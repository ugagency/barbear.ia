// Classifica falhas operacionais sem expor a mensagem bruta, credenciais ou anexos.
export function classificarFalhaGateway(error: unknown) {
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
  if (texto.includes('customer_verification_required'))
    return {
      codigo: 'verificacao_da_conta',
      status,
      mensagem:
        'A Vercel exige verificar a conta do AI Gateway antes de liberar a extração. Conclua a verificação no painel de AI Gateway da equipe.',
    }
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
  if (
    texto.includes('no authentication provided') ||
    texto.includes('header is missing')
  )
    return {
      codigo: 'autenticacao_ausente',
      status,
      mensagem:
        'A função não recebeu autenticação de IA. Habilite OIDC no projeto da Vercel e publique novamente, ou configure uma chave do AI Gateway no servidor.',
    }
  if (texto.includes('invalid oidc token'))
    return {
      codigo: 'oidc_recusado',
      status,
      mensagem:
        'O AI Gateway recusou o token OIDC do projeto. Confira a equipe e a configuração de OIDC na Vercel.',
    }
  if (status === 401 || status === 403)
    return {
      codigo: 'autenticacao_recusada',
      status,
      mensagem:
        'O AI Gateway recusou a autenticação do projeto. Confira a autorização da equipe no painel da Vercel.',
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
