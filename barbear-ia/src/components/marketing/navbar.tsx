'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const LINKS = [
  { href: '/#funcionalidades', label: 'Funcionalidades' },
  { href: '/#precos', label: 'Preços' },
  { href: '/#faq', label: 'FAQ' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all',
        scrolled
          ? 'bg-white/80 backdrop-blur-md border-b border-brand-100/60'
          : 'bg-transparent',
      )}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/">
          <Image
            src="/logomarca barbear.ia.png"
            alt="Barbear.IA"
            width={130}
            height={36}
            className="rounded"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-slate-600 hover:text-brand px-3 py-2 rounded-md transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" render={<Link href="/login" />}>
            Entrar
          </Button>
          <Button
            size="sm"
            className="bg-brand hover:bg-brand-light text-white"
            render={<Link href="/cadastro" />}
          >
            Começar grátis
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
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
          <SheetContent side="right" className="w-72">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <div className="flex flex-col h-full">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="mb-6 inline-block"
              >
                <Image
                  src="/logomarca barbear.ia.png"
                  alt="Barbear.IA"
                  width={130}
                  height={36}
                  className="rounded"
                />
              </Link>
              <nav className="flex flex-col gap-1">
                {LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="text-sm font-medium text-slate-700 hover:text-brand px-3 py-2.5 rounded-md hover:bg-brand-50 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-2">
                <Button
                  variant="outline"
                  size="lg"
                  render={
                    <Link href="/login" onClick={() => setOpen(false)} />
                  }
                >
                  Entrar
                </Button>
                <Button
                  size="lg"
                  className="bg-brand hover:bg-brand-light text-white"
                  render={
                    <Link href="/cadastro" onClick={() => setOpen(false)} />
                  }
                >
                  Começar grátis
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
