-- Lista leitores com tags agregadas (apenas quem tem ao menos 1 tag e leitura concluída)
-- Rode no Supabase SQL editor ou via CLI antes de usar o endpoint.

create or replace function public.leitores_com_tags(p_limit int default 50, p_offset int default 0)
returns table(email text, apelido text, tags text[], tags_contagem jsonb) as $$
  with tags_raw as (
    select
      lp.email,
      nullif(trim(t.tag), '') as tag_clean
    from public.leitura_progresso lp
    cross join lateral unnest(coalesce(lp.tags, '{}'::text[])) as t(tag)
    where lp.concluido is true
  ),
  tags_agg as (
    select
      tr.email,
      tr.tag_clean,
      count(*) as cnt
    from tags_raw tr
    where tr.tag_clean is not null
    group by tr.email, tr.tag_clean
  ),
  base as (
    select
      ta.email,
      array_agg(distinct ta.tag_clean) as tags,
      jsonb_agg(
        jsonb_build_object('tag', ta.tag_clean, 'count', ta.cnt)
        order by ta.cnt desc, ta.tag_clean
      ) as tags_contagem
    from tags_agg ta
    group by ta.email
    having array_length(array_agg(distinct ta.tag_clean), 1) > 0
  )
  select
    l.email,
    l.apelido,
    b.tags,
    b.tags_contagem
  from base b
  left join public.leitores l on l.email = b.email
  order by l.atualizado_em desc nulls last, b.email
  limit least(coalesce($1, 50), 200)
  offset greatest(coalesce($2, 0), 0);
$$ language sql stable;
