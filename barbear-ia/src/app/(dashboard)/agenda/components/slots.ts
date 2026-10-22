import type { BarbeiroOpcao } from '../types'
import type { HorarioDia } from '@/types'

const DIA_INDEX = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const

export interface Ocupacao {
  inicio: Date
  fim: Date
}

export interface Slot {
  hora: string
  date: Date
  iso: string
  disponivel: boolean
}

const STEP_MIN = 5

function parseHora(hhmm: string): { h: number; m: number } | null {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm)
  if (!match) return null
  return { h: Number(match[1]), m: Number(match[2]) }
}

function getHorarioDoBarbeiro(
  barbeiro: BarbeiroOpcao | null,
  date: Date,
): HorarioDia | null {
  if (!barbeiro) return null
  const dia = DIA_INDEX[date.getDay()]
  const horarios = (barbeiro.horarios as Record<string, HorarioDia>) || {}
  return horarios[dia] ?? null
}

export function gerarSlotsDoDia(
  barbeiro: BarbeiroOpcao | null,
  date: Date,
  duracaoMin: number,
  ocupacoes: Ocupacao[],
  passoMin: number = STEP_MIN,
): Slot[] {
  const horario = getHorarioDoBarbeiro(barbeiro, date)
  if (!horario) return []
  const inicio = parseHora(horario.inicio)
  const fim = parseHora(horario.fim)
  if (!inicio || !fim) return []

  const base = new Date(date)
  base.setHours(0, 0, 0, 0)

  const dtInicio = new Date(base)
  dtInicio.setHours(inicio.h, inicio.m, 0, 0)
  const dtFim = new Date(base)
  dtFim.setHours(fim.h, fim.m, 0, 0)

  const slots: Slot[] = []
  for (
    let cursor = dtInicio.getTime();
    cursor + duracaoMin * 60_000 <= dtFim.getTime();
    cursor += Math.max(5, passoMin) * 60_000
  ) {
    const slotInicio = new Date(cursor)
    const slotFim = new Date(cursor + duracaoMin * 60_000)
    const conflito = ocupacoes.some(
      (o) => slotInicio < o.fim && slotFim > o.inicio,
    )
    slots.push({
      hora: `${String(slotInicio.getHours()).padStart(2, '0')}:${String(
        slotInicio.getMinutes(),
      ).padStart(2, '0')}`,
      date: slotInicio,
      iso: slotInicio.toISOString(),
      disponivel: !conflito,
    })
  }
  return slots
}
