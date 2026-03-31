-- ============================================================
-- Bagres FC: FIX — Função para limpar TODOS os votos e zerar ratings
-- Motivo: clearAllVotosAndRatings() no api.js chama esta RPC,
--         mas ela não existia no banco, causando erro silencioso.
--         Além disso, o RLS bloqueava DELETE na tabela votos para admins.
--         security definer = roda como dono da tabela, bypassa RLS.
-- Execute no SQL Editor do Supabase
-- ============================================================

create or replace function public.clear_all_votos_and_ratings()
returns void
language plpgsql
security definer
as $$
begin
  -- Apaga todos os votos de todos os ciclos
  delete from public.votos;

  -- Zera o rating de todos os jogadores aprovados
  update public.profiles
  set rating = 0
  where status = 'aprovado';
end;
$$;
