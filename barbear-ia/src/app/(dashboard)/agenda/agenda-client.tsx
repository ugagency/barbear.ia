'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { ResumoDia } from './components/resumo-dia'
import { AgendamentoCard } from './components/agendamento-card'
import { ModalNovoAgendamento } from './components/modal-novo-agendamento'
import { ModalEditarAgendamento } from './components/modal-editar-agendamento'
import type { AgendamentoComJoins, BarbeiroOpcao } from './types'

interface Props {
  barbeariaId: string
  dataIso: string // YYYY-MM-DD
  agendamentosIniciais: AgendamentoComJoins[]
  barbeiros: BarbeiroOpcao[]
}

const DIA_SEMANA = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

const MESES = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
]

function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setHours(0, 0, 0, 0)
  return dt
}

function toIsoDate(d: Date): string {
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function formatDataLonga(d: Date): string {
  return `${DIA_SEMANA[d.getDay()].slice(0, 3)}, ${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}

export function AgendaClient({
  barbeariaId,
  dataIso,
  agendamentosIniciais,
  barbeiros,
}: Props) {
  const router = useRouter()
  const [agendamentos, setAgendamentos] = useState<AgendamentoComJoins[]>(
    agendamentosIniciais,
  )
  const [filtroBarbeiro, setFiltroBarbeiro] = useState<string>('todos')
  const [modalNovoOpen, setModalNovoOpen] = useState(false)
  const [edicao, setEdicao] = useState<AgendamentoComJoins | null>(null)

  // Sincroniza estado quando o servidor manda novos dados (ex: troca de data)
  useEffect(() => {
    setAgendamentos(agendamentosIniciais)
  }, [agendamentosIniciais])

  const dataAtual = useMemo(() => parseIsoDate(dataIso), [dataIso])

  const refetch = useCallback(async () => {
    const supabase = createClient()
    const inicio = parseIsoDate(dataIso)
    const fim = new Date(inicio)
    fim.setDate(fim.getDate() + 1)
    const { data } = await supabase
      .from('agendamentos')
      .select(
        `
        *,
        clientes(id, nome, telefone),
        barbeiros(id, nome)
      `,
      )
      .eq('barbearia_id', barbeariaId)
      .gte('inicio_at', inicio.toISOString())
      .lt('inicio_at', fim.toISOString())
      .order('inicio_at', { ascending: true })
    if (data) setAgendamentos(data as AgendamentoComJoins[])
  }, [barbeariaId, dataIso])

  // Realtime
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`agendamentos-${barbeariaId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agendamentos',
          filter: `barbearia_id=eq.${barbeariaId}`,
        },
        () => {
          refetch()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [barbeariaId, refetch])

  function navegarDia(deltaDias: number) {
    const novo = new Date(dataAtual)
    novo.setDate(novo.getDate() + deltaDias)
    router.push(`/agenda?data=${toIsoDate(novo)}`)
  }

  function irParaHoje() {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    router.push(`/agenda?data=${toIsoDate(hoje)}`)
  }

  const filtrados = useMemo(() => {
    if (filtroBarbeiro === 'todos') return agendamentos
    return agendamentos.filter((a) => a.barbeiro_id === filtroBarbeiro)
  }, [agendamentos, filtroBarbeiro])

  const isHoje = useMemo(() => {
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    return dataAtual.getTime() === hoje.getTime()
  }, [dataAtual])

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-brand">Agenda</h1>
          <p className="text-sm text-slate-500">
            Visualize e gerencie os atendimentos do dia.
          </p>
        </div>
        <Button
          onClick={() => setModalNovoOpen(true)}
          size="lg"
          className="bg-brand hover:bg-brand-light text-white"
        >
          <Plus className="size-4" /> Novo agendamento
        </Button>
      </header>

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => navegarDia(-1)}
          aria-label="Dia anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <span className="text-sm font-semibold text-slate-700 min-w-44 text-center">
          {formatDataLonga(dataAtual)}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => navegarDia(1)}
          aria-label="Próximo dia"
        >
          <ChevronRight className="size-4" />
        </Button>
        {!isHoje && (
          <Button variant="ghost" size="sm" onClick={irParaHoje}>
            <CalendarDays className="size-3.5" /> Hoje
          </Button>
        )}
      </div>

      <ResumoDia agendamentos={agendamentos} />

      <div>
        <Select
          value={filtroBarbeiro}
          onValueChange={(v) =>
            setFiltroBarbeiro(typeof v === 'string' ? v : 'todos')
          }
        >
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os barbeiros</SelectItem>
            {barbeiros.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <section className={cn('space-y-2.5')}>
        {filtrados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-brand-100 bg-white p-10 text-center">
            <CalendarDays className="size-8 text-brand/40 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-700">
              Sem agendamentos nesse dia
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Clique em "Novo agendamento" para criar um manualmente.
            </p>
          </div>
        ) : (
          filtrados.map((ag) => (
            <AgendamentoCard
              key={ag.id}
              agendamento={ag}
              onEdit={(a) => setEdicao(a)}
              onChange={refetch}
            />
          ))
        )}
      </section>

      <ModalNovoAgendamento
        open={modalNovoOpen}
        onOpenChange={setModalNovoOpen}
        barbeiros={barbeiros}
        barbeariaId={barbeariaId}
        dataInicialIso={dataIso}
        onCriado={refetch}
      />

      <ModalEditarAgendamento
        agendamento={edicao}
        open={!!edicao}
        onOpenChange={(o) => {
          if (!o) setEdicao(null)
        }}
        onSalvo={refetch}
      />
    </div>
  )
}
