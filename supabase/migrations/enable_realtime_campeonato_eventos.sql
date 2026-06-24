-- Habilita Realtime para campeonato_eventos e campeonato_times
-- Necessário para que gols, assistências e cartões apareçam em tempo real
-- para todos os usuários sem depender só do update em campeonato_partidas
ALTER TABLE public.campeonato_eventos REPLICA IDENTITY FULL;
ALTER TABLE public.campeonato_times REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campeonato_eventos;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.campeonato_times;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
