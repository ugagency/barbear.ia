import type { Agendamento } from '@/types'

export type Periodo = 'hoje' | 'semana' | 'mes' | 'mes_passado'

export interface PeriodoIntervalo {
  inicio: Date
  fim: Date
  inicioAnterior: Date
  fimAnterior: Date
  granularidade: 'hora' | 'dia'
}

export interface AgendamentoComJoins extends Agendamento {
  barbeiros: { nome: string } | null
  clientes: { nome: string | null } | null
}

export interface ClienteResumoMetrica {
  id: string
  created_at: string
  total_atendimentos: number
  ativo: boolean
  ultimo_atendimento: string | null
}

export interface PorBarbeiro {
  barbeiro_id: string
  nome: string
  total: number
  concluidos: number
  faturamento: number
  ticket_medio: number
  taxa_no_show: number
}

export interface PorServico {
  nome: string
  count: number
  faturamento: number
}

export interface PontoFaturamento {
  rotulo: string
  faturamento: number
}

export interface PontoEvolucao {
  rotulo: string
  total: number
  ativos: number
}

export interface MetricasCalculadas {
  faturamento_total: number
  total_agendamentos: number
  concluidos: number
  cancelados: number
  faltas: number
  taxa_no_show: number
  ticket_medio: number
  clientes_novos: number
  clientes_recuperados: number
  agendamentos_ia: number
  agendamentos_manual: number
  taxa_ia: number
  faturamento_ia: number
  lembretes_enviados: number
  por_barbeiro: PorBarbeiro[]
  por_servico: PorServico[]
  faturamento_por_dia: PontoFaturamento[]
  evolucao_clientes: PontoEvolucao[]
  variacao: {
    faturamento: number | null
    concluidos: number | null
    ticket_medio: number | null
    no_show: number | null
  }
}
