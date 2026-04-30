import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AlertTriangle, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { contarFundadores } from '@/app/(dashboard)/configuracoes/actions'
import { Button } from '@/components/ui/button'
import { FUNDADORES_TOTAL_VAGAS } from '@/lib/constants'

export default async function PlanoVencidoPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vinculo } = await supabase
    .from('usuarios_barbearias')
    .select('barbearia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  let motivo: 'trial' | 'inadimplente' = 'trial'

  if (vinculo) {
    const { data: barbearia } = await supabase
      .from('barbearias')
      .select('plano, plano_status, trial_ends_at')
      .eq('id', vinculo.barbearia_id)
      .maybeSingle()

    if (barbearia) {
      // Se o plano estiver ativo, redireciona para a agenda
      const now = new Date()
      const trialValido =
        barbearia.plano === 'trial' &&
        (!barbearia.trial_ends_at ||
          new Date(barbearia.trial_ends_at as string) > now)
      const planoAtivo =
        barbearia.plano !== 'trial' && barbearia.plano_status === 'ativo'

      if (trialValido || planoAtivo) redirect('/agenda')

      if (barbearia.plano_status === 'inadimplente') motivo = 'inadimplente'
    }
  }

  const fundadoresUsados = await contarFundadores()
  const vagasRestantes = Math.max(0, FUNDADORES_TOTAL_VAGAS - fundadoresUsados)

  return (
    <div className="w-full max-w-lg space-y-6">
      {/* Status card */}
      <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6 text-center">
        <div className="size-12 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">Acesso suspenso</h1>
        <p className="mt-2 text-white/70 text-sm">
          {motivo === 'trial'
            ? 'Seu trial de 7 dias encerrou. Assine um plano para continuar.'
            : 'Seu pagamento está em atraso. Regularize para reativar o acesso.'}
        </p>
        <Link href="/configuracoes?tab=plano">
          <Button className="mt-4 bg-white text-brand hover:bg-brand-50 font-semibold">
            {motivo === 'inadimplente' ? 'Pagar fatura em aberto' : 'Ver planos e assinar'}
          </Button>
        </Link>
      </div>

      {/* Cards de planos */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white/10 border border-white/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Starter
          </p>
          <p className="mt-1 text-2xl font-bold text-white font-mono">R$49</p>
          <p className="text-xs text-white/60">/mês · até 2 barbeiros</p>
          <Link href="/configuracoes">
            <Button
              size="sm"
              className="mt-3 w-full bg-white/20 hover:bg-white/30 text-white border border-white/30"
            >
              Assinar
            </Button>
          </Link>
        </div>
        <div className="rounded-xl bg-white border border-white/20 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand/60">
            Pro
          </p>
          <p className="mt-1 text-2xl font-bold text-brand font-mono">R$97</p>
          <p className="text-xs text-slate-500">/mês · até 5 barbeiros</p>
          <Link href="/configuracoes">
            <Button
              size="sm"
              className="mt-3 w-full bg-brand text-white hover:bg-brand-light"
            >
              Assinar
            </Button>
          </Link>
        </div>
      </div>

      {/* Oferta Fundadores */}
      {vagasRestantes > 0 && (
        <div className="rounded-xl border border-yellow-400/40 bg-yellow-400/10 p-4 flex items-start gap-3">
          <Star className="size-4 text-yellow-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-yellow-300">
              🔥 Oferta de Fundadores — {vagasRestantes} vaga
              {vagasRestantes !== 1 ? 's' : ''} restante
              {vagasRestantes !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-yellow-200/80 mt-0.5">
              Pro por R$49/mês para sempre. Exclusivo para os primeiros{' '}
              {FUNDADORES_TOTAL_VAGAS} clientes.
            </p>
            <Link href="/configuracoes">
              <Button
                size="sm"
                className="mt-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold text-xs"
              >
                Quero ser Fundador
              </Button>
            </Link>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-white/50">
        Dúvidas? Fale com o suporte pelo WhatsApp.
      </p>
    </div>
  )
}
