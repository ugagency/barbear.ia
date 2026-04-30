export const PLANOS = {
  trial: {
    nome: 'Trial',
    preco_mensal: 0,
    dias: 7,
    limite_barbeiros: 5,
  },
  starter: {
    nome: 'Starter',
    preco_mensal: 49,
    preco_anual: 490,
    limite_barbeiros: 2,
    features: [
      'Atendimento IA 24h',
      'Agendamento automático',
      'Lembretes anti-falta',
      'Dashboard básico',
    ],
    sem: [
      'Recuperação de inativos',
      'Métricas avançadas',
    ],
  },
  pro: {
    nome: 'Pro',
    preco_mensal: 97,
    preco_anual: 970,
    limite_barbeiros: 5,
    features: [
      'Tudo do Starter',
      'Recuperação de clientes inativos',
      'Métricas e relatórios completos',
      'Suporte via WhatsApp',
    ],
  },
} as const

export const PRECOS = {
  starter_mensal: 49.0,
  starter_anual: 490.0,
  pro_mensal: 97.0,
  pro_anual: 970.0,
  fundador: 49.0,
} as const

export const FUNDADORES_TOTAL_VAGAS = 50

export const STATUS_AGENDAMENTO = {
  agendado: { label: 'Agendado', color: 'blue' },
  confirmado: { label: 'Confirmado', color: 'green' },
  concluido: { label: 'Concluído', color: 'gray' },
  cancelado: { label: 'Cancelado', color: 'red' },
  faltou: { label: 'Faltou', color: 'orange' },
} as const

export const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const
