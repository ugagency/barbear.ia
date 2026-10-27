const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const Module = require('node:module')
const resolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith('@/'))
    request = path.resolve(__dirname, '../src', request.slice(2))
  return resolve.call(this, request, parent, ...rest)
}
require.extensions['.ts'] = (mod, file) =>
  mod._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText,
    file,
  )
const {
  extracaoSchema,
  normalizarExtracao,
  mesclarImportacao,
  mesclarHorarios,
  agendaExtraida,
  MAX_PDF_BYTES,
} = require('../src/lib/onboarding-import.ts')
function vazio() {
  const result = {}
  for (const k of [
    'barbearia',
    'perfil',
    'funcionamento',
    'regras',
    'atendimento',
  ])
    result[k] = Object.fromEntries(
      Object.keys(extracaoSchema.shape[k].shape).map((f) => [f, null]),
    )
  return { ...result, profissionais: [], pendencias: [], evidencias: [] }
}
const profissional = {
  nome: 'Dinei do corte',
  telefone: null,
  calendar_id: null,
  servicos: [{ nome: 'Corte', preco: 50, duracao_min: 60 }],
  horarios: [{ dia: 'ter', inicio: '17:30', fim: '20:30', fechado: false }],
  bloqueios: [],
  horarios_fixos: [],
}

test('campos ausentes não são convertidos em informações ou valores padrão', () => {
  const parsed = extracaoSchema.parse(vazio())
  const patch = normalizarExtracao(parsed)
  assert.deepEqual(patch.barbearia, {})
  assert.deepEqual(patch.config.perfil, {})
  assert.deepEqual(patch.config.funcionamento, {})
  const schema = require('zod').z.toJSONSchema(extracaoSchema)
  assert.ok(schema.properties.profissionais)
})
test('preserva false, zero e dados existentes até autorizar substituição', () => {
  const v = vazio()
  v.regras.multa_percentual = 0
  v.atendimento.estacionamento = false
  v.perfil.responsavel = 'Leonardo'
  const patch = normalizarExtracao(extracaoSchema.parse(v))
  const atual = {
    regras: { multa_percentual: 40 },
    atendimento: { estacionamento: true },
    perfil: { responsavel: '' },
    evolution: { preservar: true },
  }
  const merged = mesclarImportacao(atual, patch.config)
  assert.equal(merged.regras.multa_percentual, 40)
  assert.equal(merged.atendimento.estacionamento, true)
  assert.equal(merged.perfil.responsavel, 'Leonardo')
  assert.equal(merged.evolution.preservar, true)
  const replaced = mesclarImportacao(atual, patch.config, true)
  assert.equal(replaced.regras.multa_percentual, 0)
  assert.equal(replaced.atendimento.estacionamento, false)
})
test('dias explicitamente fechados são aplicados sem apagar dias não informados', () => {
  const horarios = {
    ter: { inicio: '08:00', fim: '19:30' },
    qua: { inicio: '08:00', fim: '19:30' },
  }
  const dias = [{ dia: 'ter', inicio: null, fim: null, fechado: true }]
  assert.deepEqual(mesclarHorarios(horarios, dias, false), horarios)
  assert.deepEqual(mesclarHorarios(horarios, dias, true), { qua: horarios.qua })
  assert.deepEqual(
    agendaExtraida({ ...profissional, horarios: null }).horarios,
    {},
  )
})
test('preserva vínculos individuais e recorrência sem espalhar bloqueios para a barbearia', () => {
  const v = vazio()
  v.profissionais = [
    {
      ...profissional,
      bloqueios: [
        {
          dia_semana: 'ter',
          inicio: '18:00',
          fim: '19:00',
          motivo: 'Pausa',
          data_inicio: '2026-10-27',
          data_fim: null,
          frequencia: 'quinzenal',
          semana_mes: null,
        },
      ],
    },
  ]
  const parsed = extracaoSchema.parse(v)
  assert.deepEqual(normalizarExtracao(parsed).config.funcionamento, {})
  const agenda = agendaExtraida(parsed.profissionais[0])
  assert.equal(agenda.bloqueios[0].frequencia, 'quinzenal')
  assert.equal(agenda.bloqueios[0].data_inicio, '2026-10-27')
  assert.equal('semana_mes' in agenda.bloqueios[0], false)
})

let autorizado = false
let chamadas = []
let gerado = vazio()
const load = Module._load
Module._load = function (request, parent, isMain) {
  if (request === '@/lib/platform-admin')
    return {
      getPlatformAdmin: async () => (autorizado ? { id: 'admin' } : null),
    }
  if (request === 'ai')
    return {
      Output: { object: (v) => v, json: () => ({ type: 'json' }) },
      generateText: async (options) => {
        chamadas.push(options)
        return { output: gerado }
      },
    }
  return load.call(this, request, parent, isMain)
}
const { POST } = require('../src/app/api/gestao/extrair-onboarding/route.ts')
function request(texto = '', pdf = null, origin) {
  const form = new FormData()
  form.set('texto', texto)
  if (pdf) form.set('pdf', pdf)
  return new Request('https://teste.local/api/gestao/extrair-onboarding', {
    method: 'POST',
    body: form,
    headers: origin ? { origin } : {},
  })
}

test('exige admin e mesma origem antes de chamar a IA', async () => {
  chamadas = []
  autorizado = false
  assert.equal((await POST(request('dados'))).status, 403)
  autorizado = true
  assert.equal(
    (await POST(request('dados', null, 'https://outro.local'))).status,
    403,
  )
  assert.equal(chamadas.length, 0)
})
test('rejeita conteúdo vazio, texto longo e arquivos falsos ou grandes', async () => {
  autorizado = true
  chamadas = []
  assert.equal((await POST(request())).status, 400)
  assert.equal((await POST(request('x'.repeat(60001)))).status, 400)
  assert.equal(
    (
      await POST(
        request(
          '',
          new File(['não é PDF'], 'dados.pdf', { type: 'application/pdf' }),
        ),
      )
    ).status,
    400,
  )
  const grande = new File([new Uint8Array(MAX_PDF_BYTES + 1)], 'dados.pdf', {
    type: 'application/pdf',
  })
  assert.equal((await POST(request('', grande))).status, 400)
  assert.equal(chamadas.length, 0)
})
test('chave do Gateway e OIDC não substituem a chave direta do Google', async () => {
  autorizado = true
  chamadas = []
  const key = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const oidc = process.env.VERCEL_OIDC_TOKEN
  const gateway = process.env.AI_GATEWAY_API_KEY
  delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
  process.env.VERCEL_OIDC_TOKEN = 'oidc-de-teste'
  process.env.AI_GATEWAY_API_KEY = 'gateway-de-teste'
  try {
    assert.equal((await POST(request('Nome: Barbearia Teste'))).status, 503)
    assert.equal(chamadas.length, 0)
  } finally {
    if (key) process.env.GOOGLE_GENERATIVE_AI_API_KEY = key
    if (oidc) process.env.VERCEL_OIDC_TOKEN = oidc
    else delete process.env.VERCEL_OIDC_TOKEN
    if (gateway) process.env.AI_GATEWAY_API_KEY = gateway
    else delete process.env.AI_GATEWAY_API_KEY
  }
})
test('texto e PDF são enviados juntos; a extração retorna rascunho sem escrever no banco', async () => {
  autorizado = true
  chamadas = []
  gerado = vazio()
  gerado.barbearia.nome = 'Barbearia Teste'
  gerado.profissionais = [profissional]
  const old = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = 'credencial-simulada'
  try {
    const pdf = new File(['%PDF-1.7\nfixture'], 'questionario.pdf', {
      type: 'application/pdf',
    })
    const r = await POST(request('Correção: corte dura 60 minutos.', pdf))
    assert.equal(r.status, 200)
    assert.equal(r.headers.get('cache-control'), 'no-store')
    const j = await r.json()
    assert.equal(j.extracao.profissionais[0].nome, 'Dinei do corte')
    assert.equal(chamadas.length, 1)
    assert.equal(
      chamadas[0].messages[0].content[1].mediaType,
      'application/pdf',
    )
    assert.match(chamadas[0].messages[0].content[0].text, /Correção/)
    assert.equal(chamadas[0].maxRetries, 1)
    assert.equal(chamadas[0].providerOptions.google.structuredOutputs, false)
    assert.match(chamadas[0].system, /properties/)
  } finally {
    if (old) process.env.GOOGLE_GENERATIVE_AI_API_KEY = old
    else delete process.env.GOOGLE_GENERATIVE_AI_API_KEY
  }
})

test('provedor Google envia texto e PDF diretamente, sem chamar o Gateway', async () => {
  const { createGoogle } = require('@ai-sdk/google')
  const { generateText, Output } = load.call(Module, 'ai', module, false)
  let destino, envio, apiKey
  const provider = createGoogle({
    apiKey: 'chave-de-teste',
    fetch: async (url, init) => {
      destino = String(url)
      envio = JSON.parse(init.body)
      apiKey = new Headers(init.headers).get('x-goog-api-key')
      return Response.json({
        candidates: [{ content: { role: 'model', parts: [{ text: JSON.stringify(vazio()) }] }, finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
      })
    },
  })
  const result = await generateText({
    model: provider('gemini-3.8-flash'),
    providerOptions: { google: { structuredOutputs: false } },
    messages: [{ role: 'user', content: [
      { type: 'text', text: 'Nome: Teste' },
      { type: 'file', mediaType: 'application/pdf', data: new TextEncoder().encode('%PDF-1.7 fixture') },
    ] }],
    output: Output.object({ schema: extracaoSchema }),
    maxRetries: 0,
  })
  assert.equal(new URL(destino).hostname, 'generativelanguage.googleapis.com')
  assert.equal(apiKey, 'chave-de-teste')
  assert.equal(envio.generationConfig.responseMimeType, 'application/json')
  assert.equal(envio.generationConfig.responseJsonSchema, undefined)
  assert.equal(envio.contents[0].parts[1].inlineData.mimeType, 'application/pdf')
  assert.deepEqual(result.output, vazio())
})

test('diagnóstico de acesso Google não expõe a resposta bruta', () => {
  const { classificarFalhaIA } = require('../src/lib/ai-error.ts')
  const falha = classificarFalhaIA({ statusCode: 403, responseBody: 'API_KEY_INVALID segredo-nao-expor' })
  assert.equal(falha.codigo, 'autenticacao_recusada')
  assert.match(falha.mensagem, /Google Gemini/)
  assert.equal(falha.mensagem.includes('segredo-nao-expor'), false)
  assert.equal(classificarFalhaIA({ statusCode: 402 }).codigo, 'limite_de_uso')
  assert.equal(classificarFalhaIA({ statusCode: 429 }).codigo, 'muitas_solicitacoes')
})

 test('distingue formato, modelo e parâmetros recusados sem atribuir ao PDF', () => {
  const { classificarFalhaIA } = require('../src/lib/ai-error.ts')
  assert.equal(classificarFalhaIA({ statusCode: 400, message: 'Schema produces too many states' }).codigo, 'esquema_recusado')
  assert.equal(classificarFalhaIA({ statusCode: 404 }).codigo, 'modelo_indisponivel')
  assert.equal(classificarFalhaIA({ statusCode: 400, message: 'Request contains an invalid argument.' }).codigo, 'requisicao_recusada')
})

test('indisponibilidade do Google não é apresentada como falha no texto ou PDF', () => {
  const { classificarFalhaIA } = require('../src/lib/ai-error.ts')
  const falha = classificarFalhaIA({ statusCode: 503, message: 'servico indisponivel' })
  assert.equal(falha.codigo, 'provedor_indisponivel')
  assert.match(falha.mensagem, /temporariamente indisponível/)
})

test('rascunho preserva dados válidos e marca campos opcionais inválidos como pendentes', () => {
  const { validarRascunhoExtraido } = require('../src/lib/onboarding-import.ts')
  const v = vazio()
  v.barbearia.nome = 'Léo Mariano'
  v.perfil.whatsapp_responsavel = 'não informado'
  delete v.perfil.cidade
  v.regras.antecedencia_min = 120
  const r = validarRascunhoExtraido(v)
  assert.equal(r.success, true)
  assert.equal(r.data.barbearia.nome, 'Léo Mariano')
  assert.equal(r.data.perfil.whatsapp_responsavel, null)
  assert.equal(r.data.perfil.cidade, null)
  assert.equal(r.data.regras.antecedencia_min, 120)
  assert.match(r.data.pendencias.join(' '), /whatsapp_responsavel/)
  assert.equal(validarRascunhoExtraido({ foo: 'bar' }).success, false)
})

test('preserva o status Google encapsulado pelo RetryError do SDK', () => {
  const { classificarFalhaIA } = require('../src/lib/ai-error.ts')
  const falha = classificarFalhaIA({ name: 'AI_RetryError', lastError: { statusCode: 503, responseBody: 'servico indisponivel' } })
  assert.equal(falha.status, 503)
  assert.equal(falha.codigo, 'provedor_indisponivel')
  assert.equal(classificarFalhaIA({ lastError: { statusCode: 429 } }).codigo, 'muitas_solicitacoes')
})
