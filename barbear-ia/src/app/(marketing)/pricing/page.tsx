import type { Metadata } from 'next'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CONTATO_WHATSAPP_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Planos — Barbear.IA',
  description:
    'Atendimento automático no WhatsApp para barbearias. Implantação e plano sob medida para a sua operação.',
}

const INCLUSO = [
  'Atendimento automático 24h no WhatsApp',
  'Agendamento com verificação de conflitos',
  'Lembretes automáticos anti-falta',
  'Recuperação de clientes inativos',
  'Painel de agenda, clientes e métricas',
  'Implantação e acompanhamento da nossa equipe',
]

export default function PricingPage() {
  return (
    <>
      <section className="pt-28 sm:pt-32 pb-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              Planos
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-brand leading-tight">
              Sob medida
              <br />
              <span className="text-slate-700">para a sua barbearia.</span>
            </h1>
            <p className="mt-4 text-slate-600">
              Cada barbearia tem um volume, uma equipe e uma rotina. Por isso
              a contratação é feita em uma conversa rápida, com implantação
              acompanhada pela nossa equipe.
            </p>
          </div>

          <div className="mt-10 rounded-2xl bg-white border border-brand-100 p-6 sm:p-8">
            <p className="text-sm font-semibold text-brand">O que está incluso</p>
            <ul className="mt-4 space-y-3">
              {INCLUSO.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                  <Check className="size-4 mt-0.5 shrink-0 text-brand" />
                  {item}
                </li>
              ))}
            </ul>
            {CONTATO_WHATSAPP_URL && (
              <Button
                className="mt-6 bg-brand text-white hover:bg-brand-light"
                render={
                  <a href={CONTATO_WHATSAPP_URL} target="_blank" rel="noopener noreferrer" />
                }
              >
                Falar com um consultor
              </Button>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
