import { randomUUID } from 'node:crypto'
import { supabaseAdmin as db } from '@/lib/supabase/admin'
import { decrypt } from './crypto'
import { calendarRequest, eventId, eventPayload, tokenRequest, type AppointmentSnapshot } from './client'

interface Job {
  agendamento_id: string; barbeiro_id: string; revision: string; deleted: boolean
  payload: AppointmentSnapshot & { cliente_id?: string }; attempts: number
}

export async function syncBarber(barberId: string) {
  const lease = randomUUID()
  const { data: connection, error } = await db.from('google_calendar_connections')
    .update({ lock_token: lease, locked_until: new Date(Date.now() + 300_000).toISOString() })
    .eq('barbeiro_id', barberId)
    .or(`locked_until.is.null,locked_until.lt.${new Date().toISOString()}`)
    .select('calendar_id, barbearia_id, refresh_token_encrypted').maybeSingle()
  if (error) throw new Error('Não foi possível acessar a conexão com o Google Agenda.')
  if (!connection) return { processed: 0, busy: true }
  let processed = 0
  let failed = false
  const started = Date.now()
  try {
    const { access_token: token } = await tokenRequest({
      grant_type: 'refresh_token', refresh_token: decrypt(connection.refresh_token_encrypted),
    })
    const { data, error: queueError } = await db.from('google_calendar_jobs').select('*')
      .eq('barbeiro_id', barberId).lte('next_attempt_at', new Date().toISOString())
      .order('created_at').limit(10)
    if (queueError) throw new Error('Não foi possível ler a fila do Google Agenda.')
    for (const job of (data ?? []) as Job[]) {
      if (Date.now() - started > 15_000) break
      try {
        const path = `calendars/${encodeURIComponent(connection.calendar_id)}/events`
        const id = eventId(job.agendamento_id)
        if (job.deleted || job.payload.status === 'cancelado') {
          const result = await calendarRequest(token, `${path}/${id}`, job.deleted ? { method: 'DELETE' } : { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) })
          if (!result.ok && result.status !== 404 && result.status !== 410) throw new Error('delete')
        } else {
          const { data: client, error: clientError } = await db.from('clientes').select('nome').eq('id', job.payload.cliente_id).eq('barbearia_id', connection.barbearia_id).maybeSingle()
          if (clientError) throw new Error('client')
          const payload = eventPayload(job.payload, client?.nome)
          let result = await calendarRequest(token, `${path}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
          if (result.status === 404) {
            result = await calendarRequest(token, path, { method: 'POST', body: JSON.stringify({ id, ...payload }) })
            // A previous timed-out insert may have succeeded. Retry as an update.
            if (result.status === 409) result = await calendarRequest(token, `${path}/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
          }
          if (!result.ok) throw new Error('upsert')
        }
        // Do not drop a newer change enqueued while Google was being called.
        const { error: deleteError } = await db.from('google_calendar_jobs').delete()
          .eq('barbeiro_id', barberId).eq('agendamento_id', job.agendamento_id).eq('revision', job.revision)
        if (deleteError) throw new Error('queue')
        processed++
      } catch {
        failed = true
        const delay = Math.min(3600, 30 * 2 ** Math.min(job.attempts, 7))
        await db.from('google_calendar_jobs').update({ attempts: job.attempts + 1, next_attempt_at: new Date(Date.now() + delay * 1000).toISOString() })
          .eq('barbeiro_id', barberId).eq('agendamento_id', job.agendamento_id).eq('revision', job.revision)
      }
    }
    await db.from('google_calendar_connections').update({
      last_synced_at: new Date().toISOString(), last_error: failed ? 'Há alterações pendentes. Tentaremos novamente automaticamente.' : null,
    }).eq('barbeiro_id', barberId).eq('lock_token', lease)
    return { processed, failed }
  } catch (error) {
    await db.from('google_calendar_connections').update({ last_error: 'Não foi possível sincronizar. Tente novamente ou reconecte sua conta Google.' })
      .eq('barbeiro_id', barberId).eq('lock_token', lease)
    throw error
  } finally {
    await db.from('google_calendar_connections').update({ lock_token: null, locked_until: null })
      .eq('barbeiro_id', barberId).eq('lock_token', lease)
  }
}

// Best effort after a booking mutation. The durable database queue remains the source of retries.
export async function syncShopSafely(shopId: string) {
  const { data } = await db.from('google_calendar_connections').select('barbeiro_id').eq('barbearia_id', shopId)
  const started = Date.now()
  for (const row of data ?? []) {
    if (Date.now() - started > 10_000) break
    try { await syncBarber(row.barbeiro_id) } catch { /* State is visible in settings; scheduled worker retries. */ }
  }
}
