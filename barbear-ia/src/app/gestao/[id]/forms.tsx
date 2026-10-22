'use client'
import { useState, useTransition } from 'react'
import { atualizarBarbearia, convidarResponsavel } from '../actions'

export function EditarBarbeariaForm({ barbearia }: { barbearia: {id:string; nome:string; telefone:string|null;email:string|null;plano:string;plano_status:string} }) {
  const [pending,start] = useTransition()
  const [message,setMessage]=useState('')
  return <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" onSubmit={e=>{
    e.preventDefault()
    const f=new FormData(e.currentTarget)
    start(async()=>{
      const r=await atualizarBarbearia({id:barbearia.id,nome:String(f.get('nome')??''),telefone:String(f.get('telefone')??''),email:String(f.get('email')??''),plano:String(f.get('plano')) as 'trial'|'starter'|'pro',plano_status:String(f.get('plano_status')) as 'ativo'|'inadimplente'|'cancelado'})
      setMessage(r.success?'Dados atualizados.':r.error??'Erro.')
    })
  }}>
    <h2 className="text-lg font-semibold">Dados e assinatura</h2>
    {([['nome','Nome',barbearia.nome],['telefone','Telefone',barbearia.telefone??''],['email','Email',barbearia.email??'']] as const).map(([n,l,v])=><label key={n} className="block text-sm font-medium">{l}<input name={n} defaultValue={v} className="mt-1 w-full rounded-lg border px-3 py-2"/></label>)}
    <label className="block text-sm font-medium">Plano<select name="plano" defaultValue={barbearia.plano} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="trial">Trial</option><option value="starter">Starter</option><option value="pro">Pro</option></select></label>
    <label className="block text-sm font-medium">Status<select name="plano_status" defaultValue={barbearia.plano_status} className="mt-1 w-full rounded-lg border px-3 py-2"><option value="ativo">Ativo</option><option value="inadimplente">Inadimplente</option><option value="cancelado">Cancelado</option></select></label>
    {message&&<p className="text-sm text-slate-700" role="status">{message}</p>}
    <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Salvar alterações</button>
  </form>
}
export function ConvidarResponsavelForm({id}:{id:string}) {
  const [pending,start]=useTransition()
  const [message,setMessage]=useState('')
  return <form className="space-y-4 rounded-xl border border-slate-200 bg-white p-5" onSubmit={e=>{
    e.preventDefault()
    const email=String(new FormData(e.currentTarget).get('email')??'')
    start(async()=>{const r=await convidarResponsavel({id,email});setMessage(r.success?'Convite enviado e acesso vinculado.':r.error??'Erro.')})
  }}>
    <h2 className="text-lg font-semibold">Liberar acesso ao responsável</h2>
    <p className="text-sm text-slate-500">Quando a configuração estiver pronta, envie um convite de acesso ao cliente.</p>
    <label className="block text-sm font-medium">Email do responsável<input required type="email" name="email" className="mt-1 w-full rounded-lg border px-3 py-2"/></label>
    {message&&<p role="status" className="text-sm text-slate-700">{message}</p>}
    <button disabled={pending} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Enviar convite</button>
  </form>
}
