-- ============================================================
-- Bagres FC — Suporte a convidados em time_jogadores
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. Remover a PK composta (time_id, usuario_id)
ALTER TABLE public.time_jogadores DROP CONSTRAINT time_jogadores_pkey;

-- 2. Adicionar coluna id como nova PK
ALTER TABLE public.time_jogadores ADD COLUMN id uuid DEFAULT gen_random_uuid();
ALTER TABLE public.time_jogadores ADD PRIMARY KEY (id);

-- 3. usuario_id passa a ser nullable (convidados não têm conta)
ALTER TABLE public.time_jogadores ALTER COLUMN usuario_id DROP NOT NULL;

-- 4. Colunas de convidado
ALTER TABLE public.time_jogadores
  ADD COLUMN IF NOT EXISTS is_guest            boolean      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS guest_nome          text,
  ADD COLUMN IF NOT EXISTS guest_rating        numeric(3,2),
  ADD COLUMN IF NOT EXISTS guest_posicao_campo text;

-- 5. Unicidade apenas para jogadores reais (ignora NULLs automaticamente)
CREATE UNIQUE INDEX IF NOT EXISTS time_jogadores_time_usuario_unique
  ON public.time_jogadores (time_id, usuario_id)
  WHERE usuario_id IS NOT NULL;
