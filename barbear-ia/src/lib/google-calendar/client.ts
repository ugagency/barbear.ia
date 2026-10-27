import { createHash } from 'node:crypto'

export const SCOPE = 'https://www.googleapis.com/auth/calendar.app.created'
export const STATE_COOKIE = 'barbear-google-calendar'
export function config() {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET
  const redirectUri = process.env.GOOGLE_CALENDAR_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri || !/^[a-f0-9]{64}$/i.test(process.env.GOOGLE_CALENDAR_TOKEN_KEY ?? '')) {
    throw new Error('A conexão com o Google Agenda ainda não foi habilitada pela equipe Spictur.')
  }
  return { clientId, clientSecret, redirectUri }
}

export async function tokenRequest(fields: Record<string, string>) {
  const cfg = config()
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: cfg.clientId, client_secret: cfg.clientSecret, ...fields }),
  })
  if (!response.ok) throw new Error('Reconecte o Google Agenda para autorizar a sincronização.')
  const result = await response.json() as { access_token: string; refresh_token?: string; scope?: string }
  if (!result.access_token) throw new Error('O Google não retornou a autorização.')
  return result
}

export async function calendarRequest(token: string, path: string, init: RequestInit = {}) {
  return fetch(`https://www.googleapis.com/calendar/v3/${path}`, {
    ...init, cache: 'no-store', signal: AbortSignal.timeout(8000),
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
}

export function eventId(appointmentId: string) {
  // Hex is a subset of Google's permitted base32hex event ID alphabet.
  return createHash('sha256').update(`barbear-ia:${appointmentId}`).digest('hex')
}

export interface AppointmentSnapshot {
  id: string; servico: string; inicio_at: string; fim_at: string; status: string
}
export function eventPayload(appointment: AppointmentSnapshot, clientName?: string | null) {
  return {
    status: 'confirmed',
    summary: `${appointment.servico} — ${clientName || 'Cliente'}`,
    description: 'Agendamento da Barbear.IA. Faça remarcações e cancelamentos na Barbear.IA.',
    start: { dateTime: appointment.inicio_at }, end: { dateTime: appointment.fim_at },
    extendedProperties: { private: { barbeariaAppointmentId: appointment.id } },
  }
}
