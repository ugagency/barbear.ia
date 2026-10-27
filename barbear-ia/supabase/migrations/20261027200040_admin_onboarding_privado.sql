-- Dados internos do onboarding. A interface pública usa apenas horários e regras.
create table public.barbearia_onboarding (
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  secao text not null check (secao in ('perfil', 'atendimento')),
  dados jsonb not null default '{}'::jsonb check (jsonb_typeof(dados) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (barbearia_id, secao)
);

alter table public.barbearia_onboarding enable row level security;
revoke all on table public.barbearia_onboarding from public, anon, authenticated;
grant select, insert, update, delete on table public.barbearia_onboarding to service_role;
comment on table public.barbearia_onboarding is 'Somente backend: server actions verificam platform_admins antes de ler ou alterar.';
