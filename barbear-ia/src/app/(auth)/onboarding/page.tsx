'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { Stepper } from './components/stepper'
import {
  StepBarbearia,
  type BarbeariaFormValues,
} from './components/step-barbearia'
import {
  StepBarbeiro,
  type BarbeiroFormValues,
} from './components/step-barbeiro'
import { StepConfirmar } from './components/step-confirmar'
import { createBarbearia } from '../actions'

const STEPS = [
  { label: 'Barbearia' },
  { label: 'Barbeiro' },
  { label: 'Confirmar' },
]

const defaultBarbearia: BarbeariaFormValues = {
  nome: '',
  telefone: '',
  email: '',
}

const defaultBarbeiro: BarbeiroFormValues = {
  nome: '',
  telefone: '',
  servicos: [
    { nome: 'Corte', preco: 40, duracao_min: 30 },
    { nome: 'Barba', preco: 30, duracao_min: 20 },
    { nome: 'Sobrancelha', preco: 20, duracao_min: 10 },
  ],
  horarios: {
    dom: { ativo: false, inicio: '09:00', fim: '18:00' },
    seg: { ativo: false, inicio: '09:00', fim: '20:00' },
    ter: { ativo: true, inicio: '09:00', fim: '20:00' },
    qua: { ativo: true, inicio: '09:00', fim: '20:00' },
    qui: { ativo: true, inicio: '09:00', fim: '20:00' },
    sex: { ativo: true, inicio: '09:00', fim: '20:00' },
    sab: { ativo: true, inicio: '08:00', fim: '15:00' },
  },
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [barbearia, setBarbearia] = useState<BarbeariaFormValues>(defaultBarbearia)
  const [barbeiro, setBarbeiro] = useState<BarbeiroFormValues>(defaultBarbeiro)
  const [isPending, startTransition] = useTransition()

  function handleConfirm() {
    startTransition(async () => {
      const result = await createBarbearia({
        barbearia: {
          nome: barbearia.nome,
          telefone: barbearia.telefone,
          email: barbearia.email || undefined,
        },
        barbeiro: {
          nome: barbeiro.nome,
          telefone: barbeiro.telefone || undefined,
          servicos: barbeiro.servicos,
        },
        horarios: barbeiro.horarios,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      toast.success('Barbearia criada com sucesso!')
      router.replace('/agenda')
      router.refresh()
    })
  }

  return (
    <div className="w-full max-w-2xl rounded-2xl bg-white border border-brand-100 shadow-xl p-6 sm:p-8 space-y-6">
      <Stepper current={step} steps={STEPS} />

      {step === 0 && (
        <StepBarbearia
          defaultValues={barbearia}
          onSubmit={(values) => {
            setBarbearia(values)
            setStep(1)
          }}
        />
      )}

      {step === 1 && (
        <StepBarbeiro
          defaultValues={barbeiro}
          onSubmit={(values) => {
            setBarbeiro(values)
            setStep(2)
          }}
          onBack={() => setStep(0)}
        />
      )}

      {step === 2 && (
        <StepConfirmar
          barbearia={barbearia}
          barbeiro={barbeiro}
          onBack={() => setStep(1)}
          onConfirm={handleConfirm}
          isSubmitting={isPending}
        />
      )}
    </div>
  )
}
