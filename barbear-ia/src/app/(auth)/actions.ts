'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getPlatformAdmin } from '@/lib/platform-admin'
import type { Servico } from '@/types'

type ActionResult<T = undefined> =
  | { success: true; data?: T }
  | { success: false; error: string }

// ============================================
// Auth helpers
// ============================================

export async function signUp(_input: {
  nome: string
  email: string
  senha: string
}): Promise<ActionResult<{ needsEmailConfirmation: boolean }>> {
  return { success: false, error: 'O cadastro é realizado pela equipe Barbear.IA. Solicite um convite de acesso.' }
}

export async function signIn(input: {
  email: string
  senha: string
}): Promise<ActionResult<{ hasBarbearia: boolean; isPlatformAdmin: boolean }>> {
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

  const isPlatformAdmin = !!(await getPlatformAdmin())
  return { success: true, data: { hasBarbearia: !!vinculo, isPlatformAdmin } }
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
  _payload: OnboardingPayload,
): Promise<ActionResult<{ barbeariaId: string }>> {
  return { success: false, error: 'O onboarding agora é realizado exclusivamente pela equipe Barbear.IA.' }
}
