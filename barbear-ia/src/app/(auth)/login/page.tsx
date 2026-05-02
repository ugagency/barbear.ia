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
import { signIn } from '../actions'

const schema = z.object({
  email: z.string().email('Informe um email válido'),
  senha: z.string().min(1, 'Informe sua senha'),
})

type FormValues = z.infer<typeof schema>

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', senha: '' },
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await signIn(values)
      if (!result.success) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }
      toast.success('Bem-vindo de volta!')
      router.replace(result.data?.hasBarbearia ? '/agenda' : '/onboarding')
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white border border-brand-100 shadow-xl p-6 sm:p-8 space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-brand">Entrar</h1>
        <p className="text-sm text-slate-500">Acesse o painel da sua barbearia.</p>
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="senha">Senha</Label>
            <Link
              href="/recuperar-senha"
              className="text-xs font-medium text-brand hover:text-brand-light"
            >
              Esqueci minha senha
            </Link>
          </div>
          <Input
            id="senha"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            disabled={isPending}
            aria-invalid={!!errors.senha}
            {...register('senha')}
          />
          {errors.senha && (
            <p className="text-xs text-red-600">{errors.senha.message}</p>
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
              <Loader2 className="animate-spin" /> Entrando...
            </>
          ) : (
            'Entrar'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Não tem conta?{' '}
        <Link href="/cadastro" className="font-medium text-brand hover:text-brand-light">
          Crie uma grátis
        </Link>
      </p>
    </div>
  )
}
