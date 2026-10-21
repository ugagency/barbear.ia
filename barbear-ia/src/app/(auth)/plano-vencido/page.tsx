import { redirect } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CONTATO_WHATSAPP_URL } from '@/lib/constants'

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

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/20 p-6 text-center">
        <div className="size-12 rounded-full bg-red-500/20 text-red-300 flex items-center justify-center mx-auto">
          <AlertTriangle className="size-6" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-white">Acesso suspenso</h1>
        <p className="mt-2 text-white/70 text-sm">
          {motivo === 'trial'
            ? 'Seu período de teste encerrou. Fale com a nossa equipe para continuar usando.'
            : 'Há uma pendência no seu plano. Fale com a nossa equipe para reativar o acesso.'}
        </p>
        {CONTATO_WHATSAPP_URL && (
          <Button
            className="mt-4 bg-white text-brand hover:bg-brand-50 font-semibold"
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
