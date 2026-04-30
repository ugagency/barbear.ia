'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { atualizarBarbeiro, criarBarbeiro } from '../actions'
import type { Barbeiro, Servico } from '@/types'

const DURACOES = [10, 15, 20, 30, 45, 60, 90] as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  barbeiro: Barbeiro | null
  onSalvo: () => void
}

interface FormState {
  nome: string
  telefone: string
  calendar_id: string
  servicos: Servico[]
  ativo: boolean
}

const SERVICO_PADRAO: Servico = { nome: '', preco: 0, duracao_min: 30 }

const FORM_INICIAL: FormState = {
  nome: '',
  telefone: '',
  calendar_id: '',
  servicos: [{ nome: 'Corte', preco: 40, duracao_min: 30 }],
  ativo: true,
}

export function ModalBarbeiro({ open, onOpenChange, barbeiro, onSalvo }: Props) {
  const [form, setForm] = useState<FormState>(FORM_INICIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) return
    if (barbeiro) {
      setForm({
        nome: barbeiro.nome,
        telefone: barbeiro.telefone ?? '',
        calendar_id: barbeiro.calendar_id ?? '',
        servicos:
          (barbeiro.servicos as Servico[] | null)?.length
            ? (barbeiro.servicos as Servico[])
            : [SERVICO_PADRAO],
        ativo: barbeiro.ativo,
      })
    } else {
      setForm(FORM_INICIAL)
    }
    setErrors({})
  }, [open, barbeiro])

  function setServico(idx: number, patch: Partial<Servico>) {
    setForm((s) => ({
      ...s,
      servicos: s.servicos.map((srv, i) =>
        i === idx ? { ...srv, ...patch } : srv,
      ),
    }))
  }

  function addServico() {
    setForm((s) => ({ ...s, servicos: [...s.servicos, { ...SERVICO_PADRAO }] }))
  }

  function removeServico(idx: number) {
    setForm((s) => ({
      ...s,
      servicos: s.servicos.length > 1 ? s.servicos.filter((_, i) => i !== idx) : s.servicos,
    }))
  }

  function validar(): boolean {
    const errs: Record<string, string> = {}
    if (form.nome.trim().length < 2) errs.nome = 'Informe o nome'
    if (form.telefone.replace(/\D/g, '').length < 10)
      errs.telefone = 'Telefone inválido'
    form.servicos.forEach((s, i) => {
      if (!s.nome.trim()) errs[`servico_${i}_nome`] = 'Nome'
      if (s.preco < 0) errs[`servico_${i}_preco`] = 'Preço'
      if (s.duracao_min < 5) errs[`servico_${i}_duracao`] = 'Duração'
    })
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validar()) return

    startTransition(async () => {
      const payload = {
        nome: form.nome,
        telefone: form.telefone,
        calendar_id: form.calendar_id || '',
        servicos: form.servicos,
        ativo: form.ativo,
      }
      const result = barbeiro
        ? await atualizarBarbeiro(barbeiro.id, payload)
        : await criarBarbeiro(payload)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(barbeiro ? 'Barbeiro atualizado.' : 'Barbeiro adicionado.')
      onOpenChange(false)
      onSalvo()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-brand">
            {barbeiro ? 'Editar barbeiro' : 'Novo barbeiro'}
          </DialogTitle>
          <DialogDescription>
            Dados do profissional e serviços oferecidos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="b-nome">Nome</Label>
              <Input
                id="b-nome"
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                aria-invalid={!!errors.nome}
              />
              {errors.nome && (
                <p className="text-xs text-red-600">{errors.nome}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="b-tel">WhatsApp</Label>
              <Input
                id="b-tel"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="5531999990000"
                aria-invalid={!!errors.telefone}
              />
              {errors.telefone && (
                <p className="text-xs text-red-600">{errors.telefone}</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="b-calendar">Google Calendar ID (opcional)</Label>
            <Input
              id="b-calendar"
              value={form.calendar_id}
              onChange={(e) => setForm({ ...form, calendar_id: e.target.value })}
              placeholder="seu-id@group.calendar.google.com"
              className="font-mono text-xs"
            />
            <p className="text-[11px] text-slate-500">
              Use o ID do calendário compartilhado com a integração.{' '}
              <a
                href="https://support.google.com/calendar/answer/37083"
                target="_blank"
                rel="noopener"
                className="underline text-brand"
              >
                Como obter
              </a>
            </p>
          </div>

          <div className="flex items-center justify-between rounded-md border border-brand-100 bg-brand-50/40 px-3 py-2">
            <div>
              <p className="text-sm font-medium text-slate-700">Ativo</p>
              <p className="text-xs text-slate-500">
                Barbeiros inativos não recebem novos agendamentos.
              </p>
            </div>
            <Switch
              checked={form.ativo}
              onCheckedChange={(v) => setForm({ ...form, ativo: v })}
            />
          </div>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-brand">Serviços</h3>
                <p className="text-xs text-slate-500">
                  Pelo menos 1 serviço é obrigatório.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addServico}
              >
                <Plus className="size-3.5" /> Adicionar
              </Button>
            </div>

            <div className="space-y-2">
              {form.servicos.map((s, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-5">
                    <Input
                      placeholder="Nome do serviço"
                      value={s.nome}
                      onChange={(e) => setServico(idx, { nome: e.target.value })}
                      aria-invalid={!!errors[`servico_${idx}_nome`]}
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Preço"
                      value={s.preco || ''}
                      onChange={(e) =>
                        setServico(idx, { preco: Number(e.target.value) || 0 })
                      }
                      aria-invalid={!!errors[`servico_${idx}_preco`]}
                    />
                  </div>
                  <div className="col-span-3">
                    <Select
                      value={String(s.duracao_min)}
                      onValueChange={(v) => {
                        if (typeof v === 'string') {
                          setServico(idx, { duracao_min: Number(v) })
                        }
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DURACOES.map((d) => (
                          <SelectItem key={d} value={String(d)}>
                            {d} min
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      disabled={form.servicos.length === 1}
                      onClick={() => removeServico(idx)}
                      aria-label="Remover"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </section>

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
              ) : barbeiro ? (
                'Salvar alterações'
              ) : (
                'Criar barbeiro'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
