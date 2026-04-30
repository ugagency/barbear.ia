'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const barbeariaSchema = z.object({
  nome: z.string().min(2, 'Informe o nome da barbearia'),
  telefone: z
    .string()
    .min(10, 'Informe o telefone com DDD')
    .regex(/^[\d()\s\-+]+$/, 'Use apenas números e caracteres válidos'),
  email: z
    .string()
    .email('Informe um email válido')
    .optional()
    .or(z.literal('')),
})

export type BarbeariaFormValues = z.infer<typeof barbeariaSchema>

interface Props {
  defaultValues: BarbeariaFormValues
  onSubmit: (values: BarbeariaFormValues) => void
}

export function StepBarbearia({ defaultValues, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BarbeariaFormValues>({
    resolver: zodResolver(barbeariaSchema),
    defaultValues,
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-brand">Sua barbearia</h2>
        <p className="text-sm text-slate-500">
          Conte um pouco sobre o estabelecimento.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome da barbearia</Label>
        <Input
          id="nome"
          placeholder="Ex: Barbearia New House"
          aria-invalid={!!errors.nome}
          {...register('nome')}
        />
        {errors.nome && (
          <p className="text-xs text-red-600">{errors.nome.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="telefone">WhatsApp principal</Label>
        <Input
          id="telefone"
          placeholder="(31) 99999-0000"
          aria-invalid={!!errors.telefone}
          {...register('telefone')}
        />
        {errors.telefone && (
          <p className="text-xs text-red-600">{errors.telefone.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email de contato (opcional)</Label>
        <Input
          id="email"
          type="email"
          placeholder="contato@suabarbearia.com"
          aria-invalid={!!errors.email}
          {...register('email')}
        />
        {errors.email && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>

      <div className="flex justify-end">
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
