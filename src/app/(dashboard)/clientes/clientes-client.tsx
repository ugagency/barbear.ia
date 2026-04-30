'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  MoreVertical,
  History,
  Edit3,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ResumoClientes } from './components/resumo-clientes'
import { ModalEditarCliente } from './components/modal-editar-cliente'
import { reativarCliente } from './actions'
import type { ClienteListItem, StatusCliente } from './types'

const STATUS_LABEL: Record<StatusCliente, string> = {
  ativo: 'Ativo',
  risco: 'Em risco',
  inativo: 'Inativo',
}

const STATUS_STYLES: Record<StatusCliente, string> = {
  ativo: 'bg-emerald-50 text-emerald-700',
  risco: 'bg-amber-50 text-amber-700',
  inativo: 'bg-red-50 text-red-700',
}

type Ordenacao = 'ultimo' | 'total' | 'nome'

const PAGE_SIZE = 20

function formatTelefone(t: string): string {
  const digits = t.replace(/\D/g, '')
  if (digits.length === 13) {
    return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
  }
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  return digits
}

function formatUltimoAtendimento(dias: number | null): string {
  if (dias === null) return 'Nunca'
  if (dias === 0) return 'Hoje'
  if (dias === 1) return 'Ontem'
  if (dias < 30) return `${dias} dias atrás`
  if (dias < 60) return `${Math.floor(dias / 7)} sem atrás`
  return `${Math.floor(dias / 30)} meses atrás`
}

interface Props {
  clientes: ClienteListItem[]
}

export function ClientesClient({ clientes }: Props) {
  const router = useRouter()
  const [busca, setBusca] = useState('')
  const [buscaDebounce, setBuscaDebounce] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<'todos' | StatusCliente>(
    'todos',
  )
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('ultimo')
  const [pagina, setPagina] = useState(1)
  const [edicao, setEdicao] = useState<ClienteListItem | null>(null)
  const [isPending, startTransition] = useTransition()

  // Debounce busca
  useEffect(() => {
    const handle = setTimeout(() => setBuscaDebounce(busca), 300)
    return () => clearTimeout(handle)
  }, [busca])

  // Reset paginação quando filtros mudam
  useEffect(() => {
    setPagina(1)
  }, [buscaDebounce, filtroStatus, ordenacao])

  const filtrados = useMemo(() => {
    const termo = buscaDebounce.trim().toLowerCase()
    const termoDigits = termo.replace(/\D/g, '')

    let arr = clientes
    if (filtroStatus !== 'todos') {
      arr = arr.filter((c) => c.status === filtroStatus)
    }
    if (termo.length > 0) {
      arr = arr.filter((c) => {
        const nomeMatch = c.nome?.toLowerCase().includes(termo) ?? false
        const telMatch =
          termoDigits.length >= 3 && c.telefone.includes(termoDigits)
        return nomeMatch || telMatch
      })
    }

    const sorted = [...arr]
    if (ordenacao === 'nome') {
      sorted.sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? ''))
    } else if (ordenacao === 'total') {
      sorted.sort((a, b) => b.total_atendimentos - a.total_atendimentos)
    } else {
      sorted.sort((a, b) => {
        const da = a.dias_desde_ultimo
        const db = b.dias_desde_ultimo
        if (da === null && db === null) return 0
        if (da === null) return 1
        if (db === null) return -1
        return da - db
      })
    }
    return sorted
  }, [clientes, buscaDebounce, filtroStatus, ordenacao])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const visiveis = filtrados.slice(
    (paginaAtual - 1) * PAGE_SIZE,
    paginaAtual * PAGE_SIZE,
  )

  function handleReativar(cliente: ClienteListItem) {
    startTransition(async () => {
      const result = await reativarCliente(cliente.id)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Cliente reativado.')
      router.refresh()
    })
  }

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl mx-auto">
      <header>
        <h1 className="text-2xl font-bold text-brand">Clientes</h1>
        <p className="text-sm text-slate-500">
          Gerencie a base de clientes da sua barbearia.
        </p>
      </header>

      <ResumoClientes clientes={clientes} />

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-slate-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="pl-8 h-9"
          />
        </div>
        <Select
          value={filtroStatus}
          onValueChange={(v) =>
            setFiltroStatus(
              typeof v === 'string' ? (v as 'todos' | StatusCliente) : 'todos',
            )
          }
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativo">Ativos</SelectItem>
            <SelectItem value="risco">Em risco</SelectItem>
            <SelectItem value="inativo">Inativos</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={ordenacao}
          onValueChange={(v) =>
            setOrdenacao(typeof v === 'string' ? (v as Ordenacao) : 'ultimo')
          }
        >
          <SelectTrigger className="w-full sm:w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ultimo">Último atendimento</SelectItem>
            <SelectItem value="total">Total de atendimentos</SelectItem>
            <SelectItem value="nome">Nome (A–Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtrados.length === 0 ? (
        <div className="rounded-lg border border-dashed border-brand-100 bg-white p-10 text-center">
          <Users className="size-8 text-brand/40 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700">
            {clientes.length === 0
              ? 'Sem clientes cadastrados ainda'
              : 'Nenhum cliente corresponde aos filtros'}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {clientes.length === 0
              ? 'A IA cadastra clientes automaticamente quando alguém marca pelo WhatsApp.'
              : 'Ajuste a busca ou os filtros.'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-brand-100 bg-white">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Nome
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Telefone
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Último atend.
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide text-right">
                  Total
                </TableHead>
                <TableHead className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visiveis.map((c) => (
                <TableRow key={c.id} className="hover:bg-brand-50/40">
                  <TableCell>
                    <Link
                      href={`/clientes/${c.id}`}
                      className="font-medium text-slate-900 hover:text-brand"
                    >
                      {c.nome ?? '(sem nome)'}
                    </Link>
                    {!c.ativo && (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-slate-400">
                        inativo
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">
                    {formatTelefone(c.telefone)}
                  </TableCell>
                  <TableCell className="text-xs text-slate-600">
                    {formatUltimoAtendimento(c.dias_desde_ultimo)}
                  </TableCell>
                  <TableCell className="font-mono text-sm text-right">
                    {c.total_atendimentos}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={cn(
                        'border-transparent',
                        STATUS_STYLES[c.status],
                      )}
                    >
                      {STATUS_LABEL[c.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            disabled={isPending}
                            aria-label="Ações do cliente"
                          >
                            <MoreVertical className="size-4" />
                          </Button>
                        }
                      />
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          render={
                            <Link href={`/clientes/${c.id}`}>
                              <History className="size-4" />
                              Ver histórico
                            </Link>
                          }
                        />
                        <DropdownMenuItem onClick={() => setEdicao(c)}>
                          <Edit3 className="size-4" />
                          Editar
                        </DropdownMenuItem>
                        {(!c.ativo || c.status === 'inativo') && (
                          <DropdownMenuItem
                            onClick={() => handleReativar(c)}
                            className="text-brand"
                          >
                            <RefreshCw className="size-4" />
                            Reativar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-between border-t border-brand-100 px-4 py-3">
              <p className="text-xs text-slate-500">
                Página {paginaAtual} de {totalPaginas} · {filtrados.length}{' '}
                cliente{filtrados.length === 1 ? '' : 's'}
              </p>
              <div className="flex gap-1.5">
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={paginaAtual === 1}
                  onClick={() => setPagina((p) => p - 1)}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={paginaAtual === totalPaginas}
                  onClick={() => setPagina((p) => p + 1)}
                  aria-label="Próxima página"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <ModalEditarCliente
        cliente={edicao}
        open={!!edicao}
        onOpenChange={(o) => {
          if (!o) setEdicao(null)
        }}
        onSalvo={() => router.refresh()}
      />
    </div>
  )
}
