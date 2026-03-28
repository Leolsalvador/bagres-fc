-- ============================================================
-- Bagres FC — Suporte a convidados na lista de presença
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. usuario_id passa a ser nullable (convidados não têm conta)
alter table public.presencas alter column usuario_id drop not null;

-- 2. Colunas de convidado
alter table public.presencas
  add column if not exists is_guest             boolean      not null default false,
  add column if not exists guest_nome           text,
  add column if not exists guest_posicao_campo  text         check (guest_posicao_campo in ('GOL','ZAG','MEI','ATA')),
  add column if not exists guest_rating         numeric(3,2) default 3.00,
  add column if not exists convidado_por        uuid         references public.profiles(id) on delete set null;

-- 3. RLS: jogador gerencia seus próprios convidados
create policy "Usuário gerencia próprios convidados" on public.presencas
  for all
  using     (is_guest = true and auth.uid() = convidado_por)
  with check(is_guest = true and auth.uid() = convidado_por);
