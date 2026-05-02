-- ============================================
-- Sprint 10 — Página pública de agendamento
-- ============================================

-- 1. Atualiza CHECK de criado_por para incluir 'cliente_web'
ALTER TABLE public.agendamentos
  DROP CONSTRAINT IF EXISTS agendamentos_criado_por_check;

ALTER TABLE public.agendamentos
  ADD CONSTRAINT agendamentos_criado_por_check
  CHECK (criado_por IN ('ia', 'manual', 'cliente_web'));

-- 2. Policies públicas (anon) — leitura limitada
CREATE POLICY "publico_ver_barbearia_ativa" ON public.barbearias
  FOR SELECT
  TO anon
  USING (plano_status = 'ativo');

CREATE POLICY "publico_ver_barbeiros_ativos" ON public.barbeiros
  FOR SELECT
  TO anon
  USING (ativo = true);

-- Apenas agendamentos futuros e não cancelados — para verificar disponibilidade
CREATE POLICY "publico_ver_disponibilidade" ON public.agendamentos
  FOR SELECT
  TO anon
  USING (
    status != 'cancelado'
    AND inicio_at > now()
  );

-- 3. Policies públicas (anon) — escrita controlada
CREATE POLICY "publico_criar_cliente" ON public.clientes
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "publico_criar_agendamento" ON public.agendamentos
  FOR INSERT
  TO anon
  WITH CHECK (criado_por = 'cliente_web');
