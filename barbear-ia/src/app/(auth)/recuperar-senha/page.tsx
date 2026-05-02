'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Loader2, MailCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { requestPasswordReset } from '../actions'

const schema = z.object({
  email: z.string().email('Informe um email válido'),
})

type FormValues = z.infer<typeof schema>

export default function RecuperarSenhaPage() {
  const [isPending, startTransition] = useTransition()
  const [enviado, setEnviado] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    const redirectTo = `${window.location.origin}/auth/callback?next=/redefinir-senha`
    startTransition(async () => {
      const result = await requestPasswordReset({
        email: values.email,
        redirectTo,
      })
      if (!result.success) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }
      setEnviado(true)
    })
  }

  if (enviado) {
    return (
      <div className="w-full max-w-md rounded-2xl bg-white border border-brand-100 shadow-xl p-6 sm:p-8 space-y-5 text-center">
        <div className="size-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <MailCheck className="size-6" />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-brand">Verifique seu email</h1>
          <p className="text-sm text-slate-600">
            Enviamos um link para{' '}
            <strong className="text-slate-800">{getValues('email')}</strong>.
            Clique nele para redefinir sua senha.
          </p>
        </div>
        <p className="text-xs text-slate-500">
          Não recebeu? Confira a caixa de spam ou tente novamente em alguns minutos.
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-brand hover:text-brand-light"
        >
          Voltar para o login
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white border border-brand-100 shadow-xl p-6 sm:p-8 space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-brand">Recuperar senha</h1>
        <p className="text-sm text-slate-500">
          Informe seu email e enviaremos um link para criar uma nova senha.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="voce@email.com"
            disabled={isPending}
            aria-invalid={!!errors.email}
            {...register('email')}
          />
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email.message}</p>
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
              <Loader2 className="animate-spin" /> Enviando...
            </>
          ) : (
            'Enviar link de recuperação'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Lembrou a senha?{' '}
        <Link href="/login" className="font-medium text-brand hover:text-brand-light">
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}
