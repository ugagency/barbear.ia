import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createAnonClient } from '@/lib/supabase/anon'
import { AgendamentoPublicoClient } from './agendamento-publico-client'
import type { Bloqueio, HorarioFixo, Servico } from '@/types'

export interface BarbeariaPublica {
  id: string
  nome: string
  slug: string
  logo_url: string | null
}

export interface BarbeiroPublico {
  id: string
  nome: string
  servicos: Servico[]
  horarios: Record<string, { inicio: string; fim: string }>
  bloqueios: Bloqueio[]
  horarios_fixos: HorarioFixo[]
}

async function getBarbeariaBySlug(slug: string): Promise<BarbeariaPublica | null> {
  const supabase = createAnonClient()
  const { data } = await supabase
    .from('barbearias')
    .select('id, nome, slug, logo_url')
    .eq('slug', slug)
    .eq('plano_status', 'ativo')
    .maybeSingle()
  return (data as BarbeariaPublica | null) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const barbearia = await getBarbeariaBySlug(slug)
  if (!barbearia) {
    return { title: 'Barbearia não encontrada — Barbear.IA' }
  }
  return {
    title: `Agendar horário — ${barbearia.nome}`,
    description: `Agende seu horário na ${barbearia.nome} de forma rápida e fácil. Escolha o serviço, barbeiro e horário disponível.`,
  }
}

export default async function AgendarPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const barbearia = await getBarbeariaBySlug(slug)
  if (!barbearia) notFound()

  const supabase = createAnonClient()
  const { data: barbeirosData } = await supabase
    .from('barbeiros')
    .select('id, nome, servicos, horarios, bloqueios, horarios_fixos')
    .eq('barbearia_id', barbearia.id)
    .eq('ativo', true)
    .order('nome', { ascending: true })

  const barbeiros = (barbeirosData ?? []) as BarbeiroPublico[]

  if (barbeiros.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center space-y-4 rounded-2xl bg-white border border-slate-200 p-8 shadow-sm">
          <div className="text-4xl">💈</div>
          <h1 className="text-xl font-bold text-brand">{barbearia.nome}</h1>
          <p className="text-sm text-slate-600">
            Esta barbearia ainda não tem barbeiros disponíveis para
            agendamento online. Tente novamente mais tarde.
          </p>
        </div>
      </div>
    )
  }

  return <AgendamentoPublicoClient barbearia={barbearia} barbeiros={barbeiros} />
}
