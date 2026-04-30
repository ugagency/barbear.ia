import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PricingFeature {
  label: string
  incluido: boolean
}

export interface PricingCardProps {
  nome: string
  preco: number
  periodo?: string
  destaque?: boolean
  badge?: string
  descricao: string
  features: PricingFeature[]
  ctaLabel: string
  ctaHref: string
}

export function PricingCard({
  nome,
  preco,
  periodo = '/mês',
  destaque,
  badge,
  descricao,
  features,
  ctaLabel,
  ctaHref,
}: PricingCardProps) {
  return (
    <div
      className={cn(
        'relative rounded-2xl p-6 sm:p-8 flex flex-col h-full',
        destaque
          ? 'bg-brand text-white shadow-2xl shadow-brand/20 ring-1 ring-brand/40'
          : 'bg-white text-slate-900 border border-brand-100',
      )}
    >
      {badge && (
        <span
          className={cn(
            'absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-full',
            destaque
              ? 'bg-white text-brand'
              : 'bg-brand text-white',
          )}
        >
          {badge}
        </span>
      )}

      <div>
        <h3
          className={cn(
            'text-xl font-bold',
            destaque ? 'text-white' : 'text-brand',
          )}
        >
          {nome}
        </h3>
        <p
          className={cn(
            'mt-1 text-sm',
            destaque ? 'text-white/70' : 'text-slate-500',
          )}
        >
          {descricao}
        </p>
        <p className="mt-5 flex items-baseline gap-1">
          <span
            className={cn(
              'text-4xl font-bold font-mono',
              destaque ? 'text-white' : 'text-brand',
            )}
          >
            R$ {preco}
          </span>
          <span
            className={cn(
              'text-sm',
              destaque ? 'text-white/60' : 'text-slate-500',
            )}
          >
            {periodo}
          </span>
        </p>
      </div>

      <ul className="mt-6 space-y-3 flex-1">
        {features.map((f) => (
          <li key={f.label} className="flex items-start gap-2.5 text-sm">
            {f.incluido ? (
              <Check
                className={cn(
                  'size-4 mt-0.5 shrink-0',
                  destaque ? 'text-white' : 'text-brand',
                )}
              />
            ) : (
              <X
                className={cn(
                  'size-4 mt-0.5 shrink-0',
                  destaque ? 'text-white/30' : 'text-slate-300',
                )}
              />
            )}
            <span
              className={cn(
                f.incluido
                  ? destaque
                    ? 'text-white/90'
                    : 'text-slate-700'
                  : destaque
                    ? 'text-white/40 line-through'
                    : 'text-slate-400 line-through',
              )}
            >
              {f.label}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <Button
          size="lg"
          className={cn(
            'w-full',
            destaque
              ? 'bg-white text-brand hover:bg-brand-50'
              : 'bg-brand text-white hover:bg-brand-light',
          )}
          render={<Link href={ctaHref} />}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  )
}
