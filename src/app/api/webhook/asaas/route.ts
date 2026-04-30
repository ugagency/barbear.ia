import { NextResponse, type NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

interface AsaasWebhookPayment {
  id: string
  customer: string
  subscription?: string
  status: string
  invoiceUrl?: string
  dueDate?: string
  nextDueDate?: string
}

interface AsaasWebhookSubscription {
  id: string
  customer: string
  status: string
}

interface AsaasWebhookEvent {
  event: string
  payment?: AsaasWebhookPayment
  subscription?: AsaasWebhookSubscription
}

export async function POST(request: NextRequest) {
  const token = request.headers.get('asaas-access-token')
  if (token !== process.env.ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: AsaasWebhookEvent
  try {
    body = (await request.json()) as AsaasWebhookEvent
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const customerId =
    body.payment?.customer ?? body.subscription?.customer
  if (!customerId) {
    return NextResponse.json({ ok: true })
  }

  const { data: barbearia } = await supabaseAdmin
    .from('barbearias')
    .select('id, plano_status')
    .eq('asaas_customer_id', customerId)
    .maybeSingle()

  if (!barbearia) {
    return NextResponse.json({ ok: true })
  }

  switch (body.event) {
    case 'PAYMENT_CONFIRMED':
    case 'PAYMENT_RECEIVED': {
      // Idempotente: não regredir de 'ativo'
      if (barbearia.plano_status !== 'ativo') {
        await supabaseAdmin
          .from('barbearias')
          .update({
            plano_status: 'ativo',
            proxima_cobranca: body.payment?.nextDueDate
              ? new Date(body.payment.nextDueDate).toISOString()
              : null,
          })
          .eq('id', barbearia.id)
      }
      break
    }
    case 'PAYMENT_OVERDUE': {
      await supabaseAdmin
        .from('barbearias')
        .update({ plano_status: 'inadimplente' })
        .eq('id', barbearia.id)
      break
    }
    case 'SUBSCRIPTION_CANCELLED': {
      await supabaseAdmin
        .from('barbearias')
        .update({
          plano: 'trial',
          plano_status: 'cancelado',
          asaas_subscription_id: null,
        })
        .eq('id', barbearia.id)
      break
    }
  }

  return NextResponse.json({ ok: true })
}
