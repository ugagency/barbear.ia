'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import {
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  MessageCircle,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import {
  reconectarWhatsApp,
  verificarConexaoWhatsApp,
  type WhatsAppStatus,
} from '../actions'

interface Props {
  instanceName: string
}

const POLL_INTERVAL_MS = 3000
const POLL_TIMEOUT_MS = 60_000

const STATUS_INFO: Record<
  WhatsAppStatus,
  { label: string; className: string; icon: React.ReactNode }
> = {
  open: {
    label: 'Conectado',
    className: 'bg-emerald-100 text-emerald-700',
    icon: <Wifi className="size-3.5" />,
  },
  connecting: {
    label: 'Conectando',
    className: 'bg-amber-100 text-amber-800',
    icon: <Loader2 className="size-3.5 animate-spin" />,
  },
  close: {
    label: 'Desconectado',
    className: 'bg-red-100 text-red-700',
    icon: <WifiOff className="size-3.5" />,
  },
  unknown: {
    label: 'Desconhecido',
    className: 'bg-slate-200 text-slate-600',
    icon: <AlertCircle className="size-3.5" />,
  },
}

export function AbaWhatsapp({ instanceName }: Props) {
  const [status, setStatus] = useState<WhatsAppStatus>('unknown')
  const [qrcode, setQrcode] = useState<string | null>(null)
  const [isVerifying, startVerify] = useTransition()
  const [isReconnecting, startReconnect] = useTransition()
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    handleVerificar()
    return () => {
      stopPolling()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceName])

  function stopPolling() {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current)
      pollTimerRef.current = null
    }
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current)
      pollTimeoutRef.current = null
    }
  }

  function handleVerificar() {
    startVerify(async () => {
      const result = await verificarConexaoWhatsApp(instanceName)
      if (!result.success) {
        toast.error(result.error)
        setStatus('unknown')
        return
      }
      setStatus(result.data?.status ?? 'unknown')
      if (result.data?.status === 'open') {
        setQrcode(null)
        stopPolling()
      }
    })
  }

  function handleReconectar() {
    startReconnect(async () => {
      const result = await reconectarWhatsApp(instanceName)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      if (result.data?.qrcode) {
        setQrcode(result.data.qrcode)
        toast.message('Escaneie o QR code no WhatsApp.')
      }
      setStatus(result.data?.status ?? 'connecting')
      iniciarPolling()
    })
  }

  function iniciarPolling() {
    stopPolling()
    pollTimerRef.current = setInterval(async () => {
      const result = await verificarConexaoWhatsApp(instanceName)
      if (result.success) {
        const next = result.data?.status ?? 'unknown'
        setStatus(next)
        if (next === 'open') {
          setQrcode(null)
          stopPolling()
          toast.success('WhatsApp conectado.')
        }
      }
    }, POLL_INTERVAL_MS)
    pollTimeoutRef.current = setTimeout(() => {
      stopPolling()
    }, POLL_TIMEOUT_MS)
  }

  const info = STATUS_INFO[status]

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center">
            <MessageCircle className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-brand">
              Conexão WhatsApp
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Status da instância Evolution API que recebe e envia mensagens.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Instância">
            <span className="text-sm font-mono">{instanceName}</span>
          </Field>
          <Field label="Status">
            <Badge className={cn('border-transparent', info.className)}>
              {info.icon}
              <span>{info.label}</span>
            </Badge>
          </Field>
        </div>

        <Separator className="my-5" />

        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleVerificar}
            disabled={isVerifying}
          >
            {isVerifying ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RefreshCw className="size-3.5" />
            )}
            Verificar conexão
          </Button>
          <Button
            onClick={handleReconectar}
            disabled={isReconnecting}
            className="bg-brand hover:bg-brand-light text-white"
          >
            {isReconnecting ? (
              <>
                <Loader2 className="animate-spin" /> Solicitando...
              </>
            ) : (
              'Reconectar'
            )}
          </Button>
        </div>

        {qrcode && (
          <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50/40 p-5 flex flex-col items-center text-center">
            <p className="text-sm font-medium text-brand mb-3">
              Escaneie com o WhatsApp
            </p>
            <p className="text-xs text-slate-600 mb-4 max-w-md">
              Abra o WhatsApp → Menu → Aparelhos conectados → Conectar um
              aparelho. Escaneie o código abaixo.
            </p>
            <div className="bg-white p-3 rounded-md border border-brand-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrcode}
                alt="QR Code"
                width={256}
                height={256}
                className="size-64"
              />
            </div>
            <p className="mt-3 text-[11px] text-slate-500">
              Verificando conexão automaticamente a cada 3 segundos...
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-brand-100 bg-brand-50/40 p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-brand">Como funciona</h3>
        <ul className="mt-2 space-y-1.5 text-xs text-slate-600 list-disc pl-4">
          <li>Cada barbearia tem uma instância isolada na Evolution API.</li>
          <li>
            Mensagens recebidas no WhatsApp passam pelo n8n e são respondidas
            pela IA.
          </li>
          <li>
            Se a sessão cair (celular sem internet, app desinstalado), use{' '}
            <strong>Reconectar</strong> e escaneie o novo QR code.
          </li>
        </ul>
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <div>{children}</div>
    </div>
  )
}
