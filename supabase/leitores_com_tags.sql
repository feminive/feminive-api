-- Lista leitores com tags agregadas (apenas quem tem ao menos 1 tag e leitura concluída)
-- Rode no Supabase SQL editor ou via CLI antes de usar o endpoint.

create or replace function public.leitores_com_tags(p_limit int default 50, p_offset int default 0)
returns table(email text, apelido text, tags text[]) as $$
  with base as (
    select
      lp.email,
      array_remove(array_agg(distinct nullif(trim(t.tag), '')), null) as tags
    from public.leitura_progresso lp
    cross join lateral unnest(coalesce(lp.tags, '{}'::text[])) as t(tag)
    where lp.concluido is true
    group by lp.email
    having array_length(array_remove(array_agg(distinct nullif(trim(t.tag), '')), null), 1) > 0
  )
  select
    l.email,
    l.apelido,
    b.tags
  from base b
  left join public.leitores l on l.email = b.email
  order by l.atualizado_em desc nulls last, b.email
  limit least(coalesce($1, 50), 200)
  offset greatest(coalesce($2, 0), 0);
$$ language sql stable;
