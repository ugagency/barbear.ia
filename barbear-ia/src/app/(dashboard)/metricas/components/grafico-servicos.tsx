'use client'

import { useMemo, useState } from 'react'
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { PorServico } from '../types'

const PALETA = [
  '#0A1F44',
  '#132D5E',
  '#2C4575',
  '#4A648F',
  '#6B82A8',
  '#8FA1C0',
  '#B3C0D6',
]

interface Props {
  dados: PorServico[]
}

type Modo = 'count' | 'faturamento'

interface TooltipProps {
  active?: boolean
  payload?: {
    payload: PorServico & { value: number; name: string }
  }[]
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const d = payload[0].payload
  return (
    <div className="rounded-md border border-brand-100 bg-white px-3 py-2 shadow-sm text-xs">
      <p className="font-medium text-slate-700">{d.nome}</p>
      <p className="text-slate-500 font-mono">{d.count} atend.</p>
      <p className="text-brand font-mono">
        {d.faturamento.toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2,
        })}
      </p>
    </div>
  )
}

export function GraficoServicos({ dados }: Props) {
  const [modo, setModo] = useState<Modo>('faturamento')

  const dataset = useMemo(
    () =>
      dados.map((d) => ({
        ...d,
        value: modo === 'count' ? d.count : d.faturamento,
        name: d.nome,
      })),
    [dados, modo],
  )

  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-slate-400">
        Sem serviços concluídos no período.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-1">
        <button
          type="button"
          onClick={() => setModo('faturamento')}
          className={cn(
            'text-[11px] px-2 py-1 rounded-md border',
            modo === 'faturamento'
              ? 'bg-brand text-white border-brand'
              : 'bg-white text-slate-600 border-brand-100 hover:bg-brand-50',
          )}
        >
          Faturamento
        </button>
        <button
          type="button"
          onClick={() => setModo('count')}
          className={cn(
            'text-[11px] px-2 py-1 rounded-md border',
            modo === 'count'
              ? 'bg-brand text-white border-brand'
              : 'bg-white text-slate-600 border-brand-100 hover:bg-brand-50',
          )}
        >
          Quantidade
        </button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataset}
              dataKey="value"
              nameKey="name"
              cx="35%"
              cy="50%"
              innerRadius={50}
              outerRadius={85}
              paddingAngle={2}
              stroke="#fff"
            >
              {dataset.map((_, idx) => (
                <Cell key={idx} fill={PALETA[idx % PALETA.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              verticalAlign="middle"
              align="right"
              layout="vertical"
              iconType="circle"
              wrapperStyle={{ fontSize: 12, color: '#475569' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
