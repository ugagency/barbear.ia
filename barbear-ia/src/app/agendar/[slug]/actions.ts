'use server'

import { z } from 'zod'
import { createAnonClient } from '@/lib/supabase/anon'

type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string }

const confirmarSchema = z.object({
  barbearia_id: z.string().uuid(),
  barbeiro_id: z.string().uuid(),
  servico: z.string().min(1),
  preco: z.number().min(0),
  duracao_min: z.number().int().min(5),
  inicio_iso: z.string().min(10),
  cliente_nome: z.string().min(2, 'Informe seu nome completo').max(120),
  cliente_telefone: z
    .string()
    .regex(/^\d{10,11}$/, 'WhatsApp inválido (10 ou 11 dígitos com DDD)'),
})

export type ConfirmarInput = z.infer<typeof confirmarSchema>

export async function buscarSlotsOcupados(
  barbeariaId: string,
  barbeiroId: string,
  diaIso: string,
): Promise<ActionResult<Array<{ inicio_at: string; fim_at: string }>>> {
  const supabase = createAnonClient()

  const inicioDia = new Date(diaIso)
  inicioDia.setHours(0, 0, 0, 0)
  const fimDia = new Date(diaIso)
  fimDia.setHours(23, 59, 59, 999)

  const { data, error } = await supabase
    .from('agendamentos')
    .select('inicio_at, fim_at')
    .eq('barbearia_id', barbeariaId)
    .eq('barbeiro_id', barbeiroId)
    .neq('status', 'cancelado')
    .gte('inicio_at', inicioDia.toISOString())
    .lte('inicio_at', fimDia.toISOString())

  if (error) return { success: false, error: error.message }

  const ocupacoes = (data ?? []) as Array<{ inicio_at: string; fim_at: string }>
  return { success: true, data: ocupacoes }
}

export async function confirmarAgendamentoPublico(
  input: ConfirmarInput,
): Promise<ActionResult<{ agendamento_id: string }>> {
  const parsed = confirmarSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'Dados inválidos.',
    }
  }
  const v = parsed.data

  const supabase = createAnonClient()

  const inicio = new Date(v.inicio_iso)
  if (Number.isNaN(inicio.getTime())) {
    return { success: false, error: 'Data inválida.' }
  }
  if (inicio <= new Date()) {
    return { success: false, error: 'Escolha um horário futuro.' }
  }
  const fim = new Date(inicio.getTime() + v.duracao_min * 60_000)

  // Double-check de disponibilidade — busca conflitos
  const { data: conflitos, error: conflitosErr } = await supabase
    .from('agendamentos')
    .select('id')
    .eq('barbearia_id', v.barbearia_id)
    .eq('barbeiro_id', v.barbeiro_id)
    .neq('status', 'cancelado')
    .lt('inicio_at', fim.toISOString())
    .gt('fim_at', inicio.toISOString())
    .limit(1)

  if (conflitosErr) return { success: false, error: conflitosErr.message }
  if (conflitos && conflitos.length > 0) {
    return {
      success: false,
      error:
        'Esse horário acabou de ser reservado. Por favor, escolha outro horário.',
    }
  }

  // Busca ou cria cliente por (barbearia_id, telefone)
  const { data: clienteExistente } = await supabase
    .from('clientes')
    .select('id, nome')
    .eq('barbearia_id', v.barbearia_id)
    .eq('telefone', v.cliente_telefone)
    .maybeSingle()

  let clienteId: string
  if (clienteExistente) {
    clienteId = (clienteExistente as { id: string }).id
  } else {
    const { data: novoCliente, error: clienteErr } = await supabase
      .from('clientes')
      .insert({
        barbearia_id: v.barbearia_id,
        telefone: v.cliente_telefone,
        nome: v.cliente_nome.trim(),
      })
      .select('id')
      .single()

    if (clienteErr || !novoCliente) {
      return {
        success: false,
        error: clienteErr?.message ?? 'Não foi possível criar seu cadastro.',
      }
    }
    clienteId = (novoCliente as { id: string }).id
  }

  // INSERT agendamento
  const { data: novoAg, error: agErr } = await supabase
    .from('agendamentos')
    .insert({
      barbearia_id: v.barbearia_id,
      barbeiro_id: v.barbeiro_id,
      cliente_id: clienteId,
      servico: v.servico,
      valor: v.preco,
      duracao_min: v.duracao_min,
      inicio_at: inicio.toISOString(),
      fim_at: fim.toISOString(),
      status: 'agendado',
      forma_pagamento: 'a_definir',
      criado_por: 'cliente_web',
    })
    .select('id')
    .single()

  if (agErr || !novoAg) {
    return {
      success: false,
      error: agErr?.message ?? 'Não foi possível criar o agendamento.',
    }
  }

  return { success: true, data: { agendamento_id: (novoAg as { id: string }).id } }
}
