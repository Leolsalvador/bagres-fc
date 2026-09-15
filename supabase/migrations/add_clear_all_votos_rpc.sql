-- RPC para limpar todos os votos (todos os ciclos) e zerar ratings
-- Executa com security definer para contornar RLS
create or replace function public.clear_all_votos_and_ratings()
returns void
language plpgsql
security definer
as $$
begin
  -- Supabase bloqueia DELETE/UPDATE sem WHERE (proteção contra apagar tabela inteira sem querer)
  delete from public.votos where true;
  update public.profiles set rating = 0 where status = 'aprovado';
end;
$$;
