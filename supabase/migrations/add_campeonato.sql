-- ============================================================
-- Módulo Campeonato — Migration
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Adiciona 'telespectador' ao papel em profiles
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_papel_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_papel_check
  CHECK (papel IN ('admin', 'usuario', 'telespectador'));

-- ============================================================
-- 2. Tabelas do campeonato
-- ============================================================

CREATE TABLE public.campeonatos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome        text NOT NULL,
  status      text NOT NULL DEFAULT 'rascunho'
                CHECK (status IN ('rascunho', 'em_andamento', 'finalizado')),
  visivel     boolean NOT NULL DEFAULT false,
  fase_atual  text NOT NULL DEFAULT 'grupos'
                CHECK (fase_atual IN ('grupos', 'semifinais', 'final', 'encerrado')),
  created_by  uuid REFERENCES public.profiles(id),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE public.campeonato_times (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campeonato_id   uuid NOT NULL REFERENCES public.campeonatos(id) ON DELETE CASCADE,
  nome            text NOT NULL,
  cor             text NOT NULL DEFAULT '#6B7280',
  grupo           text NOT NULL DEFAULT 'A' CHECK (grupo IN ('A', 'B'))
);

CREATE TABLE public.campeonato_time_jogadores (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_id   uuid NOT NULL REFERENCES public.campeonato_times(id) ON DELETE CASCADE,
  jogador_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  UNIQUE (time_id, jogador_id)
);

CREATE TABLE public.campeonato_partidas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campeonato_id       uuid NOT NULL REFERENCES public.campeonatos(id) ON DELETE CASCADE,
  fase                text NOT NULL DEFAULT 'grupos'
                        CHECK (fase IN ('grupos', 'semifinal', 'terceiro_lugar', 'final')),
  rodada_num          int NOT NULL DEFAULT 1,
  ordem               int NOT NULL DEFAULT 1,
  time_casa_id        uuid NOT NULL REFERENCES public.campeonato_times(id),
  time_visitante_id   uuid NOT NULL REFERENCES public.campeonato_times(id),
  gols_casa           int NOT NULL DEFAULT 0,
  gols_visitante      int NOT NULL DEFAULT 0,
  penaltis_casa       int,
  penaltis_visitante  int,
  half_atual          int NOT NULL DEFAULT 0,
  status              text NOT NULL DEFAULT 'agendada'
                        CHECK (status IN ('agendada', 'em_andamento', 'encerrada')),
  votacao_mvp_aberta  boolean NOT NULL DEFAULT false,
  mvp_id              uuid REFERENCES public.profiles(id),
  created_at          timestamptz DEFAULT now()
);

CREATE TABLE public.campeonato_eventos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id   uuid NOT NULL REFERENCES public.campeonato_partidas(id) ON DELETE CASCADE,
  jogador_id   uuid NOT NULL REFERENCES public.profiles(id),
  time_id      uuid NOT NULL REFERENCES public.campeonato_times(id),
  tipo         text NOT NULL CHECK (tipo IN ('gol', 'assistencia')),
  minuto       int,
  half         int,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE public.campeonato_votos_mvp (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partida_id  uuid NOT NULL REFERENCES public.campeonato_partidas(id) ON DELETE CASCADE,
  votante_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  jogador_id  uuid NOT NULL REFERENCES public.profiles(id),
  created_at  timestamptz DEFAULT now(),
  UNIQUE (partida_id, votante_id)
);

-- ============================================================
-- 3. RLS
-- ============================================================

ALTER TABLE public.campeonatos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_times        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_time_jogadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_partidas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_eventos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campeonato_votos_mvp    ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário aprovado (admin, usuario, telespectador)
CREATE POLICY "Leitura de campeonatos" ON public.campeonatos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

CREATE POLICY "Leitura de campeonato_times" ON public.campeonato_times
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

CREATE POLICY "Leitura de campeonato_time_jogadores" ON public.campeonato_time_jogadores
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

CREATE POLICY "Leitura de campeonato_partidas" ON public.campeonato_partidas
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

CREATE POLICY "Leitura de campeonato_eventos" ON public.campeonato_eventos
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

CREATE POLICY "Leitura de campeonato_votos_mvp" ON public.campeonato_votos_mvp
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

-- Escrita: apenas admin
CREATE POLICY "Admin gerencia campeonatos" ON public.campeonatos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND papel = 'admin')
  );

CREATE POLICY "Admin gerencia campeonato_times" ON public.campeonato_times
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND papel = 'admin')
  );

CREATE POLICY "Admin gerencia campeonato_time_jogadores" ON public.campeonato_time_jogadores
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND papel = 'admin')
  );

CREATE POLICY "Admin gerencia campeonato_partidas" ON public.campeonato_partidas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND papel = 'admin')
  );

CREATE POLICY "Admin gerencia campeonato_eventos" ON public.campeonato_eventos
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND papel = 'admin')
  );

-- Votos MVP: qualquer aprovado pode inserir o próprio voto
CREATE POLICY "Usuário insere voto MVP" ON public.campeonato_votos_mvp
  FOR INSERT WITH CHECK (
    auth.uid() = votante_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

-- ============================================================
-- 4. Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.campeonatos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campeonato_partidas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.campeonato_votos_mvp;
