'use client'

import { useTransition } from 'react'
import {
  Bot,
  Pencil,
  Globe,
  MoreVertical,
  CheckCircle2,
  CheckCheck,
  XCircle,
  Edit3,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  cancelarAgendamento,
  concluirAgendamento,
  confirmarAgendamento,
} from '../actions'
import type { AgendamentoComJoins } from '../types'
import type { StatusAgendamento } from '@/types'

const STATUS_STYLES: Record<
  StatusAgendamento,
  { label: string; className: string }
> = {
  agendado: { label: 'Agendado', className: 'bg-brand-50 text-brand' },
  confirmado: {
    label: 'Confirmado',
    className: 'bg-emerald-100 text-emerald-700',
  },
  concluido: {
    label: 'Concluído',
    className: 'bg-slate-200 text-slate-700',
  },
  cancelado: {
    label: 'Cancelado',
    className: 'bg-red-100 text-red-700',
  },
  faltou: { label: 'Faltou', className: 'bg-orange-100 text-orange-700' },
}

function formatHora(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

interface Props {
  agendamento: AgendamentoComJoins
  onEdit: (ag: AgendamentoComJoins) => void
  onChange: () => void
}

export function AgendamentoCard({ agendamento, onEdit, onChange }: Props) {
  const [isPending, startTransition] = useTransition()
  const status = agendamento.status as StatusAgendamento
  const style = STATUS_STYLES[status]
  const isCancelado = status === 'cancelado'

  function runAction(
    action: () => Promise<{ success: boolean; error?: string }>,
    successMsg: string,
  ) {
    startTransition(async () => {
      const result = await action()
      if (!result.success) {
        toast.error(result.error ?? 'Erro ao atualizar agendamento.')
        return
      }
      toast.success(successMsg)
      onChange()
    })
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-brand-100 bg-white p-4 transition-shadow hover:shadow-sm',
        isCancelado && 'opacity-70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex flex-col items-center justify-center rounded-md bg-brand-50/60 px-3 py-2 min-w-20 text-center">
            <span className="text-xs text-slate-500 font-mono">
              {formatHora(agendamento.inicio_at)}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {formatHora(agendamento.fim_at)}
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p
                className={cn(
                  'font-semibold text-slate-900 truncate',
                  isCancelado && 'line-through',
                )}
              >
                {agendamento.clientes?.nome ?? 'Cliente sem nome'}
              </p>
              {agendamento.criado_por === 'ia' ? (
                <Bot className="size-3.5 text-brand" aria-label="Criado pela IA" />
              ) : agendamento.criado_por === 'cliente_web' ? (
                <Globe
                  className="size-3.5 text-emerald-600"
                  aria-label="Agendamento online"
                />
              ) : (
                <Pencil
                  className="size-3.5 text-slate-400"
                  aria-label="Criado manualmente"
                />
              )}
            </div>
            <p className="text-sm text-slate-600 truncate">
              <span className="font-medium">{agendamento.servico}</span>
              {agendamento.valor != null && (
                <>
                  {' · '}
                  <span className="font-mono">
                    R$ {Number(agendamento.valor).toFixed(2).replace('.', ',')}
                  </span>
                </>
              )}
              {' · '}
              <span className="font-mono">{agendamento.duracao_min}min</span>
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Barbeiro: {agendamento.barbeiros?.nome ?? '—'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cn('border-transparent', style.className)}>
            {style.label}
          </Badge>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  aria-label="Ações do agendamento"
                >
                  <MoreVertical className="size-4" />
                </Button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                disabled={status !== 'agendado'}
                onClick={() =>
                  runAction(
                    () => confirmarAgendamento(agendamento.id),
                    'Agendamento confirmado.',
                  )
                }
              >
                <CheckCircle2 className="size-4" />
                Confirmar
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={status === 'concluido' || status === 'cancelado'}
                onClick={() =>
                  runAction(
                    () => concluirAgendamento(agendamento.id),
                    'Agendamento concluído.',
                  )
                }
              >
                <CheckCheck className="size-4" />
                Concluir
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(agendamento)}>
                <Edit3 className="size-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                disabled={status === 'cancelado'}
                onClick={() =>
                  runAction(
                    () => cancelarAgendamento(agendamento.id),
                    'Agendamento cancelado.',
                  )
                }
                className="text-red-600"
              >
                <XCircle className="size-4" />
                Cancelar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {agendamento.observacoes && (
        <p className="mt-3 text-xs text-slate-600 bg-slate-50 rounded p-2 border border-slate-100">
          {agendamento.observacoes}
        </p>
      )}
    </div>
  )
}
