-- Adds locale column to identify which site version created the vote
alter table if exists public.poll_votes
  add column if not exists locale text not null default 'br';

alter table if exists public.poll_votes
  drop constraint if exists poll_votes_locale_check;

alter table if exists public.poll_votes
  add constraint poll_votes_locale_check check (locale in ('br', 'en'));

create index if not exists poll_votes_locale_idx on public.poll_votes (locale);

-- Comentários
alter table if exists public.comentarios
  add column if not exists locale text not null default 'br';

alter table if exists public.comentarios
  drop constraint if exists comentarios_locale_check;

alter table if exists public.comentarios
  add constraint comentarios_locale_check check (locale in ('br', 'en'));

create index if not exists comentarios_locale_idx on public.comentarios (locale);

-- Curtidas em comentários
alter table if exists public.comentario_curtidas
  add column if not exists locale text not null default 'br';

alter table if exists public.comentario_curtidas
  drop constraint if exists comentario_curtidas_locale_check;

alter table if exists public.comentario_curtidas
  add constraint comentario_curtidas_locale_check check (locale in ('br', 'en'));

create index if not exists comentario_curtidas_locale_idx on public.comentario_curtidas (locale);

-- Leitores
alter table if exists public.leitores
  add column if not exists locale text not null default 'br';

alter table if exists public.leitores
  drop constraint if exists leitores_locale_check;

alter table if exists public.leitores
  add constraint leitores_locale_check check (locale in ('br', 'en'));

create index if not exists leitores_locale_idx on public.leitores (locale);

-- Progresso de leitura
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
