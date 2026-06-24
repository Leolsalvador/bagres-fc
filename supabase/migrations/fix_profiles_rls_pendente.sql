-- Garante que usuário pendente pode ler o próprio perfil
-- Sem isso, fetchProfile retorna null e o app fica preso em "Aguardando aprovação"
CREATE POLICY IF NOT EXISTS "Usuário lê próprio perfil"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);
