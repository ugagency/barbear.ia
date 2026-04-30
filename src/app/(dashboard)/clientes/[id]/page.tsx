import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  ChevronLeft,
  Phone,
  CalendarCheck,
  TrendingUp,
  Scissors,
  User,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { calcularStatus, diasDesde } from '../types'
import type { Agendamento, Cliente, StatusAgendamento } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

interface AgendamentoComBarbeiro extends Agendamento {
  barbeiros: { nome: string } | null
}

const STATUS_STYLES: Record<
  StatusAgendamento,
  { label: string; className: string }
> = {
  agendado: { label: 'Agendado', className: 'bg-brand-50 text-brand' },
  confirmado: {
    label: 'Confirmado',
    className: 'bg-emerald-100 text-emerald-700',
  },
  concluido: { label: 'Concluído', className: 'bg-slate-200 text-slate-700' },
  cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700' },
  faltou: { label: 'Faltou', className: 'bg-orange-100 text-orange-700' },
}

const CLIENTE_STATUS_STYLES = {
  ativo: 'bg-emerald-50 text-emerald-700',
  risco: 'bg-amber-50 text-amber-700',
  inativo: 'bg-red-50 text-red-700',
} as const

const CLIENTE_STATUS_LABEL = {
  ativo: 'Ativo',
  risco: 'Em risco',
  inativo: 'Inativo',
} as const

const MESES_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

function formatData(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getDate()).padStart(2, '0')} ${MESES_PT[d.getMonth()]} ${d.getFullYear()}`
}

function formatHora(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function formatClienteDesde(iso: string): string {
  const d = new Date(iso)
  return `${MESES_PT[d.getMonth()]}/${d.getFullYear()}`
}

function formatTelefone(t: string): string {
  const digits = t.replace(/\D/g, '')
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return digits
}

function formatUltimoAtendimentoDias(dias: number | null): string {
  if (dias === null) return 'Nunca'
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 30) return `${dias} dias atrás`
  if (dias < 60) return `${Math.floor(dias / 7)} sem atrás`
  return `${Math.floor(dias / 30)} meses atrás`
}

export default async function ClienteDetalhePage({ params }: PageProps) {
  const { id } = await params
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

  const [clienteRes, agendamentosRes] = await Promise.all([
    supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .eq('barbearia_id', barbeariaId)
      .maybeSingle(),
    supabase
      .from('agendamentos')
      .select('*, barbeiros(nome)')
      .eq('cliente_id', id)
      .eq('barbearia_id', barbeariaId)
      .order('inicio_at', { ascending: false })
      .limit(50),
  ])

  if (!clienteRes.data) notFound()

  const cliente = clienteRes.data as Cliente
  const agendamentos = (agendamentosRes.data ?? []) as AgendamentoComBarbeiro[]

  const status = calcularStatus(cliente.ultimo_atendimento)
  const dias = diasDesde(cliente.ultimo_atendimento)

  const concluidos = agendamentos.filter((a) => a.status === 'concluido')
  const totalConcluidos = concluidos.length
  const somaValores = concluidos.reduce(
    (acc, a) => acc + Number(a.valor ?? 0),
    0,
  )
  const ticketMedio = totalConcluidos > 0 ? somaValores / totalConcluidos : 0

  const servicoFavorito = topByCount(concluidos.map((a) => a.servico))
  const barbeiroFavorito = topByCount(
    concluidos
      .map((a) => a.barbeiros?.nome ?? '')
      .filter((n) => n.length > 0),
  )

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5">
      <nav className="text-sm flex items-center gap-1.5 text-slate-500">
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1 text-slate-500 hover:text-brand"
        >
          <ChevronLeft className="size-4" />
          Clientes
        </Link>
        <span>·</span>
        <span className="text-slate-700 truncate">
          {cliente.nome ?? '(sem nome)'}
        </span>
      </nav>

      <header className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-brand">
                {cliente.nome ?? '(sem nome)'}
              </h1>
              <Badge
                className={cn(
                  'border-transparent',
                  CLIENTE_STATUS_STYLES[status],
                )}
              >
                {CLIENTE_STATUS_LABEL[status]}
              </Badge>
              {!cliente.ativo && (
                <Badge className="border-transparent bg-slate-200 text-slate-700">
                  Inativo
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-600 inline-flex items-center gap-2 font-mono">
              <Phone className="size-3.5 text-slate-400" />
              {formatTelefone(cliente.telefone)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Cliente desde {formatClienteDesde(cliente.created_at)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Stat
            icon={<CalendarCheck className="size-4" />}
            label="Visitas"
            value={String(cliente.total_atendimentos)}
          />
          <Stat
            icon={<TrendingUp className="size-4" />}
            label="Ticket médio"
            value={`R$ ${ticketMedio.toFixed(2).replace('.', ',')}`}
          />
          <Stat
            icon={<CalendarCheck className="size-4" />}
            label="Último atend."
            value={formatUltimoAtendimentoDias(dias)}
          />
          <Stat
            icon={<Scissors className="size-4" />}
            label="Serviço favorito"
            value={servicoFavorito ?? '—'}
          />
        </div>

        {barbeiroFavorito && (
          <p className="mt-3 text-xs text-slate-500 inline-flex items-center gap-2">
            <User className="size-3.5" />
            Barbeiro favorito:{' '}
            <span className="font-medium text-slate-700">
              {barbeiroFavorito}
            </span>
          </p>
        )}
      </header>

      <section>
        <h2 className="text-sm font-semibold text-brand uppercase tracking-wide mb-3">
          Histórico de atendimentos
        </h2>

        {agendamentos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brand-100 bg-white p-10 text-center">
            <CalendarCheck className="size-8 text-brand/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">
              Sem histórico ainda
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Agendamentos deste cliente aparecerão aqui.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {agendamentos.map((a) => {
              const style = STATUS_STYLES[a.status as StatusAgendamento]
              return (
                <li
                  key={a.id}
                  className="rounded-lg border border-brand-100 bg-white p-3 sm:p-4 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      {formatData(a.inicio_at)} ·{' '}
                      <span className="font-mono text-xs text-slate-500">
                        {formatHora(a.inicio_at)}
                      </span>
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      <span className="font-medium">{a.servico}</span>
                      {' · '}
                      {a.barbeiros?.nome ?? '—'}
                      {a.valor != null && (
                        <>
                          {' · '}
                          <span className="font-mono">
                            R$ {Number(a.valor).toFixed(2).replace('.', ',')}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <Badge
                    className={cn('border-transparent shrink-0', style.className)}
                  >
                    {style.label}
                  </Badge>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-brand">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-1.5 text-lg font-bold text-slate-900 truncate">
        {value}
      </p>
    </div>
  )
}

function topByCount(values: string[]): string | null {
  if (values.length === 0) return null
  const counts = new Map<string, number>()
  for (const v of values) {
    counts.set(v, (counts.get(v) ?? 0) + 1)
  }
  let max = 0
  let top: string | null = null
  for (const [k, n] of counts) {
    if (n > max) {
      max = n
      top = k
    }
  }
  return top
}
