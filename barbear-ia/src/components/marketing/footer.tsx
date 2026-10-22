import Image from 'next/image'
import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-brand-100 bg-white mt-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <Link href="/">
            <Image
              src="/logomarca barbear.ia.png"
              alt="Barbear.IA"
              width={130}
              height={36}
              className="rounded"
            />
          </Link>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/#funcionalidades" className="hover:text-brand">
              Funcionalidades
            </Link>
            <Link href="/pricing" className="hover:text-brand">
              Preços
            </Link>
            <Link href="/#faq" className="hover:text-brand">
              FAQ
            </Link>
            <Link href="/login" className="hover:text-brand">
              Entrar
            </Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-brand-100/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>© {new Date().getFullYear()} Barbear.IA · Todos os direitos reservados.</p>
            <span className="text-slate-300" aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1.5">
              <span>by</span>
              <Image src="/spictur-principal-preto-mostarda.svg" alt="Spictur" width={112} height={26} className="h-[26px] w-auto" />
            </span>
          </div>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-brand">
              Política de privacidade
            </Link>
            <Link href="#" className="hover:text-brand">
              Termos de uso
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
