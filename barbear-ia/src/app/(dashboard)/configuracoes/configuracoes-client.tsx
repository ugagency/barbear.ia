'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AbaBarbearia } from './components/aba-barbearia'
import { AbaBarbeiros } from './components/aba-barbeiros'
import { AbaHorarios } from './components/aba-horarios'
import { AbaWhatsapp } from './components/aba-whatsapp'
import { AbaPlano } from './components/aba-plano'
import type { Barbearia, Barbeiro } from '@/types'

interface Props {
  barbearia: Barbearia
  barbeiros: Barbeiro[]
}

const TAB_VALUES = ['barbearia', 'barbeiros', 'horarios', 'whatsapp', 'plano'] as const
type TabValue = (typeof TAB_VALUES)[number]

const TAB_LABELS: Record<TabValue, string> = {
  barbearia: 'Barbearia',
  barbeiros: 'Barbeiros',
  horarios: 'Horários',
  whatsapp: 'WhatsApp',
  plano: 'Plano',
}

export function ConfiguracoesClient({ barbearia, barbeiros }: Props) {
  const router = useRouter()
  const [tab, setTab] = useState<TabValue>('barbearia')

  function refresh() {
    router.refresh()
  }

  const raw = barbearia as Record<string, unknown>
  const barbeariaPlano = {
    plano: (raw.plano as string) ?? 'trial',
    plano_status: (raw.plano_status as string) ?? 'ativo',
    trial_ends_at: (raw.trial_ends_at as string | null) ?? null,
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-brand">Configurações</h1>
        <p className="text-sm text-slate-500">
          Gerencie barbearia, equipe, horários e integração WhatsApp.
        </p>
      </header>

      {/* Mobile: select de abas */}
      <div className="sm:hidden">
        <Select
          value={tab}
          onValueChange={(v) =>
            typeof v === 'string' ? setTab(v as TabValue) : null
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TAB_VALUES.map((t) => (
              <SelectItem key={t} value={t}>
                {TAB_LABELS[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) =>
          typeof v === 'string' ? setTab(v as TabValue) : null
        }
        className="gap-4"
      >
        <TabsList className="hidden sm:inline-flex">
          {TAB_VALUES.map((t) => (
            <TabsTrigger key={t} value={t}>
              {TAB_LABELS[t]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="barbearia">
          <AbaBarbearia barbearia={barbearia} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="barbeiros">
          <AbaBarbeiros barbeiros={barbeiros} onChange={refresh} />
        </TabsContent>
        <TabsContent value="horarios">
          <AbaHorarios barbeiros={barbeiros} onSaved={refresh} />
        </TabsContent>
        <TabsContent value="whatsapp">
          <AbaWhatsapp instanceName={barbearia.instance_name} />
        </TabsContent>
        <TabsContent value="plano">
          <AbaPlano barbearia={barbeariaPlano} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
