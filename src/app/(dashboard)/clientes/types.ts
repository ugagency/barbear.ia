import type { Cliente } from '@/types'

export type StatusCliente = 'ativo' | 'risco' | 'inativo'

export interface ClienteListItem extends Cliente {
  status: StatusCliente
  dias_desde_ultimo: number | null
}

export function diasDesde(date: string | null): number | null {
  if (!date) return null
  const ref = new Date(date)
  if (Number.isNaN(ref.getTime())) return null
  const ms = Date.now() - ref.getTime()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

export function calcularStatus(ultimoAtendimento: string | null): StatusCliente {
  const dias = diasDesde(ultimoAtendimento)
  if (dias === null) return 'inativo'
  if (dias <= 30) return 'ativo'
  if (dias <= 45) return 'risco'
  return 'inativo'
}
