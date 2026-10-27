'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getPlatformAdmin } from '@/lib/platform-admin'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  perfilSchema,
  funcionamentoSchema,
  regrasSchema,
  atendimentoSchema,
  profissionalSchema,
  agendaSchema,
} from '@/lib/onboarding'
import type { ProfissionalInput, AgendaInput } from '@/lib/onboarding'
import type { AtualizarHorariosInput } from '@/app/(dashboard)/configuracoes/actions'

const secaoSchema = z.discriminatedUnion('secao', [
  z.object({ secao: z.literal('perfil'), dados: perfilSchema }),
  z.object({ secao: z.literal('funcionamento'), dados: funcionamentoSchema }),
  z.object({ secao: z.literal('regras'), dados: regrasSchema }),
  z.object({ secao: z.literal('atendimento'), dados: atendimentoSchema }),
])
function revalidar(id: string) {
  revalidatePath(`/gestao/${id}`)
  revalidatePath('/configuracoes')
  revalidatePath('/agendar/[slug]', 'page')
  revalidatePath('/agenda')
}

export async function salvarSecaoOnboarding(
  id: string,
  input: z.infer<typeof secaoSchema>,
) {
  if (!(await getPlatformAdmin()))
    return { success: false, error: 'Acesso negado.' }
  const p = secaoSchema.safeParse(input)
  if (!z.uuid().safeParse(id).success || !p.success)
    return {
      success: false,
      error: p.error?.issues[0]?.message ?? 'Dados inválidos.',
    }
  // Dados internos ficam em tabela sem acesso anon/authenticated.
  if (p.data.secao === 'perfil' || p.data.secao === 'atendimento') {
    const { data, error } = await supabaseAdmin
      .from('barbearia_onboarding')
      .upsert(
        {
          barbearia_id: id,
          secao: p.data.secao,
          dados: p.data.dados,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'barbearia_id,secao' },
      )
      .select('barbearia_id')
      .maybeSingle()
    if (error || !data)
      return {
        success: false,
        error: error?.message ?? 'Não foi possível salvar o onboarding.',
      }
    revalidar(id)
    return { success: true }
  }
  const { data: atual, error: leitura } = await supabaseAdmin
    .from('barbearias')
    .select('config,updated_at')
    .eq('id', id)
    .maybeSingle()
  if (leitura || !atual)
    return { success: false, error: 'Barbearia não encontrada.' }
  // Preserva configurações das integrações e de outras seções; detecta edição concorrente.
  const config = { ...atual.config, [p.data.secao]: p.data.dados }
  const { data, error } = await supabaseAdmin
    .from('barbearias')
    .update({ config })
    .eq('id', id)
    .eq('updated_at', atual.updated_at)
    .select('id')
    .maybeSingle()
  if (error || !data)
    return {
      success: false,
      error:
        error?.message ??
        'Os dados foram alterados. Atualize a página e tente novamente.',
    }
  revalidar(id)
  return { success: true }
}

export async function salvarProfissionalAdmin(
  barbeariaId: string,
  profissionalId: string | null,
  input: ProfissionalInput,
) {
  if (!(await getPlatformAdmin()))
    return { success: false, error: 'Acesso negado.' }
  const p = profissionalSchema.safeParse(input)
  if (
    !z.uuid().safeParse(barbeariaId).success ||
    (profissionalId && !z.uuid().safeParse(profissionalId).success) ||
    !p.success
  )
    return {
      success: false,
      error: p.error?.issues[0]?.message ?? 'Dados inválidos.',
    }
  const values = {
    ...p.data,
    telefone: p.data.telefone.replace(/\D/g, '') || null,
    calendar_id: p.data.calendar_id || null,
  }
  const query = profissionalId
    ? supabaseAdmin
        .from('barbeiros')
        .update(values)
        .eq('id', profissionalId)
        .eq('barbearia_id', barbeariaId)
    : supabaseAdmin.from('barbeiros').insert({
        ...values,
        barbearia_id: barbeariaId,
        horarios: {},
        bloqueios: [],
        horarios_fixos: [],
      })
  const { data, error } = await query.select('id').maybeSingle()
  if (error || !data)
    return {
      success: false,
      error: error?.message ?? 'Profissional não encontrado nesta barbearia.',
    }
  revalidar(barbeariaId)
  return { success: true }
}

export async function salvarAgendaAdmin(
  barbeariaId: string,
  profissionalId: string,
  input: AtualizarHorariosInput,
) {
  if (!(await getPlatformAdmin()))
    return { success: false, error: 'Acesso negado.' }
  if (
    !z.uuid().safeParse(barbeariaId).success ||
    !z.uuid().safeParse(profissionalId).success
  )
    return { success: false, error: 'Identificação inválida.' }
  // Valida o formato recebido antes de omitir os dias desativados.
  const raw = z
    .object({
      horarios: z.partialRecord(
        z.enum(['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab']),
        z.object({ ativo: z.boolean(), inicio: z.string(), fim: z.string() }),
      ),
      bloqueios: z.array(z.unknown()),
      horarios_fixos: z.array(z.unknown()),
    })
    .safeParse(input)
  if (!raw.success)
    return { success: false, error: 'Dados da agenda inválidos.' }
  const horarios = Object.fromEntries(
    Object.entries(raw.data.horarios)
      .filter(([, h]) => h?.ativo)
      .map(([dia, h]) => [dia, { inicio: h!.inicio, fim: h!.fim }]),
  )
  const p = agendaSchema.safeParse({ ...raw.data, horarios })
  if (!p.success)
    return {
      success: false,
      error: p.error.issues[0]?.message ?? 'Horários inválidos.',
    }
  const { data, error } = await supabaseAdmin
    .from('barbeiros')
    .update(p.data as AgendaInput)
    .eq('id', profissionalId)
    .eq('barbearia_id', barbeariaId)
    .select('id')
    .maybeSingle()
  if (error || !data)
    return {
      success: false,
      error: error?.message ?? 'Profissional não encontrado nesta barbearia.',
    }
  revalidar(barbeariaId)
  return { success: true }
}

export async function uploadLogoAdmin(id: string, formData: FormData) {
  if (!(await getPlatformAdmin()))
    return { success: false, error: 'Acesso negado.' }
  if (!z.uuid().safeParse(id).success)
    return { success: false, error: 'Identificação inválida.' }
  const file = formData.get('file')
  if (
    !(file instanceof File) ||
    !['image/png', 'image/jpeg', 'image/webp'].includes(file.type) ||
    file.size === 0 ||
    file.size > 2 * 1024 * 1024
  )
    return { success: false, error: 'Envie PNG, JPG ou WebP de até 2 MB.' }
  const { data: b } = await supabaseAdmin
    .from('barbearias')
    .select('id')
    .eq('id', id)
    .maybeSingle()
  if (!b) return { success: false, error: 'Barbearia não encontrada.' }
  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : 'jpg'
  const path = `${id}/logo-${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabaseAdmin.storage
    .from('logos')
    .upload(path, file, { contentType: file.type })
  if (uploadError) return { success: false, error: uploadError.message }
  const { data: url } = supabaseAdmin.storage.from('logos').getPublicUrl(path)
  const { data, error } = await supabaseAdmin
    .from('barbearias')
    .update({ logo_url: url.publicUrl })
    .eq('id', id)
    .select('id')
    .maybeSingle()
  if (error || !data)
    return {
      success: false,
      error: error?.message ?? 'Não foi possível salvar a logo.',
    }
  revalidar(id)
  revalidatePath('/', 'layout')
  return { success: true }
}

// Uma única escrita cadastra/atualiza os dados e a agenda revisados do profissional.
export async function salvarProfissionalImportado(
  barbeariaId: string,
  profissionalId: string | null,
  input: ProfissionalInput,
  agenda: AgendaInput,
) {
  if (!(await getPlatformAdmin()))
    return { success: false, error: 'Acesso negado.' }
  const p = profissionalSchema.safeParse(input)
  const a = agendaSchema.safeParse(agenda)
  if (
    !z.uuid().safeParse(barbeariaId).success ||
    (profissionalId && !z.uuid().safeParse(profissionalId).success) ||
    !p.success ||
    !a.success
  )
    return {
      success: false,
      error:
        p.error?.issues[0]?.message ??
        a.error?.issues[0]?.message ??
        'Dados inválidos.',
    }
  const values = {
    ...p.data,
    ...a.data,
    telefone: p.data.telefone.replace(/\D/g, '') || null,
    calendar_id: p.data.calendar_id || null,
  }
  const query = profissionalId
    ? supabaseAdmin
        .from('barbeiros')
        .update(values)
        .eq('id', profissionalId)
        .eq('barbearia_id', barbeariaId)
    : supabaseAdmin
        .from('barbeiros')
        .insert({ ...values, barbearia_id: barbeariaId })
  const { data, error } = await query.select('id').maybeSingle()
  if (error || !data)
    return {
      success: false,
      error: error?.message ?? 'Profissional não encontrado nesta barbearia.',
    }
  revalidar(barbeariaId)
  return { success: true }
}
