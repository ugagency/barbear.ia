import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CheckCircle2, Calendar, Clock, MapPin, Scissors } from 'lucide-react'
import { createAnonClient } from '@/lib/supabase/anon'

const DIAS_LONGOS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda-feira',
  2: 'Terça-feira',
  3: 'Quarta-feira',
  4: 'Quinta-feira',
  5: 'Sexta-feira',
  6: 'Sábado',
}

const MESES: Record<number, string> = {
  0: 'Janeiro',
  1: 'Fevereiro',
  2: 'Março',
  3: 'Abril',
  4: 'Maio',
  5: 'Junho',
  6: 'Julho',
  7: 'Agosto',
  8: 'Setembro',
  9: 'Outubro',
  10: 'Novembro',
  11: 'Dezembro',
}

function formatHora(d: Date): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default async function ConfirmadoPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{
    servico?: string
    barbeiro?: string
    inicio?: string
    fim?: string
  }>
}) {
  const { slug } = await params
  const sp = await searchParams

  const supabase = createAnonClient()
  const { data: barbearia } = await supabase
    .from('barbearias')
    .select('id, nome, slug')
    .eq('slug', slug)
    .eq('plano_status', 'ativo')
    .maybeSingle()

  if (!barbearia) notFound()

  const inicio = sp.inicio ? new Date(sp.inicio) : null
  const fim = sp.fim ? new Date(sp.fim) : null
  const dataValida = inicio && !Number.isNaN(inicio.getTime())

  const nomeBarbearia = (barbearia as { nome: string }).nome

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full space-y-5">
        <div className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm text-center space-y-4">
          <div className="size-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="size-8" />
          </div>
          <h1 className="text-2xl font-bold text-brand">
            Agendamento confirmado!
          </h1>
          <p className="text-sm text-slate-600">
            Seu horário foi reservado com sucesso.
          </p>
        </div>

        {dataValida && (
          <div className="rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 space-y-3">
            {sp.servico && (
              <DetailRow icon={<Scissors className="size-4" />}>
                <span className="font-semibold">{sp.servico}</span>
                {sp.barbeiro && (
                  <>
                    {' com '}
                    <span className="font-semibold">{sp.barbeiro}</span>
                  </>
                )}
              </DetailRow>
            )}
            <DetailRow icon={<Calendar className="size-4" />}>
              {DIAS_LONGOS[inicio.getDay()]},{' '}
              {String(inicio.getDate()).padStart(2, '0')} de{' '}
              {MESES[inicio.getMonth()]} de {inicio.getFullYear()}
            </DetailRow>
            <DetailRow icon={<Clock className="size-4" />}>
              {formatHora(inicio)}
              {fim && !Number.isNaN(fim.getTime()) && ` — ${formatHora(fim)}`}
            </DetailRow>
            <DetailRow icon={<MapPin className="size-4" />}>
              {nomeBarbearia}
            </DetailRow>
          </div>
        )}

        <div className="rounded-2xl bg-brand-50 border border-brand-100 p-5 text-center">
          <p className="text-sm text-brand">
            📱 Você receberá um lembrete pelo WhatsApp no dia do seu
            atendimento.
          </p>
        </div>

        <Link
          href={`/agendar/${slug}`}
          className="block w-full text-center rounded-lg bg-brand text-white px-5 py-3 text-sm font-semibold hover:bg-brand-light transition"
        >
          Fazer outro agendamento
        </Link>
      </div>
    </div>
  )
}

function DetailRow({
  icon,
  children,
}: {
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 text-sm text-slate-700">
      <span className="text-brand mt-0.5">{icon}</span>
      <span className="flex-1">{children}</span>
    </div>
  )
}
