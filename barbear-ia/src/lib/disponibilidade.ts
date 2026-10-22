import type { Bloqueio, HorarioFixo } from '@/types'

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

type Periodo = { dia_semana: string; inicio: string; fim: string; frequencia?: 'semanal' | 'quinzenal' | 'mensal' | 'pontual'; data_inicio?: string; data_fim?: string; semana_mes?: number }

function isoLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function regraAtivaNoDia(regra: Periodo, data: Date): boolean {
  const dia = isoLocal(data)
  if (regra.data_inicio && dia < regra.data_inicio) return false
  if (regra.data_fim && dia > regra.data_fim) return false
  const frequencia = regra.frequencia ?? 'semanal'
  if (frequencia === 'pontual') return regra.data_inicio === dia
  if (DIAS[data.getDay()] !== regra.dia_semana) return false
  if (frequencia === 'semanal') return true
  if (frequencia === 'mensal') {
    return Math.floor((data.getDate() - 1) / 7) + 1 === (regra.semana_mes ?? 1)
  }
  if (frequencia === 'quinzenal') {
    if (!regra.data_inicio) return false
    const [y, m, d] = regra.data_inicio.split('-').map(Number)
    const inicio = Date.UTC(y, m - 1, d)
    const atual = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
    return Math.floor((atual - inicio) / 86400000 / 7) % 2 === 0
  }
  return false
}

function horarioNaData(data: Date, hhmm: string): Date {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(data)
  d.setHours(h, m, 0, 0)
  return d
}

export function ocupacoesFixasNoDia(
  data: Date,
  bloqueios: Bloqueio[] = [],
  fixos: HorarioFixo[] = [],
): Array<{ inicio: Date; fim: Date }> {
  return [...bloqueios, ...fixos]
    .filter((regra) => regraAtivaNoDia(regra, data))
    .filter((regra) => regra.inicio < regra.fim)
    .map((regra) => ({
      inicio: horarioNaData(data, regra.inicio),
      fim: horarioNaData(data, regra.fim),
    }))
}
