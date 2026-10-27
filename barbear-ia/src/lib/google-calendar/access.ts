import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function authorizeBarber(barberId: string) {
  if (!z.uuid().safeParse(barberId).success) throw new Error('Barbeiro inválido.')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Sessão expirada. Entre novamente.')
  const { data: barber, error } = await supabaseAdmin.from('barbeiros')
    .select('id, nome, barbearia_id').eq('id', barberId).maybeSingle()
  if (error || !barber) throw new Error('Barbeiro não encontrado.')
  // Only the shop owner manages integrations; never infer permissions from user_metadata.
  const { data: membership } = await supabase.from('usuarios_barbearias')
    .select('id').eq('user_id', user.id).eq('barbearia_id', barber.barbearia_id).eq('role', 'dono').maybeSingle()
  if (!membership) throw new Error('Somente o responsável pela barbearia pode gerenciar a conexão.')
  return { user, barber }
}
