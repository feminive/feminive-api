-- Criação de tabela de comentários e curtidas (idempotente)
create extension if not exists pgcrypto;

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  autor text not null,
  conteudo text not null,
  curtidas integer not null default 0,
  criado_em timestamptz not null default now(),
  locale text not null default 'br',
  parent_id uuid references public.comentarios(id) on delete set null,
  anchor_type text not null default 'general',
  paragraph_id text,
  start_offset integer,
  end_offset integer,
  quote text
);

create table if not exists public.comentario_curtidas (
  id uuid primary key default gen_random_uuid(),
  comentario_id uuid not null references public.comentarios(id) on delete cascade,
  ip text not null,
  locale text not null default 'br',
  criado_em timestamptz not null default now(),
  unique (comentario_id, ip)
);

create index if not exists comentarios_slug_idx on public.comentarios (slug, locale, criado_em);
create index if not exists comentarios_slug_paragraph_id_idx on public.comentarios (slug, paragraph_id);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'comentarios_anchor_type_chk') then
    alter table public.comentarios
      add constraint comentarios_anchor_type_chk check (anchor_type in ('general', 'inline'));
  end if;

  if not exists (select 1 from pg_constraint where conname = 'comentarios_quote_len_chk') then
    alter table public.comentarios
      add constraint comentarios_quote_len_chk check (quote is null or char_length(quote) <= 300);
  end if;

  if not exists (select 1 from pg_constraint where conname = 'comentarios_inline_requirements_chk') then
    alter table public.comentarios
      add constraint comentarios_inline_requirements_chk check (
        anchor_type <> 'inline' or (
          paragraph_id is not null and
          start_offset is not null and start_offset >= 0 and
          end_offset is not null and end_offset > start_offset
        )
      );
  end if;
end $$;

create or replace function public.increment_comentario_curtidas(comentario_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.comentarios
    set curtidas = coalesce(curtidas, 0) + 1
    where id = increment_comentario_curtidas.comentario_id;
end;
$$;
