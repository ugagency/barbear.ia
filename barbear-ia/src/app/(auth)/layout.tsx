import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-3 text-white">
        <span aria-label="Barbear.IA" role="img" className="relative block h-[126px] w-[176px] overflow-hidden">
          <Image
            src="/logomarca barbear.ia.png"
            alt=""
            width={1536}
            height={2048}
            className="pointer-events-none absolute left-1/2 top-1/2 h-[494px] w-[371px] max-w-none -translate-x-1/2 -translate-y-1/2 brightness-0 invert"
            priority
          />
        </span>
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
