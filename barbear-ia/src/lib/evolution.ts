export interface EvolutionConfig {
  url: string
  key: string
}

export function getEvolutionConfig(): EvolutionConfig | null {
  const url = process.env.EVOLUTION_API_URL
  const key = process.env.EVOLUTION_API_KEY
  if (!url || !key) return null
  return { url: url.replace(/\/$/, ''), key }
}

interface WebhookSetBody {
  webhook: {
    enabled: boolean
    url: string
    byEvents: boolean
    base64: boolean
    events: string[]
  }
}

interface SettingsSetBody {
  rejectCall: boolean
  msgCall: string
  groupsIgnore: boolean
  alwaysOnline: boolean
  readMessages: boolean
  readStatus: boolean
  syncFullHistory: boolean
}

const DEFAULT_SETTINGS: SettingsSetBody = {
  rejectCall: true,
  msgCall:
    'No momento não atendemos chamadas pelo WhatsApp. Para agendar, envie uma mensagem! 💈',
  groupsIgnore: true,
  alwaysOnline: true,
  readMessages: true,
  readStatus: true,
  syncFullHistory: false,
}

const DEFAULT_EVENTS = [
  'MESSAGES_UPSERT',
  'CONNECTION_UPDATE',
  'QRCODE_UPDATED',
]

export async function configurarWebhookESettings(
  instanceName: string,
): Promise<void> {
  const cfg = getEvolutionConfig()
  if (!cfg) return

  const headers = {
    apikey: cfg.key,
    'Content-Type': 'application/json',
  }

  const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL

  try {
    if (n8nWebhookUrl) {
      const body: WebhookSetBody = {
        webhook: {
          enabled: true,
          url: n8nWebhookUrl,
          byEvents: false,
          base64: true,
          events: DEFAULT_EVENTS,
        },
      }
      const webhookRes = await fetch(
        `${cfg.url}/webhook/set/${encodeURIComponent(instanceName)}`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
          cache: 'no-store',
        },
      )
      if (!webhookRes.ok) {
        const text = await webhookRes.text().catch(() => '')
        console.error('[Evolution] Erro ao configurar webhook:', text)
      }
    }

    const settingsRes = await fetch(
      `${cfg.url}/settings/set/${encodeURIComponent(instanceName)}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(DEFAULT_SETTINGS),
        cache: 'no-store',
      },
    )
    if (!settingsRes.ok) {
      const text = await settingsRes.text().catch(() => '')
      console.error('[Evolution] Erro ao configurar settings:', text)
    }
  } catch (err) {
    console.error('[Evolution] Erro ao configurar webhook/settings:', err)
  }
}
