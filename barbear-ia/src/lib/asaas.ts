export interface AsaasCustomer {
  id: string
  name: string
  email: string
}

export interface AsaasSubscription {
  id: string
  status: string
  nextDueDate: string
  value: number
  invoiceUrl?: string
}

export interface AsaasPayment {
  id: string
  status: string
  value: number
  invoiceUrl?: string
  dueDate: string
}

function baseUrl(): string {
  return (
    process.env.ASAAS_API_URL ?? 'https://sandbox.asaas.com/api/v3'
  ).replace(/\/$/, '')
}

function asaasHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    access_token: process.env.ASAAS_API_KEY ?? '',
  }
}

async function asaasPost<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: asaasHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const data = (await res.json()) as {
      errors?: { description: string }[]
    }
    throw new Error(
      data.errors?.[0]?.description ?? `Asaas error: ${res.status}`,
    )
  }
  return res.json() as Promise<T>
}

async function asaasGet<T>(path: string): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    headers: asaasHeaders(),
    cache: 'no-store',
  })
  if (!res.ok) throw new Error(`Asaas error: ${res.status}`)
  return res.json() as Promise<T>
}

export async function criarCliente(input: {
  nome: string
  email: string
}): Promise<AsaasCustomer> {
  return asaasPost<AsaasCustomer>('/customers', {
    name: input.nome,
    email: input.email,
    notificationDisabled: false,
  })
}

export async function criarAssinatura(input: {
  customerId: string
  value: number
  nextDueDate: string
  description: string
  cycle: 'MONTHLY' | 'YEARLY'
}): Promise<AsaasSubscription> {
  return asaasPost<AsaasSubscription>('/subscriptions', {
    customer: input.customerId,
    billingType: 'BOLETO',
    value: input.value,
    nextDueDate: input.nextDueDate,
    description: input.description,
    cycle: input.cycle,
  })
}

export async function cancelarAssinatura(subscriptionId: string): Promise<void> {
  const res = await fetch(`${baseUrl()}/subscriptions/${subscriptionId}`, {
    method: 'DELETE',
    headers: asaasHeaders(),
  })
  if (!res.ok && res.status !== 404) {
    throw new Error(`Asaas error: ${res.status}`)
  }
}

export async function buscarAssinatura(
  subscriptionId: string,
): Promise<AsaasSubscription> {
  return asaasGet<AsaasSubscription>(`/subscriptions/${subscriptionId}`)
}

export async function listarCobrancas(
  subscriptionId: string,
): Promise<AsaasPayment[]> {
  const body = await asaasGet<{ data: AsaasPayment[] }>(
    `/payments?subscription=${subscriptionId}&status=PENDING,OVERDUE`,
  )
  return body.data
}

export function proximaDataCobranca(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
