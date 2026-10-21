'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { configurarWebhookESettings } from '@/lib/evolution'
import type { Bloqueio, HorarioFixo, Servico } from '@/types'

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
    .select('barbearia_id, role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (!vinculo) return { ok: false, error: 'Barbearia não encontrada.' }
  return {
    ok: true,
    supabase,
    barbeariaId: vinculo.barbearia_id as string,
  }
}

// ============================================
// Aba Barbearia
// ============================================

const barbeariaSchema = z.object({
  nome: z.string().min(2, 'Nome inválido'),
  telefone: z.string().min(10, 'Telefone inválido').max(20),
  email: z.string().email('Email inválido').or(z.literal('')).optional(),
})

export async function atualizarBarbearia(
  input: z.infer<typeof barbeariaSchema>,
): Promise<ActionResult> {
  const parsed = barbeariaSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }

  const { error } = await ctx.supabase
    .from('barbearias')
    .update({
      nome: parsed.data.nome.trim(),
      telefone: parsed.data.telefone.replace(/\s/g, ''),
      email: parsed.data.email || null,
    })
    .eq('id', ctx.barbeariaId)

  if (error) return { success: false, error: error.message }
  revalidatePath('/configuracoes')
  revalidatePath('/', 'layout')
  return { success: true }
}

const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
const MAX_LOGO_BYTES = 2 * 1024 * 1024

export async function uploadLogo(formData: FormData): Promise<ActionResult<{ url: string }>> {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return { success: false, error: 'Arquivo inválido.' }
  }
  if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
    return { success: false, error: 'Apenas PNG, JPG ou WebP.' }
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { success: false, error: 'Arquivo maior que 2MB.' }
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${ctx.barbeariaId}/logo.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadErr } = await supabaseAdmin.storage
    .from('logos')
    .upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    })

  if (uploadErr) {
    if (uploadErr.message.toLowerCase().includes('bucket')) {
      return {
        success: false,
        error: 'Bucket "logos" não existe. Crie-o no Supabase Storage.',
      }
    }
    return { success: false, error: uploadErr.message }
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from('logos').getPublicUrl(path)
  const url = `${publicUrl}?v=${Date.now()}`

  const { error } = await ctx.supabase
    .from('barbearias')
    .update({ logo_url: url })
    .eq('id', ctx.barbeariaId)
  if (error) return { success: false, error: error.message }

  revalidatePath('/configuracoes')
  revalidatePath('/', 'layout')
  return { success: true, data: { url } }
}

// ============================================
// Aba Barbeiros
// ============================================

const servicoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  preco: z.number().min(0, 'Preço inválido'),
  duracao_min: z.number().int().min(5, 'Duração mínima 5 min'),
})

const barbeiroBaseSchema = z.object({
  nome: z.string().min(2, 'Nome inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  calendar_id: z.string().optional().or(z.literal('')),
  servicos: z.array(servicoSchema).min(1, 'Adicione ao menos 1 serviço'),
  ativo: z.boolean(),
})

export async function criarBarbeiro(
  input: z.infer<typeof barbeiroBaseSchema>,
): Promise<ActionResult<{ id: string }>> {
  const parsed = barbeiroBaseSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }

  const { data, error } = await ctx.supabase
    .from('barbeiros')
    .insert({
      barbearia_id: ctx.barbeariaId,
      nome: parsed.data.nome.trim(),
      telefone: parsed.data.telefone.replace(/\D/g, ''),
      calendar_id: parsed.data.calendar_id || null,
      servicos: parsed.data.servicos,
      ativo: parsed.data.ativo,
    })
    .select('id')
    .single()

  if (error || !data) {
    return { success: false, error: error?.message ?? 'Erro ao criar barbeiro.' }
  }
  revalidatePath('/configuracoes')
  return { success: true, data: { id: data.id as string } }
}

export async function atualizarBarbeiro(
  id: string,
  input: z.infer<typeof barbeiroBaseSchema>,
): Promise<ActionResult> {
  const parsed = barbeiroBaseSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }

  const { error } = await ctx.supabase
    .from('barbeiros')
    .update({
      nome: parsed.data.nome.trim(),
      telefone: parsed.data.telefone.replace(/\D/g, ''),
      calendar_id: parsed.data.calendar_id || null,
      servicos: parsed.data.servicos,
      ativo: parsed.data.ativo,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/configuracoes')
  return { success: true }
}

export async function toggleAtivoBarbeiro(
  id: string,
  ativo: boolean,
): Promise<ActionResult> {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }
  const { error } = await ctx.supabase
    .from('barbeiros')
    .update({ ativo })
    .eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/configuracoes')
  return { success: true }
}

export async function removerBarbeiro(id: string): Promise<ActionResult> {
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }

  const agora = new Date().toISOString()
  const { count } = await ctx.supabase
    .from('agendamentos')
    .select('id', { count: 'exact', head: true })
    .eq('barbeiro_id', id)
    .gte('inicio_at', agora)
    .neq('status', 'cancelado')

  if (count && count > 0) {
    return {
      success: false,
      error: 'Este barbeiro tem agendamentos futuros. Cancele-os primeiro.',
    }
  }

  const { error } = await ctx.supabase.from('barbeiros').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/configuracoes')
  return { success: true }
}

// ============================================
// Aba Horários
// ============================================

const horarioDiaSchema = z.object({
  ativo: z.boolean(),
  inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
  fim: z.string().regex(/^\d{2}:\d{2}$/, 'Formato HH:MM'),
})

const bloqueioSchema = z.object({
  dia_semana: z.string().min(1),
  inicio: z.string().regex(/^\d{2}:\d{2}$/),
  fim: z.string().regex(/^\d{2}:\d{2}$/),
  motivo: z.string().min(1),
})

const horarioFixoSchema = z.object({
  dia_semana: z.string().min(1),
  inicio: z.string().regex(/^\d{2}:\d{2}$/),
  fim: z.string().regex(/^\d{2}:\d{2}$/),
  cliente: z.string().min(1),
})

const horariosSchema = z.object({
  horarios: z.record(z.string(), horarioDiaSchema),
  bloqueios: z.array(bloqueioSchema),
  horarios_fixos: z.array(horarioFixoSchema),
})

export type AtualizarHorariosInput = {
  horarios: Record<string, { ativo: boolean; inicio: string; fim: string }>
  bloqueios: Bloqueio[]
  horarios_fixos: HorarioFixo[]
}

export async function atualizarHorariosBarbeiro(
  id: string,
  input: AtualizarHorariosInput,
): Promise<ActionResult> {
  const parsed = horariosSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Dados inválidos.' }
  }
  const ctx = await getContext()
  if (!ctx.ok) return { success: false, error: ctx.error }

  // Apenas dias ativos vão para horarios; demais omitidos
  const horariosOut: Record<string, { inicio: string; fim: string }> = {}
  for (const [dia, h] of Object.entries(parsed.data.horarios)) {
    if (h.ativo) horariosOut[dia] = { inicio: h.inicio, fim: h.fim }
  }

  const { error } = await ctx.supabase
    .from('barbeiros')
    .update({
      horarios: horariosOut,
      bloqueios: parsed.data.bloqueios,
      horarios_fixos: parsed.data.horarios_fixos,
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/configuracoes')
  return { success: true }
}

// ============================================
// Aba WhatsApp — Evolution API
// ============================================

interface EvolutionConfig {
  url: string
  key: string
}

function getEvolutionConfig(): EvolutionConfig | null {
  const url = process.env.EVOLUTION_API_URL
  const key = process.env.EVOLUTION_API_KEY
  if (!url || !key) return null
  return { url: url.replace(/\/$/, ''), key }
}

export type WhatsAppStatus = 'open' | 'connecting' | 'close' | 'unknown'

interface EvolutionInstance {
  id?: string
  name?: string
  instanceName?: string
  connectionStatus?: string
}

function normalizeStatus(raw: string | undefined): WhatsAppStatus {
  if (raw === 'open' || raw === 'connecting' || raw === 'close') return raw
  return 'unknown'
}

async function fetchInstance(
  cfg: EvolutionConfig,
  instanceName: string,
): Promise<EvolutionInstance | null> {
  const res = await fetch(
    `${cfg.url}/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`,
    {
      headers: { apikey: cfg.key },
      cache: 'no-store',
    },
  )
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Evolution API: ${res.status}`)
  const json = (await res.json()) as EvolutionInstance[] | EvolutionInstance
  const list = Array.isArray(json) ? json : [json]
  return list[0] ?? null
}

export async function criarInstanciaEvolution(
  instanceName: string,
): Promise<ActionResult> {
  const cfg = getEvolutionConfig()
  if (!cfg) {
    return {
      success: false,
      error:
        'Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY.',
    }
  }
  try {
    const res = await fetch(`${cfg.url}/instance/create`, {
      method: 'POST',
      headers: {
        apikey: cfg.key,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        instanceName,
        integration: 'WHATSAPP-BAILEYS',
      }),
      cache: 'no-store',
    })

    const alreadyExists =
      res.status === 409 ||
      (!res.ok &&
        (await res
          .clone()
          .text()
          .then((t) => t.toLowerCase().includes('already'))
          .catch(() => false)))

    if (!res.ok && !alreadyExists) {
      return { success: false, error: `Evolution API: ${res.status}` }
    }

    await new Promise((resolve) => setTimeout(resolve, 1500))
    await configurarWebhookESettings(instanceName)
    return { success: true }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Falha ao criar instância.',
    }
  }
}

export async function verificarConexaoWhatsApp(
  instanceName: string,
): Promise<ActionResult<{ status: WhatsAppStatus }>> {
  const cfg = getEvolutionConfig()
  if (!cfg) {
    return {
      success: false,
      error:
        'Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY.',
    }
  }
  try {
    const instance = await fetchInstance(cfg, instanceName)
    if (!instance) return { success: true, data: { status: 'close' } }
    return {
      success: true,
      data: { status: normalizeStatus(instance.connectionStatus) },
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Falha ao verificar conexão.',
    }
  }
}

export async function reconectarWhatsApp(
  instanceName: string,
): Promise<ActionResult<{ qrcode?: string; status: WhatsAppStatus }>> {
  const cfg = getEvolutionConfig()
  if (!cfg) {
    return {
      success: false,
      error:
        'Evolution API não configurada. Defina EVOLUTION_API_URL e EVOLUTION_API_KEY.',
    }
  }
  try {
    const existing = await fetchInstance(cfg, instanceName)

    if (existing && existing.connectionStatus === 'open') {
      return { success: true, data: { status: 'open' } }
    }

    if (!existing) {
      const created = await criarInstanciaEvolution(instanceName)
      if (!created.success) return { success: false, error: created.error }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    const res = await fetch(
      `${cfg.url}/instance/connect/${encodeURIComponent(instanceName)}`,
      {
        method: 'GET',
        headers: { apikey: cfg.key },
        cache: 'no-store',
      },
    )
    if (!res.ok) {
      return { success: false, error: `Evolution API: ${res.status}` }
    }
    const json = (await res.json()) as {
      base64?: string
      code?: string
      pairingCode?: string | null
      count?: number
    }
    return {
      success: true,
      data: { qrcode: json.base64, status: 'connecting' },
    }
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Falha ao reconectar.',
    }
  }
}

// Re-exporta tipos auxiliares
export type ServicoInput = Servico
