'use client'

import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Star } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { PorBarbeiro } from '../types'

type Campo = 'nome' | 'total' | 'concluidos' | 'faturamento' | 'ticket_medio' | 'taxa_no_show'

interface Props {
  dados: PorBarbeiro[]
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  })
}

export function TabelaBarbeiros({ dados }: Props) {
  const [sortBy, setSortBy] = useState<Campo>('faturamento')
  const [direction, setDirection] = useState<'asc' | 'desc'>('desc')

  const maxFaturamento = useMemo(
    () => Math.max(0, ...dados.map((d) => d.faturamento)),
    [dados],
  )

  const melhores = useMemo(() => {
    if (dados.length === 0) return null
    const top = (campo: Campo) =>
      dados.reduce((best, cur) => {
        const a = cur[campo] as number
        const b = best[campo] as number
        return a > b ? cur : best
      }, dados[0])
    return {
      faturamento: top('faturamento').barbeiro_id,
      ticket_medio: top('ticket_medio').barbeiro_id,
      concluidos: top('concluidos').barbeiro_id,
      // Para no-show, "melhor" é o menor
      no_show: dados.reduce((best, cur) =>
        cur.taxa_no_show < best.taxa_no_show ? cur : best,
      ).barbeiro_id,
    }
  }, [dados])

  const sorted = useMemo(() => {
    const arr = [...dados]
    arr.sort((a, b) => {
      const va = a[sortBy]
      const vb = b[sortBy]
      if (typeof va === 'string' && typeof vb === 'string') {
        return direction === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      }
      const na = Number(va)
      const nb = Number(vb)
      return direction === 'asc' ? na - nb : nb - na
    })
    return arr
  }, [dados, sortBy, direction])

  function toggleSort(campo: Campo) {
    if (campo === sortBy) {
      setDirection((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(campo)
      setDirection(campo === 'nome' ? 'asc' : 'desc')
    }
  }

  if (dados.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-slate-400">
        Sem agendamentos no período.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortHeader campo="nome" sortBy={sortBy} direction={direction} onClick={toggleSort}>
            Barbeiro
          </SortHeader>
          <SortHeader campo="total" sortBy={sortBy} direction={direction} onClick={toggleSort} align="right">
            Atend.
          </SortHeader>
          <SortHeader campo="concluidos" sortBy={sortBy} direction={direction} onClick={toggleSort} align="right">
            Concluídos
          </SortHeader>
          <SortHeader campo="faturamento" sortBy={sortBy} direction={direction} onClick={toggleSort} align="right">
            Faturamento
          </SortHeader>
          <SortHeader campo="ticket_medio" sortBy={sortBy} direction={direction} onClick={toggleSort} align="right">
            Ticket méd.
          </SortHeader>
          <SortHeader campo="taxa_no_show" sortBy={sortBy} direction={direction} onClick={toggleSort} align="right">
            No-show
          </SortHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((b) => {
          const ratio = maxFaturamento > 0 ? (b.faturamento / maxFaturamento) * 100 : 0
          return (
            <TableRow key={b.barbeiro_id}>
              <TableCell className="font-medium text-slate-900">
                {b.nome}
                {melhores?.faturamento === b.barbeiro_id && (
                  <Star
                    className="size-3 ml-1.5 inline text-amber-500 fill-amber-400"
                    aria-label="Melhor faturamento"
                  />
                )}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {b.total}
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {b.concluidos}
                {melhores?.concluidos === b.barbeiro_id && b.concluidos > 0 && (
                  <Star className="size-3 ml-1 inline text-amber-500 fill-amber-400" />
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-sm text-slate-900">
                    {formatBRL(b.faturamento)}
                  </span>
                  <div className="w-24 h-1 rounded-full bg-brand-100/60 overflow-hidden">
                    <div
                      className="h-full bg-brand"
                      style={{ width: `${ratio}%` }}
                    />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">
                {formatBRL(b.ticket_medio)}
                {melhores?.ticket_medio === b.barbeiro_id && b.ticket_medio > 0 && (
                  <Star className="size-3 ml-1 inline text-amber-500 fill-amber-400" />
                )}
              </TableCell>
              <TableCell
                className={cn(
                  'text-right font-mono text-sm',
                  b.taxa_no_show >= 15 && 'text-red-600',
                )}
              >
                {b.taxa_no_show.toFixed(1).replace('.', ',')}%
                {melhores?.no_show === b.barbeiro_id && (
                  <Star className="size-3 ml-1 inline text-amber-500 fill-amber-400" />
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

interface SortHeaderProps {
  children: React.ReactNode
  campo: Campo
  sortBy: Campo
  direction: 'asc' | 'desc'
  align?: 'left' | 'right'
  onClick: (campo: Campo) => void
}

function SortHeader({ children, campo, sortBy, direction, align, onClick }: SortHeaderProps) {
  const active = sortBy === campo
  return (
    <TableHead
      className={cn(
        'text-xs font-semibold uppercase tracking-wide cursor-pointer select-none',
        align === 'right' ? 'text-right' : '',
        active ? 'text-brand' : 'text-slate-600',
      )}
      onClick={() => onClick(campo)}
    >
      <span className={cn('inline-flex items-center gap-1', align === 'right' && 'justify-end')}>
        {children}
        {active && (direction === 'asc' ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
      </span>
    </TableHead>
  )
}
