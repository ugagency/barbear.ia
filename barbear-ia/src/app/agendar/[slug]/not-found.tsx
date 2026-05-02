import Link from 'next/link'

export default function NotFoundAgendar() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-5 rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
        <div className="text-5xl">💈</div>
        <h1 className="text-2xl font-bold text-brand">
          Barbearia não encontrada
        </h1>
        <p className="text-sm text-slate-600 leading-relaxed">
          Verifique o link e tente novamente. Se você é o dono, acesse o
          dashboard para conferir suas configurações.
        </p>
        <Link
          href="/"
          className="inline-block rounded-lg bg-brand text-white px-5 py-2.5 text-sm font-medium hover:bg-brand-light transition"
        >
          Voltar para o início
        </Link>
      </div>
    </div>
  )
}
