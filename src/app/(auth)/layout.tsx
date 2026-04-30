import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-3 text-white">
        <Image
          src="/logomarca barbear.ia.png"
          alt="Barbear.IA"
          width={48}
          height={48}
          className="rounded-md bg-white/5"
          priority
        />
        <span className="text-2xl font-bold tracking-tight">Barbear.IA</span>
      </Link>
      {children}
      <p className="mt-6 text-center text-xs text-white/60">
        © {new Date().getFullYear()} Barbear.IA — Recepcionista digital para barbearias.
      </p>
    </div>
  )
}
