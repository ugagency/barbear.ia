'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PontoFaturamento } from '../types'

interface Props {
  dados: PontoFaturamento[]
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

interface TooltipProps {
  active?: boolean
  payload?: { value: number; payload: PontoFaturamento }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const valor = payload[0].value
  return (
    <div className="rounded-md border border-brand-100 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-slate-700">{label}</p>
      <p className="text-brand font-mono">
        {valor.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
        })}
      </p>
    </div>
  )
}

export function GraficoFaturamento({ dados }: Props) {
  const total = dados.reduce((s, d) => s + d.faturamento, 0)
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        Sem faturamento no período.
      </div>
    )
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8EDF5" vertical={false} />
          <XAxis
            dataKey="rotulo"
            stroke="#64748B"
            tick={{ fontSize: 11 }}
            axisLine={{ stroke: '#C5D0E3' }}
            tickLine={false}
          />
          <YAxis
            stroke="#64748B"
            tick={{ fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => formatBRL(v)}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#E8EDF5' }} />
          <Bar dataKey="faturamento" fill="#0A1F44" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
