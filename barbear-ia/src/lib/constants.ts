export const PLANOS = {
  trial: {
    nome: 'Trial',
    dias: 7,
    limite_barbeiros: 5,
  },
  starter: {
    nome: 'Starter',
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
    limite_barbeiros: 5,
    features: [
      'Tudo do Starter',
      'Recuperação de clientes inativos',
      'Métricas e relatórios completos',
      'Suporte via WhatsApp',
    ],
  },
} as const

export const STATUS_AGENDAMENTO = {
  agendado: { label: 'Agendado', color: 'blue' },
  confirmado: { label: 'Confirmado', color: 'green' },
  concluido: { label: 'Concluído', color: 'gray' },
  cancelado: { label: 'Cancelado', color: 'red' },
  faltou: { label: 'Faltou', color: 'orange' },
} as const

export const DIAS_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

export const CRIADO_POR = {
  ia: { label: 'IA', icon: 'Bot' },
  manual: { label: 'Manual', icon: 'Pencil' },
  cliente_web: { label: 'Online', icon: 'Globe' },
} as const

// Venda consultiva: contato comercial (somente dígitos com DDI, ex.: 5531999999999)
const contatoDigitos = (process.env.NEXT_PUBLIC_CONTATO_WHATSAPP ?? '').replace(/\D/g, '')

export const CONTATO_WHATSAPP_URL = contatoDigitos
  ? `https://wa.me/${contatoDigitos}?text=${encodeURIComponent('Olá! Quero saber mais sobre o Barbear.IA.')}`
  : null
