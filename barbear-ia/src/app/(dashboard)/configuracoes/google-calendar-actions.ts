'use server'

import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { authorizeBarber } from '@/lib/google-calendar/access'
import { config, SCOPE, STATE_COOKIE } from '@/lib/google-calendar/client'
import { encrypt } from '@/lib/google-calendar/crypto'
import { syncBarber } from '@/lib/google-calendar/sync'
import { supabaseAdmin as db } from '@/lib/supabase/admin'

export async function googleCalendarStatus(barberId: string) {
  try {
    await authorizeBarber(barberId)
    let configured = true
    try { config() } catch { configured = false }
    const { data, error } = await db.from('google_calendar_connections')
      .select('calendar_name, last_synced_at, last_error').eq('barbeiro_id', barberId).maybeSingle()
    if (error) return { success: false as const, error: 'A integração com Google Agenda aguarda ativação pela equipe Spictur.' }
    const { count } = await db.from('google_calendar_jobs').select('*', { count: 'exact', head: true }).eq('barbeiro_id', barberId)
    return { success: true as const, configured, connection: data as { calendar_name: string; last_synced_at: string | null; last_error: string | null } | null, pending: count ?? 0 }
  } catch (error) { return { success: false as const, error: message(error) } }
}

export async function connectGoogleCalendar(barberId: string) {
  try {
    const { user } = await authorizeBarber(barberId)
    const cfg = config()
    const { data: existing, error } = await db.from('google_calendar_connections').select('barbeiro_id').eq('barbeiro_id', barberId).maybeSingle()
    if (error) throw new Error('A integração aguarda ativação pela equipe Spictur.')
    if (existing) throw new Error('Desconecte a agenda atual antes de conectar outra conta.')
    const state = randomBytes(32).toString('base64url')
    const verifier = randomBytes(48).toString('base64url')
    const jar = await cookies()
    jar.set(STATE_COOKIE, encrypt(JSON.stringify({ state, verifier, userId: user.id, barberId, expires: Date.now() + 600_000 })), {
      httpOnly: true, secure: new URL(cfg.redirectUri).protocol === 'https:', sameSite: 'lax', maxAge: 600, path: '/api/google-calendar/callback',
    })
    const params = new URLSearchParams({
      client_id: cfg.clientId, redirect_uri: cfg.redirectUri, response_type: 'code',
      scope: SCOPE, access_type: 'offline', prompt: 'consent select_account', state,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'), code_challenge_method: 'S256',
    })
    return { success: true as const, url: `https://accounts.google.com/o/oauth2/v2/auth?${params}` }
  } catch (error) { return { success: false as const, error: message(error) } }
}

export async function disconnectGoogleCalendar(barberId: string) {
  try {
    await authorizeBarber(barberId)
    // Grants may be shared by other barbers on the same Google account: remove only this connection.
    // The separate Google calendar is preserved; removing it is a choice made in Google Calendar.
    const { error } = await db.from('google_calendar_connections').delete().eq('barbeiro_id', barberId).or(`lock_token.is.null,locked_until.lt.${new Date().toISOString()}`)
      .select('barbeiro_id').single()
    if (error) throw new Error('Aguarde a sincronização terminar e tente desconectar novamente.')
    return { success: true as const }
  } catch (error) { return { success: false as const, error: message(error) } }
}

export async function syncGoogleCalendar(barberId: string) {
  try {
    await authorizeBarber(barberId)
    const result = await syncBarber(barberId)
    return { success: true as const, ...result }
  } catch (error) { return { success: false as const, error: message(error) } }
}

function message(error: unknown) { return error instanceof Error ? error.message : 'Não foi possível acessar o Google Agenda.' }
