import Link from 'next/link'
export default function CadastroPage() {
  return <div className="w-full max-w-md space-y-4 rounded-2xl bg-white p-8 text-center shadow-xl">
    <h1 className="text-xl font-bold text-brand">Cadastro por convite</h1>
    <p className="text-sm text-slate-600">O cadastro e a configuração da barbearia são realizados pela equipe Barbear.IA. Solicite seu acesso ao responsável pela implantação.</p>
    <Link href="/login" className="inline-block text-sm font-semibold text-brand underline">Voltar ao login</Link>
  </div>
}
