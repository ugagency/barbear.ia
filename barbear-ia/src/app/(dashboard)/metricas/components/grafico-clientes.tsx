'use client'

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { PontoEvolucao } from '../types'

interface Props {
  dados: PontoEvolucao[]
}

interface TooltipProps {
  active?: boolean
  payload?: { name: string; value: number; color: string }[]
  label?: string
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="rounded-md border border-brand-100 bg-white px-3 py-2 shadow-sm text-xs space-y-0.5">
      <p className="font-medium text-slate-700">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-mono">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

export function GraficoClientes({ dados }: Props) {
  const semDados = dados.every((d) => d.total === 0)
  if (semDados) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        Sem dados suficientes ainda.
      </div>
    )
  }
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            allowDecimals={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            wrapperStyle={{ fontSize: 12, color: '#475569' }}
          />
          <Line
            type="monotone"
            dataKey="total"
            name="Total de clientes"
            stroke="#0A1F44"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#0A1F44' }}
            activeDot={{ r: 5 }}
          />
          <Line
            type="monotone"
            dataKey="ativos"
            name="Ativos (30d)"
            stroke="#059669"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#059669' }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
