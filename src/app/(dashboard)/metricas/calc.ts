import type {
  AgendamentoComJoins,
  ClienteResumoMetrica,
  MetricasCalculadas,
  Periodo,
  PeriodoIntervalo,
  PontoEvolucao,
  PontoFaturamento,
  PorBarbeiro,
  PorServico,
} from './types'

const DIA_ABREV = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb']

function startOfDay(d: Date): Date {
  const out = new Date(d)
  out.setHours(0, 0, 0, 0)
  return out
}

function endOfDay(d: Date): Date {
  const out = new Date(d)
  out.setHours(23, 59, 59, 999)
  return out
}

function addDays(d: Date, n: number): Date {
  const out = new Date(d)
  out.setDate(out.getDate() + n)
  return out
}

function startOfWeek(d: Date): Date {
  // Semana iniciando no domingo
  const out = startOfDay(d)
  out.setDate(out.getDate() - out.getDay())
  return out
}

function startOfMonth(d: Date): Date {
  const out = startOfDay(d)
  out.setDate(1)
  return out
}

function endOfMonth(d: Date): Date {
  const out = startOfDay(d)
  out.setMonth(out.getMonth() + 1, 0)
  out.setHours(23, 59, 59, 999)
  return out
}

export function intervaloPeriodo(
  periodo: Periodo,
  ref: Date = new Date(),
): PeriodoIntervalo {
  if (periodo === 'hoje') {
    const inicio = startOfDay(ref)
    const fim = endOfDay(ref)
    const ontem = addDays(ref, -1)
    return {
      inicio,
      fim,
      inicioAnterior: startOfDay(ontem),
      fimAnterior: endOfDay(ontem),
      granularidade: 'hora',
    }
  }
  if (periodo === 'semana') {
    const inicio = startOfWeek(ref)
    const fim = endOfDay(addDays(inicio, 6))
    const inicioAnterior = addDays(inicio, -7)
    const fimAnterior = endOfDay(addDays(inicioAnterior, 6))
    return { inicio, fim, inicioAnterior, fimAnterior, granularidade: 'dia' }
  }
  if (periodo === 'mes_passado') {
    const fimAtual = endOfMonth(new Date(ref.getFullYear(), ref.getMonth() - 1, 1))
    const inicio = startOfMonth(fimAtual)
    const fim = endOfMonth(fimAtual)
    const inicioAnterior = startOfMonth(addDays(inicio, -1))
    const fimAnterior = endOfMonth(inicioAnterior)
    return { inicio, fim, inicioAnterior, fimAnterior, granularidade: 'dia' }
  }
  // mes (atual)
  const inicio = startOfMonth(ref)
  const fim = endOfMonth(ref)
  const inicioAnterior = startOfMonth(addDays(inicio, -1))
  const fimAnterior = endOfMonth(inicioAnterior)
  return { inicio, fim, inicioAnterior, fimAnterior, granularidade: 'dia' }
}

export function variacaoPercentual(atual: number, anterior: number): number | null {
  if (anterior === 0) return atual > 0 ? null : 0
  return ((atual - anterior) / anterior) * 100
}

interface AgregacaoBase {
  faturamento: number
  total: number
  concluidos: number
  cancelados: number
  faltas: number
}

function agregar(ags: AgendamentoComJoins[]): AgregacaoBase {
  let faturamento = 0
  let concluidos = 0
  let cancelados = 0
  let faltas = 0
  for (const a of ags) {
    if (a.status === 'concluido') {
      concluidos += 1
      faturamento += Number(a.valor ?? 0)
    } else if (a.status === 'cancelado') {
      cancelados += 1
    } else if (a.status === 'faltou') {
      faltas += 1
    }
  }
  return { faturamento, total: ags.length, concluidos, cancelados, faltas }
}

function agruparPorBarbeiro(ags: AgendamentoComJoins[]): PorBarbeiro[] {
  const mapa = new Map<string, AgregacaoBase & { nome: string }>()
  for (const a of ags) {
    const id = a.barbeiro_id
    const nome = a.barbeiros?.nome ?? '—'
    const cur = mapa.get(id) ?? {
      nome,
      faturamento: 0,
      total: 0,
      concluidos: 0,
      cancelados: 0,
      faltas: 0,
    }
    cur.total += 1
    if (a.status === 'concluido') {
      cur.concluidos += 1
      cur.faturamento += Number(a.valor ?? 0)
    } else if (a.status === 'cancelado') {
      cur.cancelados += 1
    } else if (a.status === 'faltou') {
      cur.faltas += 1
    }
    mapa.set(id, cur)
  }
  const out: PorBarbeiro[] = []
  for (const [id, v] of mapa) {
    out.push({
      barbeiro_id: id,
      nome: v.nome,
      total: v.total,
      concluidos: v.concluidos,
      faturamento: v.faturamento,
      ticket_medio: v.concluidos > 0 ? v.faturamento / v.concluidos : 0,
      taxa_no_show: v.total > 0 ? (v.faltas / v.total) * 100 : 0,
    })
  }
  return out.sort((a, b) => b.faturamento - a.faturamento)
}

function agruparPorServico(ags: AgendamentoComJoins[]): PorServico[] {
  const mapa = new Map<string, PorServico>()
  for (const a of ags) {
    if (a.status !== 'concluido') continue
    const cur = mapa.get(a.servico) ?? {
      nome: a.servico,
      count: 0,
      faturamento: 0,
    }
    cur.count += 1
    cur.faturamento += Number(a.valor ?? 0)
    mapa.set(a.servico, cur)
  }
  return Array.from(mapa.values()).sort((a, b) => b.faturamento - a.faturamento)
}

function gerarBuckets(intervalo: PeriodoIntervalo): {
  rotulo: string
  inicio: Date
  fim: Date
}[] {
  const buckets: { rotulo: string; inicio: Date; fim: Date }[] = []
  if (intervalo.granularidade === 'hora') {
    for (let h = 0; h < 24; h++) {
      const inicio = new Date(intervalo.inicio)
      inicio.setHours(h, 0, 0, 0)
      const fim = new Date(inicio)
      fim.setMinutes(59, 59, 999)
      buckets.push({
        rotulo: `${String(h).padStart(2, '0')}h`,
        inicio,
        fim,
      })
    }
    return buckets
  }
  let cursor = new Date(intervalo.inicio)
  while (cursor.getTime() <= intervalo.fim.getTime()) {
    const fim = endOfDay(cursor)
    const rotulo = `${String(cursor.getDate()).padStart(2, '0')}/${String(
      cursor.getMonth() + 1,
    ).padStart(2, '0')}`
    buckets.push({ rotulo, inicio: new Date(cursor), fim })
    cursor = addDays(cursor, 1)
  }
  return buckets
}

function faturamentoPorBucket(
  ags: AgendamentoComJoins[],
  intervalo: PeriodoIntervalo,
  periodo: Periodo,
): PontoFaturamento[] {
  const buckets = gerarBuckets(intervalo)
  const points: PontoFaturamento[] = buckets.map((b) => ({
    rotulo: periodo === 'semana' ? bucketLabelSemana(b.inicio) : b.rotulo,
    faturamento: 0,
  }))
  for (const a of ags) {
    if (a.status !== 'concluido') continue
    const t = new Date(a.inicio_at).getTime()
    const idx = buckets.findIndex(
      (b) => t >= b.inicio.getTime() && t <= b.fim.getTime(),
    )
    if (idx >= 0) points[idx].faturamento += Number(a.valor ?? 0)
  }
  return points
}

function bucketLabelSemana(d: Date): string {
  return `${DIA_ABREV[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(
    d.getMonth() + 1,
  ).padStart(2, '0')}`
}

function evolucaoUltimos6Meses(
  clientes: ClienteResumoMetrica[],
  ref: Date = new Date(),
): PontoEvolucao[] {
  const meses: { rotulo: string; ate: Date }[] = []
  for (let i = 5; i >= 0; i--) {
    const m = new Date(ref.getFullYear(), ref.getMonth() - i + 1, 0, 23, 59, 59, 999)
    const rotulo = m.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')
    meses.push({ rotulo, ate: m })
  }

  return meses.map(({ rotulo, ate }) => {
    let total = 0
    let ativos = 0
    const limiteAtivo = new Date(ate)
    limiteAtivo.setDate(limiteAtivo.getDate() - 30)
    for (const c of clientes) {
      const criado = new Date(c.created_at)
      if (criado.getTime() <= ate.getTime()) {
        total += 1
        if (c.ultimo_atendimento) {
          const ult = new Date(c.ultimo_atendimento)
          if (ult.getTime() >= limiteAtivo.getTime() && ult.getTime() <= ate.getTime()) {
            ativos += 1
          }
        }
      }
    }
    return { rotulo, total, ativos }
  })
}

function clientesNovosNoPeriodo(
  clientes: ClienteResumoMetrica[],
  intervalo: PeriodoIntervalo,
): number {
  let count = 0
  for (const c of clientes) {
    const t = new Date(c.created_at).getTime()
    if (t >= intervalo.inicio.getTime() && t <= intervalo.fim.getTime()) {
      count += 1
    }
  }
  return count
}

function clientesRecuperados(
  ags: AgendamentoComJoins[],
  clientes: ClienteResumoMetrica[],
  intervalo: PeriodoIntervalo,
): number {
  // Heurística: clientes com agendamento criado pela IA no período E
  // que já existiam antes do período E sem atendimento nos 30 dias anteriores ao período.
  const clientesMap = new Map(clientes.map((c) => [c.id, c]))
  const limiar = new Date(intervalo.inicio)
  limiar.setDate(limiar.getDate() - 30)

  const recuperados = new Set<string>()
  for (const a of ags) {
    if (a.criado_por !== 'ia') continue
    if (a.status === 'cancelado') continue
    const c = clientesMap.get(a.cliente_id)
    if (!c) continue
    if (new Date(c.created_at).getTime() >= intervalo.inicio.getTime()) continue
    // ultimo_atendimento atual está dentro/após o período (foi atualizado por concluir)
    // mas precisamos saber se ANTES desse agendamento o cliente estava inativo.
    // Como fallback: se total_atendimentos > 1 e ultimo_atendimento >= inicio, conta.
    if (
      c.ultimo_atendimento &&
      new Date(c.ultimo_atendimento).getTime() >= intervalo.inicio.getTime() &&
      c.total_atendimentos > 1
    ) {
      recuperados.add(c.id)
    }
  }
  return recuperados.size
}

export function calcularMetricas(args: {
  agendamentos: AgendamentoComJoins[]
  agendamentosAnterior: AgendamentoComJoins[]
  clientes: ClienteResumoMetrica[]
  lembretesCount: number
  intervalo: PeriodoIntervalo
  periodo: Periodo
}): MetricasCalculadas {
  const { agendamentos, agendamentosAnterior, clientes, lembretesCount, intervalo, periodo } = args

  const base = agregar(agendamentos)
  const baseAnterior = agregar(agendamentosAnterior)

  const ticket_medio = base.concluidos > 0 ? base.faturamento / base.concluidos : 0
  const ticketAnterior =
    baseAnterior.concluidos > 0 ? baseAnterior.faturamento / baseAnterior.concluidos : 0

  const taxa_no_show = base.total > 0 ? (base.faltas / base.total) * 100 : 0
  const noShowAnterior =
    baseAnterior.total > 0 ? (baseAnterior.faltas / baseAnterior.total) * 100 : 0

  let agendamentos_ia = 0
  let agendamentos_manual = 0
  let faturamento_ia = 0
  for (const a of agendamentos) {
    if (a.criado_por === 'ia') {
      agendamentos_ia += 1
      if (a.status === 'concluido') faturamento_ia += Number(a.valor ?? 0)
    } else {
      agendamentos_manual += 1
    }
  }

  return {
    faturamento_total: base.faturamento,
    total_agendamentos: base.total,
    concluidos: base.concluidos,
    cancelados: base.cancelados,
    faltas: base.faltas,
    taxa_no_show,
    ticket_medio,
    clientes_novos: clientesNovosNoPeriodo(clientes, intervalo),
    clientes_recuperados: clientesRecuperados(agendamentos, clientes, intervalo),
    agendamentos_ia,
    agendamentos_manual,
    taxa_ia: base.total > 0 ? (agendamentos_ia / base.total) * 100 : 0,
    faturamento_ia,
    lembretes_enviados: lembretesCount,
    por_barbeiro: agruparPorBarbeiro(agendamentos),
    por_servico: agruparPorServico(agendamentos),
    faturamento_por_dia: faturamentoPorBucket(agendamentos, intervalo, periodo),
    evolucao_clientes: evolucaoUltimos6Meses(clientes),
    variacao: {
      faturamento: variacaoPercentual(base.faturamento, baseAnterior.faturamento),
      concluidos: variacaoPercentual(base.concluidos, baseAnterior.concluidos),
      ticket_medio: variacaoPercentual(ticket_medio, ticketAnterior),
      no_show: variacaoPercentual(taxa_no_show, noShowAnterior),
    },
  }
}
