'use client'

import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DIAS_SEMANA } from '@/lib/constants'

const servicoSchema = z.object({
  nome: z.string().min(1, 'Nome obrigatório'),
  preco: z.number({ message: 'Preço inválido' }).min(0, 'Preço inválido'),
  duracao_min: z
    .number({ message: 'Duração inválida' })
    .int()
    .min(5, 'Mínimo 5 min'),
})

const horarioSchema = z.object({
  ativo: z.boolean(),
  inicio: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
  fim: z.string().regex(/^\d{2}:\d{2}$/, 'HH:MM'),
})

export const barbeiroSchema = z.object({
  nome: z.string().min(2, 'Informe o nome do barbeiro'),
  telefone: z.string().optional().or(z.literal('')),
  servicos: z.array(servicoSchema).min(1, 'Adicione ao menos 1 serviço'),
  horarios: z.object({
    dom: horarioSchema,
    seg: horarioSchema,
    ter: horarioSchema,
    qua: horarioSchema,
    qui: horarioSchema,
    sex: horarioSchema,
    sab: horarioSchema,
  }),
})

export type BarbeiroFormValues = z.infer<typeof barbeiroSchema>

const DIA_LABELS: Record<(typeof DIAS_SEMANA)[number], string> = {
  dom: 'Domingo',
  seg: 'Segunda',
  ter: 'Terça',
  qua: 'Quarta',
  qui: 'Quinta',
  sex: 'Sexta',
  sab: 'Sábado',
}

interface Props {
  defaultValues: BarbeiroFormValues
  onSubmit: (values: BarbeiroFormValues) => void
  onBack: () => void
}

export function StepBarbeiro({ defaultValues, onSubmit, onBack }: Props) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BarbeiroFormValues>({
    resolver: zodResolver(barbeiroSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'servicos',
  })

  const horarios = watch('horarios')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-brand">Primeiro barbeiro</h2>
        <p className="text-sm text-slate-500">
          Você poderá adicionar mais barbeiros depois.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="bnome">Nome</Label>
          <Input
            id="bnome"
            placeholder="Luiz Freitas"
            aria-invalid={!!errors.nome}
            {...register('nome')}
          />
          {errors.nome && (
            <p className="text-xs text-red-600">{errors.nome.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="btelefone">WhatsApp (opcional)</Label>
          <Input
            id="btelefone"
            placeholder="(31) 99999-0000"
            {...register('telefone')}
          />
        </div>
      </div>

      <Separator />

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-brand">Serviços</h3>
            <p className="text-xs text-slate-500">Nome, preço (R$) e duração (min).</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ nome: '', preco: 0, duracao_min: 30 })
            }
          >
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </div>

        <div className="space-y-2">
          {fields.map((f, idx) => (
            <div
              key={f.id}
              className="grid grid-cols-12 gap-2 items-start"
            >
              <div className="col-span-5 space-y-1">
                <Input
                  placeholder="Corte"
                  aria-invalid={!!errors.servicos?.[idx]?.nome}
                  {...register(`servicos.${idx}.nome` as const)}
                />
                {errors.servicos?.[idx]?.nome && (
                  <p className="text-[10px] text-red-600">
                    {errors.servicos[idx]?.nome?.message}
                  </p>
                )}
              </div>
              <div className="col-span-3 space-y-1">
                <Input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="40"
                  aria-invalid={!!errors.servicos?.[idx]?.preco}
                  {...register(`servicos.${idx}.preco` as const, {
                    valueAsNumber: true,
                  })}
                />
                {errors.servicos?.[idx]?.preco && (
                  <p className="text-[10px] text-red-600">
                    {errors.servicos[idx]?.preco?.message}
                  </p>
                )}
              </div>
              <div className="col-span-3 space-y-1">
                <Input
                  type="number"
                  step="5"
                  min="5"
                  placeholder="30"
                  aria-invalid={!!errors.servicos?.[idx]?.duracao_min}
                  {...register(`servicos.${idx}.duracao_min` as const, {
                    valueAsNumber: true,
                  })}
                />
                {errors.servicos?.[idx]?.duracao_min && (
                  <p className="text-[10px] text-red-600">
                    {errors.servicos[idx]?.duracao_min?.message}
                  </p>
                )}
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={fields.length === 1}
                  onClick={() => remove(idx)}
                  aria-label="Remover serviço"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
        {errors.servicos?.message && (
          <p className="text-xs text-red-600">{errors.servicos.message}</p>
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-brand">Horários de funcionamento</h3>
          <p className="text-xs text-slate-500">
            Marque os dias ativos e ajuste os horários.
          </p>
        </div>

        <div className="space-y-2">
          {DIAS_SEMANA.map((dia) => {
            const ativo = horarios[dia]?.ativo
            return (
              <div
                key={dia}
                className="grid grid-cols-12 items-center gap-2 rounded-md border border-brand-100 px-3 py-2"
              >
                <label className="col-span-4 sm:col-span-3 flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    className="accent-brand"
                    checked={ativo}
                    onChange={(e) =>
                      setValue(`horarios.${dia}.ativo`, e.target.checked, {
                        shouldDirty: true,
                      })
                    }
                  />
                  {DIA_LABELS[dia]}
                </label>
                <div className="col-span-4 sm:col-span-4">
                  <Input
                    type="time"
                    disabled={!ativo}
                    {...register(`horarios.${dia}.inicio` as const)}
                  />
                </div>
                <span className="col-span-1 text-center text-xs text-slate-400">às</span>
                <div className="col-span-3 sm:col-span-4">
                  <Input
                    type="time"
                    disabled={!ativo}
                    {...register(`horarios.${dia}.fim` as const)}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <div className="flex justify-between">
        <Button type="button" variant="outline" size="lg" onClick={onBack}>
          Voltar
        </Button>
        <Button
          type="submit"
          size="lg"
          className="bg-brand hover:bg-brand-light text-white"
        >
          Próximo
        </Button>
      </div>
    </form>
  )
}
