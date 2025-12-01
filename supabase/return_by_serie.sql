-- Analytics: total de leituras concluídas agrupadas pelo prefixo do slug (texto antes da primeira '/')
-- Safe to run in Supabase SQL Editor. Edite o limit_rows ou locale_param se necessário.

WITH params AS (
  SELECT
    50::int AS limit_rows,        -- mude 50 para o limite desejado
    'br'::text AS locale_param    -- mude para 'en' quando necessário
)
SELECT
  split_part(slug, '/', 1) AS slug_prefix,
  count(*) AS total_concluidos
FROM public.leitura_progresso
WHERE concluido IS TRUE
  AND locale = (SELECT locale_param FROM params)
  AND email NOT IN ('cefasheli@gmail.com', 'oskrnl@gmail.com', 'feminivefanfics@gmail.com')
GROUP BY slug_prefix
ORDER BY total_concluidos DESC, slug_prefix ASC
LIMIT (SELECT limit_rows FROM params);