import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPlatformAdmin } from '@/lib/platform-admin'

export default async function GestaoLayout({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdmin()
  if (!admin) redirect('/login')
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link href="/gestao" className="font-bold text-xl text-slate-900">Barbear.IA <span className="ml-2 text-xs font-medium text-slate-500">Gestão interna</span></Link>
          <span className="text-xs text-slate-500">Acesso restrito à equipe</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
    </div>
  )
}
