-- ============================================================
-- Campeonato v2 — Sincronização de timer + suporte a cartões
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Colunas de timer na tabela de partidas
--    timer_end_ts   : timestamp absoluto em que o timer chega a 0 (nulo = pausado/parado)
--    timer_paused_secs : segundos restantes quando pausado (nulo = rodando ou não iniciado)
ALTER TABLE public.campeonato_partidas
  ADD COLUMN IF NOT EXISTS timer_end_ts timestamptz,
  ADD COLUMN IF NOT EXISTS timer_paused_secs int;

-- 2. Estende os tipos de eventos para incluir cartões
ALTER TABLE public.campeonato_eventos
  DROP CONSTRAINT IF EXISTS campeonato_eventos_tipo_check;
ALTER TABLE public.campeonato_eventos
  ADD CONSTRAINT campeonato_eventos_tipo_check
  CHECK (tipo IN ('gol', 'assistencia', 'cartao_amarelo', 'cartao_vermelho'));

-- 3. Adiciona campeonato_id nos eventos (já usado no código, garante consistência)
ALTER TABLE public.campeonato_eventos
  ADD COLUMN IF NOT EXISTS campeonato_id uuid REFERENCES public.campeonatos(id) ON DELETE CASCADE;
