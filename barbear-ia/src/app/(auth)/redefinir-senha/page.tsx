'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updatePassword } from '../actions'

const schema = z
  .object({
    senha: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirmar: z.string().min(6, 'Confirme a senha'),
  })
  .refine((data) => data.senha === data.confirmar, {
    path: ['confirmar'],
    message: 'As senhas não coincidem',
  })

type FormValues = z.infer<typeof schema>

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { senha: '', confirmar: '' },
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await updatePassword({ senha: values.senha })
      if (!result.success) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }
      toast.success('Senha redefinida com sucesso!')
      router.replace('/agenda')
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white border border-brand-100 shadow-xl p-6 sm:p-8 space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-brand">Nova senha</h1>
        <p className="text-sm text-slate-500">
          Defina sua nova senha de acesso ao painel.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="senha">Nova senha</Label>
          <Input
            id="senha"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={isPending}
            aria-invalid={!!errors.senha}
            {...register('senha')}
          />
          {errors.senha && (
            <p className="text-xs text-red-600">{errors.senha.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmar">Confirmar nova senha</Label>
          <Input
            id="confirmar"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            disabled={isPending}
            aria-invalid={!!errors.confirmar}
            {...register('confirmar')}
          />
          {errors.confirmar && (
            <p className="text-xs text-red-600">{errors.confirmar.message}</p>
          )}
        </div>

        {serverError && (
          <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-100">
            {serverError}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full bg-brand hover:bg-brand-light text-white"
        >
          {isPending ? (
            <>
              <Loader2 className="animate-spin" /> Salvando...
            </>
          ) : (
            'Redefinir senha'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-brand hover:text-brand-light">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
