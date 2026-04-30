'use client'

import { useEffect, useState, useTransition } from 'react'
import { Check, ChevronsUpDown, UserPlus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { buscarClientes } from '../actions'
import type { ClienteResumo } from '../types'

export type ClienteSelecionado =
  | { tipo: 'existente'; cliente: ClienteResumo }
  | { tipo: 'novo'; nome: string; telefone: string }
  | null

interface Props {
  value: ClienteSelecionado
  onChange: (value: ClienteSelecionado) => void
  error?: string
}

export function ClientePicker({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false)
  const [termo, setTermo] = useState('')
  const [results, setResults] = useState<ClienteResumo[]>([])
  const [isPending, startTransition] = useTransition()
  const [criarNovo, setCriarNovo] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoTelefone, setNovoTelefone] = useState('')

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const result = await buscarClientes(termo)
        if (result.success) {
          setResults(
            result.data.map((c) => ({
              id: c.id,
              nome: c.nome,
              telefone: c.telefone,
            })),
          )
        }
      })
    }, 200)
    return () => clearTimeout(handle)
  }, [termo])

  function selecionarExistente(c: ClienteResumo) {
    onChange({ tipo: 'existente', cliente: c })
    setOpen(false)
  }

  function aplicarNovo() {
    if (!novoNome.trim() || !novoTelefone.trim()) return
    onChange({ tipo: 'novo', nome: novoNome.trim(), telefone: novoTelefone.trim() })
    setOpen(false)
    setCriarNovo(false)
    setNovoNome('')
    setNovoTelefone('')
  }

  const label =
    value?.tipo === 'existente'
      ? value.cliente.nome ?? value.cliente.telefone
      : value?.tipo === 'novo'
        ? `${value.nome} (novo)`
        : 'Selecionar cliente...'

  return (
    <div className="space-y-1.5">
      <Label>Cliente</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="default"
              className="w-full justify-between font-normal"
              aria-invalid={!!error}
            >
              <span
                className={cn(
                  'truncate',
                  !value && 'text-muted-foreground',
                )}
              >
                {label}
              </span>
              <ChevronsUpDown className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <PopoverContent
          align="start"
          className="w-(--anchor-width) min-w-72 p-0"
        >
          {!criarNovo ? (
            <div className="flex flex-col">
              <div className="flex items-center gap-2 border-b border-brand-100 px-3 py-2">
                <Search className="size-3.5 text-muted-foreground" />
                <input
                  autoFocus
                  value={termo}
                  onChange={(e) => setTermo(e.target.value)}
                  placeholder="Buscar por nome ou telefone..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              <ul className="max-h-56 overflow-y-auto py-1">
                {isPending && results.length === 0 && (
                  <li className="px-3 py-2 text-xs text-muted-foreground">
                    Buscando...
                  </li>
                )}
                {!isPending && results.length === 0 && (
                  <li className="px-3 py-2 text-xs text-muted-foreground">
                    Nenhum cliente encontrado.
                  </li>
                )}
                {results.map((c) => {
                  const isSelected =
                    value?.tipo === 'existente' && value.cliente.id === c.id
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => selecionarExistente(c)}
                        className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-brand-50"
                      >
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">
                            {c.nome ?? '(sem nome)'}
                          </span>
                          <span className="block truncate text-xs text-muted-foreground font-mono">
                            {c.telefone}
                          </span>
                        </span>
                        {isSelected && <Check className="size-4 text-brand" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
              <div className="border-t border-brand-100 p-1">
                <button
                  type="button"
                  onClick={() => setCriarNovo(true)}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-brand hover:bg-brand-50"
                >
                  <UserPlus className="size-4" /> Criar novo cliente
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 p-3">
              <div className="space-y-1.5">
                <Label htmlFor="novo-nome">Nome</Label>
                <Input
                  id="novo-nome"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  placeholder="João Silva"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="novo-tel">WhatsApp</Label>
                <Input
                  id="novo-tel"
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(e.target.value)}
                  placeholder="(31) 99999-0000"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCriarNovo(false)}
                >
                  Voltar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="bg-brand hover:bg-brand-light text-white"
                  onClick={aplicarNovo}
                  disabled={!novoNome.trim() || !novoTelefone.trim()}
                >
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
