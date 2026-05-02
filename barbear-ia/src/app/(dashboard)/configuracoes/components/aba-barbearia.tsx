'use client'

import { useRef, useState, useTransition } from 'react'
import Image from 'next/image'
import { Loader2, Upload, Link as LinkIcon, Copy, ExternalLink, Check } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { atualizarBarbearia, uploadLogo } from '../actions'
import { PLANOS } from '@/lib/constants'
import type { Barbearia, Plano } from '@/types'

const PLANO_VARIANT: Record<Plano, string> = {
  trial: 'bg-amber-100 text-amber-800',
  starter: 'bg-brand-50 text-brand',
  pro: 'bg-brand text-white',
}

interface Props {
  barbearia: Barbearia
  onSaved: () => void
}

export function AbaBarbearia({ barbearia, onSaved }: Props) {
  const [nome, setNome] = useState(barbearia.nome)
  const [telefone, setTelefone] = useState(barbearia.telefone ?? '')
  const [email, setEmail] = useState(barbearia.email ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(barbearia.logo_url)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [isUploading, startUploading] = useTransition()

  const plano = barbearia.plano as Plano
  const planoInfo = PLANOS[plano]
  const trialEnds = barbearia.trial_ends_at
    ? new Date(barbearia.trial_ends_at)
    : null

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    if (f.size > 2 * 1024 * 1024) {
      toast.error('Arquivo maior que 2MB.')
      return
    }
    setPendingFile(f)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') setPreview(reader.result)
    }
    reader.readAsDataURL(f)
  }

  function handleUpload() {
    if (!pendingFile) return
    startUploading(async () => {
      const fd = new FormData()
      fd.append('file', pendingFile)
      const result = await uploadLogo(fd)
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Logo atualizado.')
      setPendingFile(null)
      if (result.data?.url) setPreview(result.data.url)
      onSaved()
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (nome.trim().length < 2) errs.nome = 'Informe o nome'
    if (telefone.replace(/\D/g, '').length < 10)
      errs.telefone = 'Telefone inválido'
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      errs.email = 'Email inválido'
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    startTransition(async () => {
      const result = await atualizarBarbearia({
        nome,
        telefone,
        email: email || undefined,
      })
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success('Dados da barbearia atualizados.')
      onSaved()
    })
  }

  return (
    <div className="space-y-5">
      <LinkAgendamento slug={barbearia.slug} />

      <section className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-brand">Dados da barbearia</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Informações básicas usadas no painel e nas mensagens da IA.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-5 items-start">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-slate-500">
                Logo
              </Label>
              <div className="size-32 rounded-lg border-2 border-dashed border-brand-100 bg-brand-50/40 overflow-hidden flex items-center justify-center">
                {preview ? (
                  <Image
                    src={preview}
                    alt="Logo da barbearia"
                    width={128}
                    height={128}
                    className="object-contain w-full h-full"
                    unoptimized
                  />
                ) : (
                  <span className="text-xs text-slate-400 text-center px-2">
                    Sem logo
                  </span>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="flex flex-col gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="size-3.5" /> Escolher
                </Button>
                {pendingFile && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleUpload}
                    disabled={isUploading}
                    className="bg-brand hover:bg-brand-light text-white"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="animate-spin" /> Enviando...
                      </>
                    ) : (
                      'Enviar logo'
                    )}
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                PNG, JPG ou WebP, até 2MB.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="cfg-nome">Nome</Label>
                <Input
                  id="cfg-nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  aria-invalid={!!errors.nome}
                />
                {errors.nome && (
                  <p className="text-xs text-red-600">{errors.nome}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cfg-telefone">WhatsApp principal</Label>
                <Input
                  id="cfg-telefone"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="5531999990000"
                  aria-invalid={!!errors.telefone}
                />
                {errors.telefone && (
                  <p className="text-xs text-red-600">{errors.telefone}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cfg-email">Email de contato</Label>
                <Input
                  id="cfg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contato@suabarbearia.com"
                  aria-invalid={!!errors.email}
                />
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
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
                'Salvar alterações'
              )}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-brand-100 bg-white p-5 sm:p-6">
        <h2 className="text-base font-semibold text-brand">Plano e identificação</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Informações somente leitura.
        </p>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoRow label="Plano">
            <Badge
              className={cn(
                'border-transparent text-[10px] uppercase tracking-wide',
                PLANO_VARIANT[plano],
              )}
            >
              {planoInfo?.nome ?? plano}
            </Badge>
          </InfoRow>
          <InfoRow label="Status do plano">
            <span className="text-sm capitalize">{barbearia.plano_status}</span>
          </InfoRow>
          {plano === 'trial' && trialEnds && (
            <InfoRow label="Trial expira em">
              <span className="text-sm font-mono">
                {trialEnds.toLocaleDateString('pt-BR')}
              </span>
            </InfoRow>
          )}
          <InfoRow label="Slug" muted>
            <span className="text-xs font-mono text-slate-500">
              {barbearia.slug}
            </span>
          </InfoRow>
          <InfoRow label="Instance name" muted>
            <span className="text-xs font-mono text-slate-500">
              {barbearia.instance_name}
            </span>
          </InfoRow>
        </div>

        <Separator className="my-4" />
        <p className="text-xs text-slate-500">
          Para alterar plano, entre em contato com o suporte.
        </p>
      </section>
    </div>
  )
}

function LinkAgendamento({ slug }: { slug: string }) {
  const [copiado, setCopiado] = useState(false)
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== 'undefined' ? window.location.origin : '')
  const link = `${baseUrl}/agendar/${slug}`

  function copiar() {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(true)
      toast.success('Link copiado!')
      setTimeout(() => setCopiado(false), 2000)
    })
  }

  return (
    <section className="rounded-xl border border-brand-100 bg-gradient-to-br from-brand-50/60 to-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="size-10 rounded-lg bg-brand text-white flex items-center justify-center shrink-0">
          <LinkIcon className="size-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-semibold text-brand">
            Seu link de agendamento
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compartilhe com seus clientes no WhatsApp, Instagram ou bio.
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <div className="flex-1 min-w-0 rounded-lg border border-brand-100 bg-white px-3 py-2 text-xs sm:text-sm font-mono text-slate-700 truncate">
          {link}
        </div>
        <div className="flex gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copiar}
            className="flex-1 sm:flex-none"
          >
            {copiado ? (
              <>
                <Check className="size-3.5" /> Copiado
              </>
            ) : (
              <>
                <Copy className="size-3.5" /> Copiar
              </>
            )}
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-brand hover:bg-brand-light text-white flex-1 sm:flex-none"
            render={
              <a href={link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-3.5" /> Abrir
              </a>
            }
          />
        </div>
      </div>
    </section>
  )
}

function InfoRow({
  label,
  children,
  muted,
}: {
  label: string
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <div className="space-y-1">
      <p
        className={cn(
          'text-[11px] uppercase tracking-wide',
          muted ? 'text-slate-400' : 'text-slate-500',
        )}
      >
        {label}
      </p>
      <div>{children}</div>
    </div>
  )
}
