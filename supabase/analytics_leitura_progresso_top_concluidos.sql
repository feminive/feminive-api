-- Analytics: top slugs by concluded readings (concluido = true)
-- Safe to run in Supabase SQL Editor. Edit the limit if needed.

WITH params AS (
  SELECT
    50::int AS limit_rows,        -- change 50 to desired limit
    'br'::text AS locale_param    -- change locale to 'en' when needed
)
SELECT
  slug,
  count(*) AS total_concluidos
FROM public.leitura_progresso
WHERE concluido IS TRUE
  AND locale = (SELECT locale_param FROM params)
  AND email NOT IN ('feminivefanfics@gmail.com')
GROUP BY slug
ORDER BY total_concluidos DESC, slug ASC
LIMIT (SELECT limit_rows FROM params);
