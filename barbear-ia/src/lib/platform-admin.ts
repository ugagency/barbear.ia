import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { SupabaseClient } from '@supabase/supabase-js'

export async function getPlatformAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  const { data } = await (supabaseAdmin as unknown as SupabaseClient)
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()
  return data ? user : null
}
