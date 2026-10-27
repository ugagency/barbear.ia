import { generateText, Output } from 'ai'
import type { UserContent } from 'ai'
import { classificarFalhaGateway } from '@/lib/gateway-error'
import { getPlatformAdmin } from '@/lib/platform-admin'
import {
  extracaoSchema,
  INSTRUCAO_EXTRACAO,
  MAX_PDF_BYTES,
  MAX_TEXTO,
} from '@/lib/onboarding-import'

export const runtime = 'nodejs'
export const maxDuration = 120
function resposta(error: string, status: number) {
  return Response.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store' } },
  )
}
export async function POST(request: Request) {
  if (!(await getPlatformAdmin())) return resposta('Acesso negado.', 403)
  const origem = request.headers.get('origin')
  if (origem && origem !== new URL(request.url).origin)
    return resposta('Origem inválida.', 403)
  const tamanho = Number(request.headers.get('content-length') ?? 0)
  if (tamanho > MAX_PDF_BYTES + MAX_TEXTO * 4 + 10000)
    return resposta('O envio excede o limite permitido.', 413)
  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return resposta('Não foi possível ler o envio.', 400)
  }
  const texto = String(form.get('texto') ?? '').trim()
  const arquivo = form.get('pdf')
  if (texto.length > MAX_TEXTO)
    return resposta('O texto deve ter até 60 mil caracteres.', 400)
  const pdf = arquivo instanceof File && arquivo.size > 0 ? arquivo : null
  if (!texto && !pdf) return resposta('Cole um texto ou selecione um PDF.', 400)
  if (
    pdf &&
    (pdf.size > MAX_PDF_BYTES ||
      !pdf.name.toLowerCase().endsWith('.pdf') ||
      (pdf.type && pdf.type !== 'application/pdf'))
  )
    return resposta('Envie um PDF de até 3 MB.', 400)
  let bytes: Uint8Array | undefined
  if (pdf) {
    bytes = new Uint8Array(await pdf.arrayBuffer())
    if (!new TextDecoder().decode(bytes.slice(0, 1024)).includes('%PDF-'))
      return resposta('O arquivo não é um PDF válido.', 400)
  }
  // O SDK resolve API key ou OIDC do contexto confiável da requisição Vercel.
  // Não exigir VERCEL_OIDC_TOKEN no process.env: em Functions ele pode vir só no contexto.
  const content: UserContent = [
    {
      type: 'text',
      text: `Extraia o onboarding abaixo. Não salve dados. Data de referência: ${new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())}.\n<respostas>\n${texto || 'Consulte o PDF anexado.'}\n</respostas>`,
    },
  ]
  if (bytes)
    content.push({ type: 'file', mediaType: 'application/pdf', data: bytes })
  try {
    const { output } = await generateText({
      model: process.env.ONBOARDING_AI_MODEL || 'google/gemini-2.5-flash',
      system: INSTRUCAO_EXTRACAO,
      messages: [{ role: 'user', content }],
      output: Output.object({ schema: extracaoSchema }),
      maxOutputTokens: 12000,
      maxRetries: 0,
      abortSignal: AbortSignal.any([
        request.signal,
        AbortSignal.timeout(110000),
      ]),
    })
    const validado = extracaoSchema.safeParse(output)
    if (!validado.success)
      return resposta(
        'A leitura ficou incompleta. Tente um trecho menor ou um PDF mais legível.',
        422,
      )
    return Response.json(
      { extracao: validado.data },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    const falha = classificarFalhaGateway(error)
    // Somente códigos operacionais; nunca o erro bruto ou conteúdo enviado.
    console.warn('onboarding_ai_failure', {
      codigo: falha.codigo,
      status: falha.status,
    })
    if (request.signal.aborted) return resposta('Leitura cancelada.', 499)
    return resposta(
      falha.mensagem,
      falha.status === 429
        ? 429
        : [401, 402, 403].includes(falha.status)
          ? 503
          : 502,
    )
  }
}
