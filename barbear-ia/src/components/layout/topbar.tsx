'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { Menu, Settings, LogOut, ChevronDown } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useBarbearia, clearBarbeariaCache } from '@/hooks/use-barbearia'
import { createClient } from '@/lib/supabase/client'
import { signOut } from '@/app/(auth)/actions'
import { Sidebar } from './sidebar'

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?'
}

export function Topbar() {
  const router = useRouter()
  const { barbearia } = useBarbearia()
  const [userLabel, setUserLabel] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled || !user) return
      const meta = user.user_metadata as { nome?: string } | undefined
      setUserLabel(meta?.nome ?? user.email ?? '')
    })
    return () => {
      cancelled = true
    }
  }, [])

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

  return (
    <header className="flex h-14 items-center justify-between border-b border-brand-100 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3 min-w-0">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                className="md:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="size-4" />
              </Button>
            }
          />
          <SheetContent side="left" className="w-64 p-0 bg-brand text-white">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <Sidebar
              className="flex w-full"
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="hidden md:block min-w-0">
          <p className="text-xs text-slate-500">Painel</p>
          <p className="text-sm font-semibold text-brand truncate">
            {barbearia?.nome ?? 'Barbear.IA'}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="sm" className="gap-2">
              <Avatar size="sm">
                <AvatarFallback className="bg-brand text-white text-xs">
                  {initials(userLabel || 'U')}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline text-sm text-slate-700 max-w-[160px] truncate">
                {userLabel || 'Usuário'}
              </span>
              <ChevronDown className="size-3.5 text-slate-400" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem
            render={
              <Link href="/configuracoes">
                <Settings className="size-4" />
                Configurações
              </Link>
            }
          />
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={isPending}
            onClick={handleLogout}
            className="text-red-600"
          >
            <LogOut className="size-4" />
            {isPending ? 'Saindo...' : 'Sair'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
