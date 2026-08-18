-- ============================================================
-- Módulo Campeonato — cor secundária do time
-- Execute no SQL Editor do Supabase
-- ============================================================

ALTER TABLE public.campeonato_times
  ADD COLUMN IF NOT EXISTS cor_secundaria text;
