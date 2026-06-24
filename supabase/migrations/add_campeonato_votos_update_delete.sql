-- Permite que cada usuário atualize e delete seu próprio voto MVP
CREATE POLICY "Usuário atualiza voto MVP"
  ON public.campeonato_votos_mvp
  FOR UPDATE
  USING (votante_id = auth.uid())
  WITH CHECK (votante_id = auth.uid());

CREATE POLICY "Usuário deleta voto MVP"
  ON public.campeonato_votos_mvp
  FOR DELETE
  USING (votante_id = auth.uid());
