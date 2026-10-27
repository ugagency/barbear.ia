const test = require('node:test')
const assert = require('node:assert/strict')
const ts = require('typescript')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const root = path.resolve(__dirname, '..')
const resolve = Module._resolveFilename
Module._resolveFilename = function (request, parent, ...rest) {
  if (request.startsWith('@/'))
    request = path.join(root, 'src', request.slice(2))
  return resolve.call(this, request, parent, ...rest)
}
require.extensions['.ts'] = (module, file) =>
  module._compile(
    ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    file,
  )
const {
  agendaSchema,
  funcionamentoSchema,
} = require('../src/lib/onboarding.ts')
const {
  validarReserva,
  configPublica,
} = require('../src/lib/regras-agendamento.ts')
const agora = new Date('2026-10-27T10:00:00-03:00')
const inicio = new Date('2026-10-27T18:00:00-03:00')
const profissional = {
  horarios: { ter: { inicio: '17:30', fim: '20:30' } },
  bloqueios: [],
  horarios_fixos: [],
}
const funcionamento = {
  horarios: { ter: { inicio: '08:00', fim: '19:30' } },
  bloqueios: [],
  fechamentos: [],
  funciona_feriados: false,
  ferias: '',
}
const regras = {
  antecedencia_min: 120,
  horizonte_dias: 30,
  cancelamento_min: 60,
  tolerancia_min: 10,
  confirmacao_automatica: true,
  avisar_responsavel: true,
  multa_percentual: 40,
  politica_cancelamento: 'Corte apenas',
}
const config = { fuso: 'America/Sao_Paulo', funcionamento, regras }

test('permite dias de folga e valida horas reais e intervalos', () => {
  assert.equal(
    agendaSchema.safeParse({ ...profissional, horarios: {} }).success,
    true,
  )
  for (const h of [
    { inicio: '25:00', fim: '26:00' },
    { inicio: '19:00', fim: '08:00' },
  ])
    assert.equal(
      agendaSchema.safeParse({ ...profissional, horarios: { ter: h } }).success,
      false,
    )
  assert.equal(
    funcionamentoSchema.safeParse({
      ...funcionamento,
      fechamentos: [
        { data_inicio: '2027-02-01', data_fim: '2027-01-01', motivo: 'Férias' },
      ],
    }).success,
    false,
  )
})
test('não oferece corte que termine após o fechamento geral', () => {
  assert.equal(validarReserva(config, profissional, inicio, 60, agora), null)
  assert.match(
    validarReserva(
      config,
      profissional,
      new Date('2026-10-27T19:00:00-03:00'),
      60,
      agora,
    ),
    /fechada/,
  )
})
test('aplica bloqueios gerais e reservas individuais sem bloquear outros profissionais', () => {
  const bloqueio = {
    dia_semana: 'ter',
    inicio: '18:00',
    fim: '19:00',
    motivo: 'Limpeza',
  }
  assert.match(
    validarReserva(
      { ...config, funcionamento: { ...funcionamento, bloqueios: [bloqueio] } },
      profissional,
      inicio,
      60,
      agora,
    ),
    /bloqueado/,
  )
  const fixo = { ...bloqueio, cliente: 'Cliente fixo' }
  assert.match(
    validarReserva(
      config,
      { ...profissional, horarios_fixos: [fixo] },
      inicio,
      60,
      agora,
    ),
    /reservado/,
  )
  assert.equal(validarReserva(config, profissional, inicio, 60, agora), null)
})
test('aplica antecedência, horizonte, férias inclusivas e folgas', () => {
  assert.match(
    validarReserva(
      config,
      profissional,
      inicio,
      60,
      new Date('2026-10-27T17:00:00-03:00'),
    ),
    /antecedência/,
  )
  assert.match(
    validarReserva(
      { ...config, regras: { ...regras, horizonte_dias: 1 } },
      profissional,
      new Date('2026-11-03T18:00:00-03:00'),
      60,
      agora,
    ),
    /até 1 dias/,
  )
  const c = {
    ...config,
    funcionamento: {
      ...funcionamento,
      fechamentos: [
        { data_inicio: '2026-10-27', data_fim: '2026-10-28', motivo: 'Férias' },
      ],
    },
  }
  assert.match(
    validarReserva(c, profissional, inicio, 60, agora),
    /fechada nessa data/,
  )
  assert.match(
    validarReserva(
      config,
      { ...profissional, horarios: {} },
      inicio,
      60,
      agora,
    ),
    /profissional/,
  )
})
test('valida recorrências e não serializa dados privados de onboarding', () => {
  const b = {
    dia_semana: 'ter',
    inicio: '18:00',
    fim: '19:00',
    cliente: 'Fixo',
    frequencia: 'quinzenal',
  }
  assert.equal(
    agendaSchema.safeParse({ ...profissional, horarios_fixos: [b] }).success,
    false,
  )
  assert.equal(
    agendaSchema.safeParse({
      ...profissional,
      horarios_fixos: [{ ...b, data_inicio: '2026-10-27' }],
    }).success,
    true,
  )
  const safe = configPublica({
    ...config,
    perfil: { cnpj: 'privado', responsavel: 'privado' },
    atendimento: { whatsapp_humano: 'privado' },
  })
  assert.equal(safe.perfil, undefined)
  assert.equal(safe.atendimento, undefined)
})

let autorizado = false
let failWrite = false
let queries = []
let currentConfig = {
  evolution: { preservar: true },
  perfil: { responsavel: 'Original' },
}
const load = Module._load
Module._load = function (request, parent, isMain) {
  if (request === '@/lib/platform-admin')
    return {
      getPlatformAdmin: async () => (autorizado ? { id: 'admin' } : null),
    }
  if (request === 'next/cache') return { revalidatePath: () => {} }
  if (request === '@/lib/supabase/admin')
    return {
      supabaseAdmin: {
        from(table) {
          const q = { table, filters: {}, op: 'read', values: null }
          const chain = {
            select() {
              return chain
            },
            update(values) {
              q.op = 'update'
              q.values = values
              return chain
            },
            upsert(values) {
              q.op = 'upsert'
              q.values = values
              return chain
            },
            insert(values) {
              q.op = 'insert'
              q.values = values
              return chain
            },
            eq(k, v) {
              q.filters[k] = v
              return chain
            },
            async maybeSingle() {
              queries.push(q)
              if (q.op === 'read')
                return {
                  data: { config: currentConfig, updated_at: 'version-1' },
                  error: null,
                }
              if (failWrite) return { data: null, error: null }
              return { data: { id: q.filters.id ?? 'created' }, error: null }
            },
          }
          return chain
        },
      },
    }
  return load.call(this, request, parent, isMain)
}
const actions = require('../src/app/gestao/onboarding-actions.ts')
const shopId = '123e4567-e89b-42d3-a456-426614174000'
const profId = '123e4567-e89b-42d3-a456-426614174001'
test('ações recusam usuário sem acesso de admin antes de consultar o banco', async () => {
  autorizado = false
  queries = []
  for (const r of [
    await actions.salvarSecaoOnboarding(shopId, {
      secao: 'regras',
      dados: regras,
    }),
    await actions.salvarProfissionalAdmin(shopId, profId, {}),
    await actions.salvarAgendaAdmin(shopId, profId, {}),
  ])
    assert.equal(r.success, false)
  assert.equal(queries.length, 0)
})
test('salva uma seção preservando integrações e detecta edição concorrente', async () => {
  autorizado = true
  queries = []
  failWrite = false
  assert.equal(
    (
      await actions.salvarSecaoOnboarding(shopId, {
        secao: 'regras',
        dados: regras,
      })
    ).success,
    true,
  )
  const write = queries.find((q) => q.op === 'update')
  assert.deepEqual(write.values.config.evolution, { preservar: true })
  assert.deepEqual(write.values.config.perfil, { responsavel: 'Original' })
  assert.deepEqual(write.values.config.regras, regras)
  assert.equal(write.filters.id, shopId)
  assert.equal(write.filters.updated_at, 'version-1')
  failWrite = true
  assert.equal(
    (
      await actions.salvarSecaoOnboarding(shopId, {
        secao: 'regras',
        dados: regras,
      })
    ).success,
    false,
  )
  failWrite = false
})
test('edição de profissional e agenda é limitada à barbearia selecionada', async () => {
  autorizado = true
  queries = []
  assert.equal(
    (
      await actions.salvarProfissionalAdmin(shopId, profId, {
        nome: 'Dinei',
        telefone: '',
        calendar_id: '',
        ativo: true,
        servicos: [{ nome: 'Corte', preco: 50, duracao_min: 60 }],
      })
    ).success,
    true,
  )
  assert.equal(
    (
      await actions.salvarAgendaAdmin(shopId, profId, {
        horarios: {
          ter: { ativo: true, inicio: '17:30', fim: '20:30' },
          seg: { ativo: false, inicio: '09:00', fim: '19:00' },
        },
        bloqueios: [],
        horarios_fixos: [],
      })
    ).success,
    true,
  )
  for (const q of queries) {
    assert.equal(q.filters.id, profId)
    assert.equal(q.filters.barbearia_id, shopId)
  }
  assert.deepEqual(queries[1].values.horarios, {
    ter: { inicio: '17:30', fim: '20:30' },
  })
  failWrite = true
  assert.equal(
    (
      await actions.salvarAgendaAdmin(shopId, profId, {
        horarios: {},
        bloqueios: [],
        horarios_fixos: [],
      })
    ).success,
    false,
  )
  failWrite = false
})

test('dados internos são gravados somente na tabela protegida', async () => {
  autorizado = true
  queries = []
  const { perfilSchema } = require('../src/lib/onboarding.ts')
  const perfil = Object.fromEntries(
    Object.keys(perfilSchema.shape).map((k) => [k, '']),
  )
  perfil.responsavel = 'Leonardo'
  assert.equal(
    (
      await actions.salvarSecaoOnboarding(shopId, {
        secao: 'perfil',
        dados: perfil,
      })
    ).success,
    true,
  )
  assert.equal(queries.length, 1)
  assert.equal(queries[0].table, 'barbearia_onboarding')
  assert.equal(queries[0].values.barbearia_id, shopId)
  assert.equal(queries[0].values.secao, 'perfil')
  assert.equal(queries[0].values.dados.responsavel, 'Leonardo')
})
