-- Analytics: totals of most voted options per poll
-- Safe to run in Supabase SQL Editor. Edit params as needed.

WITH params AS (
  SELECT
    100::int     AS limit_rows,    -- max rows returned
    false::bool  AS winners_only,  -- set to true to return only top option per poll
    NULL::text   AS locale_filter  -- set to 'br' or 'en' to filter by locale
), aggregated AS (
  SELECT
    poll_id,
    option_id,
    locale,
    count(*)::bigint AS total_votos
  FROM public.poll_votes
  WHERE (SELECT locale_filter FROM params) IS NULL
     OR locale = (SELECT locale_filter FROM params)
  GROUP BY poll_id, option_id, locale
), ranked AS (
  SELECT
    poll_id,
    option_id,
    locale,
    total_votos,
    rank() OVER (
      PARTITION BY poll_id, locale
      ORDER BY total_votos DESC, option_id ASC
    ) AS rnk
  FROM aggregated
)
SELECT
  poll_id,
  locale,
  option_id,
  total_votos,
  rnk AS ranking
FROM ranked
WHERE (SELECT winners_only FROM params) IS FALSE OR rnk = 1
ORDER BY poll_id, ranking, total_votos DESC, option_id ASC
LIMIT (SELECT limit_rows FROM params);
