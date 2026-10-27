'use client'

import { useEffect, useState, useTransition } from 'react'
import { CalendarDays, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { connectGoogleCalendar, disconnectGoogleCalendar, googleCalendarStatus, syncGoogleCalendar } from '../google-calendar-actions'

type Status = Awaited<ReturnType<typeof googleCalendarStatus>>

export function GoogleCalendar({ barberId }: { barberId: string }) {
  const [status, setStatus] = useState<Status | null>(null)
  const [pending, startTransition] = useTransition()
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  useEffect(() => {
    let active = true
    googleCalendarStatus(barberId).then((result) => { if (active) setStatus(result) })
      .catch(() => { if (active) setStatus({ success: false, error: 'Não foi possível consultar a conexão.' }) })
    return () => { active = false }
  }, [barberId])

  function connect() {
    startTransition(async () => {
      const result = await connectGoogleCalendar(barberId)
      if (!result.success) return void toast.error(result.error)
      window.location.assign(result.url)
    })
  }
  function sync() {
    startTransition(async () => {
      const result = await syncGoogleCalendar(barberId)
      if (!result.success) toast.error(result.error)
      else if (result.busy) toast.info('A sincronização já está em andamento.')
      else if (result.failed) toast.info('Algumas alterações serão reenviadas automaticamente.')
      else toast.success('Sincronização executada.')
      setStatus(await googleCalendarStatus(barberId))
    })
  }
  function disconnect() {
    startTransition(async () => {
      const result = await disconnectGoogleCalendar(barberId)
      if (!result.success) return void toast.error(result.error)
      setConfirmDisconnect(false)
      setStatus(await googleCalendarStatus(barberId))
      toast.success('Google Agenda desconectado.')
    })
  }
  const connection = status?.success ? status.connection : null
  return (
    <section className="space-y-3 rounded-lg border border-brand-100 p-4" aria-label="Google Agenda">
      <div className="flex items-center gap-2 text-sm font-semibold text-brand"><CalendarDays className="size-4" /> Google Agenda</div>
      <p className="text-xs text-slate-500">Os agendamentos deste profissional aparecem em uma agenda própria na conta Google autorizada. Criações, remarcações e cancelamentos são enviados pela Barbear.IA.</p>
      <p className="text-xs text-slate-500">Compromissos pessoais e alterações feitas no Google não são importados. Gerencie os horários pela Barbear.IA.</p>
      {!status ? <p className="text-xs text-slate-500" role="status">Carregando conexão…</p> : !status.success ? <p className="text-xs text-amber-700" role="status">{status.error}</p> : connection ? (
        <>
          <p className="text-sm font-medium text-green-700">Conectado: {connection.calendar_name}</p>
          {connection.last_synced_at && <p className="text-xs text-slate-500">Última execução: {new Date(connection.last_synced_at).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}</p>}
          <p className="text-xs text-slate-500">{status.pending} alteração(ões) pendente(s).</p>
          {connection.last_error && <p className="text-xs text-amber-700" role="status">{connection.last_error}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={sync}>{pending && <Loader2 className="size-4 animate-spin" />} Sincronizar agora</Button>
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmDisconnect(true)}>Desconectar</Button>
          </div>
          {confirmDisconnect && <div className="space-y-2 rounded-md bg-slate-50 p-3">
            <p className="text-xs text-slate-600">A sincronização será interrompida. A agenda e os eventos já enviados permanecem no Google; você pode removê-los por lá.</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" disabled={pending} onClick={disconnect}>Confirmar desconexão</Button>
              <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirmDisconnect(false)}>Manter conectado</Button>
            </div>
          </div>}
        </>
      ) : <>
        {!status.configured && <p className="text-xs text-amber-700">A conexão aguarda ativação pela equipe Spictur.</p>}
        <Button type="button" size="sm" variant="outline" disabled={pending || !status.configured} onClick={connect}>{pending && <Loader2 className="size-4 animate-spin" />} Conectar Google Agenda</Button>
        <p className="text-xs text-slate-500">Use a conta Google do barbeiro na próxima tela. Salve as alterações deste formulário antes de conectar.</p>
      </>}
    </section>
  )
}
