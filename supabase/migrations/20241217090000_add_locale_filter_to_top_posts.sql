-- Atualiza a função para respeitar o locale informado
create or replace function public.top_posts_mais_lidos(locale_param text default 'br', limit_rows integer default 10)
returns table(slug text, total_concluidos bigint)
language sql
as $$
  select
    lp.slug,
    count(*)::bigint as total_concluidos
  from public.leitura_progresso lp
  where lp.concluido is true
    and lp.locale = coalesce(nullif(lower(locale_param), ''), 'br')
  group by lp.slug
  order by total_concluidos desc, lp.slug asc
  limit greatest(1, coalesce(limit_rows, 10));
$$;

comment on function public.top_posts_mais_lidos is
  'Retorna o ranking de posts com mais leituras concluídas para uso nas APIs filtrando por locale';
