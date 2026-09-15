-- ============================================================
-- Stories — fotos que qualquer jogador aprovado pode postar,
-- visíveis por 24h e depois apagadas (registro + arquivo no R2)
-- Execute no SQL Editor do Supabase
-- ============================================================

CREATE TABLE public.stories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  autor_id    uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  imagem_url  text NOT NULL,
  r2_key      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer usuário aprovado (jogador ou telespectador)
CREATE POLICY "Leitura de stories" ON public.stories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

-- Criação: só o próprio autor, se aprovado
CREATE POLICY "Usuario cria seu story" ON public.stories
  FOR INSERT WITH CHECK (
    auth.uid() = autor_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND status = 'aprovado')
  );

-- Exclusão: o autor pode apagar o próprio story a qualquer momento;
-- qualquer usuário aprovado pode apagar stories já expirados (>24h) —
-- é o mecanismo de limpeza automática, disparado pelo cliente de quem
-- abrir o Feed, sem precisar de cron/servidor.
CREATE POLICY "Autor ou story expirado pode ser excluido" ON public.stories
  FOR DELETE USING (
    auth.uid() = autor_id
    OR created_at < now() - interval '24 hours'
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
