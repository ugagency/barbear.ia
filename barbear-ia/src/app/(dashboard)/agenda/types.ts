import type { Agendamento, Barbeiro } from '@/types'

export interface ClienteResumo {
  id: string
  nome: string | null
  telefone: string
}

export interface BarbeiroResumo {
  id: string
  nome: string
}

export interface AgendamentoComJoins extends Agendamento {
  clientes: ClienteResumo | null
  barbeiros: BarbeiroResumo | null
}

export interface BarbeiroOpcao
  extends Pick<Barbeiro, 'id' | 'nome' | 'servicos' | 'horarios' | 'bloqueios' | 'horarios_fixos' | 'ativo'> {}
