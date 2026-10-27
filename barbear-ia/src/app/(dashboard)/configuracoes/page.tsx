import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesClient } from './configuracoes-client'
import type { Barbearia, Barbeiro } from '@/types'

export default async function ConfiguracoesPage({ searchParams }: { searchParams: Promise<{ google_calendar?: string }> }) {
  const outcome = (await searchParams).google_calendar
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
  if (!vinculo) redirect('/onboarding')
  const barbeariaId = vinculo.barbearia_id as string

  const [barbeariaRes, barbeirosRes] = await Promise.all([
    supabase.from('barbearias').select('*').eq('id', barbeariaId).single(),
    supabase
      .from('barbeiros')
      .select('*')
      .eq('barbearia_id', barbeariaId)
      .order('created_at', { ascending: true }),
  ])

  if (!barbeariaRes.data) redirect('/onboarding')

  return (
    <>
    {outcome && <div className="mb-4 rounded-lg border border-brand-100 bg-white p-4 text-sm" role="status">
      {outcome === 'conectado' ? 'Google Agenda conectado. Acesse Barbeiros → Editar para acompanhar a sincronização.' : 'Não foi possível conectar o Google Agenda. Tente novamente e autorize o acesso à agenda. Se persistir, entre em contato com a equipe Spictur.'}
    </div>}
    <ConfiguracoesClient
      barbearia={barbeariaRes.data as Barbearia}
      barbeiros={(barbeirosRes.data ?? []) as Barbeiro[]}
    />
    </>
  )
}
