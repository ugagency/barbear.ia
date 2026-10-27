import { z } from 'zod'

export const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const
export const DIA_NOME: Record<string, string> = {
  dom: 'Domingo',
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
}
const hora = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use um horário válido (HH:MM).')
const texto = z.string().trim().max(5000)
const telefone = z
  .string()
  .trim()
  .max(25)
  .refine((v) => !v || /^\+?[\d\s()-]{10,25}$/.test(v), 'Telefone inválido.')
const link = z.union([
  z.url().refine((v) => /^https?:\/\//.test(v), 'Use um link HTTP ou HTTPS.'),
  z.literal(''),
])
const intervalo = z
  .object({ inicio: hora, fim: hora })
  .refine((v) => v.inicio < v.fim, 'A hora final deve ser posterior à inicial.')
export const horariosSchema = z.partialRecord(z.enum(DIAS), intervalo)
const recorrencia = {
  dia_semana: z.enum(DIAS),
  inicio: hora,
  fim: hora,
  frequencia: z.enum(['semanal', 'quinzenal', 'mensal', 'pontual']).optional(),
  data_inicio: z.iso.date().optional(),
  data_fim: z.iso.date().optional(),
  semana_mes: z.number().int().min(1).max(5).optional(),
}
function validarRegra(v: {
  inicio: string
  fim: string
  frequencia?: string
  data_inicio?: string
  data_fim?: string
}) {
  return (
    v.inicio < v.fim &&
    !(v.data_inicio && v.data_fim && v.data_fim < v.data_inicio) &&
    !(['pontual', 'quinzenal'].includes(v.frequencia ?? '') && !v.data_inicio)
  )
}
export const bloqueioSchema = z
  .object({ ...recorrencia, motivo: texto.min(1) })
  .refine(validarRegra, 'Revise o intervalo e a data inicial do bloqueio.')
const fixoSchema = z
  .object({ ...recorrencia, cliente: texto.min(1) })
  .refine(validarRegra, 'Revise o intervalo e a data inicial do horário fixo.')
export const agendaSchema = z.object({
  horarios: horariosSchema,
  bloqueios: z.array(bloqueioSchema).max(500),
  horarios_fixos: z.array(fixoSchema).max(500),
})
export const perfilSchema = z.object({
  razao_social: texto,
  cnpj: z
    .string()
    .trim()
    .refine(
      (v) => !v || v.replace(/\D/g, '').length === 14,
      'Informe os 14 dígitos do CNPJ.',
    ),
  responsavel: texto,
  whatsapp_responsavel: telefone,
  instagram: texto,
  endereco: texto,
  cidade: texto,
  uf: z.string().max(2),
  cep: z.string().max(10),
  maps_url: link,
  cores: texto,
  fotos_url: texto,
  agenda_atual: texto,
  agendamentos_pendentes: texto,
  observacoes: texto,
})
export const funcionamentoSchema = z.object({
  horarios: horariosSchema,
  bloqueios: z.array(bloqueioSchema).max(500),
  fechamentos: z
    .array(
      z
        .object({
          data_inicio: z.iso.date(),
          data_fim: z.iso.date(),
          motivo: texto.min(1),
        })
        .refine(
          (v) => v.data_fim >= v.data_inicio,
          'Revise as datas do fechamento.',
        ),
    )
    .max(500),
  funciona_feriados: z.boolean(),
  ferias: texto,
})
export const regrasSchema = z.object({
  antecedencia_min: z.number().int().min(0).max(43200),
  horizonte_dias: z.number().int().min(1).max(365),
  cancelamento_min: z.number().int().min(0).max(43200),
  tolerancia_min: z.number().int().min(0).max(120),
  confirmacao_automatica: z.boolean(),
  avisar_responsavel: z.boolean(),
  multa_percentual: z.number().min(0).max(100),
  politica_cancelamento: texto,
})
export const atendimentoSchema = z.object({
  saudacao: texto,
  duvidas_frequentes: texto,
  pagamentos: z.array(z.enum(['pix', 'dinheiro', 'cartao'])),
  atende_criancas: z.boolean(),
  estacionamento: z.boolean(),
  regras_importantes: texto,
  encaminhar_quando: texto,
  whatsapp_humano: telefone,
})
export const profissionalSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone,
  calendar_id: z.string().trim().max(320).optional(),
  ativo: z.boolean(),
  servicos: z
    .array(
      z.object({
        nome: z.string().trim().min(1).max(120),
        preco: z.number().min(0).max(100000),
        duracao_min: z.number().int().min(5).max(1440),
      }),
    )
    .min(1)
    .max(100),
})
export type Perfil = z.infer<typeof perfilSchema>
export type Funcionamento = z.infer<typeof funcionamentoSchema>
export type Regras = z.infer<typeof regrasSchema>
export type Atendimento = z.infer<typeof atendimentoSchema>
export type ProfissionalInput = z.infer<typeof profissionalSchema>
export type AgendaInput = z.infer<typeof agendaSchema>
export interface OnboardingConfig {
  perfil?: Perfil
  funcionamento?: Funcionamento
  regras?: Regras
  atendimento?: Atendimento
}
