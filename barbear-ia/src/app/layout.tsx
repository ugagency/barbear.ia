import { Inter } from 'next/font/google'
import '@/app/globals.css'
import { Toaster } from '@/components/ui/sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Barbear.IA — Recepcionista Digital para Barbearias',
  description: 'Sistema multi-tenant de atendimento automatizado via WhatsApp para barbearias.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
