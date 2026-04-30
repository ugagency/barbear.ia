import type { Metadata } from 'next'
import { Star } from 'lucide-react'
import { PricingCard } from '@/components/marketing/pricing-card'
import { FUNDADORES_TOTAL_VAGAS } from '@/lib/constants'
import { contarFundadores } from '@/app/(dashboard)/configuracoes/actions'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Preços — Barbear.IA',
  description: 'Planos Starter e Pro. Cancele quando quiser. Sem fidelidade.',
}

export default async function PricingPage() {
  const fundadoresUsados = await contarFundadores()
  const vagasRestantes = Math.max(0, FUNDADORES_TOTAL_VAGAS - fundadoresUsados)

  return (
    <>
      <section className="pt-28 sm:pt-32 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              Planos
            </span>
            <h1 className="mt-3 text-4xl sm:text-5xl font-bold text-brand leading-tight">
              Preços simples,
              <br />
              <span className="text-slate-700">para todo tamanho.</span>
            </h1>
            <p className="mt-4 text-slate-600">
              Comece grátis por 7 dias. Sem cartão. Cancele a qualquer momento.
            </p>
          </div>

          {/* Oferta de Fundadores */}
          {vagasRestantes > 0 && (
            <div className="mt-10 max-w-3xl mx-auto rounded-2xl border border-yellow-300 bg-gradient-to-r from-yellow-50 via-amber-50 to-yellow-50 p-6 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="size-10 rounded-full bg-yellow-200 flex items-center justify-center shrink-0">
                <Star className="size-5 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-yellow-800">
                  🔥 Oferta de Fundadores — apenas {vagasRestantes} vaga
                  {vagasRestantes !== 1 ? 's' : ''} restante
                  {vagasRestantes !== 1 ? 's' : ''}
                </p>
                <p className="text-sm text-yellow-700 mt-0.5">
                  Plano <strong>Pro completo</strong> por{' '}
                  <strong>R$49/mês para sempre</strong>. Exclusivo para os
                  primeiros {FUNDADORES_TOTAL_VAGAS} clientes. Sem aumento
                  de preço nunca.
                </p>
              </div>
              <Button
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shrink-0"
                render={<Link href="/cadastro" />}
              >
                Garantir vaga
              </Button>
            </div>
          )}

          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <PricingCard
              nome="Starter"
              preco={49}
              descricao="Para quem começa a automatizar."
              features={[
                { label: 'Atendimento automático 24h', incluido: true },
                { label: 'Agendamento via WhatsApp', incluido: true },
                { label: 'Lembretes automáticos', incluido: true },
                { label: 'Até 2 barbeiros', incluido: true },
                { label: 'Recuperação de inativos', incluido: false },
                { label: 'Métricas avançadas', incluido: false },
              ]}
              ctaLabel="Começar grátis"
              ctaHref="/cadastro"
            />
            <PricingCard
              nome="Pro"
              preco={97}
              descricao="Para quem quer crescer no automático."
              destaque
              badge="Mais popular"
              features={[
                { label: 'Tudo do Starter', incluido: true },
                { label: 'Até 5 barbeiros', incluido: true },
                { label: 'Recuperação de clientes inativos', incluido: true },
                { label: 'Métricas e relatórios completos', incluido: true },
                { label: 'Suporte prioritário', incluido: true },
              ]}
              ctaLabel="Testar 7 dias grátis"
              ctaHref="/cadastro"
            />
          </div>

          {/* Planos anuais */}
          <div className="mt-6 max-w-3xl mx-auto rounded-xl bg-brand-50 border border-brand-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <p className="text-sm text-slate-700 flex-1">
              <strong className="text-brand">Plano anual</strong> — economize 2 meses:{' '}
              <span className="font-semibold">Starter R$490/ano</span> · <span className="font-semibold">Pro R$970/ano</span>
            </p>
            <Link
              href="/cadastro"
              className="text-sm font-semibold text-brand hover:text-brand-light underline underline-offset-2 shrink-0"
            >
              Fale com o suporte
            </Link>
          </div>

          <p className="mt-4 text-center text-xs text-slate-500">
            Cancele quando quiser. Sem fidelidade. Pix, cartão ou boleto.
          </p>
        </div>
      </section>

      <section className="bg-brand-50/40 border-t border-brand-100 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-brand text-center">
            Perguntas comuns sobre planos
          </h2>
          <dl className="mt-8 space-y-4 text-sm text-slate-600">
            <Item
              q="Posso mudar de plano depois?"
              a="Sim, a qualquer momento. A cobrança é proporcional aos dias usados."
            />
            <Item
              q="Tem desconto anual?"
              a="Sim, equivalente a 2 meses grátis. Starter R$490/ano, Pro R$970/ano."
            />
            <Item
              q="O trial cobra automaticamente?"
              a="Não. Sem cartão no trial. Você só ativa o pagamento quando decidir continuar."
            />
            <Item
              q="O que é a Oferta de Fundadores?"
              a={`Exclusiva para os primeiros ${FUNDADORES_TOTAL_VAGAS} clientes: plano Pro completo por R$49/mês para sempre. Nunca terá aumento de preço.`}
            />
          </dl>
        </div>
      </section>
    </>
  )
}

function Item({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-xl bg-white border border-brand-100 p-5">
      <dt className="font-semibold text-brand">{q}</dt>
      <dd className="mt-1.5 leading-relaxed">{a}</dd>
    </div>
  )
}
