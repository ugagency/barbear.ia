import { timingSafeEqual } from 'node:crypto'
import { supabaseAdmin as db } from '@/lib/supabase/admin'
import { syncBarber } from '@/lib/google-calendar/sync'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  const secret = process.env.GOOGLE_CALENDAR_SYNC_SECRET
  const received = Buffer.from(request.headers.get('authorization') ?? '')
  const expected = Buffer.from(`Bearer ${secret ?? ''}`)
  if (!secret || received.length !== expected.length || !timingSafeEqual(received, expected)) {
    return Response.json({ error: 'Não autorizado.' }, { status: 401 })
  }
  const { data, error } = await db.from('google_calendar_jobs').select('barbeiro_id')
    .lte('next_attempt_at', new Date().toISOString()).order('created_at').limit(100)
  if (error) return Response.json({ error: 'Fila indisponível.' }, { status: 503 })
  const started = Date.now()
  let processed = 0
  let failures = 0
  for (const barberId of new Set<string>((data ?? []).map((j: { barbeiro_id: string }) => j.barbeiro_id))) {
    if (Date.now() - started > 10_000) break
    try { const result = await syncBarber(barberId); processed += result.processed; if (result.failed) failures++ } catch { failures++ }
  }
  return Response.json({ processed, failures }, { headers: { 'Cache-Control': 'no-store' } })
}
