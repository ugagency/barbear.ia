// Classifica falhas operacionais sem expor a mensagem bruta, credenciais ou anexos.
export function classificarFalhaIA(error: unknown) {
  const textos: string[] = []
  let status = 0
  let atual = error
  for (let i = 0; i < 5 && atual && typeof atual === 'object'; i++) {
    const e = atual as Record<string, unknown>
    if (!status && typeof e.statusCode === 'number') status = e.statusCode
    for (const key of ['message', 'responseBody', 'type', 'code']) {
      if (typeof e[key] === 'string') textos.push(e[key] as string)
    }
    atual = e.cause
  }
  const texto = textos.join(' ').toLowerCase()
  if (
    texto.includes('insufficient_funds') ||
    texto.includes('quota_for_entity_exceeded') ||
    status === 402
  )
    return {
      codigo: 'limite_de_uso',
      status,
      mensagem: 'A conexão de IA está sem saldo ou atingiu seu limite de uso.',
    }
  if (status === 401 || status === 403 || texto.includes('api_key_invalid'))
    return {
      codigo: 'autenticacao_recusada',
      status,
      mensagem:
        'O Google Gemini recusou a chave ou a permissão de acesso. Confira GOOGLE_GENERATIVE_AI_API_KEY e as permissões da API no projeto Google.',
    }
  if (status === 429)
    return {
      codigo: 'muitas_solicitacoes',
      status,
      mensagem:
        'Há muitas leituras no momento. Tente novamente em alguns instantes.',
    }
  return {
    codigo: 'extracao_falhou',
    status,
    mensagem:
      'Não foi possível concluir a extração. Confira se o PDF está legível e sem senha, ou cole o texto.',
  }
}
