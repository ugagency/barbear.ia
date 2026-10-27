'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Scissors,
  User,
} from 'lucide-react'

import { gerarSlotsDoDia, type Ocupacao } from '@/app/(dashboard)/agenda/components/slots'
import { validarReserva } from '@/lib/regras-agendamento'
import { ocupacoesFixasNoDia } from '@/lib/disponibilidade'
import {
  buscarSlotsOcupados,
  confirmarAgendamentoPublico,
} from './actions'
import type { BarbeariaPublica, BarbeiroPublico } from './page'

interface Props {
  barbearia: BarbeariaPublica
  barbeiros: BarbeiroPublico[]
}

type Servico = { nome: string; preco: number; duracao_min: number }

const DIA_INDEX = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const
const DIAS_CURTOS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]
const DIAS_NOMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function formatTelefone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 2) return d
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatPreco(v: number): string {
  return `R$ ${v.toFixed(2).replace('.', ',')}`
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function AgendamentoPublicoClient({ barbearia, barbeiros }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [barbeiro, setBarbeiro] = useState<BarbeiroPublico | null>(
    barbeiros.length === 1 ? barbeiros[0] : null,
  )
  const [servico, setServico] = useState<Servico | null>(null)
  const [data, setData] = useState<Date | null>(null)
  const [horario, setHorario] = useState<Date | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [erros, setErros] = useState<{ nome?: string; telefone?: string }>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Pula passo 1 se só tiver 1 barbeiro
  useEffect(() => {
    if (barbeiros.length === 1 && step === 1) setStep(2)
  }, [barbeiros.length, step])

  function voltar() {
    setServerError(null)
    if (step === 4) setStep(3)
    else if (step === 3) setStep(2)
    else if (step === 2) {
      if (barbeiros.length === 1) return
      setStep(1)
      setServico(null)
    }
  }

  function escolherBarbeiro(b: BarbeiroPublico) {
    setBarbeiro(b)
    setServico(null)
    setData(null)
    setHorario(null)
    setStep(2)
  }

  function escolherServico(s: Servico) {
    setServico(s)
    setData(null)
    setHorario(null)
    setStep(3)
  }

  function escolherHorario(h: Date) {
    setHorario(h)
    setStep(4)
  }

  function handleConfirmar() {
    setErros({})
    setServerError(null)
    const errs: { nome?: string; telefone?: string } = {}
    const nomeTrim = nome.trim()
    const tel = telefone.replace(/\D/g, '')
    if (nomeTrim.length < 2) errs.nome = 'Informe seu nome completo'
    if (tel.length < 10 || tel.length > 11)
      errs.telefone = 'WhatsApp inválido (10 ou 11 dígitos com DDD)'
    if (Object.keys(errs).length > 0) {
      setErros(errs)
      return
    }
    if (!barbeiro || !servico || !horario) return

    startTransition(async () => {
      const result = await confirmarAgendamentoPublico({
        barbearia_id: barbearia.id,
        barbeiro_id: barbeiro.id,
        servico: servico.nome,
        preco: servico.preco,
        duracao_min: servico.duracao_min,
        inicio_iso: horario.toISOString(),
        cliente_nome: nomeTrim,
        cliente_telefone: tel,
      })
      if (!result.success) {
        setServerError(result.error)
        return
      }
      const fim = new Date(horario.getTime() + servico.duracao_min * 60_000)
      const sp = new URLSearchParams({
        servico: servico.nome,
        barbeiro: barbeiro.nome,
        inicio: horario.toISOString(),
        fim: fim.toISOString(),
      })
      router.replace(`/agendar/${barbearia.slug}/confirmado?${sp.toString()}`)
    })
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">
      {/* Header */}
      <header className="flex items-center gap-3 mb-6">
        {barbearia.logo_url ? (
          <div className="size-12 rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center">
            <Image
              src={barbearia.logo_url}
              alt={barbearia.nome}
              width={48}
              height={48}
              className="object-contain w-full h-full"
              unoptimized
            />
          </div>
        ) : (
          <div className="size-12 rounded-lg bg-brand text-white flex items-center justify-center text-2xl">
            💈
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-lg font-bold text-brand truncate">
            {barbearia.nome}
          </h1>
          <p className="text-xs text-slate-500">Agendamento online</p>
        </div>
      </header>

      {/* Stepper */}
      <Stepper step={step} pulaBarbeiro={barbeiros.length === 1} />

      {/* Conteúdo do passo */}
      <div className="mt-6">
        {step > 1 && (
          <button
            type="button"
            onClick={voltar}
            disabled={step === 2 && barbeiros.length === 1}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-brand disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="size-4" />
            Voltar
          </button>
        )}

        {step === 1 && (
          <PassoBarbeiro
            barbeiros={barbeiros}
            onEscolher={escolherBarbeiro}
          />
        )}

        {step === 2 && barbeiro && (
          <PassoServico
            barbeiro={barbeiro}
            onEscolher={escolherServico}
          />
        )}

        {step === 3 && barbeiro && servico && (
          <PassoData
            barbearia={barbearia}
            barbeiro={barbeiro}
            servico={servico}
            data={data}
            setData={setData}
            horario={horario}
            onEscolher={escolherHorario}
          />
        )}

        {step === 4 && barbeiro && servico && horario && (
          <PassoConfirmar
            barbeiro={barbeiro}
            servico={servico}
            horario={horario}
            nome={nome}
            telefone={telefone}
            erros={erros}
            serverError={serverError}
            isPending={isPending}
            onChangeNome={setNome}
            onChangeTelefone={(v) => setTelefone(formatTelefone(v))}
            onConfirmar={handleConfirmar}
          />
        )}
      </div>
    </div>
  )
}

// ============================================================
// Stepper visual
// ============================================================
function Stepper({ step, pulaBarbeiro }: { step: 1 | 2 | 3 | 4; pulaBarbeiro: boolean }) {
  const passos = [
    { n: 1, label: 'Barbeiro' },
    { n: 2, label: 'Serviço' },
    { n: 3, label: 'Horário' },
    { n: 4, label: 'Dados' },
  ]
  const visiveis = pulaBarbeiro ? passos.slice(1) : passos
  return (
    <ol className="flex items-center gap-2">
      {visiveis.map((p, idx) => {
        const ativo = step === p.n
        const concluido = step > p.n
        return (
          <li key={p.n} className="flex items-center gap-2 flex-1">
            <div
              className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                ativo
                  ? 'bg-brand text-white'
                  : concluido
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              {concluido ? '✓' : idx + 1}
            </div>
            <span
              className={`text-xs font-medium hidden sm:inline ${
                ativo ? 'text-brand' : 'text-slate-500'
              }`}
            >
              {p.label}
            </span>
            {idx < visiveis.length - 1 && (
              <div className="flex-1 h-0.5 bg-slate-200 rounded" />
            )}
          </li>
        )
      })}
    </ol>
  )
}

// ============================================================
// Passo 1 — Barbeiro
// ============================================================
function PassoBarbeiro({
  barbeiros,
  onEscolher,
}: {
  barbeiros: BarbeiroPublico[]
  onEscolher: (b: BarbeiroPublico) => void
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900">Quem vai te atender?</h2>
      <p className="text-sm text-slate-500 mt-1">
        Escolha um barbeiro para começar.
      </p>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {barbeiros.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => onEscolher(b)}
            className="group rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-brand hover:shadow-md transition"
          >
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-full bg-brand-50 text-brand flex items-center justify-center font-bold text-lg shrink-0">
                {b.nome.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">
                  {b.nome}
                </p>
                <p className="text-xs text-slate-500">
                  {b.servicos.length} serviço{b.servicos.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="mt-3 text-sm font-medium text-brand group-hover:text-brand-light">
              Escolher →
            </div>
          </button>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// Passo 2 — Serviço
// ============================================================
function PassoServico({
  barbeiro,
  onEscolher,
}: {
  barbeiro: BarbeiroPublico
  onEscolher: (s: Servico) => void
}) {
  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900">Qual serviço?</h2>
      <p className="text-sm text-slate-500 mt-1">
        Atendimento com <strong>{barbeiro.nome}</strong>.
      </p>
      <div className="mt-5 space-y-2">
        {barbeiro.servicos.map((s, i) => (
          <button
            key={`${s.nome}-${i}`}
            type="button"
            onClick={() => onEscolher(s)}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-brand hover:shadow-md transition flex items-center gap-4"
          >
            <Scissors className="size-5 text-brand shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900">{s.nome}</p>
              <p className="text-xs text-slate-500 mt-0.5">
                <span className="font-mono">{formatPreco(s.preco)}</span>
                {' · '}
                <span className="font-mono">{s.duracao_min} min</span>
              </p>
            </div>
            <span className="text-sm font-medium text-brand shrink-0">→</span>
          </button>
        ))}
      </div>
    </section>
  )
}

// ============================================================
// Passo 3 — Data e horário
// ============================================================
function PassoData({
  barbearia,
  barbeiro,
  servico,
  data,
  setData,
  horario,
  onEscolher,
}: {
  barbearia: BarbeariaPublica
  barbeiro: BarbeiroPublico
  servico: Servico
  data: Date | null
  setData: (d: Date) => void
  horario: Date | null
  onEscolher: (h: Date) => void
}) {
  const hoje = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [mesVisivel, setMesVisivel] = useState<Date>(() => {
    const d = new Date(hoje)
    d.setDate(1)
    return d
  })

  const [ocupacoes, setOcupacoes] = useState<Ocupacao[]>([])
  const [carregandoSlots, setCarregandoSlots] = useState(false)

  // Dias em que o barbeiro atende
  const diasDisponiveis = useMemo(() => {
    return new Set(Object.keys(barbeiro.horarios ?? {}))
  }, [barbeiro.horarios])

  function diaDisponivel(date: Date): boolean {
    if (date < hoje) return false
    const dia = DIA_INDEX[date.getDay()]
    const funcionamento=barbearia.config.funcionamento
    if (funcionamento && !funcionamento.horarios[dia]) return false
    const max=barbearia.config.regras?.horizonte_dias
    if (max !== undefined) { const limite=new Date(hoje);limite.setDate(limite.getDate()+max);if(date>limite)return false }
    const iso=`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`
    if (funcionamento?.fechamentos.some(f=>iso>=f.data_inicio&&iso<=f.data_fim)) return false
    return diasDisponiveis.has(dia)
  }

  // Carrega slots ocupados quando muda data
  useEffect(() => {
    if (!data) return
    setCarregandoSlots(true)
    buscarSlotsOcupados(barbearia.id, barbeiro.id, data.toISOString())
      .then((res) => {
        if (!res.success) {
          setOcupacoes([])
          return
        }
        const ocup: Ocupacao[] = res.data.map((o) => ({
          inicio: new Date(o.inicio_at),
          fim: new Date(o.fim_at),
        }))
        ocup.push(...ocupacoesFixasNoDia(data, barbeiro.bloqueios ?? [], barbeiro.horarios_fixos ?? []))
        setOcupacoes(ocup)
      })
      .finally(() => setCarregandoSlots(false))
  }, [data, barbearia.id, barbeiro.id, barbeiro.bloqueios, barbeiro.horarios_fixos])

  // Slots a partir de slots.ts
  const slots = useMemo(() => {
    if (!data) return []
    const todos = gerarSlotsDoDia(
      {
        id: barbeiro.id,
        nome: barbeiro.nome,
        servicos: barbeiro.servicos,
        horarios: barbeiro.horarios,
        bloqueios: barbeiro.bloqueios,
        horarios_fixos: barbeiro.horarios_fixos,
        ativo: true,
      },
      data,
      servico.duracao_min,
      ocupacoes,
    )
    // Filtra slots no passado se for hoje
    const agora = new Date()
    return todos.filter((s) => !validarReserva(barbearia.config, barbeiro, s.date, servico.duracao_min, agora))
  }, [data, ocupacoes, barbeiro, servico, barbearia.config])

  return (
    <section>
      <h2 className="text-xl font-bold text-slate-900">Quando você quer vir?</h2>
      <p className="text-sm text-slate-500 mt-1">
        <strong>{servico.nome}</strong> com {barbeiro.nome} ·{' '}
        {servico.duracao_min} min
      </p>

      <Calendario
        mesVisivel={mesVisivel}
        setMesVisivel={setMesVisivel}
        dataSelecionada={data}
        onSelect={setData}
        diaDisponivel={diaDisponivel}
        hoje={hoje}
      />

      {data && (
        <div className="mt-6">
          <p className="text-sm font-semibold text-slate-700">
            Horários disponíveis para{' '}
            <span className="text-brand">
              {DIAS_NOMES[data.getDay()]},{' '}
              {String(data.getDate()).padStart(2, '0')}/
              {String(data.getMonth() + 1).padStart(2, '0')}
            </span>
          </p>
          {carregandoSlots ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
              <Loader2 className="size-4 animate-spin" />
              Carregando horários...
            </div>
          ) : slots.length === 0 ? (
            <div className="mt-4 rounded-lg bg-slate-100 border border-slate-200 p-4 text-sm text-slate-600 text-center">
              Nenhum horário disponível neste dia. Tente outra data.
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.iso}
                  type="button"
                  disabled={!s.disponivel}
                  onClick={() => onEscolher(s.date)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-mono font-semibold transition ${
                    !s.disponivel
                      ? 'bg-slate-100 border-slate-200 text-slate-400 line-through cursor-not-allowed'
                      : horario && sameDay(horario, s.date) && horario.getHours() === s.date.getHours() && horario.getMinutes() === s.date.getMinutes()
                      ? 'bg-brand text-white border-brand'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-brand hover:text-brand'
                  }`}
                >
                  {s.hora}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

// ============================================================
// Calendário simples
// ============================================================
function Calendario({
  mesVisivel,
  setMesVisivel,
  dataSelecionada,
  onSelect,
  diaDisponivel,
  hoje,
}: {
  mesVisivel: Date
  setMesVisivel: (d: Date) => void
  dataSelecionada: Date | null
  onSelect: (d: Date) => void
  diaDisponivel: (d: Date) => boolean
  hoje: Date
}) {
  const ano = mesVisivel.getFullYear()
  const mes = mesVisivel.getMonth()
  const primeiroDia = new Date(ano, mes, 1)
  const ultimoDia = new Date(ano, mes + 1, 0)
  const offsetInicio = primeiroDia.getDay()

  const cells: Array<{ date: Date | null; key: string }> = []
  for (let i = 0; i < offsetInicio; i++) {
    cells.push({ date: null, key: `pad-${i}` })
  }
  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    const date = new Date(ano, mes, d)
    cells.push({ date, key: `d-${d}` })
  }

  const podeVoltar = mesVisivel > new Date(hoje.getFullYear(), hoje.getMonth(), 1)

  return (
    <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => podeVoltar && setMesVisivel(new Date(ano, mes - 1, 1))}
          disabled={!podeVoltar}
          className="size-8 rounded-md hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold text-slate-900">
          {MESES[mes]} {ano}
        </p>
        <button
          type="button"
          onClick={() => setMesVisivel(new Date(ano, mes + 1, 1))}
          className="size-8 rounded-md hover:bg-slate-100 flex items-center justify-center"
          aria-label="Próximo mês"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
        {DIAS_CURTOS.map((d, i) => (
          <div key={i}>{d}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map(({ date, key }) => {
          if (!date) return <div key={key} />
          const disp = diaDisponivel(date)
          const isSelected = dataSelecionada && sameDay(date, dataSelecionada)
          const isToday = sameDay(date, hoje)
          return (
            <button
              key={key}
              type="button"
              disabled={!disp}
              onClick={() => onSelect(date)}
              className={`aspect-square rounded-md text-sm font-medium transition ${
                isSelected
                  ? 'bg-brand text-white'
                  : !disp
                  ? 'text-slate-300 cursor-not-allowed'
                  : isToday
                  ? 'bg-brand-50 text-brand hover:bg-brand-100'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================================
// Passo 4 — Confirmação
// ============================================================
function PassoConfirmar({
  barbeiro,
  servico,
  horario,
  nome,
  telefone,
  erros,
  serverError,
  isPending,
  onChangeNome,
  onChangeTelefone,
  onConfirmar,
}: {
  barbeiro: BarbeiroPublico
  servico: Servico
  horario: Date
  nome: string
  telefone: string
  erros: { nome?: string; telefone?: string }
  serverError: string | null
  isPending: boolean
  onChangeNome: (v: string) => void
  onChangeTelefone: (v: string) => void
  onConfirmar: () => void
}) {
  const fim = new Date(horario.getTime() + servico.duracao_min * 60_000)
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Quase lá!</h2>
        <p className="text-sm text-slate-500 mt-1">
          Só precisamos do seu nome e WhatsApp.
        </p>
      </div>

      {/* Resumo */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
        <p className="text-xs uppercase tracking-wide font-semibold text-slate-500">
          Resumo do agendamento
        </p>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Scissors className="size-4 text-brand shrink-0" />
          <span>
            <strong>{servico.nome}</strong> com{' '}
            <strong>{barbeiro.nome}</strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <CalendarIcon className="size-4 text-brand shrink-0" />
          <span>
            {DIAS_NOMES[horario.getDay()]},{' '}
            {String(horario.getDate()).padStart(2, '0')}/
            {String(horario.getMonth() + 1).padStart(2, '0')} às{' '}
            <strong className="font-mono">
              {String(horario.getHours()).padStart(2, '0')}:
              {String(horario.getMinutes()).padStart(2, '0')}
            </strong>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-700">
          <Clock className="size-4 text-brand shrink-0" />
          <span>
            {servico.duracao_min} minutos · {formatPreco(servico.preco)}
          </span>
        </div>
        <p className="text-xs text-slate-500 pt-1 border-t border-slate-100">
          Termina às{' '}
          <span className="font-mono">
            {String(fim.getHours()).padStart(2, '0')}:
            {String(fim.getMinutes()).padStart(2, '0')}
          </span>
        </p>
      </div>

      {/* Form */}
      <div className="space-y-3">
        <div>
          <label
            htmlFor="nome"
            className="text-sm font-medium text-slate-700"
          >
            Nome completo
          </label>
          <div className="mt-1 relative">
            <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="nome"
              type="text"
              autoComplete="name"
              value={nome}
              onChange={(e) => onChangeNome(e.target.value)}
              disabled={isPending}
              placeholder="João da Silva"
              className="w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
              aria-invalid={!!erros.nome}
            />
          </div>
          {erros.nome && (
            <p className="mt-1 text-xs text-red-600">{erros.nome}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="telefone"
            className="text-sm font-medium text-slate-700"
          >
            WhatsApp (com DDD)
          </label>
          <input
            id="telefone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            value={telefone}
            onChange={(e) => onChangeTelefone(e.target.value)}
            disabled={isPending}
            placeholder="(11) 91234-5678"
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
            aria-invalid={!!erros.telefone}
          />
          {erros.telefone && (
            <p className="mt-1 text-xs text-red-600">{erros.telefone}</p>
          )}
        </div>
      </div>

      {serverError && (
        <div className="rounded-lg bg-red-50 border border-red-100 p-3 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <button
        type="button"
        onClick={onConfirmar}
        disabled={isPending}
        className="w-full rounded-lg bg-brand text-white font-semibold py-3 text-sm hover:bg-brand-light disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
      >
        {isPending ? (
          <>
            <Loader2 className="size-4 animate-spin" /> Confirmando...
          </>
        ) : (
          'Confirmar agendamento'
        )}
      </button>

      <p className="text-center text-xs text-slate-500">
        📱 Você receberá a confirmação no WhatsApp.
      </p>
    </section>
  )
}
