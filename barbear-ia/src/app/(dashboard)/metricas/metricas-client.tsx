'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowDownRight,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  DollarSign,
  Pencil,
  Sparkles,
  TrendingUp,
  UserPlus,
  XCircle,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { GraficoFaturamento } from './components/grafico-faturamento'
import { GraficoServicos } from './components/grafico-servicos'
import { GraficoClientes } from './components/grafico-clientes'
import { TabelaBarbeiros } from './components/tabela-barbeiros'
import { CardIA } from './components/card-ia'
import type { MetricasCalculadas, Periodo } from './types'

interface Props {
  periodo: Periodo
  metricas: MetricasCalculadas
}

const PERIODO_OPCOES: { value: Periodo; label: string }[] = [
  { value: 'hoje', label: 'Hoje' },
  { value: 'semana', label: 'Esta semana' },
  { value: 'mes', label: 'Este mês' },
  { value: 'mes_passado', label: 'Mês passado' },
]

const PERIODO_TITULO_GRAFICO: Record<Periodo, string> = {
  hoje: 'Faturamento por hora',
  semana: 'Faturamento por dia',
  mes: 'Faturamento por dia',
  mes_passado: 'Faturamento por dia',
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function MetricasClient({ periodo, metricas }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function trocarPeriodo(p: Periodo) {
    startTransition(() => {
      router.push(`/metricas?periodo=${p}`)
    })
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-5">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand">Métricas</h1>
          <p className="text-sm text-slate-500">
            Acompanhe o desempenho da sua barbearia.
          </p>
        </div>
        <div className="inline-flex flex-wrap gap-1 rounded-lg bg-brand-50 p-1">
          {PERIODO_OPCOES.map((opt) => {
            const ativo = opt.value === periodo
            return (
              <button
                key={opt.value}
                type="button"
                disabled={isPending}
                onClick={() => trocarPeriodo(opt.value)}
                className={cn(
                  'text-xs font-medium px-3 py-1.5 rounded-md transition-colors',
                  ativo
                    ? 'bg-white text-brand shadow-sm'
                    : 'text-slate-600 hover:text-brand',
                )}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </header>

      {/* KPIs principais */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          icon={<DollarSign className="size-4" />}
          label="Faturamento"
          value={formatBRL(metricas.faturamento_total)}
          variacao={metricas.variacao.faturamento}
        />
        <Kpi
          icon={<CheckCircle2 className="size-4" />}
          label="Concluídos"
          value={String(metricas.concluidos)}
          variacao={metricas.variacao.concluidos}
        />
        <Kpi
          icon={<TrendingUp className="size-4" />}
          label="Ticket médio"
          value={formatBRL(metricas.ticket_medio)}
          variacao={metricas.variacao.ticket_medio}
        />
        <Kpi
          icon={<XCircle className="size-4" />}
          label="No-show"
          value={`${metricas.taxa_no_show.toFixed(1).replace('.', ',')}%`}
          variacao={metricas.variacao.no_show}
          variacaoInvertida
        />
      </section>

      {/* KPIs secundários */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Kpi
          icon={<UserPlus className="size-4" />}
          label="Clientes novos"
          value={String(metricas.clientes_novos)}
        />
        <Kpi
          icon={<Sparkles className="size-4" />}
          label="Recuperados pela IA"
          value={String(metricas.clientes_recuperados)}
          accent="emerald"
        />
        <Kpi
          icon={<Bot className="size-4" />}
          label="Agendados pela IA"
          value={`${metricas.taxa_ia.toFixed(0)}%`}
          subtitle={`${metricas.agendamentos_ia} agend.`}
          accent="brand"
        />
        <Kpi
          icon={<Pencil className="size-4" />}
          label="Manuais"
          value={String(metricas.agendamentos_manual)}
        />
      </section>

      {metricas.total_agendamentos === 0 ? (
        <div className="rounded-xl border border-dashed border-brand-100 bg-white p-12 text-center">
          <Calendar className="size-10 text-brand/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">
            Sem agendamentos no período selecionado
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Tente outro recorte de tempo no seletor acima.
          </p>
        </div>
      ) : (
        <>
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CardChart
              titulo={PERIODO_TITULO_GRAFICO[periodo]}
              subtitle={`Total: ${formatBRL(metricas.faturamento_total)}`}
              className="lg:col-span-2"
            >
              <GraficoFaturamento dados={metricas.faturamento_por_dia} />
            </CardChart>
            <CardChart titulo="Serviços" subtitle="Distribuição dos concluídos">
              <GraficoServicos dados={metricas.por_servico} />
            </CardChart>
          </section>

          <section className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
            <h2 className="text-base font-semibold text-brand">
              Performance por barbeiro
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Clique no cabeçalho para ordenar.
            </p>
            <div className="mt-4">
              <TabelaBarbeiros dados={metricas.por_barbeiro} />
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <CardChart
              titulo="Evolução de clientes"
              subtitle="Últimos 6 meses"
              className="lg:col-span-2"
            >
              <GraficoClientes dados={metricas.evolucao_clientes} />
            </CardChart>
            <CardIA metricas={metricas} />
          </section>
        </>
      )}
    </div>
  )
}

interface KpiProps {
  icon: React.ReactNode
  label: string
  value: string
  subtitle?: string
  variacao?: number | null
  variacaoInvertida?: boolean
  accent?: 'brand' | 'emerald'
}

function Kpi({
  icon,
  label,
  value,
  subtitle,
  variacao,
  variacaoInvertida,
  accent = 'brand',
}: KpiProps) {
  return (
    <div className="rounded-lg border border-brand-100 bg-white p-3 sm:p-4">
      <div
        className={cn(
          'flex items-center gap-2 text-xs font-medium',
          accent === 'brand' ? 'text-brand' : 'text-emerald-700',
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900 font-mono leading-tight">
        {value}
      </p>
      {subtitle && (
        <p className="text-[11px] text-slate-500 mt-0.5">{subtitle}</p>
      )}
      {variacao !== undefined && variacao !== null && (
        <Variacao value={variacao} invertida={variacaoInvertida} />
      )}
    </div>
  )
}

function Variacao({
  value,
  invertida,
}: {
  value: number
  invertida?: boolean
}) {
  const positivoFinanceiro = invertida ? value < 0 : value > 0
  const cor =
    Math.abs(value) < 0.1
      ? 'text-slate-500'
      : positivoFinanceiro
        ? 'text-emerald-700'
        : 'text-red-600'
  const Icon = value > 0 ? ArrowUpRight : ArrowDownRight
  return (
    <div className={cn('mt-1.5 inline-flex items-center gap-0.5 text-xs font-medium', cor)}>
      <Icon className="size-3" />
      {Math.abs(value).toFixed(1).replace('.', ',')}% vs anterior
    </div>
  )
}

function CardChart({
  titulo,
  subtitle,
  children,
  className,
}: {
  titulo: string
  subtitle?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-brand-100 bg-white p-5 sm:p-6',
        className,
      )}
    >
      <div className="mb-3">
        <h2 className="text-base font-semibold text-brand">{titulo}</h2>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}
