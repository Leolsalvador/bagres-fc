-- ============================================================
-- RPC para excluir um usuário completamente — apaga estatísticas
-- individuais (gols, assistências, votos de MVP recebidos, etc.),
-- limpa referências em registros históricos que devem continuar
-- existindo, e por fim remove o perfil e a conta de login.
-- Execute no SQL Editor do Supabase.
-- ============================================================

create or replace function public.admin_delete_profile(target_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if not exists (
    select 1 from public.profiles where id = auth.uid() and papel = 'admin'
  ) then
    raise exception 'Apenas administradores podem excluir usuários';
  end if;

  if target_id = auth.uid() then
    raise exception 'Não é possível excluir a própria conta por aqui';
  end if;

  -- Estatísticas individuais — apaga por completo
  delete from public.eventos where usuario_id = target_id;
  delete from public.campeonato_eventos where jogador_id = target_id;
  delete from public.campeonato_votos_mvp where jogador_id = target_id;
  delete from public.push_subscriptions where user_id = target_id;

  -- Voto semanal de "bagre"/"melhor" em que essa pessoa foi o alvo —
  -- limpa só a coluna do alvo, preserva o resto do voto de quem votou
  update public.votos_rodada set bagre_id = null where bagre_id = target_id;
  update public.votos_rodada set melhor_id = null where melhor_id = target_id;

  -- Atribuições em registros históricos que devem continuar existindo
  update public.rodadas set artilheiro_id = null where artilheiro_id = target_id;
  update public.rodadas set garcom_id = null where garcom_id = target_id;
  update public.campeonato_partidas set mvp_id = null where mvp_id = target_id;
  update public.campeonatos set created_by = null where created_by = target_id;

  -- O restante (feed_posts, feed_comentarios, feed_reactions, presencas,
  -- time_jogadores, campeonato_time_jogadores, votos, campeonato_votos_mvp.votante_id)
  -- já tem ON DELETE CASCADE e é apagado automaticamente pelo delete abaixo.
  delete from public.profiles where id = target_id;

  -- Remove a conta de login por completo (não dá mais pra entrar com esse email)
  delete from auth.users where id = target_id;
end;
$$;

NOTIFY pgrst, 'reload schema';
