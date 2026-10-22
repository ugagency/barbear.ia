import Image from 'next/image'
import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase/admin'

export default async function GestaoPage() {
  const { data, error } = await supabaseAdmin
    .from('barbearias')
    .select('id, nome, slug, logo_url, telefone, plano, plano_status, created_at')
    .order('created_at', { ascending: false })
  if (error) return <p className="text-red-700">Não foi possível consultar as barbearias.</p>
  const barbearias = data ?? []
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900">Barbearias</h1><p className="text-sm text-slate-500">Gestão das operações cadastradas na plataforma.</p></div>
        <Link href="/gestao/nova" className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700">+ Nova barbearia</Link>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4 text-sm font-medium text-slate-600">{barbearias.length} barbearia(s) cadastrada(s)</div>
        {barbearias.map((b) => (
          <div key={b.id} className="flex flex-wrap items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-b-0">
            {b.logo_url ? <Image src={b.logo_url} alt="" width={48} height={48} unoptimized className="size-12 rounded-lg border object-contain p-1" /> : <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 font-bold text-slate-500">{b.nome.slice(0,1).toUpperCase()}</div>}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{b.nome}</p>
              <p className="text-xs text-slate-500">{b.telefone ?? 'Sem telefone'} · {b.slug}</p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">{b.plano} · {b.plano_status}</span>
            <Link className="text-sm font-medium text-blue-700 hover:underline" href={`/agendar/${b.slug}`} target="_blank">Página pública</Link>
            <Link className="text-sm font-medium text-slate-900 hover:underline" href={`/gestao/${b.id}`}>Gerenciar</Link>
          </div>
        ))}
        {barbearias.length === 0 && <p className="p-8 text-center text-sm text-slate-500">Nenhuma barbearia cadastrada.</p>}
      </div>
    </div>
  )
}
