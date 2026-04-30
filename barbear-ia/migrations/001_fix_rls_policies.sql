-- ============================================
-- Migração: Corrigir RLS policies para suportar INSERTs via dashboard
-- ============================================
-- As policies originais usam FOR ALL com USING, o que não cobre INSERT
-- (INSERT exige WITH CHECK). Esta migração separa em policies dedicadas
-- por operação para cada tabela tenant.
--
-- Para a tabela `barbearias`, NÃO criamos policy de INSERT. O onboarding
-- (criação inicial da barbearia + vínculo em usuarios_barbearias) é feito
-- via Server Action usando a service_role key (supabaseAdmin), que bypassa
-- RLS por design.
-- ============================================

BEGIN;

-- ============================================
-- BARBEIROS
-- ============================================
DROP POLICY IF EXISTS "Acesso total barbeiros tenant" ON public.barbeiros;

CREATE POLICY "barbeiros_select_tenant" ON public.barbeiros
  FOR SELECT USING (barbearia_id = public.get_barbearia_id());

CREATE POLICY "barbeiros_insert_tenant" ON public.barbeiros
  FOR INSERT WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "barbeiros_update_tenant" ON public.barbeiros
  FOR UPDATE USING (barbearia_id = public.get_barbearia_id())
  WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "barbeiros_delete_tenant" ON public.barbeiros
  FOR DELETE USING (barbearia_id = public.get_barbearia_id());

-- ============================================
-- CLIENTES
-- ============================================
DROP POLICY IF EXISTS "Acesso total clientes tenant" ON public.clientes;

CREATE POLICY "clientes_select_tenant" ON public.clientes
  FOR SELECT USING (barbearia_id = public.get_barbearia_id());

CREATE POLICY "clientes_insert_tenant" ON public.clientes
  FOR INSERT WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "clientes_update_tenant" ON public.clientes
  FOR UPDATE USING (barbearia_id = public.get_barbearia_id())
  WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "clientes_delete_tenant" ON public.clientes
  FOR DELETE USING (barbearia_id = public.get_barbearia_id());

-- ============================================
-- AGENDAMENTOS
-- ============================================
DROP POLICY IF EXISTS "Acesso total agendamentos tenant" ON public.agendamentos;

CREATE POLICY "agendamentos_select_tenant" ON public.agendamentos
  FOR SELECT USING (barbearia_id = public.get_barbearia_id());

CREATE POLICY "agendamentos_insert_tenant" ON public.agendamentos
  FOR INSERT WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "agendamentos_update_tenant" ON public.agendamentos
  FOR UPDATE USING (barbearia_id = public.get_barbearia_id())
  WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "agendamentos_delete_tenant" ON public.agendamentos
  FOR DELETE USING (barbearia_id = public.get_barbearia_id());

-- ============================================
-- CONVERSAS
-- ============================================
DROP POLICY IF EXISTS "Acesso total conversas tenant" ON public.conversas;

CREATE POLICY "conversas_select_tenant" ON public.conversas
  FOR SELECT USING (barbearia_id = public.get_barbearia_id());

CREATE POLICY "conversas_insert_tenant" ON public.conversas
  FOR INSERT WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "conversas_update_tenant" ON public.conversas
  FOR UPDATE USING (barbearia_id = public.get_barbearia_id())
  WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "conversas_delete_tenant" ON public.conversas
  FOR DELETE USING (barbearia_id = public.get_barbearia_id());

-- ============================================
-- LEMBRETES_LOG
-- ============================================
DROP POLICY IF EXISTS "Acesso total lembretes tenant" ON public.lembretes_log;

CREATE POLICY "lembretes_select_tenant" ON public.lembretes_log
  FOR SELECT USING (barbearia_id = public.get_barbearia_id());

CREATE POLICY "lembretes_insert_tenant" ON public.lembretes_log
  FOR INSERT WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "lembretes_update_tenant" ON public.lembretes_log
  FOR UPDATE USING (barbearia_id = public.get_barbearia_id())
  WITH CHECK (barbearia_id = public.get_barbearia_id());

CREATE POLICY "lembretes_delete_tenant" ON public.lembretes_log
  FOR DELETE USING (barbearia_id = public.get_barbearia_id());

-- ============================================
-- BARBEARIAS — apenas reforça SELECT/UPDATE existentes,
-- INSERT permanece sem policy (uso via service_role no onboarding).
-- ============================================
-- (As policies de SELECT e UPDATE já existem do schema inicial.
-- Não há DROP/CREATE aqui para evitar regressão.)

COMMIT;
