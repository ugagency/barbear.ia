'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  ImportarOnboarding,
  ProfissionaisImportados,
} from './importar-onboarding'
import { EditarBarbeariaForm } from './forms'
import {
  normalizarExtracao,
  mesclarImportacao,
  mesclarHorarios,
} from '@/lib/onboarding-import'
import type { ExtracaoOnboarding } from '@/lib/onboarding-import'
import { toast } from 'sonner'
import { AbaHorarios } from '@/app/(dashboard)/configuracoes/components/aba-horarios'
import { ModalBarbeiro } from '@/app/(dashboard)/configuracoes/components/modal-barbeiro'
import {
  salvarSecaoOnboarding,
  salvarProfissionalAdmin,
  salvarAgendaAdmin,
  uploadLogoAdmin,
} from '../onboarding-actions'
import { DIAS, DIA_NOME } from '@/lib/onboarding'
import type {
  Perfil,
  Funcionamento,
  Regras,
  Atendimento,
  OnboardingConfig,
} from '@/lib/onboarding'
import type { Barbeiro, Servico } from '@/types'

const inputClass =
  'mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-2 focus:outline-slate-500'
const buttonClass =
  'rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50'
const tabs = [
  'Dados completos',
  'Funcionamento',
  'Profissionais e serviços',
  'Agenda dos profissionais',
  'Regras',
  'Atendimento',
] as const
const perfilInicial: Perfil = {
  razao_social: '',
  cnpj: '',
  responsavel: '',
  whatsapp_responsavel: '',
  instagram: '',
  endereco: '',
  cidade: '',
  uf: '',
  cep: '',
  maps_url: '',
  cores: '',
  fotos_url: '',
  agenda_atual: '',
  agendamentos_pendentes: '',
  observacoes: '',
}
const regrasIniciais: Regras = {
  antecedencia_min: 0,
  horizonte_dias: 30,
  cancelamento_min: 60,
  tolerancia_min: 10,
  confirmacao_automatica: true,
  avisar_responsavel: false,
  multa_percentual: 0,
  politica_cancelamento: '',
}
const atendimentoInicial: Atendimento = {
  saudacao: '',
  duvidas_frequentes: '',
  pagamentos: [],
  atende_criancas: false,
  estacionamento: false,
  regras_importantes: '',
  encaminhar_quando: '',
  whatsapp_humano: '',
}

function Campo({
  label,
  name,
  value = '',
  type = 'text',
  multiline = false,
}: {
  label: string
  name: string
  value?: string | number
  type?: string
  multiline?: boolean
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {multiline ? (
        <textarea
          name={name}
          defaultValue={value}
          rows={3}
          className={inputClass}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={value}
          className={inputClass}
        />
      )}
    </label>
  )
}
function Opcao({
  label,
  name,
  checked,
}: {
  label: string
  name: string
  checked: boolean
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-slate-700">
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="size-4"
      />
      {label}
    </label>
  )
}
function FormSecao({
  title,
  description,
  children,
  save,
}: {
  title: string
  description?: string
  children: React.ReactNode
  save: (f: FormData) => Promise<{ success: boolean; error?: string }>
}) {
  const [pending, start] = useTransition()
  const [error, setError] = useState('')
  return (
    <form
      className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault()
        const form = new FormData(e.currentTarget)
        setError('')
        start(async () => {
          try {
            const r = await save(form)
            if (!r.success) {
              setError(r.error ?? 'Não foi possível salvar.')
              return
            }
            toast.success('Configuração salva.')
          } catch {
            setError('Não foi possível salvar. Tente novamente.')
          }
        })
      }}
    >
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>
      <fieldset disabled={pending} className="space-y-5 disabled:opacity-60">
        {children}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <button className={buttonClass} disabled={pending}>
        {pending ? 'Salvando...' : 'Salvar configuração'}
      </button>
    </form>
  )
}

function OnboardingEditor({
  id,
  config,
  barbeiros,
}: {
  id: string
  config: OnboardingConfig & Record<string, unknown>
  barbeiros: Barbeiro[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<(typeof tabs)[number]>('Dados completos')
  const [editing, setEditing] = useState<Barbeiro | null>(null)
  const [creating, setCreating] = useState(false)
  const perfil = { ...perfilInicial, ...config.perfil }
  const regras = { ...regrasIniciais, ...config.regras }
  const atendimento = { ...atendimentoInicial, ...config.atendimento }
  const refresh = () => router.refresh()
  const text = (f: FormData, key: string) => String(f.get(key) ?? '')
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Configuração do onboarding</h2>
        <p className="mt-1 text-sm text-slate-500">
          Configure toda a operação por aqui antes de liberar o acesso ao
          cliente. Cada seção tem seu próprio botão de salvar.
        </p>
      </div>
      <nav aria-label="Seções do onboarding" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            aria-pressed={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${tab === t ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'}`}
          >
            {t}
          </button>
        ))}
      </nav>
      {/* Keep forms mounted so switching sections does not discard unsaved changes. */}
      <div hidden={tab !== 'Dados completos'} className="space-y-4">
        <FormSecao
          title="Dados completos da barbearia"
          save={async (f) => {
            const dados = Object.fromEntries(
              Object.keys(perfilInicial).map((k) => [k, text(f, k)]),
            ) as Perfil
            return salvarSecaoOnboarding(id, { secao: 'perfil', dados })
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ['razao_social', 'Razão social'],
                ['cnpj', 'CNPJ'],
                ['responsavel', 'Nome do responsável'],
                ['whatsapp_responsavel', 'WhatsApp do responsável'],
                ['instagram', 'Instagram'],
                ['endereco', 'Endereço completo'],
                ['cidade', 'Cidade'],
                ['uf', 'UF'],
                ['cep', 'CEP'],
                ['maps_url', 'Link do Google Maps'],
                ['cores', 'Cores da marca'],
                ['fotos_url', 'Links de fotos do estabelecimento'],
              ] as const
            ).map(([name, label]) => (
              <Campo
                key={name}
                name={name}
                label={label}
                value={perfil[name]}
              />
            ))}
          </div>
          <Campo
            name="agenda_atual"
            label="Como a agenda é organizada atualmente?"
            value={perfil.agenda_atual}
            multiline
          />
          <Campo
            name="agendamentos_pendentes"
            label="Agendamentos futuros a importar"
            value={perfil.agendamentos_pendentes}
            multiline
          />
          <p className="text-xs text-slate-500">
            Este campo registra a pendência. Os compromissos devem ser
            cadastrados na agenda antes da abertura ao público.
          </p>
          <Campo
            name="observacoes"
            label="Observações e informações pendentes de confirmação"
            value={perfil.observacoes}
            multiline
          />
        </FormSecao>
        <FormSecao
          title="Logo da barbearia"
          description="Envie PNG, JPG ou WebP de até 2 MB."
          save={async (f) => {
            const r = await uploadLogoAdmin(id, f)
            if (r.success) refresh()
            return r
          }}
        >
          <label className="block text-sm font-medium">
            Arquivo da logo
            <input
              required
              name="file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className={inputClass}
            />
          </label>
        </FormSecao>
      </div>
      <div hidden={tab !== 'Funcionamento'}>
        <FuncionamentoForm id={id} config={config} />
      </div>
      <div
        hidden={tab !== 'Profissionais e serviços'}
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Profissionais e serviços</h3>
            <p className="mt-1 text-sm text-slate-500">
              Preços, duração, combos e serviços são definidos por profissional.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className={buttonClass}
          >
            Adicionar profissional
          </button>
        </div>
        <ul className="mt-5 divide-y">
          {barbeiros.map((b) => (
            <li
              key={b.id}
              className="flex items-start justify-between gap-4 py-4"
            >
              <div className="min-w-0">
                <p className="font-semibold">
                  {b.nome}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    {b.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </p>
                <p className="text-xs text-slate-500">
                  {b.telefone || 'WhatsApp não informado'}
                </p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {((b.servicos ?? []) as Servico[]).map((s, i) => (
                    <li key={i}>
                      {s.nome} ·{' '}
                      {s.preco.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}{' '}
                      · {s.duracao_min} min
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setEditing(b)}
                className="shrink-0 rounded-lg border px-3 py-2 text-sm"
              >
                Editar
              </button>
            </li>
          ))}
        </ul>
        {!barbeiros.length && (
          <p className="mt-5 text-sm text-slate-500">
            Adicione o primeiro profissional para configurar serviços e agenda.
          </p>
        )}
        <ModalBarbeiro
          open={creating || !!editing}
          onOpenChange={(o) => {
            if (!o) {
              setCreating(false)
              setEditing(null)
            }
          }}
          barbeiro={editing}
          onSalvo={refresh}
          saveAction={(profId, dados) =>
            salvarProfissionalAdmin(id, profId, dados)
          }
        />
      </div>
      <div hidden={tab !== 'Agenda dos profissionais'}>
        <AbaHorarios
          key={barbeiros.map((b) => `${b.id}:${b.updated_at}`).join(',')}
          barbeiros={barbeiros}
          onSaved={refresh}
          saveAction={(profId, dados) => salvarAgendaAdmin(id, profId, dados)}
        />
      </div>
      <div hidden={tab !== 'Regras'}>
        <FormSecao
          title="Regras de agendamento"
          description="Antecedência e limite de dias são aplicados ao agendamento online. Políticas de cancelamento, tolerância e multa ficam registradas para o atendimento; não geram cobranças automáticas."
          save={async (f) => {
            const dados: Regras = {
              ...regras,
              antecedencia_min: Number(f.get('antecedencia_min')),
              horizonte_dias: Number(f.get('horizonte_dias')),
              cancelamento_min: Number(f.get('cancelamento_min')),
              tolerancia_min: Number(f.get('tolerancia_min')),
              multa_percentual: Number(f.get('multa_percentual')),
              confirmacao_automatica: f.has('confirmacao_automatica'),
              avisar_responsavel: f.has('avisar_responsavel'),
              politica_cancelamento: text(f, 'politica_cancelamento'),
            }
            return salvarSecaoOnboarding(id, { secao: 'regras', dados })
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {(
              [
                ['antecedencia_min', 'Antecedência mínima (minutos)'],
                ['horizonte_dias', 'Agendar até quantos dias no futuro?'],
                [
                  'cancelamento_min',
                  'Prazo para cancelar ou remarcar (minutos)',
                ],
                ['tolerancia_min', 'Tolerância de atraso (minutos)'],
                ['multa_percentual', 'Multa por cancelamento tardio (%)'],
              ] as const
            ).map(([name, label]) => (
              <Campo
                key={name}
                name={name}
                label={label}
                type="number"
                value={regras[name]}
              />
            ))}
          </div>
          <Opcao
            name="confirmacao_automatica"
            label="Confirmar agendamento automaticamente"
            checked={regras.confirmacao_automatica}
          />
          <Opcao
            name="avisar_responsavel"
            label="Solicitar aviso ao responsável sobre novos agendamentos"
            checked={regras.avisar_responsavel}
          />
          <p className="text-xs text-slate-500">
            O aviso registra a preferência; o envio pelo WhatsApp depende da
            automação de notificações.
          </p>
          <Campo
            name="politica_cancelamento"
            label="Política de cancelamento e aplicação da multa"
            value={regras.politica_cancelamento}
            multiline
          />
        </FormSecao>
      </div>
      <div hidden={tab !== 'Atendimento'}>
        <FormSecao
          title="Atendimento automático"
          description="Base de informações para a assistente e para a equipe. A publicação destas instruções no fluxo do WhatsApp depende da integração da automação."
          save={async (f) => {
            const dados: Atendimento = {
              saudacao: text(f, 'saudacao'),
              duvidas_frequentes: text(f, 'duvidas_frequentes'),
              pagamentos: (['pix', 'dinheiro', 'cartao'] as const).filter((p) =>
                f.has(p),
              ),
              atende_criancas: f.has('atende_criancas'),
              estacionamento: f.has('estacionamento'),
              regras_importantes: text(f, 'regras_importantes'),
              encaminhar_quando: text(f, 'encaminhar_quando'),
              whatsapp_humano: text(f, 'whatsapp_humano'),
            }
            return salvarSecaoOnboarding(id, { secao: 'atendimento', dados })
          }}
        >
          <Campo
            name="saudacao"
            label="Mensagem de boas-vindas"
            value={atendimento.saudacao}
            multiline
          />
          <Campo
            name="duvidas_frequentes"
            label="Perguntas frequentes e respostas"
            value={atendimento.duvidas_frequentes}
            multiline
          />
          <fieldset className="space-y-3">
            <legend className="mb-2 text-sm font-medium">
              Formas de pagamento
            </legend>
            {(['pix', 'dinheiro', 'cartao'] as const).map((p) => (
              <Opcao
                key={p}
                name={p}
                label={
                  { pix: 'Pix', dinheiro: 'Dinheiro', cartao: 'Cartão' }[p]
                }
                checked={atendimento.pagamentos.includes(p)}
              />
            ))}
          </fieldset>
          <Opcao
            name="atende_criancas"
            label="Atende crianças"
            checked={atendimento.atende_criancas}
          />
          <Opcao
            name="estacionamento"
            label="Possui estacionamento"
            checked={atendimento.estacionamento}
          />
          <Campo
            name="regras_importantes"
            label="Regras importantes para os clientes"
            value={atendimento.regras_importantes}
            multiline
          />
          <Campo
            name="encaminhar_quando"
            label="Quando encaminhar para uma pessoa?"
            value={atendimento.encaminhar_quando}
            multiline
          />
          <Campo
            name="whatsapp_humano"
            label="WhatsApp do atendimento humano"
            value={atendimento.whatsapp_humano}
          />
        </FormSecao>
      </div>
    </section>
  )
}

function FuncionamentoForm({
  id,
  config,
}: {
  id: string
  config: OnboardingConfig & Record<string, unknown>
}) {
  const existentes = config.funcionamento
  const [horarios, setHorarios] = useState<Funcionamento['horarios']>(
    () =>
      existentes?.horarios ??
      Object.fromEntries(
        ((config.dias_funcionamento ?? []) as string[]).map((d) => [
          d,
          {
            inicio: String(config.horario_abertura ?? '09:00'),
            fim: String(
              d === 'sab'
                ? (config.sabado_fechamento ??
                    config.horario_fechamento ??
                    '19:00')
                : (config.horario_fechamento ?? '19:00'),
            ),
          },
        ]),
      ),
  )
  const [bloqueios, setBloqueios] = useState<Funcionamento['bloqueios']>(
    () => existentes?.bloqueios ?? [],
  )
  const [fechamentos, setFechamentos] = useState<Funcionamento['fechamentos']>(
    () => existentes?.fechamentos ?? [],
  )
  return (
    <FormSecao
      title="Funcionamento e bloqueios da barbearia"
      description="Os horários gerais limitam a agenda de todos os profissionais. Use a agenda individual para reservar apenas o horário de um barbeiro."
      save={async (f) =>
        salvarSecaoOnboarding(id, {
          secao: 'funcionamento',
          dados: {
            horarios,
            bloqueios,
            fechamentos,
            funciona_feriados: f.has('funciona_feriados'),
            ferias: String(f.get('ferias') ?? ''),
          },
        })
      }
    >
      <div className="space-y-2">
        {DIAS.map((d) => (
          <div
            key={d}
            className="grid grid-cols-[1fr_1fr_1fr] items-center gap-2 rounded-lg bg-slate-50 p-3"
          >
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!horarios[d]}
                onChange={(e) =>
                  setHorarios((old) => {
                    const next = { ...old }
                    if (e.target.checked)
                      next[d] = { inicio: '09:00', fim: '19:00' }
                    else delete next[d]
                    return next
                  })
                }
              />
              {DIA_NOME[d]}
            </label>
            {horarios[d] ? (
              <>
                <input
                  type="time"
                  aria-label={`Abertura ${DIA_NOME[d]}`}
                  value={horarios[d]!.inicio}
                  className={inputClass}
                  onChange={(e) =>
                    setHorarios((old) => ({
                      ...old,
                      [d]: { ...old[d]!, inicio: e.target.value },
                    }))
                  }
                />
                <input
                  type="time"
                  aria-label={`Fechamento ${DIA_NOME[d]}`}
                  value={horarios[d]!.fim}
                  className={inputClass}
                  onChange={(e) =>
                    setHorarios((old) => ({
                      ...old,
                      [d]: { ...old[d]!, fim: e.target.value },
                    }))
                  }
                />
              </>
            ) : (
              <span className="col-span-2 text-sm text-slate-400">Fechado</span>
            )}
          </div>
        ))}
      </div>
      <section className="space-y-3">
        <h3 className="font-semibold">Bloqueios semanais gerais</h3>
        <p className="text-xs text-slate-500">
          Almoço, limpeza ou pausas que bloqueiam toda a equipe.
        </p>
        {bloqueios.map((b, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2"
          >
            <label className="text-sm">
              Dia
              <select
                aria-label={`Dia do bloqueio ${i + 1}`}
                value={b.dia_semana}
                className={inputClass}
                onChange={(e) =>
                  setBloqueios((old) =>
                    old.map((v, n) =>
                      n === i
                        ? {
                            ...v,
                            dia_semana: e.target.value as typeof b.dia_semana,
                          }
                        : v,
                    ),
                  )
                }
              >
                {DIAS.map((d) => (
                  <option key={d} value={d}>
                    {DIA_NOME[d]}
                  </option>
                ))}
              </select>
            </label>
            {(['inicio', 'fim', 'motivo'] as const).map((k) => (
              <label key={k} className="text-sm">
                {{ inicio: 'Início', fim: 'Fim', motivo: 'Motivo' }[k]}
                <input
                  aria-label={`${k} do bloqueio ${i + 1}`}
                  type={k === 'motivo' ? 'text' : 'time'}
                  value={b[k]}
                  className={inputClass}
                  onChange={(e) =>
                    setBloqueios((old) =>
                      old.map((v, n) =>
                        n === i ? { ...v, [k]: e.target.value } : v,
                      ),
                    )
                  }
                />
              </label>
            ))}
            <button
              type="button"
              onClick={() =>
                setBloqueios((old) => old.filter((_, n) => n !== i))
              }
              className="text-left text-sm text-red-700"
            >
              Remover bloqueio
            </button>
          </div>
        ))}
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() =>
            setBloqueios((old) => [
              ...old,
              {
                dia_semana: 'ter',
                inicio: '12:00',
                fim: '13:00',
                motivo: 'Almoço',
                frequencia: 'semanal',
              },
            ])
          }
        >
          Adicionar bloqueio semanal
        </button>
      </section>
      <section className="space-y-3">
        <h3 className="font-semibold">
          Feriados, férias e fechamentos por data
        </h3>
        <p className="text-xs text-slate-500">
          Cadastre as datas de fechamento para impedir agendamentos. O período
          inclui a data inicial e final.
        </p>
        {fechamentos.map((b, i) => (
          <div
            key={i}
            className="grid gap-2 rounded-lg border p-3 sm:grid-cols-3"
          >
            {(['data_inicio', 'data_fim', 'motivo'] as const).map((k) => (
              <label key={k} className="text-sm">
                {{ data_inicio: 'De', data_fim: 'Até', motivo: 'Motivo' }[k]}
                <input
                  aria-label={`${k} do fechamento ${i + 1}`}
                  required
                  type={k === 'motivo' ? 'text' : 'date'}
                  value={b[k]}
                  className={inputClass}
                  onChange={(e) =>
                    setFechamentos((old) =>
                      old.map((v, n) =>
                        n === i ? { ...v, [k]: e.target.value } : v,
                      ),
                    )
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="text-left text-sm text-red-700"
              onClick={() =>
                setFechamentos((old) => old.filter((_, n) => n !== i))
              }
            >
              Remover fechamento
            </button>
          </div>
        ))}
        <button
          type="button"
          className="rounded-lg border px-3 py-2 text-sm"
          onClick={() =>
            setFechamentos((old) => [
              ...old,
              { data_inicio: '', data_fim: '', motivo: '' },
            ])
          }
        >
          Adicionar fechamento por data
        </button>
      </section>
      <Opcao
        name="funciona_feriados"
        label="Funciona em feriados"
        checked={existentes?.funciona_feriados ?? false}
      />
      <Campo
        name="ferias"
        label="Observações sobre férias e ausências"
        value={existentes?.ferias ?? ''}
        multiline
      />
    </FormSecao>
  )
}

type DadosBasicos = Parameters<typeof EditarBarbeariaForm>[0]['barbearia']
type PropsOnboarding = {
  id: string
  config: OnboardingConfig & Record<string, unknown>
  barbeiros: Barbeiro[]
  barbearia: DadosBasicos
}
export function OnboardingAdmin(props: PropsOnboarding) {
  const [importacao, setImportacao] = useState<{
    dados: ExtracaoOnboarding
    substituir: boolean
    versao: number
  } | null>(null)
  let config = props.config
  let basicos = props.barbearia
  if (importacao) {
    const patch = normalizarExtracao(importacao.dados)
    config = mesclarImportacao(
      props.config,
      patch.config,
      importacao.substituir,
    )
    basicos = mesclarImportacao(
      props.barbearia,
      patch.barbearia,
      importacao.substituir,
    )
    if (importacao.dados.funcionamento.horarios !== null) {
      config = {
        ...config,
        funcionamento: {
          ...config.funcionamento!,
          horarios: mesclarHorarios(
            props.config.funcionamento?.horarios ?? {},
            importacao.dados.funcionamento.horarios,
            importacao.substituir,
          ),
        },
      }
    }
  }
  return (
    <div className="space-y-6">
      <ImportarOnboarding
        onAplicar={(dados, substituir) =>
          setImportacao((old) => ({
            dados,
            substituir,
            versao: (old?.versao ?? 0) + 1,
          }))
        }
      />
      {importacao && (
        <p
          role="status"
          className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900"
        >
          Rascunho preenchido. Confira cada seção e salve os dados que deseja
          cadastrar. Campos sem resposta permanecem para preenchimento manual.
        </p>
      )}
      <EditarBarbeariaForm
        key={`basicos-${importacao?.versao ?? 0}`}
        barbearia={basicos}
      />
      {importacao && importacao.dados.profissionais.length > 0 && (
        <ProfissionaisImportados
          key={`profissionais-${importacao.versao}`}
          id={props.id}
          profissionais={importacao.dados.profissionais}
          existentes={props.barbeiros}
        />
      )}
      <OnboardingEditor
        key={`editor-${importacao?.versao ?? 0}`}
        id={props.id}
        config={config}
        barbeiros={props.barbeiros}
      />
    </div>
  )
}
