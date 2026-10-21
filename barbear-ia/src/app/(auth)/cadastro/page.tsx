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
import { signUp } from '../actions'

const schema = z
  .object({
    nome: z.string().min(2, 'Informe seu nome completo'),
    email: z.string().email('Informe um email válido'),
    senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
    confirmar: z.string().min(6, 'Confirme sua senha'),
  })
  .refine((d) => d.senha === d.confirmar, {
    path: ['confirmar'],
    message: 'As senhas não conferem',
  })

type FormValues = z.infer<typeof schema>

export default function CadastroPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { nome: '', email: '', senha: '', confirmar: '' },
  })

  function onSubmit(values: FormValues) {
    setServerError(null)
    startTransition(async () => {
      const result = await signUp({
        nome: values.nome,
        email: values.email,
        senha: values.senha,
      })
      if (!result.success) {
        setServerError(result.error)
        toast.error(result.error)
        return
      }
      if (result.data?.needsEmailConfirmation) {
        toast.success('Conta criada! Verifique seu email para confirmar.')
        router.replace('/login')
        return
      }
      toast.success('Conta criada! Vamos configurar sua barbearia.')
      router.replace('/onboarding')
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-md rounded-2xl bg-white border border-brand-100 shadow-xl p-6 sm:p-8 space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-bold text-brand">Criar conta</h1>
        <p className="text-sm text-slate-500">
          Crie sua conta e comece o período de teste.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="nome">Nome completo</Label>
          <Input
            id="nome"
            type="text"
            autoComplete="name"
            placeholder="João Silva"
            disabled={isPending}
            aria-invalid={!!errors.nome}
            {...register('nome')}
          />
          {errors.nome && (
            <p className="text-xs text-red-600">{errors.nome.message}</p>
          )}
        </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
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
            <Label htmlFor="confirmar">Confirmar</Label>
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
              <Loader2 className="animate-spin" /> Criando conta...
            </>
          ) : (
            'Criar conta grátis'
          )}
        </Button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Já tem conta?{' '}
        <Link href="/login" className="font-medium text-brand hover:text-brand-light">
          Entre aqui
        </Link>
      </p>
    </div>
  )
}
