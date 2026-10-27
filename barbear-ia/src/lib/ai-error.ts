// Classifica falhas operacionais sem expor a mensagem bruta, credenciais ou anexos.
export function classificarFalhaIA(error: unknown) {
  const textos: string[] = []
  let status = 0
  let atual = error
  for (let i = 0; i < 5 && atual && typeof atual === 'object'; i++) {
    const e = atual as Record<string, unknown>
    if (!status && typeof e.statusCode === 'number') status = e.statusCode
    for (const key of ['name', 'message', 'responseBody', 'type', 'code']) {
      if (typeof e[key] === 'string') textos.push(e[key] as string)
    }
    atual = e.lastError ?? e.cause
  }
  const texto = textos.join(' ').toLowerCase()
  if (/fetch failed|econnreset|etimedout|enotfound|econnrefused/.test(texto))
    return {
      codigo: 'falha_de_rede',
      status,
      mensagem: 'Não foi possível conectar ao Google Gemini. Tente novamente em alguns instantes. Nenhum dado foi salvo.',
    }
  if (/noobjectgeneratederror|nooutputgeneratederror|typevalidationerror|jsonparseerror/.test(texto))
    return {
      codigo: 'resposta_invalida',
      status,
      mensagem: 'A IA devolveu uma resposta incompleta ou fora do formato esperado. Tente novamente com um trecho menor. Nenhum dado foi salvo.',
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
  if (status === 401 || status === 403 || texto.includes('api_key_invalid'))
    return {
      codigo: 'autenticacao_recusada',
      status,
      mensagem:
        'O Google Gemini recusou a chave ou a permissão de acesso. Confira GOOGLE_GENERATIVE_AI_API_KEY e as permissões da API no projeto Google.',
    }
  if (status === 503 || status === 504)
    return {
      codigo: 'provedor_indisponivel',
      status,
      mensagem: 'O Google Gemini está temporariamente indisponível. Tente novamente em alguns instantes. Nenhum dado foi salvo.',
    }
  if (status === 400 && /schema|too many states|too complex|nesting|constraint/.test(texto))
    return {
      codigo: 'esquema_recusado',
      status,
      mensagem: 'O Google recusou o formato de extração configurado. O administrador precisa ajustar o esquema de resposta.',
    }
  if (status === 404 || /model.*not found|model.*not supported/.test(texto))
    return {
      codigo: 'modelo_indisponivel',
      status,
      mensagem: 'O modelo de IA configurado não está disponível para este projeto Google.',
    }
  if (status === 400 && /api key not valid|api_key_invalid|api key expired/.test(texto))
    return {
      codigo: 'chave_invalida',
      status,
      mensagem: 'A chave da API Google é inválida ou expirou. Atualize GOOGLE_GENERATIVE_AI_API_KEY no servidor.',
    }
  if (status === 400 && /location|region|country/.test(texto))
    return {
      codigo: 'regiao_indisponivel',
      status,
      mensagem: 'O Google não liberou a API para a região desta requisição.',
    }
  if (status === 400)
    return {
      codigo: 'requisicao_recusada',
      status,
      mensagem: 'O Google recusou a configuração da solicitação de extração. O administrador precisa verificar a integração.',
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
