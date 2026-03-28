-- ============================================================
-- Bagres FC — Agendamento automático de abertura de rodada
-- Execute no SQL Editor do Supabase
-- ============================================================
--
-- PRÉ-REQUISITOS: habilite as extensões no painel do Supabase
--   Settings > Database > Extensions > pg_cron   (ativar)
--   Settings > Database > Extensions > pg_net    (ativar)
--
-- Substitua os dois valores abaixo antes de executar:
--   <SUPABASE_URL>        → Settings > API > Project URL
--   <SERVICE_ROLE_KEY>    → Settings > API > service_role (secret)
-- ============================================================

-- Agenda a abertura automática toda quinta-feira às 17:00 UTC (= 14:00 BRT)
select cron.schedule(
  'abrir-rodada-quinta',   -- nome único do job (use para cancelar/atualizar)
  '0 17 * * 4',            -- cron: minuto hora dia mês dia-semana (4 = quinta)
  $$
  select
    net.http_post(
      url     := '<SUPABASE_URL>/functions/v1/abrir-rodada',
      headers := jsonb_build_object(
        'Content-Type',  'application/json',
        'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
      ),
      body    := '{}'::jsonb
    );
  $$
);

-- ============================================================
-- Comandos úteis de manutenção
-- ============================================================

-- Ver jobs agendados:
-- select * from cron.job;

-- Ver histórico de execuções (últimas 10):
-- select * from cron.job_run_details order by start_time desc limit 10;

-- Remover o job (se precisar recriar):
-- select cron.unschedule('abrir-rodada-quinta');

-- Testar manualmente (dispara imediatamente sem esperar quinta):
-- select net.http_post(
--   url     := '<SUPABASE_URL>/functions/v1/abrir-rodada',
--   headers := jsonb_build_object(
--     'Content-Type',  'application/json',
--     'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
--   ),
--   body    := '{}'::jsonb
-- );
