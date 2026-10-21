import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ConfiguracoesClient } from './configuracoes-client'
import type { Barbearia, Barbeiro } from '@/types'

export default async function ConfiguracoesPage() {
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
    <ConfiguracoesClient
      barbearia={barbeariaRes.data as Barbearia}
      barbeiros={(barbeirosRes.data ?? []) as Barbeiro[]}
    />
  )
}
