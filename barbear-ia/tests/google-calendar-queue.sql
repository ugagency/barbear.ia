-- All fixtures are rolled back. No Google HTTP calls are made.
begin;
do $$
declare
  shop uuid := gen_random_uuid(); barber uuid := gen_random_uuid(); barber2 uuid := gen_random_uuid();
  customer uuid := gen_random_uuid(); appointment uuid := gen_random_uuid(); rev uuid;
begin
  insert into public.barbearias(id,nome,slug,instance_name) values(shop,'Google Calendar transactional test',shop::text,shop::text);
  insert into public.barbeiros(id,barbearia_id,nome) values(barber,shop,'Test A'),(barber2,shop,'Test B');
  insert into public.clientes(id,barbearia_id,telefone,nome) values(customer,shop,'5500000000000','Test');
  insert into public.agendamentos(id,barbearia_id,barbeiro_id,cliente_id,servico,duracao_min,inicio_at,fim_at)
    values(appointment,shop,barber,customer,'Corte',30,now()+interval '100 days',now()+interval '100 days 30 minutes');
  if exists(select 1 from public.google_calendar_jobs where agendamento_id=appointment) then raise exception 'Disconnected barber enqueued'; end if;
  insert into public.google_calendar_connections(barbeiro_id,barbearia_id,calendar_id,calendar_name,refresh_token_encrypted)
    values(barber,shop,'transaction-test','Test','not-a-real-token'),(barber2,shop,'transaction-test-2','Test','not-a-real-token');
  if (select count(*) from public.google_calendar_jobs where agendamento_id=appointment) <> 1 then raise exception 'Backfill failed'; end if;
  select revision into rev from public.google_calendar_jobs where agendamento_id=appointment;
  update public.agendamentos set inicio_at=inicio_at+interval '1 day',fim_at=fim_at+interval '1 day' where id=appointment;
  delete from public.google_calendar_jobs where agendamento_id=appointment and revision=rev;
  if (select count(*) from public.google_calendar_jobs where agendamento_id=appointment) <> 1 then raise exception 'Newer revision was lost'; end if;
  update public.agendamentos set status='cancelado' where id=appointment;
  if (select payload->>'status' from public.google_calendar_jobs where agendamento_id=appointment) <> 'cancelado' then raise exception 'Cancel failed'; end if;
  update public.agendamentos set barbeiro_id=barber2,status='agendado' where id=appointment;
  if (select count(*) from public.google_calendar_jobs where agendamento_id=appointment) <> 2 then raise exception 'Barber reassignment failed'; end if;
  if not (select deleted from public.google_calendar_jobs where agendamento_id=appointment and barbeiro_id=barber) then raise exception 'Old barber event retained'; end if;
  delete from public.agendamentos where id=appointment;
  if not (select deleted from public.google_calendar_jobs where agendamento_id=appointment and barbeiro_id=barber2) then raise exception 'Delete failed'; end if;
  delete from public.google_calendar_connections where barbeiro_id in(barber,barber2);
  if exists(select 1 from public.google_calendar_jobs where agendamento_id=appointment) then raise exception 'Disconnect failed'; end if;
  if has_table_privilege('anon','public.google_calendar_connections','SELECT')
    or has_table_privilege('authenticated','public.google_calendar_connections','SELECT')
    or has_table_privilege('authenticated','public.google_calendar_jobs','INSERT') then raise exception 'Tokens/queue exposed'; end if;
end;
$$;
select 'PASS: backfill, updates, stale revision, cancellation, barber reassignment, deletion, disconnect and token isolation' as verification;
rollback;
