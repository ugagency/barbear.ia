-- ============================================
-- 1. EXTENSÕES
-- ============================================
-- A maioria dos projetos do Supabase já vem com suporte ao gen_random_uuid() nativo.
-- Caso seja necessário alguma extensão como pg_trgm no futuro, você pode adicionar aqui.

-- ============================================
-- 2. FUNÇÕES AUXILIARES
-- ============================================

-- Função para atualizar automaticamente a coluna updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. TABELAS
-- ============================================

CREATE TABLE public.barbearias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    nome text NOT NULL,
    slug text UNIQUE NOT NULL,
    instance_name text UNIQUE NOT NULL,
    telefone text,
    email text,
    logo_url text,
    plano text NOT NULL DEFAULT 'trial' CHECK (plano IN ('trial', 'starter', 'pro')),
    plano_status text NOT NULL DEFAULT 'ativo' CHECK (plano_status IN ('ativo', 'cancelado', 'inadimplente')),
    trial_ends_at timestamptz DEFAULT (now() + interval '7 days'),
    config jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.usuarios_barbearias (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    barbearia_id uuid NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
    role text NOT NULL DEFAULT 'dono' CHECK (role IN ('dono', 'barbeiro')),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(user_id, barbearia_id)
);

CREATE TABLE public.barbeiros (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id uuid NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
    nome text NOT NULL,
    telefone text,
    calendar_id text,
    servicos jsonb NOT NULL DEFAULT '[]'::jsonb,
    horarios jsonb NOT NULL DEFAULT '{}'::jsonb,
    bloqueios jsonb NOT NULL DEFAULT '[]'::jsonb,
    horarios_fixos jsonb NOT NULL DEFAULT '[]'::jsonb,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.clientes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id uuid NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
    telefone text NOT NULL,
    nome text,
    ultimo_atendimento timestamptz,
    total_atendimentos integer NOT NULL DEFAULT 0,
    preferencias jsonb NOT NULL DEFAULT '{}'::jsonb,
    ativo boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(barbearia_id, telefone)
);

CREATE TABLE public.agendamentos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id uuid NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
    barbeiro_id uuid NOT NULL REFERENCES public.barbeiros(id) ON DELETE CASCADE,
    cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
    servico text NOT NULL,
    valor numeric(10,2),
    duracao_min integer NOT NULL,
    status text NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'concluido', 'cancelado', 'faltou')),
    inicio_at timestamptz NOT NULL,
    fim_at timestamptz NOT NULL,
    forma_pagamento text NOT NULL DEFAULT 'a_definir' CHECK (forma_pagamento IN ('pix', 'cartao', 'dinheiro', 'a_definir')),
    google_event_id text,
    observacoes text,
    criado_por text NOT NULL DEFAULT 'ia' CHECK (criado_por IN ('ia', 'manual')),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (fim_at > inicio_at)
);

CREATE TABLE public.conversas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id uuid NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
    telefone text NOT NULL,
    mensagens jsonb NOT NULL DEFAULT '[]'::jsonb,
    contexto jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(barbearia_id, telefone)
);

CREATE TABLE public.lembretes_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    barbearia_id uuid NOT NULL REFERENCES public.barbearias(id) ON DELETE CASCADE,
    agendamento_id uuid NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
    tipo text NOT NULL DEFAULT 'lembrete' CHECK (tipo IN ('lembrete', 'reativacao')),
    enviado_at timestamptz NOT NULL DEFAULT now(),
    status text NOT NULL DEFAULT 'enviado' CHECK (status IN ('enviado', 'falhou'))
);

-- ============================================
-- 4. TRIGGERS (updated_at automático)
-- ============================================

CREATE TRIGGER set_barbearias_updated_at
BEFORE UPDATE ON public.barbearias
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_barbeiros_updated_at
BEFORE UPDATE ON public.barbeiros
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_agendamentos_updated_at
BEFORE UPDATE ON public.agendamentos
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE TRIGGER set_conversas_updated_at
BEFORE UPDATE ON public.conversas
FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- ============================================
-- 5. ÍNDICES
-- ============================================

CREATE INDEX idx_agendamentos_barbearia_inicio ON public.agendamentos(barbearia_id, inicio_at);
CREATE INDEX idx_agendamentos_barbearia_status ON public.agendamentos(barbearia_id, status);
CREATE INDEX idx_agendamentos_barbeiro_inicio ON public.agendamentos(barbearia_id, barbeiro_id, inicio_at);
CREATE INDEX idx_clientes_barbearia_telefone ON public.clientes(barbearia_id, telefone);
CREATE INDEX idx_conversas_barbearia_telefone ON public.conversas(barbearia_id, telefone);
CREATE INDEX idx_barbeiros_barbearia ON public.barbeiros(barbearia_id);
CREATE INDEX idx_barbearias_instance ON public.barbearias(instance_name);
CREATE INDEX idx_barbearias_slug ON public.barbearias(slug);
CREATE INDEX idx_usuarios_barbearias_user ON public.usuarios_barbearias(user_id);
CREATE INDEX idx_lembretes_agendamento ON public.lembretes_log(agendamento_id);

-- ============================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Função Helper para validar RLS
CREATE OR REPLACE FUNCTION public.get_barbearia_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT barbearia_id FROM public.usuarios_barbearias WHERE user_id = auth.uid() LIMIT 1;
$$;


ALTER TABLE public.barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_barbearias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbeiros ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lembretes_log ENABLE ROW LEVEL SECURITY;

-- Barbearias
CREATE POLICY "Usuário vê sua própria barbearia" ON public.barbearias
FOR SELECT USING (id = public.get_barbearia_id());

CREATE POLICY "Usuário atualiza sua própria barbearia" ON public.barbearias
FOR UPDATE USING (id = public.get_barbearia_id());

-- Usuarios_Barbearias
CREATE POLICY "Usuário vê e gerencia seus próprios vínculos" ON public.usuarios_barbearias
FOR ALL USING (user_id = auth.uid());

-- Barbeiros
CREATE POLICY "Acesso total barbeiros tenant" ON public.barbeiros
FOR ALL USING (barbearia_id = public.get_barbearia_id());

-- Clientes
CREATE POLICY "Acesso total clientes tenant" ON public.clientes
FOR ALL USING (barbearia_id = public.get_barbearia_id());

-- Agendamentos
CREATE POLICY "Acesso total agendamentos tenant" ON public.agendamentos
FOR ALL USING (barbearia_id = public.get_barbearia_id());

-- Conversas
CREATE POLICY "Acesso total conversas tenant" ON public.conversas
FOR ALL USING (barbearia_id = public.get_barbearia_id());

-- Lembretes
CREATE POLICY "Acesso total lembretes tenant" ON public.lembretes_log
FOR ALL USING (barbearia_id = public.get_barbearia_id());

-- ============================================
-- 7. SEED DE DESENVOLVIMENTO
-- ============================================

WITH nova_barbearia AS (
  INSERT INTO public.barbearias (nome, slug, instance_name, plano, config)
  VALUES (
    'Barbearia New House', 
    'new-house', 
    'newhouse', 
    'pro', 
    '{"fuso":"America/Sao_Paulo","dias_funcionamento":["ter","qua","qui","sex","sab"],"horario_abertura":"09:00","horario_fechamento":"20:00","sabado_abertura":"07:30","sabado_fechamento":"15:00"}'::jsonb
  )
  RETURNING id
),
novos_barbeiros AS (
  INSERT INTO public.barbeiros (barbearia_id, nome, telefone, calendar_id, servicos, bloqueios)
  VALUES 
  (
    (SELECT id FROM nova_barbearia),
    'Luiz Freitas',
    '553799593955',
    'ce4db2b20e11109d1b6bafb3acc4396de282a2bf0a0851605bb406777c2f1269@group.calendar.google.com',
    '[{"nome":"Corte","preco":40,"duracao_min":30},{"nome":"Barba","preco":30,"duracao_min":20},{"nome":"Barba terapia","preco":40,"duracao_min":30},{"nome":"Sobrancelha","preco":20,"duracao_min":10},{"nome":"Pigmentação","preco":25,"duracao_min":15},{"nome":"Alisamento","preco":30,"duracao_min":15},{"nome":"Platinado/Luzes","preco":70,"duracao_min":60}]'::jsonb,
    '[{"dia_semana":"ter","inicio":"11:30","fim":"14:00","motivo":"Almoço"},{"dia_semana":"qua","inicio":"11:30","fim":"14:00","motivo":"Almoço"},{"dia_semana":"qui","inicio":"12:00","fim":"13:00","motivo":"Almoço"},{"dia_semana":"sex","inicio":"12:30","fim":"13:00","motivo":"Almoço"},{"dia_semana":"sab","inicio":"11:30","fim":"12:00","motivo":"Intervalo"}]'::jsonb
  ),
  (
    (SELECT id FROM nova_barbearia),
    'Gabriel',
    '5537900000000',
    '190ec4d2a9376697b89b2464cc1acbe5387e1ceb500820a5362e8ec73b7b17cb@group.calendar.google.com',
    '[{"nome":"Corte","preco":30,"duracao_min":30},{"nome":"Barba","preco":20,"duracao_min":20},{"nome":"Barba terapia","preco":25,"duracao_min":30},{"nome":"Sobrancelha","preco":5,"duracao_min":10},{"nome":"Pigmentação","preco":15,"duracao_min":15},{"nome":"Alisamento","preco":50,"duracao_min":15}]'::jsonb,
    '[]'::jsonb
  )
  RETURNING id, nome
),
novos_clientes AS (
  INSERT INTO public.clientes (barbearia_id, nome, telefone, total_atendimentos, ultimo_atendimento, ativo)
  VALUES 
  ((SELECT id FROM nova_barbearia), 'João Silva', '5531999990001', 5, now() - interval '3 days', true),
  ((SELECT id FROM nova_barbearia), 'Pedro Santos', '5531999990002', 12, now() - interval '30 days', true),
  ((SELECT id FROM nova_barbearia), 'Lucas Oliveira', '5531999990003', 2, now() - interval '50 days', false)
  RETURNING id, nome
)
INSERT INTO public.agendamentos (barbearia_id, barbeiro_id, cliente_id, servico, valor, duracao_min, status, inicio_at, fim_at, forma_pagamento, criado_por)
VALUES 
(
  (SELECT id FROM nova_barbearia),
  (SELECT id FROM novos_barbeiros WHERE nome = 'Luiz Freitas'),
  (SELECT id FROM novos_clientes WHERE nome = 'João Silva'),
  'Corte', 40.00, 30, 'agendado', now() + interval '2 hours', now() + interval '2 hours 30 minutes', 'pix', 'ia'
),
(
  (SELECT id FROM nova_barbearia),
  (SELECT id FROM novos_barbeiros WHERE nome = 'Gabriel'),
  (SELECT id FROM novos_clientes WHERE nome = 'Pedro Santos'),
  'Barba', 20.00, 20, 'confirmado', now() + interval '1 day 4 hours', now() + interval '1 day 4 hours 20 minutes', 'cartao', 'manual'
),
(
  (SELECT id FROM nova_barbearia),
  (SELECT id FROM novos_barbeiros WHERE nome = 'Luiz Freitas'),
  (SELECT id FROM novos_clientes WHERE nome = 'Lucas Oliveira'),
  'Corte e Barba', 70.00, 50, 'agendado', now() + interval '1 day 6 hours', now() + interval '1 day 6 hours 50 minutes', 'a_definir', 'ia'
),
(
  (SELECT id FROM nova_barbearia),
  (SELECT id FROM novos_barbeiros WHERE nome = 'Gabriel'),
  (SELECT id FROM novos_clientes WHERE nome = 'João Silva'),
  'Alisamento', 50.00, 15, 'concluido', now() - interval '1 hour', now() - interval '45 minutes', 'dinheiro', 'ia'
),
(
  (SELECT id FROM nova_barbearia),
  (SELECT id FROM novos_barbeiros WHERE nome = 'Luiz Freitas'),
  (SELECT id FROM novos_clientes WHERE nome = 'Pedro Santos'),
  'Pigmentação', 25.00, 15, 'faltou', now() - interval '1 day', now() - interval '1 day' + interval '15 minutes', 'a_definir', 'ia'
);
