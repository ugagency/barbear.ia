'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { cadastrarBarbearia } from '../actions'

export function NovaBarbeariaForm() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  return <div className="mx-auto max-w-2xl space-y-6">
    <div><Link href="/gestao" className="text-sm text-slate-500 hover:underline">← Voltar</Link><h1 className="mt-3 text-2xl font-bold">Cadastrar barbearia</h1><p className="text-sm text-slate-500">A equipe configura a operação antes de convidar o cliente.</p></div>
    <form className="space-y-5 rounded-xl border border-slate-200 bg-white p-6" onSubmit={e => {
      e.preventDefault()
      const f = new FormData(e.currentTarget)
      setError('')
      start(async () => {
        const r = await cadastrarBarbearia({ nome: String(f.get('nome') ?? ''), telefone: String(f.get('telefone') ?? ''), email: String(f.get('email') ?? ''), barbeiro: String(f.get('barbeiro') ?? ''), telefoneBarbeiro: String(f.get('telefoneBarbeiro') ?? '') })
        if (!r.success) return setError(r.error ?? 'Erro inesperado.')
        router.push(`/gestao/${r.id}`)
        router.refresh()
      })
    }}>
      <h2 className="font-semibold text-slate-800">Dados da barbearia</h2>
      {([['nome','Nome da barbearia','text',true],['telefone','WhatsApp principal','tel',true],['email','Email de contato','email',false],['barbeiro','Primeiro barbeiro','text',true],['telefoneBarbeiro','WhatsApp do barbeiro','tel',false]] as const).map(([name,label,type,required]) => (
        <label key={name} className="block space-y-1.5 text-sm font-medium text-slate-700">{label}<input name={name} type={type} required={required} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-slate-800" /></label>
      ))}
      <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Após criar, configure o funcionamento, os profissionais, os serviços, os bloqueios e as regras aqui na gestão antes de compartilhar a agenda.</p>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={pending} className="w-full rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white disabled:opacity-50">{pending ? 'Cadastrando...' : 'Cadastrar e continuar'}</button>
    </form>
  </div>
}
