import type { Metadata } from 'next'
import { Navbar } from '@/components/marketing/navbar'
import { Footer } from '@/components/marketing/footer'

export const metadata: Metadata = {
  title: 'Barbear.IA — Recepcionista Digital para Barbearias',
  description:
    'IA que agenda, confirma, lembra e recupera clientes direto no WhatsApp. 24h por dia. Sem recepcionista.',
  openGraph: {
    title: 'Barbear.IA',
    description: 'Recepcionista digital para barbearias',
    type: 'website',
  },
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      <Navbar />
      <main>{children}</main>
      <Footer />
    </div>
  )
}
