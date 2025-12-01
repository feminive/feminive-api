-- Adds tags support to leitura_progresso
-- Run in Supabase SQL editor before deploying the API changes

alter table public.leitura_progresso
  add column if not exists tags text[] default '{}'::text[];

-- Optional: faster searches/aggregations by tag
create index if not exists leitura_progresso_tags_gin on public.leitura_progresso using gin (tags);
