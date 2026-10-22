import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-3 text-white">
        <Image
          src="/barbear-ia-logo-branca.svg"
          alt="Barbear.IA"
          width={176}
          height={131}
          className="h-auto w-44"
          priority
        />
      </Link>
      {children}
      <div className="mt-7 flex items-center justify-center gap-1.5 text-xs text-white/50">
        <span>by</span>
        <Image src="/spictur-principal-branco-mostarda.svg" alt="Spictur" width={112} height={26} className="h-[26px] w-auto" />
      </div>
      <p className="mt-3 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Barbear.IA — Recepcionista digital para barbearias.
      </p>
    </div>
  )
}
