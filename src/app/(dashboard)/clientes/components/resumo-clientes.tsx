'use client'

import { Users, UserCheck, AlertTriangle, UserX } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ClienteListItem } from '../types'
import { useMemo } from 'react'

interface Props {
  clientes: ClienteListItem[]
}

export function ResumoClientes({ clientes }: Props) {
  const stats = useMemo(() => {
    let ativos = 0
    let risco = 0
    let inativos = 0
    for (const c of clientes) {
      if (c.status === 'ativo') ativos += 1
      else if (c.status === 'risco') risco += 1
      else inativos += 1
    }
    return { total: clientes.length, ativos, risco, inativos }
  }, [clientes])

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card icon={<Users className="size-4" />} label="Total" value={stats.total} />
      <Card
        icon={<UserCheck className="size-4" />}
        label="Ativos"
        value={stats.ativos}
        accent="emerald"
      />
      <Card
        icon={<AlertTriangle className="size-4" />}
        label="Em risco"
        value={stats.risco}
        accent="amber"
      />
      <Card
        icon={<UserX className="size-4" />}
        label="Inativos"
        value={stats.inativos}
        accent="red"
      />
    </div>
  )
}

interface CardProps {
  icon: React.ReactNode
  label: string
  value: number
  accent?: 'brand' | 'emerald' | 'amber' | 'red'
}

function Card({ icon, label, value, accent = 'brand' }: CardProps) {
  return (
    <div className="rounded-lg border border-brand-100 bg-white p-3 sm:p-4">
      <div
        className={cn(
          'flex items-center gap-2 text-xs font-medium',
          accent === 'brand' && 'text-brand',
          accent === 'emerald' && 'text-emerald-700',
          accent === 'amber' && 'text-amber-700',
          accent === 'red' && 'text-red-700',
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
