'use client'

import { useState, useTransition } from 'react'
import {
  Plus,
  MoreVertical,
  Edit3,
  PowerOff,
  Power,
  Trash2,
  User as UserIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { ModalBarbeiro } from './modal-barbeiro'
import { removerBarbeiro, toggleAtivoBarbeiro } from '../actions'
import type { Barbeiro, Servico } from '@/types'

interface Props {
  barbeiros: Barbeiro[]
  onChange: () => void
}

export function AbaBarbeiros({ barbeiros, onChange }: Props) {
  const [editando, setEditando] = useState<Barbeiro | null>(null)
  const [criando, setCriando] = useState(false)
  const [confirmRemover, setConfirmRemover] = useState<Barbeiro | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle(b: Barbeiro) {
    startTransition(async () => {
      const result = await toggleAtivoBarbeiro(b.id, !b.ativo)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success(!b.ativo ? 'Barbeiro ativado.' : 'Barbeiro desativado.')
      onChange()
    })
  }

  function handleRemover() {
    if (!confirmRemover) return
    startTransition(async () => {
      const result = await removerBarbeiro(confirmRemover.id)
      if (!result.success) {
        toast.error(result.error)
        setConfirmRemover(null)
        return
      }
      toast.success('Barbeiro removido.')
      setConfirmRemover(null)
      onChange()
    })
  }

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-brand">
              Barbeiros ({barbeiros.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Profissionais que atendem nesta barbearia.
            </p>
          </div>
          <Button
            onClick={() => setCriando(true)}
            className="bg-brand hover:bg-brand-light text-white"
            size="sm"
          >
            <Plus className="size-3.5" /> Adicionar
          </Button>
        </div>

        {barbeiros.length === 0 ? (
          <div className="mt-5 rounded-lg border border-dashed border-brand-100 p-8 text-center">
            <UserIcon className="size-7 text-brand/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-700">
              Nenhum barbeiro cadastrado
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Adicione o primeiro profissional para começar.
            </p>
          </div>
        ) : (
          <ul className="mt-4 divide-y divide-brand-100">
            {barbeiros.map((b) => {
              const servicos = (b.servicos as Servico[] | null) ?? []
              return (
                <li
                  key={b.id}
                  className="flex items-center justify-between gap-3 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 shrink-0 rounded-full bg-brand-50 text-brand flex items-center justify-center">
                      <UserIcon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {b.nome}
                      </p>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {b.telefone ?? '—'} ·{' '}
                        <span className="font-sans">
                          {servicos.length} serviço
                          {servicos.length === 1 ? '' : 's'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge
                      className={cn(
                        'border-transparent',
                        b.ativo
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600',
                      )}
                    >
                      <span
                        className={cn(
                          'inline-block size-1.5 rounded-full mr-1',
                          b.ativo ? 'bg-emerald-500' : 'bg-slate-400',
                        )}
                      />
                      {b.ativo ? 'Ativo' : 'Inativo'}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditando(b)}
                    >
                      <Edit3 className="size-3.5" /> Editar
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isPending}
                            aria-label="Mais ações"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => handleToggle(b)}>
                          {b.ativo ? (
                            <>
                              <PowerOff className="size-4" /> Desativar
                            </>
                          ) : (
                            <>
                              <Power className="size-4" /> Ativar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => setConfirmRemover(b)}
                        >
                          <Trash2 className="size-4" /> Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <ModalBarbeiro
        open={criando || !!editando}
        onOpenChange={(o) => {
          if (!o) {
            setCriando(false)
            setEditando(null)
          }
        }}
        barbeiro={editando}
        onSalvo={onChange}
      />

      <Dialog
        open={!!confirmRemover}
        onOpenChange={(o) => {
          if (!o) setConfirmRemover(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-700">Remover barbeiro?</DialogTitle>
            <DialogDescription>
              Esta ação não pode ser desfeita. O barbeiro <strong>{confirmRemover?.nome}</strong>{' '}
              será removido permanentemente. Agendamentos passados ficam preservados.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmRemover(null)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemover}
              disabled={isPending}
            >
              {isPending ? 'Removendo...' : 'Sim, remover'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
