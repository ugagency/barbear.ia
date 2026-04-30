import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AgendaClient } from './agenda-client'
import type { AgendamentoComJoins, BarbeiroOpcao } from './types'

interface PageProps {
  searchParams: Promise<{ data?: string }>
}

function parseDataParam(value: string | undefined): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number)
    const dt = new Date(y, m - 1, d)
    if (!Number.isNaN(dt.getTime())) return dt
  }
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return today
}

export default async function AgendaPage({ searchParams }: PageProps) {
  const { data } = await searchParams
  const dia = parseDataParam(data)
  dia.setHours(0, 0, 0, 0)

  const proximoDia = new Date(dia)
  proximoDia.setDate(proximoDia.getDate() + 1)

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

  const [agendamentosRes, barbeirosRes] = await Promise.all([
    supabase
      .from('agendamentos')
      .select(
        `
        *,
        clientes(id, nome, telefone),
        barbeiros(id, nome)
      `,
      )
      .eq('barbearia_id', barbeariaId)
      .gte('inicio_at', dia.toISOString())
      .lt('inicio_at', proximoDia.toISOString())
      .order('inicio_at', { ascending: true }),
    supabase
      .from('barbeiros')
      .select('id, nome, servicos, horarios, ativo')
      .eq('barbearia_id', barbeariaId)
      .eq('ativo', true)
      .order('nome', { ascending: true }),
  ])

  const agendamentos = (agendamentosRes.data ?? []) as AgendamentoComJoins[]
  const barbeiros = (barbeirosRes.data ?? []) as BarbeiroOpcao[]

  return (
    <AgendaClient
      barbeariaId={barbeariaId}
      dataIso={toIsoDate(dia)}
      agendamentosIniciais={agendamentos}
      barbeiros={barbeiros}
    />
  )
}

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}
