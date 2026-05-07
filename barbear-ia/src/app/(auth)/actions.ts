'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { configurarWebhookESettings } from '@/lib/evolution'
import type { ConfigBarbearia, HorarioDia, Servico } from '@/types'

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ============================================
// Auth helpers
// ============================================

export async function signUp(input: {
  nome: string
  email: string
  senha: string
}): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.senha,
    options: {
      data: { nome: input.nome },
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('already')) {
      return { success: false, error: 'Este email já está cadastrado.' }
    }
    return { success: false, error: error.message }
  }

  const needsEmailConfirmation = !data.session
  return { success: true, data: { needsEmailConfirmation } }
}

export async function signIn(input: {
  email: string
  senha: string
}): Promise<ActionResult<{ hasBarbearia: boolean }>> {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.senha,
  })

  if (error) {
    return { success: false, error: 'Email ou senha incorretos.' }
  }

  const { data: vinculo } = await supabase
    .from('usuarios_barbearias')
    .select('id')
    .eq('user_id', data.user.id)
    .maybeSingle()

  return { success: true, data: { hasBarbearia: !!vinculo } }
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.signOut()
  if (error) return { success: false, error: error.message }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function requestPasswordReset(input: {
  email: string
  redirectTo: string
}): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: input.redirectTo,
  })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

export async function updatePassword(input: {
  senha: string
}): Promise<ActionResult> {
  if (input.senha.length < 6) {
    return { success: false, error: 'A senha precisa ter ao menos 6 caracteres.' }
  }
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return {
      success: false,
      error: 'Sessão de recuperação inválida ou expirada. Solicite um novo link.',
    }
  }
  const { error } = await supabase.auth.updateUser({ password: input.senha })
  if (error) return { success: false, error: error.message }
  return { success: true }
}

// ============================================
// Onboarding — criação da barbearia
// ============================================

function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

async function uniqueSlug(base: string): Promise<string> {
  const baseSlug = slugify(base) || 'barbearia'
  let candidate = baseSlug
  let suffix = 1
  while (true) {
    const { data } = await supabaseAdmin
      .from('barbearias')
      .select('id')
      .eq('slug', candidate)
      .maybeSingle()
    if (!data) return candidate
    suffix += 1
    candidate = `${baseSlug}-${suffix}`
  }
}

export interface OnboardingPayload {
  barbearia: {
    nome: string
    telefone: string
    email?: string
  }
  barbeiro: {
    nome: string
    telefone?: string
    servicos: Servico[]
  }
  horarios: Record<string, { ativo: boolean; inicio: string; fim: string }>
}

export async function createBarbearia(
  payload: OnboardingPayload,
): Promise<ActionResult<{ barbeariaId: string }>> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' }
  }

  // Garantir que o usuário ainda não está vinculado a nenhuma barbearia
  const { data: vinculoExistente } = await supabaseAdmin
    .from('usuarios_barbearias')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (vinculoExistente) {
    return { success: false, error: 'Você já possui uma barbearia cadastrada.' }
  }

  // Slug + instance_name únicos
  const slug = await uniqueSlug(payload.barbearia.nome)
  const instanceName = slug.replace(/-/g, '')

  // Monta config a partir dos horários
  const diasFuncionamento = Object.entries(payload.horarios)
    .filter(([, h]) => h.ativo)
    .map(([dia]) => dia)

  const diaPadrao =
    payload.horarios.seg?.ativo ? payload.horarios.seg : payload.horarios.ter
  const sabado = payload.horarios.sab

  const config: ConfigBarbearia = {
    fuso: 'America/Sao_Paulo',
    dias_funcionamento: diasFuncionamento,
    horario_abertura: diaPadrao?.inicio ?? '09:00',
    horario_fechamento: diaPadrao?.fim ?? '20:00',
    sabado_abertura: sabado?.ativo ? sabado.inicio : undefined,
    sabado_fechamento: sabado?.ativo ? sabado.fim : undefined,
  }

  // Monta horarios do barbeiro como { dia: { inicio, fim } }
  const horariosBarbeiro: Record<string, HorarioDia> = {}
  for (const [dia, h] of Object.entries(payload.horarios)) {
    if (h.ativo) horariosBarbeiro[dia] = { inicio: h.inicio, fim: h.fim }
  }

  // Insere barbearia
  const { data: novaBarbearia, error: barbeariaError } = await supabaseAdmin
    .from('barbearias')
    .insert({
      nome: payload.barbearia.nome,
      slug,
      instance_name: instanceName,
      telefone: payload.barbearia.telefone,
      email: payload.barbearia.email || user.email,
      plano: 'trial',
      config,
    })
    .select('id')
    .single()

  if (barbeariaError || !novaBarbearia) {
    return {
      success: false,
      error: barbeariaError?.message ?? 'Erro ao criar barbearia.',
    }
  }

  const barbeariaId = novaBarbearia.id as string

  // Vincula usuário como dono
  const { error: vinculoError } = await supabaseAdmin
    .from('usuarios_barbearias')
    .insert({
      user_id: user.id,
      barbearia_id: barbeariaId,
      role: 'dono',
    })

  if (vinculoError) {
    await supabaseAdmin.from('barbearias').delete().eq('id', barbeariaId)
    return { success: false, error: vinculoError.message }
  }

  // Cria primeiro barbeiro
  const { error: barbeiroError } = await supabaseAdmin
    .from('barbeiros')
    .insert({
      barbearia_id: barbeariaId,
      nome: payload.barbeiro.nome,
      telefone: payload.barbeiro.telefone || null,
      servicos: payload.barbeiro.servicos,
      horarios: horariosBarbeiro,
      ativo: true,
    })

  if (barbeiroError) {
    return { success: false, error: barbeiroError.message }
  }

  // Configurar Evolution API — não bloqueia onboarding se falhar
  const evoUrl = process.env.EVOLUTION_API_URL?.replace(/\/$/, '')
  const evoKey = process.env.EVOLUTION_API_KEY
  if (evoUrl && evoKey) {
    try {
      const createRes = await fetch(`${evoUrl}/instance/create`, {
        method: 'POST',
        headers: {
          apikey: evoKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instanceName,
          integration: 'WHATSAPP-BAILEYS',
        }),
      })

      if (!createRes.ok && createRes.status !== 409) {
        const text = await createRes.text().catch(() => '')
        if (!text.toLowerCase().includes('already')) {
          console.error('[Evolution] Erro ao criar instância:', text)
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1500))
      await configurarWebhookESettings(instanceName)
    } catch (err) {
      console.error('[Evolution] Erro na configuração automática:', err)
    }
  }

  revalidatePath('/', 'layout')
  return { success: true, data: { barbeariaId } }
}
