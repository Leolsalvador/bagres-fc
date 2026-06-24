-- Habilita Realtime para a tabela profiles
-- Necessário para que a tela de aguardando aprovação redirecione automaticamente
ALTER TABLE public.profiles REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
