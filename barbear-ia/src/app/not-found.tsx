import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center text-center">
      <h2 className="text-3xl font-bold">404 - Página não encontrada</h2>
      <p className="mt-2 text-muted-foreground">Não conseguimos encontrar o recurso solicitado.</p>
      <Link href="/" className="mt-4 text-blue-500 hover:underline">
        Voltar ao Início
      </Link>
    </div>
  )
}
