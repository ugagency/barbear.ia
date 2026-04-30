'use client'

import { Bot, RefreshCw, Bell, DollarSign } from 'lucide-react'
import type { MetricasCalculadas } from '../types'

interface Props {
  metricas: MetricasCalculadas
}

function formatBRL(v: number): string {
  return v.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

export function CardIA({ metricas }: Props) {
  return (
    <div className="rounded-xl bg-brand text-white p-5 sm:p-6 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <div className="size-10 rounded-lg bg-white/10 flex items-center justify-center">
          <Bot className="size-5 text-white" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Impacto da IA no período</h3>
          <p className="text-xs text-white/60">
            O que sua recepcionista digital fez por você.
          </p>
        </div>
      </div>

      <div className="space-y-3 flex-1">
        <Linha
          icon={<Bot className="size-4 text-white/70" />}
          label={
            <>
              <span className="font-mono font-bold text-white">
                {metricas.taxa_ia.toFixed(0)}%
              </span>{' '}
              dos agendamentos feitos pela IA
            </>
          }
          subtitle={`${metricas.agendamentos_ia} de ${metricas.total_agendamentos} no total`}
        />
        <Linha
          icon={<RefreshCw className="size-4 text-white/70" />}
          label={
            <>
              <span className="font-mono font-bold text-white">
                {metricas.clientes_recuperados}
              </span>{' '}
              cliente{metricas.clientes_recuperados === 1 ? '' : 's'} recuperado{metricas.clientes_recuperados === 1 ? '' : 's'}
            </>
          }
          subtitle="Voltaram após inatividade"
        />
        <Linha
          icon={<Bell className="size-4 text-white/70" />}
          label={
            <>
              <span className="font-mono font-bold text-white">
                {metricas.lembretes_enviados}
              </span>{' '}
              lembrete{metricas.lembretes_enviados === 1 ? '' : 's'} enviado{metricas.lembretes_enviados === 1 ? '' : 's'}
            </>
          }
          subtitle="Reativações automáticas"
        />
        <Linha
          icon={<DollarSign className="size-4 text-white/70" />}
          label={
            <>
              <span className="font-mono font-bold text-white">
                ~{formatBRL(metricas.faturamento_ia)}
              </span>{' '}
              gerados automaticamente
            </>
          }
          subtitle="Concluídos vindos da IA"
        />
      </div>
    </div>
  )
}

function Linha({
  icon,
  label,
  subtitle,
}: {
  icon: React.ReactNode
  label: React.ReactNode
  subtitle: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-white/5 px-3 py-2.5">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-white/90">{label}</p>
        <p className="text-[11px] text-white/50">{subtitle}</p>
      </div>
    </div>
  )
}
