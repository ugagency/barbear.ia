'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  Calendar,
  Users,
  Settings,
  BarChart3,
  LogOut,
} from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useBarbearia, clearBarbeariaCache } from '@/hooks/use-barbearia'
import { signOut } from '@/app/(auth)/actions'
import { PLANOS } from '@/lib/constants'
import type { Plano } from '@/types'

const NAV_ITEMS = [
  { href: '/agenda', label: 'Agenda', icon: Calendar },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/configuracoes', label: 'Configurações', icon: Settings },
  { href: '/metricas', label: 'Métricas', icon: BarChart3 },
] as const

const PLANO_VARIANT: Record<Plano, string> = {
  trial: 'bg-amber-100 text-amber-800',
  starter: 'bg-brand-50 text-brand',
  pro: 'bg-brand text-white',
}

interface SidebarProps {
  className?: string
  onNavigate?: () => void
}

export function Sidebar({ className, onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { barbearia, isLoading } = useBarbearia()
  const [isPending, startTransition] = useTransition()

  function handleLogout() {
    startTransition(async () => {
      const result = await signOut()
      if (!result.success) {
        toast.error(result.error)
        return
      }
      clearBarbeariaCache()
      router.replace('/login')
      router.refresh()
    })
  }

  const plano = (barbearia?.plano ?? 'trial') as Plano

  return (
    <aside
      className={cn(
        'flex w-64 flex-col bg-brand text-white shrink-0',
        className,
      )}
    >
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <Link
          href="/agenda"
          onClick={onNavigate}
          className="flex items-center gap-2.5"
        >
          <Image
            src="/logomarca barbear.ia.png"
            alt="Barbear.IA"
            width={36}
            height={36}
            className="rounded-md bg-white/5"
          />
          <span className="text-lg font-bold tracking-tight">Barbear.IA</span>
        </Link>
        <div className="mt-4 space-y-1.5">
          <p className="text-[11px] uppercase tracking-wide text-white/50">
            Barbearia
          </p>
          <p className="text-sm font-semibold truncate">
            {isLoading ? 'Carregando...' : barbearia?.nome ?? 'Sua barbearia'}
          </p>
          {barbearia && (
            <Badge
              className={cn(
                'border-transparent text-[10px] uppercase tracking-wide',
                PLANO_VARIANT[plano],
              )}
            >
              {PLANOS[plano]?.nome ?? 'Trial'}
            </Badge>
          )}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-brand-light text-white'
                  : 'text-white/70 hover:bg-brand-light hover:text-white',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="mb-3 px-3 flex items-center gap-1.5 text-[10px] tracking-[0.12em] text-white/50">
          <span className="normal-case tracking-normal">by</span>
          <span className="font-bold text-xs tracking-[0.16em] text-white/85">SPICTUR</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-white/70 hover:bg-brand-light hover:text-white"
        >
          <LogOut className="size-4" />
          {isPending ? 'Saindo...' : 'Sair'}
        </Button>
      </div>
    </aside>
  )
}
