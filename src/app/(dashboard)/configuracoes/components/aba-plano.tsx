'use client'

import { useState, useTransition } from 'react'
import { Check, X, Star, AlertTriangle, Clock, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { FUNDADORES_TOTAL_VAGAS, PLANOS } from '@/lib/constants'
import {
  assinarPlano,
  assinarComoFundador,
  cancelarPlano,
  buscarFaturaEmAberto,
} from '../actions'

interface BarbeariaPlano {
  plano: string
  plano_status: string
  trial_ends_at: string | null
  proxima_cobranca: string | null
  fundador: boolean
  plano_ciclo: 'mensal' | 'anual'
}

interface Props {
  barbearia: BarbeariaPlano
  fundadoresUsados: number
}

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function diasRestantes(iso: string | null): number {
  if (!iso) return 0
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function AbaPlano({ barbearia, fundadoresUsados }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null)
  const [ciclo, setCiclo] = useState<'mensal' | 'anual'>('mensal')

  const vagasRestantes = Math.max(0, FUNDADORES_TOTAL_VAGAS - fundadoresUsados)
  const isTrial = barbearia.plano === 'trial'
  const isAtivo = barbearia.plano_status === 'ativo'
  const isInadimplente = barbearia.plano_status === 'inadimplente'
  const isFundador = barbearia.fundador === true
  const dias = diasRestantes(barbearia.trial_ends_at)

  function handleError(msg: string) {
    setError(msg)
    setTimeout(() => setError(null), 6000)
  }

  function handleAssinar(plano: 'starter' | 'pro') {
    setError(null)
    startTransition(async () => {
      const res = await assinarPlano(plano, ciclo)
      if (!res.success) {
        handleError(res.error)
        return
      }
      if (res.data?.invoiceUrl) {
        setInvoiceUrl(res.data.invoiceUrl)
      }
    })
  }

  function handleFundador() {
    setError(null)
    startTransition(async () => {
      const res = await assinarComoFundador()
      if (!res.success) {
        handleError(res.error)
        return
      }
      if (res.data?.invoiceUrl) {
        setInvoiceUrl(res.data.invoiceUrl)
      }
    })
  }

  function handleCancelar() {
    if (!confirm('Tem certeza? Sua assinatura será cancelada ao fim do período pago.')) return
    setError(null)
    startTransition(async () => {
      const res = await cancelarPlano()
      if (!res.success) handleError(res.error)
    })
  }

  function handlePagarAgora() {
    setError(null)
    startTransition(async () => {
      const res = await buscarFaturaEmAberto()
      if (!res.success) {
        handleError(res.error)
        return
      }
      if (res.data?.invoiceUrl) {
        window.open(res.data.invoiceUrl, '_blank')
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Invoice URL — primeira fatura após assinar */}
      {invoiceUrl && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-800">
              Assinatura criada! Pague a primeira fatura para ativar.
            </p>
            <p className="text-xs text-emerald-700 mt-0.5">
              Pix, boleto ou cartão. Acesso liberado em minutos após confirmação.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
            onClick={() => window.open(invoiceUrl, '_blank')}
          >
            Pagar agora
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Status atual ── */}
      {isTrial && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Clock className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Trial ativo</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {dias > 0
                ? `Expira em ${dias} dia${dias !== 1 ? 's' : ''}. Acesso Pro completo durante o trial.`
                : 'Seu trial expirou. Assine para continuar usando.'}
            </p>
          </div>
        </div>
      )}

      {!isTrial && isAtivo && !isFundador && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <Check className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-emerald-800">
              Plano {barbearia.plano === 'pro' ? 'Pro' : 'Starter'} ativo
            </p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Próxima cobrança: {formatDate(barbearia.proxima_cobranca)}
              {' · '}
              {barbearia.plano_ciclo === 'anual' ? 'Cobrança anual' : 'Cobrança mensal'}
            </p>
          </div>
          <button
            onClick={handleCancelar}
            disabled={isPending}
            className="text-xs text-slate-500 hover:text-red-600 transition-colors shrink-0"
          >
            Cancelar
          </button>
        </div>
      )}

      {isFundador && isAtivo && (
        <div className="rounded-xl border border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50 p-4 flex items-start gap-3">
          <Crown className="size-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-yellow-800 flex items-center gap-2">
              Pro — Fundador
              <span className="text-[10px] font-bold uppercase tracking-wider bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                Vitalício
              </span>
            </p>
            <p className="text-sm text-yellow-700 mt-0.5">
              R$49/mês para sempre. Obrigado por acreditar desde o início! 🙏
            </p>
          </div>
        </div>
      )}

      {isInadimplente && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-800">Pagamento em atraso</p>
            <p className="text-sm text-red-700 mt-0.5">
              Regularize para continuar usando todos os recursos.
            </p>
          </div>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white shrink-0"
            onClick={handlePagarAgora}
            disabled={isPending}
          >
            Pagar agora
          </Button>
        </div>
      )}

      {/* ── Cards de planos (mostrar se trial ou se quer mudar) ── */}
      {(isTrial || isInadimplente || barbearia.plano_status === 'cancelado') && (
        <div className="space-y-4">
          {/* Toggle ciclo */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-600">Ciclo:</span>
            <div className="inline-flex rounded-lg border border-brand-100 bg-brand-50 p-0.5">
              {(['mensal', 'anual'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCiclo(c)}
                  className={cn(
                    'px-3 py-1 text-xs font-medium rounded-md transition-all',
                    ciclo === c
                      ? 'bg-brand text-white shadow-sm'
                      : 'text-slate-600 hover:text-brand',
                  )}
                >
                  {c === 'mensal' ? 'Mensal' : 'Anual (2 meses grátis)'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PlanoCard
              nome="Starter"
              preco={ciclo === 'mensal' ? PLANOS.starter.preco_mensal : PLANOS.starter.preco_anual}
              ciclo={ciclo}
              limite="Até 2 barbeiros"
              features={[...PLANOS.starter.features]}
              sem={[...PLANOS.starter.sem]}
              onAssinar={() => handleAssinar('starter')}
              loading={isPending}
            />
            <PlanoCard
              nome="Pro"
              preco={ciclo === 'mensal' ? PLANOS.pro.preco_mensal : PLANOS.pro.preco_anual}
              ciclo={ciclo}
              limite="Até 5 barbeiros"
              features={[...PLANOS.pro.features]}
              destaque
              onAssinar={() => handleAssinar('pro')}
              loading={isPending}
            />
          </div>

          {/* Oferta de Fundadores */}
          {vagasRestantes > 0 && (
            <div className="rounded-xl border border-yellow-300 bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 p-5">
              <div className="flex items-start gap-3">
                <Star className="size-5 text-yellow-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-yellow-800">
                    🔥 Oferta de Fundadores — {vagasRestantes} vagas restantes
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Plano <strong>Pro completo</strong> por{' '}
                    <strong>R$49/mês para sempre</strong>. Exclusivo para os
                    primeiros {FUNDADORES_TOTAL_VAGAS} clientes.
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold"
                    onClick={handleFundador}
                    disabled={isPending}
                  >
                    Quero ser Fundador — {vagasRestantes} vaga
                    {vagasRestantes !== 1 ? 's' : ''} restante
                    {vagasRestantes !== 1 ? 's' : ''}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface PlanoCardProps {
  nome: string
  preco: number
  ciclo: 'mensal' | 'anual'
  limite: string
  features: string[]
  sem?: string[]
  destaque?: boolean
  onAssinar: () => void
  loading: boolean
}

function PlanoCard({
  nome,
  preco,
  ciclo,
  limite,
  features,
  sem,
  destaque,
  onAssinar,
  loading,
}: PlanoCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-xl p-5 flex flex-col gap-4',
        destaque
          ? 'bg-brand text-white ring-2 ring-brand'
          : 'bg-white border border-brand-100',
      )}
    >
      {destaque && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider bg-white text-brand px-3 py-0.5 rounded-full">
          Mais popular
        </span>
      )}
      <div>
        <h3
          className={cn(
            'text-base font-bold',
            destaque ? 'text-white' : 'text-brand',
          )}
        >
          {nome}
        </h3>
        <p
          className={cn(
            'text-xs mt-0.5',
            destaque ? 'text-white/70' : 'text-slate-500',
          )}
        >
          {limite}
        </p>
        <p className="mt-3 flex items-baseline gap-1">
          <span
            className={cn(
              'text-3xl font-bold font-mono',
              destaque ? 'text-white' : 'text-brand',
            )}
          >
            R$ {preco}
          </span>
          <span
            className={cn(
              'text-xs',
              destaque ? 'text-white/60' : 'text-slate-500',
            )}
          >
            /{ciclo === 'anual' ? 'ano' : 'mês'}
          </span>
        </p>
      </div>

      <ul className="space-y-2 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs">
            <Check
              className={cn(
                'size-3.5 mt-0.5 shrink-0',
                destaque ? 'text-white' : 'text-brand',
              )}
            />
            <span className={destaque ? 'text-white/90' : 'text-slate-700'}>
              {f}
            </span>
          </li>
        ))}
        {sem?.map((f) => (
          <li key={f} className="flex items-start gap-2 text-xs">
            <X
              className={cn(
                'size-3.5 mt-0.5 shrink-0',
                destaque ? 'text-white/30' : 'text-slate-300',
              )}
            />
            <span
              className={cn(
                'line-through',
                destaque ? 'text-white/40' : 'text-slate-400',
              )}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>

      <Button
        size="sm"
        disabled={loading}
        onClick={onAssinar}
        className={cn(
          'w-full font-semibold',
          destaque
            ? 'bg-white text-brand hover:bg-brand-50'
            : 'bg-brand text-white hover:bg-brand-light',
        )}
      >
        Assinar {nome}
      </Button>
    </div>
  )
}
