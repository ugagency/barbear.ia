'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  extracaoSchema,
  MAX_PDF_BYTES,
  MAX_TEXTO,
  agendaExtraida,
  horariosExtraidos,
} from '@/lib/onboarding-import'
import type {
  ExtracaoOnboarding,
  ProfissionalExtraido,
} from '@/lib/onboarding-import'
import { DIAS, DIA_NOME } from '@/lib/onboarding'
import type { AgendaInput } from '@/lib/onboarding'
import type { Barbeiro } from '@/types'
import { ModalBarbeiro } from '@/app/(dashboard)/configuracoes/components/modal-barbeiro'
import { salvarProfissionalImportado } from '../onboarding-actions'

const input =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm'
const button =
  'rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'
export function ImportarOnboarding({
  onAplicar,
}: {
  onAplicar: (dados: ExtracaoOnboarding, substituir: boolean) => void
}) {
  const [texto, setTexto] = useState('')
  const [resultado, setResultado] = useState<ExtracaoOnboarding | null>(null)
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [substituir, setSubstituir] = useState(false)
  const [aplicado, setAplicado] = useState(false)
  const arquivo = useRef<HTMLInputElement>(null)
  const cancelar = useRef<AbortController | null>(null)
  async function extrair(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResultado(null)
    setAplicado(false)
    const pdf = arquivo.current?.files?.[0]
    if (!texto.trim() && !pdf) {
      setError('Cole as respostas ou selecione um PDF.')
      return
    }
    if (pdf && pdf.size > MAX_PDF_BYTES) {
      setError('O PDF deve ter até 3 MB.')
      return
    }
    const form = new FormData()
    form.set('texto', texto)
    if (pdf) form.set('pdf', pdf)
    const controller = new AbortController()
    cancelar.current = controller
    setPending(true)
    try {
      const response = await fetch('/api/gestao/extrair-onboarding', {
        method: 'POST',
        body: form,
        signal: controller.signal,
      })
      const r = await response.json()
      if (!response.ok) {
        setError(r.error || 'Não foi possível ler o envio.')
        return
      }
      const parsed = extracaoSchema.safeParse(r.extracao)
      if (!parsed.success) {
        setError('A extração veio incompleta. Tente novamente.')
        return
      }
      setResultado(parsed.data)
    } catch (err) {
      if (!(err instanceof Error && err.name === 'AbortError'))
        setError(
          'A leitura não foi concluída. Verifique a conexão e tente novamente.',
        )
    } finally {
      setPending(false)
      cancelar.current = null
    }
  }
  const qtd = resultado
    ? Object.values(resultado.barbearia).filter((v) => v !== null).length +
      [
        resultado.perfil,
        resultado.funcionamento,
        resultado.regras,
        resultado.atendimento,
      ].reduce(
        (n, s) => n + Object.values(s).filter((v) => v !== null).length,
        0,
      )
    : 0
  return (
    <section className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-semibold">
          Importar respostas do onboarding
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Cole a conversa ou o questionário respondido, envie um PDF, ou use os
          dois juntos. A leitura identifica os dados para você conferir.
        </p>
      </div>
      <form onSubmit={extrair} className="space-y-3">
        <label className="block space-y-1.5 text-sm font-medium">
          Texto com as respostas
          <textarea
            rows={6}
            maxLength={MAX_TEXTO}
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value)
              setResultado(null)
              setAplicado(false)
            }}
            placeholder="Cole aqui as respostas enviadas pelo cliente no WhatsApp..."
            className={input}
            disabled={pending}
          />
        </label>
        <label className="block space-y-1.5 text-sm font-medium">
          PDF do onboarding (opcional, até 3 MB)
          <input
            ref={arquivo}
            type="file"
            accept="application/pdf,.pdf"
            disabled={pending}
            className={input}
            onChange={() => {
              setResultado(null)
              setAplicado(false)
            }}
          />
        </label>
        <p className="text-xs text-slate-500">
          O conteúdo será enviado ao serviço de IA para leitura. O PDF e o texto
          original não são armazenados por esta função. PDFs digitalizados podem
          exigir conferência adicional.
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={pending} className={button}>
            {pending
              ? 'Lendo e organizando informações...'
              : 'Extrair informações'}
          </button>
          {pending && (
            <button
              type="button"
              onClick={() => cancelar.current?.abort()}
              className="rounded-lg border px-3 py-2 text-sm"
            >
              Cancelar leitura
            </button>
          )}
        </div>
      </form>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      {resultado && (
        <div
          className="space-y-4 rounded-xl border bg-white p-4"
          aria-live="polite"
        >
          <div>
            <h3 className="font-semibold">Leitura concluída</h3>
            <p className="text-sm text-slate-600">
              {qtd} campos ou grupos identificados ·{' '}
              {resultado.profissionais.length} profissional(is).
            </p>
          </div>
          {resultado.pendencias.length > 0 && (
            <section className="rounded-lg bg-amber-50 p-3">
              <h4 className="text-sm font-semibold text-amber-900">
                Pontos para conferir
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                {resultado.pendencias.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </section>
          )}
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">
              Conferir trechos identificados
            </summary>
            <dl className="mt-3 space-y-3">
              {resultado.evidencias.map((v, i) => (
                <div key={i}>
                  <dt className="font-medium">{v.campo}</dt>
                  <dd className="mt-1 text-slate-600">“{v.trecho}”</dd>
                </div>
              ))}
            </dl>
          </details>
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={substituir}
              disabled={aplicado}
              onChange={(e) => setSubstituir(e.target.checked)}
              className="mt-1"
            />
            Substituir campos já preenchidos pelos dados identificados. Sem
            marcar, somente campos vazios serão preenchidos.
          </label>
          <p className="text-xs text-slate-500">
            Salve alterações manuais antes de preencher. Depois, confira e salve
            cada seção abaixo. Profissionais são revisados e salvos
            individualmente. Nenhum dado é gravado durante a extração.
          </p>
          <button
            type="button"
            disabled={
              aplicado || (qtd === 0 && resultado.profissionais.length === 0)
            }
            className={button}
            onClick={() => {
              onAplicar(resultado, substituir)
              setAplicado(true)
            }}
          >
            {aplicado
              ? 'Rascunho preenchido — revise abaixo'
              : 'Preencher rascunho para revisão'}
          </button>
        </div>
      )}
    </section>
  )
}

export function ProfissionaisImportados({
  id,
  profissionais,
  existentes,
}: {
  id: string
  profissionais: ProfissionalExtraido[]
  existentes: Barbeiro[]
}) {
  return (
    <section className="space-y-4 rounded-xl border border-amber-200 bg-amber-50/30 p-5">
      <div>
        <h2 className="text-lg font-semibold">
          Profissionais identificados para revisar
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Confira a agenda e os bloqueios. Depois revise nome, serviços e
          valores e confirme o cadastro. Para substituir um profissional
          existente, selecione-o explicitamente.
        </p>
      </div>
      {profissionais.map((p, i) => (
        <ProfissionalImportado
          key={i}
          id={id}
          profissional={p}
          existentes={existentes}
        />
      ))}
    </section>
  )
}
function ProfissionalImportado({
  id,
  profissional: p,
  existentes,
}: {
  id: string
  profissional: ProfissionalExtraido
  existentes: Barbeiro[]
}) {
  const router = useRouter()
  const [destino, setDestino] = useState('')
  const [open, setOpen] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [agenda, setAgenda] = useState<AgendaInput>(() => agendaExtraida(p))
  const horarioConhecido = horariosExtraidos(p.horarios)
  const draft = {
    id: 'rascunho',
    nome: p.nome,
    telefone:
      p.telefone ?? existentes.find((b) => b.id === destino)?.telefone ?? '',
    calendar_id:
      p.calendar_id ??
      existentes.find((b) => b.id === destino)?.calendar_id ??
      '',
    ativo: existentes.find((b) => b.id === destino)?.ativo ?? true,
    servicos: p.servicos.map((s) => ({
      ...s,
      preco: s.preco ?? Number.NaN,
      duracao_min: s.duracao_min ?? 0,
    })),
    horarios: agenda.horarios,
    bloqueios: agenda.bloqueios,
    horarios_fixos: agenda.horarios_fixos,
  } as Barbeiro
  if (salvo)
    return (
      <p
        role="status"
        className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800"
      >
        {p.nome}: dados e agenda salvos.
      </p>
    )
  return (
    <div className="space-y-4 rounded-lg border bg-white p-4">
      <h3 className="font-semibold">{p.nome}</h3>
      <label className="block space-y-1 text-sm">
        Salvar como
        <select
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
          className={input}
        >
          <option value="">Novo profissional</option>
          {existentes.map((b) => (
            <option key={b.id} value={b.id}>
              Substituir dados e agenda de {b.nome}
            </option>
          ))}
        </select>
      </label>
      {(!horarioConhecido ||
        p.servicos.some((s) => s.preco === null || s.duracao_min === null) ||
        !p.servicos.length) && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
          Existem horários ou serviços sem informação completa. Complete os
          dados antes de disponibilizar a agenda.
        </p>
      )}
      <details open>
        <summary className="cursor-pointer text-sm font-medium">
          Conferir e ajustar dias e horários
        </summary>
        <div className="mt-2 space-y-2">
          {DIAS.map((d) => (
            <div
              key={d}
              className="grid grid-cols-2 items-center gap-2 sm:grid-cols-3"
            >
              <label
                className={`flex items-center gap-2 text-sm ${agenda.horarios[d] ? 'col-span-2 sm:col-span-1' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={!!agenda.horarios[d]}
                  onChange={(e) =>
                    setAgenda((old) => {
                      const horarios = { ...old.horarios }
                      if (e.target.checked)
                        horarios[d] = { inicio: '09:00', fim: '19:00' }
                      else delete horarios[d]
                      return { ...old, horarios }
                    })
                  }
                />
                {DIA_NOME[d]}
              </label>
              {agenda.horarios[d] ? (
                (['inicio', 'fim'] as const).map((k) => (
                  <input
                    key={k}
                    type="time"
                    aria-label={`${k} ${DIA_NOME[d]} de ${p.nome}`}
                    value={agenda.horarios[d]![k]}
                    className={input}
                    onChange={(e) =>
                      setAgenda((old) => ({
                        ...old,
                        horarios: {
                          ...old.horarios,
                          [d]: { ...old.horarios[d]!, [k]: e.target.value },
                        },
                      }))
                    }
                  />
                ))
              ) : (
                <span className="text-xs text-slate-400 sm:col-span-2">
                  Sem atendimento configurado
                </span>
              )}
            </div>
          ))}
        </div>
      </details>
      <details>
        <summary className="cursor-pointer text-sm font-medium">
          Bloqueios e clientes fixos (
          {agenda.bloqueios.length + agenda.horarios_fixos.length})
        </summary>
        <div className="mt-2 space-y-3">
          {(['bloqueios', 'horarios_fixos'] as const).map((tipo) =>
            agenda[tipo].map((b, i) => (
              <div
                key={`${tipo}-${i}`}
                className="space-y-2 rounded-lg border p-3"
              >
                <p className="text-sm">
                  {DIA_NOME[b.dia_semana]} · {b.inicio}–{b.fim} ·{' '}
                  {'motivo' in b ? b.motivo : b.cliente}
                </p>
                <div className="flex gap-2">
                  {(['inicio', 'fim'] as const).map((k) => (
                    <input
                      key={k}
                      type="time"
                      aria-label={`${k} ${tipo} ${i + 1} de ${p.nome}`}
                      value={b[k]}
                      className={input}
                      onChange={(e) =>
                        setAgenda((old) => ({
                          ...old,
                          [tipo]: old[tipo].map((v, n) =>
                            n === i ? { ...v, [k]: e.target.value } : v,
                          ),
                        }))
                      }
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="text-sm text-red-700"
                  onClick={() =>
                    setAgenda((old) => ({
                      ...old,
                      [tipo]: old[tipo].filter((_, n) => n !== i),
                    }))
                  }
                >
                  Remover este bloqueio
                </button>
              </div>
            )),
          )}
        </div>
      </details>
      <button type="button" className={button} onClick={() => setOpen(true)}>
        Revisar serviços e{' '}
        {destino ? 'substituir profissional' : 'cadastrar profissional'}
      </button>
      <ModalBarbeiro
        title="Revisar profissional importado"
        saveLabel={
          destino
            ? 'Confirmar substituição dos dados e agenda'
            : 'Confirmar cadastro com esta agenda'
        }
        open={open}
        onOpenChange={setOpen}
        barbeiro={draft}
        onSalvo={() => {
          setSalvo(true)
          router.refresh()
        }}
        saveAction={(_, dados) =>
          salvarProfissionalImportado(id, destino || null, dados, agenda)
        }
      />
    </div>
  )
}
