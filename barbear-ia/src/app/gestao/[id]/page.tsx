import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { EditarBarbeariaForm, ConvidarResponsavelForm } from './forms'

export default async function Detalhe({ params }: { params: Promise<{id: string}> }) {
  const { id } = await params
  const { data: b } = await supabaseAdmin.from('barbearias').select('id,nome,slug,telefone,email,logo_url,plano,plano_status').eq('id',id).maybeSingle()
  if (!b) notFound()
  const { data: people } = await supabaseAdmin.from('usuarios_barbearias').select('user_id,role').eq('barbearia_id',id)
  return <div className="space-y-6">
    <Link href="/gestao" className="text-sm text-slate-500 hover:underline">← Todas as barbearias</Link>
    <div className="flex items-center gap-4">
      {b.logo_url ? <Image src={b.logo_url} alt="" width={64} height={64} unoptimized className="size-16 rounded-xl border bg-white p-2 object-contain"/> : <div className="flex size-16 items-center justify-center rounded-xl bg-slate-200 text-2xl font-bold">{b.nome[0]}</div>}
      <div><h1 className="text-2xl font-bold">{b.nome}</h1><a className="text-sm text-blue-700 hover:underline" target="_blank" href={`/agendar/${b.slug}`}>/agendar/{b.slug}</a></div>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <EditarBarbeariaForm barbearia={b}/>
      <div className="space-y-5">
        <ConvidarResponsavelForm id={b.id}/>
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="font-semibold">Acessos vinculados</h2>
          <p className="mt-1 text-xs text-slate-500">{(people ?? []).length} usuário(s) vinculados</p>
          <div className="mt-3 space-y-2">{(people ?? []).map(p => <p key={p.user_id} className="rounded bg-slate-50 p-2 text-xs text-slate-700">{p.role} · {p.user_id}</p>)}</div>
        </section>
      </div>
    </div>
  </div>
}
