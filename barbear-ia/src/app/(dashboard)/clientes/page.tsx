import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClientesClient } from './clientes-client'
import {
  calcularStatus,
  diasDesde,
  type ClienteListItem,
} from './types'
import type { Cliente } from '@/types'

export default async function ClientesPage() {
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

  const { data: clientesRaw } = await supabase
    .from('clientes')
    .select('*')
    .eq('barbearia_id', barbeariaId)
    .order('ultimo_atendimento', { ascending: false, nullsFirst: false })

  const clientes: ClienteListItem[] = ((clientesRaw ?? []) as Cliente[]).map(
    (c) => ({
      ...c,
      status: calcularStatus(c.ultimo_atendimento),
      dias_desde_ultimo: diasDesde(c.ultimo_atendimento),
    }),
  )

  return <ClientesClient clientes={clientes} />
}
