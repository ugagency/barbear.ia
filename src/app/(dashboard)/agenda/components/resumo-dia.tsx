'use client'

import { useMemo } from 'react'
import { Calendar, CheckCircle2, DollarSign, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AgendamentoComJoins } from '../types'

interface Props {
  agendamentos: AgendamentoComJoins[]
}

export function ResumoDia({ agendamentos }: Props) {
  const stats = useMemo(() => {
    let agendado = 0
    let confirmado = 0
    let faltou = 0
    let faturamento = 0
    for (const ag of agendamentos) {
      if (ag.status === 'agendado') agendado += 1
      if (ag.status === 'confirmado') confirmado += 1
      if (ag.status === 'faltou') faltou += 1
      if (ag.status === 'concluido') {
        faturamento += Number(ag.valor ?? 0)
      }
    }
    return { agendado, confirmado, faturamento, faltou }
  }, [agendamentos])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card
        icon={<Calendar className="size-4" />}
        label="Agendados"
        value={stats.agendado}
      />
      <Card
        icon={<CheckCircle2 className="size-4" />}
        label="Confirmados"
        value={stats.confirmado}
        accent="emerald"
      />
      <Card
        icon={<DollarSign className="size-4" />}
        label="Faturamento"
        value={`R$ ${stats.faturamento.toFixed(2).replace('.', ',')}`}
      />
      <Card
        icon={<UserX className="size-4" />}
        label="Faltas"
        value={stats.faltou}
        accent="orange"
      />
    </div>
  )
}

interface CardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  accent?: 'brand' | 'emerald' | 'orange'
}

function Card({ icon, label, value, accent = 'brand' }: CardProps) {
  return (
    <div className="rounded-lg border border-brand-100 bg-white p-3 sm:p-4">
      <div
        className={cn(
          'flex items-center gap-2 text-xs font-medium',
          accent === 'brand' && 'text-brand',
          accent === 'emerald' && 'text-emerald-700',
          accent === 'orange' && 'text-orange-700',
        )}
      >
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold text-slate-900 font-mono">
        {value}
      </p>
    </div>
  )
}
