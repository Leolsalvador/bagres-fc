-- ============================================================
-- Bagres FC — Funções auxiliares (execute no SQL Editor do Supabase)
-- ============================================================

-- Incrementa stats de um jogador contornando RLS (security definer)
create or replace function public.increment_player_stats(
  player_id       uuid,
  gols_add        int default 0,
  assistencias_add int default 0,
  jogos_add       int default 0
)
returns void
language plpgsql
security definer
as $$
begin
  update public.profiles
  set
    gols         = gols         + gols_add,
    assistencias = assistencias + assistencias_add,
    jogos        = jogos        + jogos_add
  where id = player_id;
end;
$$;

-- Recalcula o rating de um jogador com base na média dos votos recebidos
create or replace function public.recalculate_rating(player_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  avg_nota numeric;
begin
  select avg(nota) into avg_nota
  from public.votos
  where avaliado_id = player_id;

  if avg_nota is not null then
    update public.profiles
    set rating = round(avg_nota::numeric, 2)
    where id = player_id;
  end if;
end;
$$;

-- Função is_admin (security definer — evita recursão infinita no RLS)
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and papel = 'admin'
  )
$$;
