'use client'

import { useEffect, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { editarCliente } from '../actions'
import type { ClienteListItem } from '../types'

interface Props {
  cliente: ClienteListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSalvo: () => void
}

export function ModalEditarCliente({
  cliente,
  open,
  onOpenChange,
  onSalvo,
}: Props) {
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [errors, setErrors] = useState<{ nome?: string; telefone?: string }>({})
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    if (open && cliente) {
      setNome(cliente.nome ?? '')
      setTelefone(cliente.telefone)
      setErrors({})
    }
  }, [open, cliente])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cliente) return
    const errs: typeof errors = {}
    if (nome.trim().length < 2) errs.nome = 'Informe o nome completo'
    if (telefone.replace(/\D/g, '').length < 10)
      errs.telefone = 'Telefone inválido'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    startTransition(async () => {
      const result = await editarCliente(cliente.id, { nome, telefone })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Cliente atualizado.')
      onOpenChange(false)
      onSalvo()
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-brand">Editar cliente</DialogTitle>
          <DialogDescription>
            Atualize o nome e o WhatsApp do cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              aria-invalid={!!errors.nome}
              autoFocus
            />
            {errors.nome && <p className="text-xs text-red-600">{errors.nome}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="telefone">WhatsApp</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              aria-invalid={!!errors.telefone}
              placeholder="5531999990000"
            />
            {errors.telefone && (
              <p className="text-xs text-red-600">{errors.telefone}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-brand hover:bg-brand-light text-white"
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
