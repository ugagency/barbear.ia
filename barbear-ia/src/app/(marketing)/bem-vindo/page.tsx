import type { Metadata } from 'next'
import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle2,
  MessageCircle,
  Calendar,
  Settings,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Bem-vindo — Barbear.IA',
}

export default function BemVindoPage() {
  return (
    <section className="relative pt-28 sm:pt-32 pb-20 min-h-screen">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(10,31,68,0.08),transparent)]"
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
        <div className="size-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-8" />
        </div>

        <h1 className="mt-6 text-3xl sm:text-4xl font-bold text-brand leading-tight">
          Sua barbearia está
          <br /> configurada!
        </h1>
        <p className="mt-4 text-slate-600">
          Falta pouco para a IA começar a atender. Veja os próximos passos:
        </p>

        <ol className="mt-10 space-y-3 text-left">
          <Passo
            numero={1}
            icon={<Settings className="size-4" />}
            titulo="Conectar o WhatsApp"
            texto="Abra Configurações → WhatsApp e escaneie o QR code com o número da barbearia."
          />
          <Passo
            numero={2}
            icon={<MessageCircle className="size-4" />}
            titulo="Testar com uma mensagem"
            texto="Mande uma mensagem para o número da barbearia e veja a IA responder."
          />
          <Passo
            numero={3}
            icon={<Calendar className="size-4" />}
            titulo="Acompanhar a agenda"
            texto="Cada agendamento aparece em tempo real no painel. Você pode editar a qualquer momento."
          />
        </ol>

        <div className="mt-10">
          <Button
            size="lg"
            className="bg-brand hover:bg-brand-light text-white px-6"
            render={<Link href="/agenda" />}
          >
            Ir para o dashboard <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  )
}

function Passo({
  numero,
  icon,
  titulo,
  texto,
}: {
  numero: number
  icon: React.ReactNode
  titulo: string
  texto: string
}) {
  return (
    <li className="flex gap-4 rounded-xl bg-white border border-brand-100 p-4">
      <div className="size-9 shrink-0 rounded-lg bg-brand-50 text-brand flex items-center justify-center font-mono text-sm font-bold">
        {numero}
      </div>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-brand inline-flex items-center gap-1.5">
          {icon}
          {titulo}
        </h3>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{texto}</p>
      </div>
    </li>
  )
}
