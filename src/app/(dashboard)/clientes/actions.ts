'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

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

export async function reativarCliente(id: string): Promise<ActionResult> {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }
  const { error } = await ctx.supabase
    .from('clientes')
    .update({ ativo: true })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}

export interface EditarClienteInput {
  nome: string
  telefone: string
}

export async function editarCliente(
  id: string,
  input: EditarClienteInput,
): Promise<ActionResult> {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }
  const telefone = input.telefone.replace(/\D/g, '')
  if (telefone.length < 10) {
    return { success: false, error: 'Telefone inválido.' }
  }
  if (input.nome.trim().length < 2) {
    return { success: false, error: 'Nome inválido.' }
  }
  const { error } = await ctx.supabase
    .from('clientes')
    .update({ nome: input.nome.trim(), telefone })
    .eq('id', id)
  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        error: 'Já existe um cliente com este telefone.',
      }
    }
    return { success: false, error: error.message }
  }
  revalidatePath('/clientes')
  revalidatePath(`/clientes/${id}`)
  return { success: true }
}

export interface CriarClienteInput {
  nome: string
  telefone: string
}

export async function criarCliente(
  input: CriarClienteInput,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }
  const telefone = input.telefone.replace(/\D/g, '')
  if (telefone.length < 10) {
    return { success: false, error: 'Telefone inválido.' }
  }
  if (input.nome.trim().length < 2) {
    return { success: false, error: 'Nome inválido.' }
  }
  const { data, error } = await ctx.supabase
    .from('clientes')
    .insert({
      barbearia_id: ctx.barbeariaId,
      nome: input.nome.trim(),
      telefone,
      ativo: true,
    })
    .select('id')
    .single()
  if (error) {
    if (error.code === '23505') {
      return {
        success: false,
        error: 'Já existe um cliente com este telefone.',
      }
    }
    return { success: false, error: error.message }
  }
  revalidatePath('/clientes')
  return { success: true, data: { id: data.id as string } }
}
