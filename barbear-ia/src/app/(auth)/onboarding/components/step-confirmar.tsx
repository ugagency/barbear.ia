'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { DIAS_SEMANA } from '@/lib/constants'
import type { BarbeariaFormValues } from './step-barbearia'
import type { BarbeiroFormValues } from './step-barbeiro'

const DIA_LABELS: Record<(typeof DIAS_SEMANA)[number], string> = {
  dom: 'Dom',
  seg: 'Seg',
  ter: 'Ter',
  qua: 'Qua',
  qui: 'Qui',
  sex: 'Sex',
  sab: 'Sáb',
}

interface Props {
  barbearia: BarbeariaFormValues
  barbeiro: BarbeiroFormValues
  onBack: () => void
  onConfirm: () => void
  isSubmitting: boolean
}

export function StepConfirmar({
  barbearia,
  barbeiro,
  onBack,
  onConfirm,
  isSubmitting,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand">Revisar e confirmar</h2>
        <p className="text-sm text-slate-500">
          Confira os dados antes de criar sua barbearia.
        </p>
      </div>

      <section className="space-y-2 rounded-lg border border-brand-100 bg-brand-50/40 p-4">
        <h3 className="text-sm font-semibold text-brand">Barbearia</h3>
        <dl className="text-sm text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-y-1">
          <dt className="text-slate-500">Nome</dt>
          <dd>{barbearia.nome}</dd>
          <dt className="text-slate-500">WhatsApp</dt>
          <dd>{barbearia.telefone}</dd>
          {barbearia.email && (
            <>
              <dt className="text-slate-500">Email</dt>
              <dd>{barbearia.email}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="space-y-2 rounded-lg border border-brand-100 bg-brand-50/40 p-4">
        <h3 className="text-sm font-semibold text-brand">Primeiro barbeiro</h3>
        <dl className="text-sm text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-y-1">
          <dt className="text-slate-500">Nome</dt>
          <dd>{barbeiro.nome}</dd>
          {barbeiro.telefone && (
            <>
              <dt className="text-slate-500">WhatsApp</dt>
              <dd>{barbeiro.telefone}</dd>
            </>
          )}
        </dl>

        <Separator className="my-2" />

        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Serviços
        </h4>
        <ul className="text-sm text-slate-700 divide-y divide-brand-100/70">
          {barbeiro.servicos.map((s) => (
            <li
              key={s.nome}
              className="flex items-center justify-between py-1.5"
            >
              <span>{s.nome}</span>
              <span className="font-mono text-xs text-slate-500">
                R$ {Number(s.preco).toFixed(2)} · {s.duracao_min}min
              </span>
            </li>
          ))}
        </ul>

        <Separator className="my-2" />

        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Horários
        </h4>
        <ul className="text-sm text-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          {DIAS_SEMANA.map((d) => {
            const h = barbeiro.horarios[d]
            return (
              <li
                key={d}
                className="flex items-center justify-between py-0.5"
              >
                <span className="text-slate-500">{DIA_LABELS[d]}</span>
                <span className="font-mono text-xs">
                  {h.ativo ? `${h.inicio} – ${h.fim}` : 'Fechado'}
                </span>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Voltar
        </Button>
        <Button
          type="button"
          size="lg"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="bg-brand hover:bg-brand-light text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" /> Criando...
            </>
          ) : (
            'Criar minha barbearia'
          )}
        </Button>
      </div>
    </div>
  )
}
