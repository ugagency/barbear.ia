'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { editarAgendamento } from '../actions'
import type { AgendamentoComJoins } from '../types'
import type { FormaPagamento, StatusAgendamento } from '@/types'

interface Props {
  agendamento: AgendamentoComJoins | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSalvo: () => void
}

const STATUS_OPCOES: { value: StatusAgendamento; label: string }[] = [
  { value: 'agendado', label: 'Agendado' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'cancelado', label: 'Cancelado' },
  { value: 'faltou', label: 'Faltou' },
]

const PAGAMENTO_OPCOES: { value: FormaPagamento; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'a_definir', label: 'A definir' },
]

function isoToInputDateTime(iso: string): string {
  const d = new Date(iso)
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
}

export function ModalEditarAgendamento({
  agendamento,
  open,
  onOpenChange,
  onSalvo,
}: Props) {
  const [status, setStatus] = useState<StatusAgendamento>('agendado')
  const [inicioInput, setInicioInput] = useState('')
  const [servico, setServico] = useState('')
  const [valor, setValor] = useState<number>(0)
  const [duracao, setDuracao] = useState<number>(30)
  const [pagamento, setPagamento] = useState<FormaPagamento>('a_definir')
  const [observacoes, setObservacoes] = useState('')
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && agendamento) {
      setStatus(agendamento.status as StatusAgendamento)
      setInicioInput(isoToInputDateTime(agendamento.inicio_at))
      setServico(agendamento.servico)
      setValor(Number(agendamento.valor ?? 0))
      setDuracao(agendamento.duracao_min)
      setPagamento(agendamento.forma_pagamento as FormaPagamento)
      setObservacoes(agendamento.observacoes ?? '')
    }
  }, [open, agendamento])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!agendamento) return

    startTransition(async () => {
      const result = await editarAgendamento(agendamento.id, {
        status,
        servico,
        valor,
        duracao_min: duracao,
        inicio_at: new Date(inicioInput).toISOString(),
        forma_pagamento: pagamento,
        observacoes: observacoes || null,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Agendamento atualizado.')
      onOpenChange(false)
      onSalvo()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-brand">Editar agendamento</DialogTitle>
          <DialogDescription>
            {agendamento?.clientes?.nome ?? 'Agendamento'} ·{' '}
            {agendamento?.barbeiros?.nome ?? '—'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select
              value={status}
              onValueChange={(v) =>
                setStatus(typeof v === 'string' ? (v as StatusAgendamento) : status)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPCOES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inicio">Data e horário</Label>
            <Input
              id="inicio"
              type="datetime-local"
              value={inicioInput}
              onChange={(e) => setInicioInput(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="servico">Serviço</Label>
            <Input
              id="servico"
              value={servico}
              onChange={(e) => setServico(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="evalor">Valor (R$)</Label>
              <Input
                id="evalor"
                type="number"
                min="0"
                step="1"
                value={valor || ''}
                onChange={(e) => setValor(Number(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eduracao">Duração (min)</Label>
              <Input
                id="eduracao"
                type="number"
                min="5"
                step="5"
                value={duracao || ''}
                onChange={(e) => setDuracao(Number(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <Select
              value={pagamento}
              onValueChange={(v) =>
                setPagamento(
                  typeof v === 'string' ? (v as FormaPagamento) : 'a_definir',
                )
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGAMENTO_OPCOES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eobs">Observações</Label>
            <Textarea
              id="eobs"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand hover:bg-brand-light text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
