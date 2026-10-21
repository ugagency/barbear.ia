'use client'

import { AlertTriangle, Check, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CONTATO_WHATSAPP_URL, PLANOS } from '@/lib/constants'

interface BarbeariaPlano {
  plano: string
  plano_status: string
  trial_ends_at: string | null
}

interface Props {
  barbearia: BarbeariaPlano
}

function diasRestantes(iso: string | null): number {
  if (!iso) return 0
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function AbaPlano({ barbearia }: Props) {
  const isTrial = barbearia.plano === 'trial'
  const isAtivo = barbearia.plano_status === 'ativo'
  const isInadimplente = barbearia.plano_status === 'inadimplente'
  const isCancelado = barbearia.plano_status === 'cancelado'
  const dias = diasRestantes(barbearia.trial_ends_at)
  const planoInfo = PLANOS[barbearia.plano as keyof typeof PLANOS]

  return (
    <div className="space-y-6">
      {isTrial && isAtivo && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <Clock className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800">Período de teste</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {dias > 0
                ? `Expira em ${dias} dia${dias !== 1 ? 's' : ''}. Acesso completo durante o teste.`
                : 'Seu período de teste expirou. Fale com a gente para continuar.'}
            </p>
          </div>
        </div>
      )}

      {!isTrial && isAtivo && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <Check className="size-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-emerald-800">
              Plano {planoInfo?.nome ?? barbearia.plano} ativo
            </p>
            <p className="text-sm text-emerald-700 mt-0.5">
              Condições e faturamento combinados diretamente com nossa equipe.
            </p>
          </div>
        </div>
      )}

      {(isInadimplente || isCancelado) && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="size-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800">
              {isInadimplente ? 'Pendência no plano' : 'Plano cancelado'}
            </p>
            <p className="text-sm text-red-700 mt-0.5">
              Fale com a nossa equipe para regularizar e reativar o acesso.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-xl bg-white border border-brand-100 p-5 space-y-3">
        <p className="text-sm font-semibold text-brand">
          Alterar plano, renovar ou tirar dúvidas
        </p>
        <p className="text-sm text-slate-600">
          O Barbear.IA é contratado de forma personalizada. Para mudar de plano,
          renovar ou ajustar a cobrança, fale diretamente com a nossa equipe.
        </p>
        {CONTATO_WHATSAPP_URL && (
          <Button
            size="sm"
            className="bg-brand text-white hover:bg-brand-light"
            render={
              <a href={CONTATO_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" />
            }
          >
            Falar com a equipe
          </Button>
        )}
      </div>
    </div>
  )
}
