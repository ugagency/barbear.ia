'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { getPlatformAdmin } from '@/lib/platform-admin'

const createSchema = z.object({
  nome: z.string().trim().min(2),
  telefone: z.string().trim().min(10),
  email: z.union([z.email(), z.literal('')]),
  barbeiro: z.string().trim().min(2),
  telefoneBarbeiro: z.string().trim(),
})
const editSchema = z.object({
  id: z.uuid(),
  nome: z.string().trim().min(2),
  telefone: z.string().trim(),
  email: z.union([z.email(), z.literal('')]),
  plano: z.enum(['trial', 'starter', 'pro']),
  plano_status: z.enum(['ativo','inadimplente','cancelado']),
})
const inviteSchema = z.object({ id: z.uuid(), email: z.email() })

function slugify(text: string) {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'barbearia'
}

export async function cadastrarBarbearia(input: z.infer<typeof createSchema>) {
  if (!await getPlatformAdmin()) return { success: false, error: 'Acesso negado.' }
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Revise os dados informados.' }
  const v = parsed.data
  const base = slugify(v.nome)
  let slug = base
  for (let n = 2; n < 100; n++) {
    const { data } = await supabaseAdmin.from('barbearias').select('id').eq('slug', slug).maybeSingle()
    if (!data) break
    slug = `${base}-${n}`
  }
  const { data: barbearia, error } = await supabaseAdmin.from('barbearias')
    .insert({
      nome: v.nome, telefone: v.telefone, email: v.email || null, slug,
      instance_name: slug.replace(/-/g, ''),
      plano: 'trial', plano_status: 'ativo',
      config: { fuso: 'America/Sao_Paulo', dias_funcionamento: ['ter','qua','qui','sex','sab'], horario_abertura: '09:00', horario_fechamento: '19:00' },
    }).select('id').single()
  if (error || !barbearia) return { success: false, error: error?.message ?? 'Não foi possível cadastrar.' }
  const { error: barbeiroError } = await supabaseAdmin.from('barbeiros').insert({
    barbearia_id: barbearia.id, nome: v.barbeiro,
    telefone: v.telefoneBarbeiro || null, ativo: true,
    horarios: {},
    servicos: [],
  })
  revalidatePath('/gestao')
  if (barbeiroError) return { success: true, id: barbearia.id, warning: 'Barbearia criada, mas houve erro ao cadastrar o barbeiro: ' + barbeiroError.message }
  return { success: true, id: barbearia.id }
}

export async function atualizarBarbearia(input: z.infer<typeof editSchema>) {
  if (!await getPlatformAdmin()) return { success: false, error: 'Acesso negado.' }
  const parsed = editSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Dados inválidos.' }
  const { id, ...values } = parsed.data
  const { error } = await supabaseAdmin.from('barbearias').update({ ...values, email: values.email || null }).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/gestao')
  revalidatePath(`/gestao/${id}`)
  return { success: true }
}

export async function convidarResponsavel(input: z.infer<typeof inviteSchema>) {
  if (!await getPlatformAdmin()) return { success: false, error: 'Acesso negado.' }
  const parsed = inviteSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Email inválido.' }
  const { id, email } = parsed.data
  const { data: barbearia } = await supabaseAdmin.from('barbearias').select('id').eq('id', id).maybeSingle()
  if (!barbearia) return { success: false, error: 'Barbearia não encontrada.' }
  // O convite cria o usuário; o vínculo é registrado depois do convite.
  const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
  if (error || !invited.user) return { success: false, error: error?.message ?? 'Convite não enviado.' }
  const { error: linkError } = await supabaseAdmin.from('usuarios_barbearias').insert({
    user_id: invited.user.id, barbearia_id: id, role: 'dono',
  })
  if (linkError) return { success: false, error: 'Convite criado, mas houve falha no vínculo: ' + linkError.message }
  revalidatePath(`/gestao/${id}`)
  return { success: true }
}

const deleteSchema = z.object({
  id: z.uuid(),
  confirmacao: z.string().min(1),
})

export async function excluirBarbearia(input: z.infer<typeof deleteSchema>) {
  if (!await getPlatformAdmin()) return { success: false, error: 'Acesso negado.' }
  const parsed = deleteSchema.safeParse(input)
  if (!parsed.success) return { success: false, error: 'Confirmação inválida.' }

  const { id, confirmacao } = parsed.data
  const { data: barbearia, error: lookupError } = await supabaseAdmin
    .from('barbearias')
    .select('id,nome')
    .eq('id', id)
    .maybeSingle()

  if (lookupError || !barbearia) return { success: false, error: 'Barbearia não encontrada.' }
  if (confirmacao !== barbearia.nome) {
    return { success: false, error: 'Digite exatamente o nome da barbearia para confirmar.' }
  }

  // As tabelas vinculadas (barbeiros, clientes, agendamentos, conversas,
  // lembretes e vínculos de usuários) possuem ON DELETE CASCADE.
  const { data: deleted, error: deleteError } = await supabaseAdmin
    .from('barbearias')
    .delete()
    .eq('id', id)
    .eq('nome', barbearia.nome)
    .select('id')
    .maybeSingle()
  if (deleteError || !deleted) return { success: false, error: deleteError?.message ?? 'Exclusão não confirmada.' }

  revalidatePath('/gestao')
  return { success: true }
}
