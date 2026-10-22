import type { Database } from './database'

// Atalhos para tipos de tabelas
export type Barbearia = Database['public']['Tables']['barbearias']['Row']
export type Barbeiro = Database['public']['Tables']['barbeiros']['Row']
export type Cliente = Database['public']['Tables']['clientes']['Row']
export type Agendamento = Database['public']['Tables']['agendamentos']['Row']
export type Conversa = Database['public']['Tables']['conversas']['Row']

// Tipos para inserção
export type BarbeariaInsert = Database['public']['Tables']['barbearias']['Insert']
export type AgendamentoInsert = Database['public']['Tables']['agendamentos']['Insert']
export type ClienteInsert = Database['public']['Tables']['clientes']['Insert']

// Tipos para update
export type AgendamentoUpdate = Database['public']['Tables']['agendamentos']['Update']

// Enums manuais (espelham os CHECK constraints do banco)
export type Plano = 'trial' | 'starter' | 'pro'
export type PlanoStatus = 'ativo' | 'cancelado' | 'inadimplente'
export type StatusAgendamento = 'agendado' | 'confirmado' | 'concluido' | 'cancelado' | 'faltou'
export type FormaPagamento = 'pix' | 'cartao' | 'dinheiro' | 'a_definir'
export type CriadoPor = 'ia' | 'manual' | 'cliente_web'
export type RoleUsuario = 'dono' | 'barbeiro'

// Tipos para os jsonb
export interface Servico {
  nome: string
  preco: number
  duracao_min: number
}

export interface HorarioDia {
  inicio: string  // "09:00"
  fim: string     // "20:00"
}

export interface Bloqueio {
  dia_semana: string
  inicio: string
  fim: string
  motivo: string
  frequencia?: 'semanal' | 'quinzenal' | 'mensal' | 'pontual'
  data_inicio?: string
  data_fim?: string
  semana_mes?: number
}

export interface HorarioFixo {
  dia_semana: string
  inicio: string
  fim: string
  cliente: string
  frequencia?: 'semanal' | 'quinzenal' | 'mensal' | 'pontual'
  data_inicio?: string
  data_fim?: string
  semana_mes?: number
}

export interface ConfigBarbearia {
  fuso: string
  dias_funcionamento: string[]
  horario_abertura: string
  horario_fechamento: string
  sabado_abertura?: string
  sabado_fechamento?: string
}
