-- Analytics: totals of most voted options per poll
-- Safe to run in Supabase SQL Editor. Edit params as needed.

WITH params AS (
  SELECT
    100::int     AS limit_rows,   -- max rows returned
    false::bool  AS winners_only  -- set to true to return only top option per poll
), aggregated AS (
  SELECT
    poll_id,
    option_id,
    count(*)::bigint AS total_votos
  FROM public.poll_votes
  GROUP BY poll_id, option_id
), ranked AS (
  SELECT
    poll_id,
    option_id,
    total_votos,
    rank() OVER (PARTITION BY poll_id ORDER BY total_votos DESC, option_id ASC) AS rnk
  FROM aggregated
)
SELECT
  poll_id,
  option_id,
  total_votos,
  rnk AS ranking
FROM ranked
WHERE (SELECT winners_only FROM params) IS FALSE OR rnk = 1
ORDER BY poll_id, ranking, total_votos DESC, option_id ASC
LIMIT (SELECT limit_rows FROM params);

