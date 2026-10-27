'use server'

import { after } from 'next/server'
import { syncShopSafely } from '@/lib/google-calendar/sync'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { FormaPagamento, StatusAgendamento } from '@/types'

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

type Context =
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; barbeariaId: string }
  | { ok: false; error: string }

async function getContext(): Promise<Context> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Sessão expirada.' }

  const { data: vinculo } = await supabase
    .from('usuarios_barbearias')
    .select('barbearia_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!vinculo) return { ok: false, error: 'Barbearia não encontrada.' }
  return { ok: true, supabase, barbeariaId: vinculo.barbearia_id as string }
}

export interface CriarAgendamentoInput {
  cliente_id?: string
  novo_cliente?: { nome: string; telefone: string }
  barbeiro_id: string
  servico: string
  valor: number
  duracao_min: number
  inicio_at: string // ISO
  forma_pagamento: FormaPagamento
  observacoes?: string
}

export async function criarAgendamento(
  input: CriarAgendamentoInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }
  const { supabase, barbeariaId } = ctx

  let clienteId = input.cliente_id

  if (!clienteId && input.novo_cliente) {
    const telefone = input.novo_cliente.telefone.replace(/\D/g, '')
    const { data: existente } = await supabase
      .from('clientes')
      .select('id')
      .eq('barbearia_id', barbeariaId)
      .eq('telefone', telefone)
      .maybeSingle()

    if (existente) {
      clienteId = existente.id as string
    } else {
      const { data: novoCliente, error: clienteErr } = await supabase
        .from('clientes')
        .insert({
          barbearia_id: barbeariaId,
          nome: input.novo_cliente.nome,
          telefone,
          ativo: true,
        })
        .select('id')
        .single()
      if (clienteErr || !novoCliente) {
        return {
          success: false,
          error: clienteErr?.message ?? 'Erro ao criar cliente.',
        }
      }
      clienteId = novoCliente.id as string
    }
  }

  if (!clienteId) {
    return { success: false, error: 'Selecione ou cadastre um cliente.' }
  }

  const inicio = new Date(input.inicio_at)
  const fim = new Date(inicio.getTime() + input.duracao_min * 60_000)

  const { data, error } = await supabase
    .from('agendamentos')
    .insert({
      barbearia_id: barbeariaId,
      barbeiro_id: input.barbeiro_id,
      cliente_id: clienteId,
      servico: input.servico,
      valor: input.valor,
      duracao_min: input.duracao_min,
      inicio_at: inicio.toISOString(),
      fim_at: fim.toISOString(),
      forma_pagamento: input.forma_pagamento,
      observacoes: input.observacoes || null,
      criado_por: 'manual',
      status: 'agendado',
    })
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao criar agendamento.' }
  }

  after(() => syncShopSafely(ctx.barbeariaId))
  revalidatePath('/agenda')
  return { success: true, data: { id: data.id as string } }
}

export interface EditarAgendamentoInput {
  status?: StatusAgendamento
  servico?: string
  valor?: number
  duracao_min?: number
  inicio_at?: string
  forma_pagamento?: FormaPagamento
  observacoes?: string | null
}

export async function editarAgendamento(
  id: string,
  input: EditarAgendamentoInput,
): Promise<ActionResult> {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }
  const { supabase } = ctx

  const update: Record<string, unknown> = {}
  if (input.status !== undefined) update.status = input.status
  if (input.servico !== undefined) update.servico = input.servico
  if (input.valor !== undefined) update.valor = input.valor
  if (input.forma_pagamento !== undefined)
    update.forma_pagamento = input.forma_pagamento
  if (input.observacoes !== undefined) update.observacoes = input.observacoes

  if (input.inicio_at !== undefined || input.duracao_min !== undefined) {
    const { data: atual } = await supabase
      .from('agendamentos')
      .select('inicio_at, duracao_min')
      .eq('id', id)
      .single()
    if (!atual) return { success: false, error: 'Agendamento não encontrado.' }
    const inicio = new Date(input.inicio_at ?? (atual.inicio_at as string))
    const duracao = input.duracao_min ?? (atual.duracao_min as number)
    update.inicio_at = inicio.toISOString()
    update.fim_at = new Date(inicio.getTime() + duracao * 60_000).toISOString()
    update.duracao_min = duracao
  }

  const { error } = await supabase
    .from('agendamentos')
    .update(update)
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  after(() => syncShopSafely(ctx.barbeariaId))
  revalidatePath('/agenda')
  return { success: true }
}

export async function cancelarAgendamento(id: string): Promise<ActionResult> {
  return editarAgendamento(id, { status: 'cancelado' })
}

export async function confirmarAgendamento(id: string): Promise<ActionResult> {
  return editarAgendamento(id, { status: 'confirmado' })
}

export async function concluirAgendamento(id: string): Promise<ActionResult> {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }
  const { supabase } = ctx

  const { data: ag, error: fetchErr } = await supabase
    .from('agendamentos')
    .select('cliente_id, inicio_at')
    .eq('id', id)
    .single()

  if (fetchErr || !ag) {
    return { success: false, error: fetchErr?.message ?? 'Agendamento não encontrado.' }
  }

  const { error } = await supabase
    .from('agendamentos')
    .update({ status: 'concluido' })
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  const { data: cliente } = await supabase
    .from('clientes')
    .select('total_atendimentos')
    .eq('id', ag.cliente_id as string)
    .single()

  await supabase
    .from('clientes')
    .update({
      ultimo_atendimento: ag.inicio_at as string,
      total_atendimentos:
        ((cliente?.total_atendimentos as number | undefined) ?? 0) + 1,
    })
    .eq('id', ag.cliente_id as string)

  after(() => syncShopSafely(ctx.barbeariaId))
  revalidatePath('/agenda')
  return { success: true }
}

export async function buscarClientes(termo: string) {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error } as const
  const { supabase, barbeariaId } = ctx

  const t = termo.trim()
  let query = supabase
    .from('clientes')
    .select('id, nome, telefone')
    .eq('barbearia_id', barbeariaId)
    .eq('ativo', true)
    .order('updated_at', { ascending: false })
    .limit(20)

  if (t.length > 0) {
    const digits = t.replace(/\D/g, '')
    if (digits.length >= 3) {
      query = query.ilike('telefone', `%${digits}%`)
    } else {
      query = query.ilike('nome', `%${t}%`)
    }
  }

  const { data, error } = await query
  if (error) return { success: false, error: error.message } as const
  return {
    success: true,
    data: (data ?? []) as { id: string; nome: string | null; telefone: string }[],
  } as const
}
