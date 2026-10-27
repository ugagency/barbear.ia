import { regraAtivaNoDia } from './disponibilidade'
import { DIAS } from './onboarding'
import type { OnboardingConfig } from './onboarding'
import type { Bloqueio, HorarioDia, HorarioFixo } from '@/types'

export interface AgendaProfissional {
  horarios: Record<string, HorarioDia>
  bloqueios?: Bloqueio[]
  horarios_fixos?: HorarioFixo[]
}
// Converts an instant to the shop's civil date/time, independent of the server timezone.
function localParts(instant: Date, fuso: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: fuso,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant)
  const get = (key: string) => parts.find((p) => p.type === key)!.value
  const iso = `${get('year')}-${get('month')}-${get('day')}`
  return {
    iso,
    hora: `${get('hour')}:${get('minute')}`,
    date: new Date(`${iso}T12:00:00`),
  }
}
export function validarReserva(
  config: OnboardingConfig & { fuso?: string },
  barbeiro: AgendaProfissional,
  inicio: Date,
  duracao: number,
  agora = new Date(),
): string | null {
  if (!Number.isFinite(inicio.getTime()) || inicio <= agora)
    return 'Escolha um horário futuro.'
  const regras = config.regras
  if (
    regras &&
    inicio.getTime() < agora.getTime() + regras.antecedencia_min * 60000
  )
    return `Agende com pelo menos ${regras.antecedencia_min} minutos de antecedência.`
  const fuso = config.fuso ?? 'America/Sao_Paulo'
  const local = localParts(inicio, fuso)
  const hoje = localParts(agora, fuso)
  const dias = (Date.parse(local.iso) - Date.parse(hoje.iso)) / 86400000
  if (regras && dias > regras.horizonte_dias)
    return `A agenda está aberta para até ${regras.horizonte_dias} dias.`
  const fim = localParts(new Date(inicio.getTime() + duracao * 60000), fuso)
  if (fim.iso !== local.iso) return 'O serviço deve terminar no mesmo dia.'
  const dia = DIAS[local.date.getDay()]
  const h = barbeiro.horarios?.[dia]
  if (!h || local.hora < h.inicio || fim.hora > h.fim)
    return 'Horário fora do atendimento do profissional.'
  const funcionamento = config.funcionamento
  if (funcionamento) {
    const geral = funcionamento.horarios[dia]
    if (!geral || local.hora < geral.inicio || fim.hora > geral.fim)
      return 'A barbearia está fechada nesse horário.'
    if (
      funcionamento.fechamentos.some(
        (f) => local.iso >= f.data_inicio && local.iso <= f.data_fim,
      )
    )
      return 'A barbearia está fechada nessa data.'
  }
  const ocupacoes = [
    ...(funcionamento?.bloqueios ?? []),
    ...(barbeiro.bloqueios ?? []),
    ...(barbeiro.horarios_fixos ?? []),
  ]
  if (
    ocupacoes.some(
      (b) =>
        regraAtivaNoDia(b, local.date) &&
        local.hora < b.fim &&
        fim.hora > b.inicio,
    )
  )
    return 'Este horário está reservado ou bloqueado.'
  return null
}

// Only scheduling fields are serialized into the public booking client.
export function configPublica(config: OnboardingConfig & { fuso?: string }) {
  return {
    fuso: config.fuso ?? 'America/Sao_Paulo',
    funcionamento: config.funcionamento
      ? {
          horarios: config.funcionamento.horarios,
          bloqueios: config.funcionamento.bloqueios.map((b) => ({
            ...b,
            motivo: 'Indisponível',
          })),
          fechamentos: config.funcionamento.fechamentos.map((f) => ({
            ...f,
            motivo: 'Fechado',
          })),
          funciona_feriados: config.funcionamento.funciona_feriados,
          ferias: '',
        }
      : undefined,
    regras: config.regras
      ? {
          ...config.regras,
          politica_cancelamento: config.regras.politica_cancelamento,
        }
      : undefined,
  }
}
