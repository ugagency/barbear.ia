import Link from 'next/link'
import {
  ArrowDown,
  ArrowRight,
  Bell,
  CalendarCheck,
  Ghost,
  History,
  MessageSquare,
  Moon,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionPanel,
} from '@/components/ui/accordion'
import { WhatsappMockup } from '@/components/marketing/whatsapp-mockup'

export default function LandingPage() {
  return (
    <>
      {/* ============================================
          HERO
          ============================================ */}
      <section className="relative pt-28 sm:pt-32 pb-20 sm:pb-28 overflow-hidden">
        {/* Decorative background */}
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(10,31,68,0.08),transparent)]"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,rgba(10,31,68,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,31,68,0.04)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]"
        />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand-50 px-3 py-1 text-xs font-medium text-brand">
            <Sparkles className="size-3" />
            Recepcionista digital para barbearias
          </div>

          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-brand leading-[1.05]">
            Sua barbearia atendendo
            <br />
            <span className="bg-gradient-to-r from-brand to-brand-light bg-clip-text text-transparent">
              sempre
            </span>
            , sem você precisar.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            IA que <strong className="text-slate-800">agenda, confirma, lembra e recupera</strong>{' '}
            clientes — direto no WhatsApp. Você foca no corte.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-brand hover:bg-brand-light text-white px-6"
              render={<Link href="/cadastro" />}
            >
              Testar grátis 7 dias <ArrowRight className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              render={<Link href="#funcionalidades" />}
            >
              Ver como funciona <ArrowDown className="size-4" />
            </Button>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 sm:gap-10 flex-wrap text-sm text-slate-500">
            <Stat value="24h" label="atendimento" />
            <span className="text-slate-200" aria-hidden>
              ·
            </span>
            <Stat value="0s" label="resposta" />
            <span className="text-slate-200" aria-hidden>
              ·
            </span>
            <Stat value="-40%" label="no-show" />
          </div>
        </div>
      </section>

      {/* ============================================
          PROBLEMA
          ============================================ */}
      <section className="bg-brand-50 py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand">
              Você está perdendo clientes
              <br />
              <span className="text-slate-700">sem perceber.</span>
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            <DorCard
              icon={<Moon className="size-5" />}
              titulo="Fora do horário"
              texto="Cliente manda às 23h. Você não responde. Ele marca em outro lugar."
            />
            <DorCard
              icon={<CalendarCheck className="size-5" />}
              titulo="Agenda bagunçada"
              texto="Dois clientes no mesmo horário. Confirmação feita no boca a boca."
            />
            <DorCard
              icon={<Ghost className="size-5" />}
              titulo="Clientes que somem"
              texto="Não voltou há 45 dias. Você não sabe, não fala, não recupera."
            />
          </div>
        </div>
      </section>

      {/* ============================================
          COMO FUNCIONA
          ============================================ */}
      <section id="funcionalidades" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand">
              Como funciona
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-brand">
              Uma recepcionista que nunca dorme.
            </h2>
            <p className="mt-3 text-slate-600">
              A IA conversa pelo WhatsApp, encaixa no horário disponível, manda
              lembretes e traz quem sumiu. Tudo automático.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ul className="space-y-4">
              <Funcionalidade
                icon={<MessageSquare className="size-5" />}
                titulo="Atendimento instantâneo 24h"
                texto="Responde em segundos, qualquer hora, qualquer dia."
              />
              <Funcionalidade
                icon={<CalendarCheck className="size-5" />}
                titulo="Agendamento sem conflito"
                texto="Verifica disponibilidade, encaixa o cliente e bloqueia o horário."
              />
              <Funcionalidade
                icon={<Bell className="size-5" />}
                titulo="Lembretes anti-falta"
                texto="Avisa o cliente 1 hora antes. No-show despenca."
              />
              <Funcionalidade
                icon={<RefreshCw className="size-5" />}
                titulo="Recupera quem sumiu"
                texto="Cliente sem corte há 30+ dias recebe convite automático."
              />
              <Funcionalidade
                icon={<History className="size-5" />}
                titulo="Histórico inteligente"
                texto="Lembra preferências, serviços favoritos e ticket médio."
              />
            </ul>

            <div className="lg:pl-8">
              <WhatsappMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ============================================
          SETUP (fundo brand)
          ============================================ */}
      <section className="relative bg-brand text-white py-20 sm:py-24 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 [background-image:linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/60">
              Setup simples
            </span>
            <h2 className="mt-3 text-3xl sm:text-4xl font-bold">
              Funcionando em menos de 1 hora.
            </h2>
          </div>

          <ol className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Passo numero={1} titulo="Cria sua conta" texto="Email e senha. 30 segundos." />
            <Passo numero={2} titulo="Conecta o WhatsApp" texto="Escaneia um QR code. Pronto." />
            <Passo numero={3} titulo="Configura a agenda" texto="Barbeiros, serviços e horários." />
            <Passo numero={4} titulo="Vai cortar cabelo" texto="A IA toma conta do resto." />
          </ol>
        </div>
      </section>

      {/* ============================================
          FAQ
          ============================================ */}
      <section id="faq" className="bg-brand-50/40 py-20 sm:py-24 border-y border-brand-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-brand">
              Perguntas frequentes
            </h2>
            <p className="mt-3 text-slate-600">
              Não encontrou? Mande mensagem pelo WhatsApp.
            </p>
          </div>

          <div className="mt-10 rounded-xl bg-white border border-brand-100 px-6">
            <Accordion>
              <AccordionItem value="instalar">
                <AccordionTrigger>
                  Precisa instalar algum app?
                </AccordionTrigger>
                <AccordionPanel>
                  Não. Funciona pelo mesmo WhatsApp que você já usa. Você
                  conecta o número da barbearia uma vez e pronto.
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem value="ia">
                <AccordionTrigger>
                  Os clientes sabem que é IA?
                </AccordionTrigger>
                <AccordionPanel>
                  A maioria não percebe. A linguagem é natural e informal — bom
                  dia, emoji, jeitinho de barbearia. Quando perguntam, a IA
                  pode responder com transparência.
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem value="multiplos">
                <AccordionTrigger>
                  Funciona com mais de um barbeiro?
                </AccordionTrigger>
                <AccordionPanel>
                  Sim. Você cadastra cada barbeiro com seus serviços, preços e
                  horários próprios. A IA escolhe o profissional certo para
                  cada cliente.
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem value="cancelar">
                <AccordionTrigger>E se eu quiser cancelar?</AccordionTrigger>
                <AccordionPanel>
                  Basta falar com a nossa equipe. Sem multa e sem burocracia:
                  combinamos o encerramento com você.
                </AccordionPanel>
              </AccordionItem>
              <AccordionItem value="erro">
                <AccordionTrigger>
                  E se a IA errar um agendamento?
                </AccordionTrigger>
                <AccordionPanel>
                  Você tem painel em tempo real para ver tudo. Pode editar,
                  cancelar ou criar agendamento manual a qualquer momento. Se
                  algo escapou, é correção em segundos.
                </AccordionPanel>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* ============================================
          CTA FINAL
          ============================================ */}
      <section className="relative bg-brand-dark text-white py-20 sm:py-28 overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(255,255,255,0.06),transparent)]"
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <Zap className="size-7 text-white mx-auto mb-4" />
          <h2 className="text-3xl sm:text-4xl font-bold leading-tight">
            Sua barbearia merece
            <br /> trabalhar por você.
          </h2>
          <p className="mt-4 text-white/70 max-w-md mx-auto">
            Teste por 7 dias, sem compromisso, com a nossa equipe ao seu lado.
          </p>
          <div className="mt-8">
            <Button
              size="lg"
              className="bg-white text-brand hover:bg-brand-50 px-6"
              render={<Link href="/cadastro" />}
            >
              Começar agora — é grátis <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}

// ============================================
// Subcomponentes
// ============================================

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <span className="text-base font-bold font-mono text-brand">{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  )
}

function DorCard({
  icon,
  titulo,
  texto,
}: {
  icon: React.ReactNode
  titulo: string
  texto: string
}) {
  return (
    <div className="rounded-xl bg-white border border-brand-100 p-6 hover:shadow-md hover:border-brand/30 transition-all">
      <div className="size-10 rounded-lg bg-brand-50 text-brand flex items-center justify-center">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-brand">{titulo}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{texto}</p>
    </div>
  )
}

function Funcionalidade({
  icon,
  titulo,
  texto,
}: {
  icon: React.ReactNode
  titulo: string
  texto: string
}) {
  return (
    <li className="flex gap-4 group">
      <div className="size-10 shrink-0 rounded-lg bg-brand-50 text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-base font-semibold text-brand">{titulo}</h3>
        <p className="mt-1 text-sm text-slate-600 leading-relaxed">{texto}</p>
      </div>
    </li>
  )
}

function Passo({
  numero,
  titulo,
  texto,
}: {
  numero: number
  titulo: string
  texto: string
}) {
  return (
    <li className="relative rounded-xl bg-white/5 border border-white/10 p-5 hover:bg-white/10 transition-colors">
      <span className="text-3xl font-bold font-mono text-white/20 leading-none">
        {String(numero).padStart(2, '0')}
      </span>
      <h3 className="mt-3 text-base font-semibold">{titulo}</h3>
      <p className="mt-1 text-sm text-white/70 leading-relaxed">{texto}</p>
    </li>
  )
}
