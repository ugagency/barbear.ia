'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

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
import { cn } from '@/lib/utils'
import { atualizarHorariosBarbeiro } from '../actions'
import type { AtualizarHorariosInput } from '../actions'
import { DIAS_SEMANA } from '@/lib/constants'
import type { Barbeiro, Bloqueio, HorarioDia, HorarioFixo } from '@/types'

const DIA_LABEL: Record<(typeof DIAS_SEMANA)[number], string> = {
  dom: 'Domingo',
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
}

interface HorariosState {
  horarios: Record<string, { ativo: boolean; inicio: string; fim: string }>
  bloqueios: Bloqueio[]
  horarios_fixos: HorarioFixo[]
}

function buildState(barbeiro: Barbeiro): HorariosState {
  const existentes = (barbeiro.horarios as Record<string, HorarioDia> | null) ?? {}
  const horarios: HorariosState['horarios'] = {}
  for (const d of DIAS_SEMANA) {
    const h = existentes[d]
    horarios[d] = {
      ativo: !!h,
      inicio: h?.inicio ?? '09:00',
      fim: h?.fim ?? '20:00',
    }
  }
  return {
    horarios,
    bloqueios: ((barbeiro.bloqueios as Bloqueio[] | null) ?? []).map((b) => ({ ...b })),
    horarios_fixos: ((barbeiro.horarios_fixos as HorarioFixo[] | null) ?? []).map(
      (h) => ({ ...h }),
    ),
  }
}

interface Props {
  barbeiros: Barbeiro[]
  onSaved: () => void
  saveAction?: (id: string, input: AtualizarHorariosInput) => Promise<{ success: boolean; error?: string }>
}

export function AbaHorarios({ barbeiros, onSaved, saveAction = atualizarHorariosBarbeiro }: Props) {
  const [barbeiroId, setBarbeiroId] = useState<string>(barbeiros[0]?.id ?? '')
  const barbeiro = useMemo(
    () => barbeiros.find((b) => b.id === barbeiroId) ?? null,
    [barbeiros, barbeiroId],
  )
  const [state, setState] = useState<HorariosState>(() =>
    barbeiro ? buildState(barbeiro) : { horarios: {}, bloqueios: [], horarios_fixos: [] },
  )
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (barbeiro) setState(buildState(barbeiro))
  }, [barbeiro])

  function setHorarioField(
    dia: (typeof DIAS_SEMANA)[number],
    patch: Partial<{ ativo: boolean; inicio: string; fim: string }>,
  ) {
    setState((s) => ({
      ...s,
      horarios: {
        ...s.horarios,
        [dia]: { ...s.horarios[dia], ...patch },
      },
    }))
  }

  function addBloqueio() {
    setState((s) => ({
      ...s,
      bloqueios: [
        ...s.bloqueios,
        { dia_semana: 'ter', inicio: '12:00', fim: '13:00', motivo: 'Almoço', frequencia: 'semanal' },
      ],
    }))
  }

  function setBloqueio(idx: number, patch: Partial<Bloqueio>) {
    setState((s) => ({
      ...s,
      bloqueios: s.bloqueios.map((b, i) => (i === idx ? { ...b, ...patch } : b)),
    }))
  }

  function removeBloqueio(idx: number) {
    setState((s) => ({
      ...s,
      bloqueios: s.bloqueios.filter((_, i) => i !== idx),
    }))
  }

  function addHorarioFixo() {
    setState((s) => ({
      ...s,
      horarios_fixos: [
        ...s.horarios_fixos,
        { dia_semana: 'qui', inicio: '09:00', fim: '10:00', cliente: '', frequencia: 'semanal' },
      ],
    }))
  }

  function setHorarioFixo(idx: number, patch: Partial<HorarioFixo>) {
    setState((s) => ({
      ...s,
      horarios_fixos: s.horarios_fixos.map((h, i) =>
        i === idx ? { ...h, ...patch } : h,
      ),
    }))
  }

  function removeHorarioFixo(idx: number) {
    setState((s) => ({
      ...s,
      horarios_fixos: s.horarios_fixos.filter((_, i) => i !== idx),
    }))
  }

  function handleSalvar() {
    if (!barbeiro) return
    // Validação de horários fixos: cliente obrigatório
    const fixoSemCliente = state.horarios_fixos.find((h) => !h.cliente.trim())
    if (fixoSemCliente) {
      toast.error('Informe o cliente em todos os horários fixos.')
      return
    }
    startTransition(async () => {
      const result = await saveAction(barbeiro.id, {
        horarios: state.horarios,
        bloqueios: state.bloqueios,
        horarios_fixos: state.horarios_fixos,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Horários atualizados.')
      onSaved()
    })
  }

  if (barbeiros.length === 0) {
    return (
      <div className="rounded-xl border border-brand-100 bg-white p-8 text-center">
        <p className="text-sm text-slate-700">
          Adicione um barbeiro na aba "Barbeiros" antes de configurar horários.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-semibold text-brand">
              Horários de funcionamento
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Defina dias e horários em que o barbeiro atende.
            </p>
          </div>
          <div className="min-w-48">
            <Select
              value={barbeiroId}
              onValueChange={(v) =>
                typeof v === 'string' ? setBarbeiroId(v) : null
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {barbeiros.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {DIAS_SEMANA.map((d) => {
            const h = state.horarios[d]
            return (
              <div
                key={d}
                className={cn(
                  'grid grid-cols-12 gap-2 items-center rounded-md border border-brand-100 px-3 py-2',
                  !h?.ativo && 'bg-slate-50',
                )}
              >
                <span className="col-span-4 sm:col-span-3 text-sm font-medium text-slate-700">
                  {DIA_LABEL[d]}
                </span>
                <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                  <Switch
                    checked={!!h?.ativo}
                    onCheckedChange={(v) => setHorarioField(d, { ativo: v })}
                  />
                  <span className="text-xs text-slate-500">
                    {h?.ativo ? 'Sim' : 'Não'}
                  </span>
                </div>
                <div className="col-span-5 sm:col-span-7 grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <Input
                      type="time"
                      value={h?.inicio ?? '09:00'}
                      disabled={!h?.ativo}
                      onChange={(e) =>
                        setHorarioField(d, { inicio: e.target.value })
                      }
                    />
                  </div>
                  <span className="col-span-2 text-center text-xs text-slate-400 self-center">
                    às
                  </span>
                  <div className="col-span-5">
                    <Input
                      type="time"
                      value={h?.fim ?? '20:00'}
                      disabled={!h?.ativo}
                      onChange={(e) =>
                        setHorarioField(d, { fim: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-brand">
              Bloqueios fixos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Períodos recorrentes em que o barbeiro não atende (ex: almoço).
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={addBloqueio}>
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </div>

        {state.bloqueios.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">Sem bloqueios fixos.</p>
        ) : (
          <div className="mt-4 space-y-2">
            <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wide text-slate-500 px-1">
              <span className="col-span-3">Dia</span>
              <span className="col-span-2">Início</span>
              <span className="col-span-2">Fim</span>
              <span className="col-span-4">Motivo</span>
              <span className="col-span-1" />
            </div>
            {state.bloqueios.map((b, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-3">
                  <DiaSelect
                    value={b.dia_semana}
                    onChange={(v) => setBloqueio(idx, { dia_semana: v })}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="time"
                    value={b.inicio}
                    onChange={(e) => setBloqueio(idx, { inicio: e.target.value })}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="time"
                    value={b.fim}
                    onChange={(e) => setBloqueio(idx, { fim: e.target.value })}
                  />
                </div>
                <div className="col-span-3 sm:col-span-4">
                  <Input
                    placeholder="Almoço"
                    value={b.motivo}
                    onChange={(e) => setBloqueio(idx, { motivo: e.target.value })}
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeBloqueio(idx)}
                    aria-label="Remover"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                                <div className="col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md bg-slate-50 p-2">
                  <div>
                    <Label className="text-xs">Recorrência</Label>
                    <Select value={b.frequencia ?? 'semanal'} onValueChange={(v) => setBloqueio(idx, { frequencia: v as 'semanal' | 'quinzenal' | 'mensal' | 'pontual' })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="pontual">Data específica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">A partir de</Label>
                    <Input type="date" value={b.data_inicio ?? ''} onChange={(e) => setBloqueio(idx, { data_inicio: e.target.value || undefined })} />
                  </div>
                  <div>
                    <Label className="text-xs">Até (opcional)</Label>
                    <Input type="date" value={b.data_fim ?? ''} onChange={(e) => setBloqueio(idx, { data_fim: e.target.value || undefined })} />
                  </div>
                  {b.frequencia === 'mensal' && (
                    <div>
                      <Label className="text-xs">Semana do mês</Label>
                      <Select value={String(b.semana_mes ?? 1)} onValueChange={(v) => setBloqueio(idx, { semana_mes: Number(v) })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n}ª semana</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-brand">
              Horários fixos
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Reservas semanais para clientes recorrentes.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addHorarioFixo}
          >
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </div>

        {state.horarios_fixos.length === 0 ? (
          <p className="mt-4 text-xs text-slate-500">Sem horários fixos.</p>
        ) : (
          <div className="mt-4 space-y-2">
            <div className="hidden sm:grid grid-cols-12 gap-2 text-[10px] uppercase tracking-wide text-slate-500 px-1">
              <span className="col-span-3">Dia</span>
              <span className="col-span-2">Início</span>
              <span className="col-span-2">Fim</span>
              <span className="col-span-4">Cliente</span>
              <span className="col-span-1" />
            </div>
            {state.horarios_fixos.map((h, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 sm:col-span-3">
                  <DiaSelect
                    value={h.dia_semana}
                    onChange={(v) => setHorarioFixo(idx, { dia_semana: v })}
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="time"
                    value={h.inicio}
                    onChange={(e) =>
                      setHorarioFixo(idx, { inicio: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <Input
                    type="time"
                    value={h.fim}
                    onChange={(e) =>
                      setHorarioFixo(idx, { fim: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-3 sm:col-span-4">
                  <Input
                    placeholder="Nome do cliente"
                    value={h.cliente}
                    onChange={(e) =>
                      setHorarioFixo(idx, { cliente: e.target.value })
                    }
                  />
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeHorarioFixo(idx)}
                    aria-label="Remover"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                                <div className="col-span-12 grid grid-cols-2 sm:grid-cols-4 gap-2 rounded-md bg-slate-50 p-2">
                  <div>
                    <Label className="text-xs">Recorrência</Label>
                    <Select value={h.frequencia ?? 'semanal'} onValueChange={(v) => setHorarioFixo(idx, { frequencia: v as 'semanal' | 'quinzenal' | 'mensal' | 'pontual' })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="semanal">Semanal</SelectItem>
                        <SelectItem value="quinzenal">Quinzenal</SelectItem>
                        <SelectItem value="mensal">Mensal</SelectItem>
                        <SelectItem value="pontual">Data específica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">A partir de</Label>
                    <Input type="date" value={h.data_inicio ?? ''} onChange={(e) => setHorarioFixo(idx, { data_inicio: e.target.value || undefined })} />
                  </div>
                  <div>
                    <Label className="text-xs">Até (opcional)</Label>
                    <Input type="date" value={h.data_fim ?? ''} onChange={(e) => setHorarioFixo(idx, { data_fim: e.target.value || undefined })} />
                  </div>
                  {h.frequencia === 'mensal' && (
                    <div>
                      <Label className="text-xs">Semana do mês</Label>
                      <Select value={String(h.semana_mes ?? 1)} onValueChange={(v) => setHorarioFixo(idx, { semana_mes: Number(v) })}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1,2,3,4,5].map((n) => <SelectItem key={n} value={String(n)}>{n}ª semana</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <div className="flex justify-end">
        <Button
          onClick={handleSalvar}
          disabled={isPending || !barbeiro}
          size="lg"
          className="bg-brand hover:bg-brand-light text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" /> Salvando...
            </>
          ) : (
            'Salvar horários'
          )}
        </Button>
      </div>
    </div>
  )
}

function DiaSelect({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => (typeof v === 'string' ? onChange(v) : null)}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {DIAS_SEMANA.map((d) => (
          <SelectItem key={d} value={d}>
            {DIA_LABEL[d]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
