import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MetricasClient } from './metricas-client'
import { calcularMetricas, intervaloPeriodo } from './calc'
import type {
  AgendamentoComJoins,
  ClienteResumoMetrica,
  Periodo,
} from './types'

interface PageProps {
  searchParams: Promise<{ periodo?: string }>
}

const PERIODOS_VALIDOS: Periodo[] = ['hoje', 'semana', 'mes', 'mes_passado']

function parsePeriodo(value: string | undefined): Periodo {
  if (value && (PERIODOS_VALIDOS as string[]).includes(value)) {
    return value as Periodo
  }
  return 'mes'
}

export default async function MetricasPage({ searchParams }: PageProps) {
  const { periodo: rawPeriodo } = await searchParams
  const periodo = parsePeriodo(rawPeriodo)
  const intervalo = intervaloPeriodo(periodo)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vinculo } = await supabase
    .from('usuarios_barbearias')
    .select('barbearia_id')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!vinculo) redirect('/onboarding')
  const barbeariaId = vinculo.barbearia_id as string

  const [agendamentosRes, agendamentosAnteriorRes, clientesRes, lembretesRes] =
    await Promise.all([
      supabase
        .from('agendamentos')
        .select('*, barbeiros(nome), clientes(nome)')
        .eq('barbearia_id', barbeariaId)
        .gte('inicio_at', intervalo.inicio.toISOString())
        .lte('inicio_at', intervalo.fim.toISOString())
        .order('inicio_at', { ascending: true }),
      supabase
        .from('agendamentos')
        .select('*, barbeiros(nome), clientes(nome)')
        .eq('barbearia_id', barbeariaId)
        .gte('inicio_at', intervalo.inicioAnterior.toISOString())
        .lte('inicio_at', intervalo.fimAnterior.toISOString()),
      supabase
        .from('clientes')
        .select('id, created_at, total_atendimentos, ativo, ultimo_atendimento')
        .eq('barbearia_id', barbeariaId),
      supabase
        .from('lembretes_log')
        .select('id', { count: 'exact', head: true })
        .eq('barbearia_id', barbeariaId)
        .eq('tipo', 'reativacao')
        .eq('status', 'enviado')
        .gte('enviado_at', intervalo.inicio.toISOString())
        .lte('enviado_at', intervalo.fim.toISOString()),
    ])

  const metricas = calcularMetricas({
    agendamentos: (agendamentosRes.data ?? []) as AgendamentoComJoins[],
    agendamentosAnterior: (agendamentosAnteriorRes.data ?? []) as AgendamentoComJoins[],
    clientes: (clientesRes.data ?? []) as ClienteResumoMetrica[],
    lembretesCount: lembretesRes.count ?? 0,
    intervalo,
    periodo,
  })

  return <MetricasClient periodo={periodo} metricas={metricas} />
}
