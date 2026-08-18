-- ============================================================
-- Módulo Campeonato — Suporte a jogadores convidados (sem conta no app)
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. campeonato_time_jogadores — convidado no elenco do time
ALTER TABLE public.campeonato_time_jogadores
  ALTER COLUMN jogador_id DROP NOT NULL;
ALTER TABLE public.campeonato_time_jogadores
  ADD COLUMN IF NOT EXISTS is_guest   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_nome text;

ALTER TABLE public.campeonato_time_jogadores
  DROP CONSTRAINT IF EXISTS campeonato_time_jogadores_time_id_jogador_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS campeonato_time_jogadores_time_jogador_unique
  ON public.campeonato_time_jogadores (time_id, jogador_id)
  WHERE jogador_id IS NOT NULL;

-- 2. campeonato_eventos — gol/assistência/cartão de convidado
ALTER TABLE public.campeonato_eventos
  ALTER COLUMN jogador_id DROP NOT NULL;
ALTER TABLE public.campeonato_eventos
  ADD COLUMN IF NOT EXISTS is_guest              boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_nome            text,
  ADD COLUMN IF NOT EXISTS guest_time_jogador_id uuid REFERENCES public.campeonato_time_jogadores(id);

-- 3. campeonato_votos_mvp — voto para convidado
ALTER TABLE public.campeonato_votos_mvp
  ALTER COLUMN jogador_id DROP NOT NULL;
ALTER TABLE public.campeonato_votos_mvp
  ADD COLUMN IF NOT EXISTS is_guest              boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_nome            text,
  ADD COLUMN IF NOT EXISTS guest_time_jogador_id uuid REFERENCES public.campeonato_time_jogadores(id);

-- 4. campeonato_partidas — MVP eleito pode ser um convidado
ALTER TABLE public.campeonato_partidas
  ADD COLUMN IF NOT EXISTS mvp_is_guest   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS mvp_guest_nome text;

NOTIFY pgrst, 'reload schema';
