-- Tokens and outbox are accessible exclusively through authenticated server code.
create table public.google_calendar_connections (
  barbeiro_id uuid primary key references public.barbeiros(id) on delete cascade,
  barbearia_id uuid not null references public.barbearias(id) on delete cascade,
  calendar_id text not null,
  calendar_name text not null,
  refresh_token_encrypted text not null,
  connected_by uuid references auth.users(id) on delete set null,
  last_synced_at timestamptz,
  last_error text,
  lock_token uuid,
  locked_until timestamptz,
  created_at timestamptz not null default now()
);
create index google_calendar_connections_shop_idx on public.google_calendar_connections(barbearia_id);
alter table public.google_calendar_connections enable row level security;
revoke all on public.google_calendar_connections from public, anon, authenticated;
grant all on public.google_calendar_connections to service_role;

create table public.google_calendar_jobs (
  barbeiro_id uuid not null references public.google_calendar_connections(barbeiro_id) on delete cascade,
  agendamento_id uuid not null, -- deliberately no FK: deletion still needs a cancellation in Google
  revision uuid not null default gen_random_uuid(),
  payload jsonb not null,
  deleted boolean not null default false,
  attempts integer not null default 0,
  next_attempt_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (barbeiro_id, agendamento_id)
);
create index google_calendar_jobs_due_idx on public.google_calendar_jobs(next_attempt_at, created_at);
alter table public.google_calendar_jobs enable row level security;
revoke all on public.google_calendar_jobs from public, anon, authenticated;
grant all on public.google_calendar_jobs to service_role;

create schema if not exists private;
-- These SECURITY DEFINER functions are trigger-only, unavailable through the Data API.
-- They intentionally also handle service-role writes from n8n and validated public bookings.
create function private.enqueue_google_calendar_booking() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if TG_OP = 'DELETE' or (TG_OP = 'UPDATE' and old.barbeiro_id is distinct from new.barbeiro_id) then
    insert into public.google_calendar_jobs (barbeiro_id, agendamento_id, payload, deleted)
    select old.barbeiro_id, old.id, to_jsonb(old), true
    from public.google_calendar_connections c
    where c.barbeiro_id = old.barbeiro_id and c.barbearia_id = old.barbearia_id
    on conflict (barbeiro_id, agendamento_id) do update
      set payload = excluded.payload, deleted = true, revision = gen_random_uuid(), attempts = 0,
          next_attempt_at = now(), created_at = now();
  end if;
  if TG_OP <> 'DELETE' then
    insert into public.google_calendar_jobs (barbeiro_id, agendamento_id, payload)
    select new.barbeiro_id, new.id, to_jsonb(new)
    from public.google_calendar_connections c
    where c.barbeiro_id = new.barbeiro_id and c.barbearia_id = new.barbearia_id
    on conflict (barbeiro_id, agendamento_id) do update
      set payload = excluded.payload, deleted = false, revision = gen_random_uuid(), attempts = 0,
          next_attempt_at = now(), created_at = now();
  end if;
  return null;
end;
$$;
revoke all on function private.enqueue_google_calendar_booking() from public, anon, authenticated;
create trigger google_calendar_booking_changed after insert or update or delete on public.agendamentos
for each row execute function private.enqueue_google_calendar_booking();

create function private.backfill_google_calendar_bookings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.barbeiros b where b.id = new.barbeiro_id and b.barbearia_id = new.barbearia_id) then
    raise exception 'Barbeiro e barbearia incompatíveis';
  end if;
  insert into public.google_calendar_jobs (barbeiro_id, agendamento_id, payload)
    select a.barbeiro_id, a.id, to_jsonb(a) from public.agendamentos a
    where a.barbeiro_id = new.barbeiro_id and a.barbearia_id = new.barbearia_id
      and a.fim_at >= now() and a.status <> 'cancelado'
    on conflict (barbeiro_id, agendamento_id) do nothing;
  return null;
end;
$$;
revoke all on function private.backfill_google_calendar_bookings() from public, anon, authenticated;
create trigger google_calendar_connected after insert on public.google_calendar_connections
for each row execute function private.backfill_google_calendar_bookings();
