import { cookies } from 'next/headers'
import { after, NextRequest, NextResponse } from 'next/server'
import { authorizeBarber } from '@/lib/google-calendar/access'
import { calendarRequest, config, SCOPE, STATE_COOKIE, tokenRequest } from '@/lib/google-calendar/client'
import { decrypt, encrypt } from '@/lib/google-calendar/crypto'
import { syncBarber } from '@/lib/google-calendar/sync'
import { supabaseAdmin as db } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const jar = await cookies()
  const saved = jar.get(STATE_COOKIE)?.value
  jar.delete(STATE_COOKIE)
  let outcome = 'erro'
  try {
    if (!saved) throw new Error('state')
    const ctx = JSON.parse(decrypt(saved)) as { state: string; verifier: string; userId: string; barberId: string; expires: number }
    if (ctx.expires < Date.now() || ctx.state !== request.nextUrl.searchParams.get('state')) throw new Error('state')
    const { user, barber } = await authorizeBarber(ctx.barberId)
    if (user.id !== ctx.userId) throw new Error('session')
    if (request.nextUrl.searchParams.has('error')) throw new Error('denied')
    const code = request.nextUrl.searchParams.get('code')
    if (!code) throw new Error('code')
    const { data: existing, error: existingError } = await db.from('google_calendar_connections').select('barbeiro_id').eq('barbeiro_id', barber.id).maybeSingle()
    if (existingError || existing) throw new Error('existing')
    const tokens = await tokenRequest({ grant_type: 'authorization_code', code, code_verifier: ctx.verifier, redirect_uri: config().redirectUri })
    if (!tokens.refresh_token || !tokens.scope?.split(' ').includes(SCOPE)) throw new Error('consent')
    const calendarName = `Barbear.IA — ${barber.nome}`
    const created = await calendarRequest(tokens.access_token, 'calendars', {
      method: 'POST', body: JSON.stringify({ summary: calendarName, timeZone: 'America/Sao_Paulo', description: 'Agendamentos da Barbear.IA. Gerencie os horários na Barbear.IA.' }),
    })
    if (!created.ok) throw new Error('calendar')
    const calendar = await created.json() as { id: string }
    if (!calendar.id) throw new Error('calendar')
    const { error } = await db.from('google_calendar_connections').insert({
      barbeiro_id: barber.id, barbearia_id: barber.barbearia_id, calendar_id: calendar.id,
      calendar_name: calendarName, refresh_token_encrypted: encrypt(tokens.refresh_token), connected_by: user.id,
    })
    if (error) {
      await calendarRequest(tokens.access_token, `calendars/${encodeURIComponent(calendar.id)}`, { method: 'DELETE' })
      throw new Error('save')
    }
    outcome = 'conectado'
    after(async () => { try { await syncBarber(barber.id) } catch { /* Stored error is visible in settings. */ } })
  } catch { /* Never expose provider tokens or codes in URLs, logs or UI. */ }
  const response = NextResponse.redirect(new URL(`/configuracoes?google_calendar=${outcome}`, request.url))
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('Referrer-Policy', 'no-referrer')
  return response
}
