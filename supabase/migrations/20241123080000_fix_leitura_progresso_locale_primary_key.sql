-- Guarantees that leitura_progresso uses (email, slug, locale) as the primary key
-- so upserts with those columns in ON CONFLICT clauses work reliably.
alter table if exists public.leitura_progresso
  add column if not exists locale text not null default 'br';

alter table if exists public.leitura_progresso
  drop constraint if exists leitura_progresso_locale_check;

alter table if exists public.leitura_progresso
  add constraint leitura_progresso_locale_check check (locale in ('br', 'en'));

alter table if exists public.leitura_progresso
  drop constraint if exists leitura_progresso_pkey;

alter table if exists public.leitura_progresso
  add constraint leitura_progresso_pkey primary key (email, slug, locale);

create index if not exists leitura_progresso_locale_idx on public.leitura_progresso (locale);
