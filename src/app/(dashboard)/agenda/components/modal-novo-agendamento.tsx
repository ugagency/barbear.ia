'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
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
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

import { ClientePicker, type ClienteSelecionado } from './cliente-picker'
import { gerarSlotsDoDia, type Ocupacao } from './slots'
import { criarAgendamento } from '../actions'
import type { BarbeiroOpcao } from '../types'
import type { FormaPagamento, Servico } from '@/types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  barbeiros: BarbeiroOpcao[]
  barbeariaId: string
  dataInicialIso: string
  onCriado: () => void
}

const PAGAMENTO_OPCOES: { value: FormaPagamento; label: string }[] = [
  { value: 'pix', label: 'PIX' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'a_definir', label: 'A definir' },
]

export function ModalNovoAgendamento({
  open,
  onOpenChange,
  barbeiros,
  barbeariaId,
  dataInicialIso,
  onCriado,
}: Props) {
  const [cliente, setCliente] = useState<ClienteSelecionado>(null)
  const [barbeiroId, setBarbeiroId] = useState<string>('')
  const [servicoNome, setServicoNome] = useState<string>('')
  const [valor, setValor] = useState<number>(0)
  const [duracao, setDuracao] = useState<number>(30)
  const [data, setData] = useState<string>(dataInicialIso)
  const [horaIso, setHoraIso] = useState<string>('')
  const [pagamento, setPagamento] = useState<FormaPagamento>('a_definir')
  const [observacoes, setObservacoes] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ocupacoes, setOcupacoes] = useState<Ocupacao[]>([])
  const [isPending, startTransition] = useTransition()

  // Reset form on open
  useEffect(() => {
    if (open) {
      setCliente(null)
      setBarbeiroId('')
      setServicoNome('')
      setValor(0)
      setDuracao(30)
      setData(dataInicialIso)
      setHoraIso('')
      setPagamento('a_definir')
      setObservacoes('')
      setErrors({})
      setOcupacoes([])
    }
  }, [open, dataInicialIso])

  const barbeiroSelecionado = useMemo(
    () => barbeiros.find((b) => b.id === barbeiroId) ?? null,
    [barbeiros, barbeiroId],
  )

  const servicosDoBarbeiro = useMemo(
    () => (barbeiroSelecionado?.servicos as Servico[] | null) ?? [],
    [barbeiroSelecionado],
  )

  // Buscar ocupações do barbeiro no dia (para slots)
  useEffect(() => {
    if (!barbeiroId || !data) {
      setOcupacoes([])
      return
    }
    let cancelled = false
    const supabase = createClient()
    const inicio = new Date(`${data}T00:00:00`)
    const fim = new Date(inicio)
    fim.setDate(fim.getDate() + 1)
    supabase
      .from('agendamentos')
      .select('inicio_at, fim_at, status')
      .eq('barbearia_id', barbeariaId)
      .eq('barbeiro_id', barbeiroId)
      .gte('inicio_at', inicio.toISOString())
      .lt('inicio_at', fim.toISOString())
      .then(({ data: ags }) => {
        if (cancelled) return
        const validos = (ags ?? []).filter(
          (a) => a.status !== 'cancelado',
        ) as { inicio_at: string; fim_at: string }[]
        setOcupacoes(
          validos.map((a) => ({
            inicio: new Date(a.inicio_at),
            fim: new Date(a.fim_at),
          })),
        )
      })
    return () => {
      cancelled = true
    }
  }, [barbeiroId, data, barbeariaId])

  const slots = useMemo(() => {
    if (!barbeiroSelecionado) return []
    const dt = new Date(`${data}T00:00:00`)
    return gerarSlotsDoDia(barbeiroSelecionado, dt, duracao, ocupacoes)
  }, [barbeiroSelecionado, data, duracao, ocupacoes])

  function handleServicoChange(nome: string) {
    setServicoNome(nome)
    const s = servicosDoBarbeiro.find((s) => s.nome === nome)
    if (s) {
      setValor(s.preco)
      setDuracao(s.duracao_min)
      setHoraIso('')
    }
  }

  function validar(): boolean {
    const errs: Record<string, string> = {}
    if (!cliente) errs.cliente = 'Selecione um cliente'
    if (cliente?.tipo === 'novo') {
      if (cliente.nome.length < 2) errs.cliente = 'Nome inválido'
      if (cliente.telefone.replace(/\D/g, '').length < 10)
        errs.cliente = 'Telefone inválido'
    }
    if (!barbeiroId) errs.barbeiro = 'Selecione um barbeiro'
    if (!servicoNome) errs.servico = 'Selecione um serviço'
    if (!horaIso) errs.hora = 'Selecione um horário'
    if (valor <= 0) errs.valor = 'Valor inválido'
    if (duracao <= 0) errs.duracao = 'Duração inválida'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar() || !cliente) return

    startTransition(async () => {
      const result = await criarAgendamento({
        cliente_id:
          cliente.tipo === 'existente' ? cliente.cliente.id : undefined,
        novo_cliente:
          cliente.tipo === 'novo'
            ? { nome: cliente.nome, telefone: cliente.telefone }
            : undefined,
        barbeiro_id: barbeiroId,
        servico: servicoNome,
        valor,
        duracao_min: duracao,
        inicio_at: horaIso,
        forma_pagamento: pagamento,
        observacoes: observacoes || undefined,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Agendamento criado.')
      onOpenChange(false)
      onCriado()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-brand">Novo agendamento</DialogTitle>
          <DialogDescription>
            Cadastre um agendamento manual para a sua agenda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <ClientePicker
            value={cliente}
            onChange={setCliente}
            error={errors.cliente}
          />

          <div className="space-y-1.5">
            <Label>Barbeiro</Label>
            <Select
              value={barbeiroId}
              onValueChange={(v) => {
                setBarbeiroId(typeof v === 'string' ? v : '')
                setServicoNome('')
                setHoraIso('')
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {barbeiros.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.barbeiro && (
              <p className="text-xs text-red-600">{errors.barbeiro}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Serviço</Label>
            <Select
              value={servicoNome}
              disabled={!barbeiroId}
              onValueChange={(v) =>
                handleServicoChange(typeof v === 'string' ? v : '')
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    barbeiroId ? 'Selecione o serviço' : 'Escolha um barbeiro'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {servicosDoBarbeiro.map((s) => (
                  <SelectItem key={s.nome} value={s.nome}>
                    {s.nome} · R$ {s.preco.toFixed(2).replace('.', ',')} ·{' '}
                    {s.duracao_min}min
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.servico && (
              <p className="text-xs text-red-600">{errors.servico}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="valor">Valor (R$)</Label>
              <Input
                id="valor"
                type="number"
                min="0"
                step="1"
                value={valor || ''}
                onChange={(e) => setValor(Number(e.target.value) || 0)}
              />
              {errors.valor && (
                <p className="text-xs text-red-600">{errors.valor}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="duracao">Duração (min)</Label>
              <Input
                id="duracao"
                type="number"
                min="5"
                step="5"
                value={duracao || ''}
                onChange={(e) => {
                  setDuracao(Number(e.target.value) || 0)
                  setHoraIso('')
                }}
              />
              {errors.duracao && (
                <p className="text-xs text-red-600">{errors.duracao}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input
              id="data"
              type="date"
              value={data}
              onChange={(e) => {
                setData(e.target.value)
                setHoraIso('')
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Horário</Label>
            {!barbeiroId || !servicoNome ? (
              <p className="text-xs text-muted-foreground">
                Selecione barbeiro e serviço para ver os horários disponíveis.
              </p>
            ) : slots.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Barbeiro não atende neste dia.
              </p>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-40 overflow-y-auto p-1 rounded-md border border-brand-100">
                {slots.map((s) => {
                  const ativo = s.iso === horaIso
                  return (
                    <button
                      type="button"
                      key={s.iso}
                      disabled={!s.disponivel}
                      onClick={() => setHoraIso(s.iso)}
                      className={cn(
                        'text-xs font-mono rounded-md px-2 py-1.5 border transition-colors',
                        ativo
                          ? 'bg-brand text-white border-brand'
                          : s.disponivel
                            ? 'border-brand-100 bg-white hover:bg-brand-50 text-slate-700'
                            : 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through',
                      )}
                    >
                      {s.hora}
                    </button>
                  )
                })}
              </div>
            )}
            {errors.hora && (
              <p className="text-xs text-red-600">{errors.hora}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Forma de pagamento</Label>
            <Select
              value={pagamento}
              onValueChange={(v) =>
                setPagamento(typeof v === 'string' ? (v as FormaPagamento) : 'a_definir')
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
            <Label htmlFor="obs">Observações (opcional)</Label>
            <Textarea
              id="obs"
              rows={2}
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Detalhes adicionais..."
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
                'Criar agendamento'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
