-- Acesso da equipe Barbear.IA. Provisione administradores explicitamente pelo auth.users.id.
create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;
-- Exemplo de concessão manual (substituir UUID após confirmação da conta):
-- insert into public.platform_admins(user_id) values ('UUID_DO_ADMIN');
