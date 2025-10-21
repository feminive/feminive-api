-- Inicialização do esquema para a API Feminive
create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1 from pg_roles where rolname = 'anon'
  ) then
    create role anon;
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_roles where rolname = 'service_role'
  ) then
    create role service_role;
  end if;
end
$$;

create table if not exists public.newsletter_inscricoes (
  email text primary key,
  origem text,
  criado_em timestamptz not null default timezone('utc', now()),
  cancelado_em timestamptz,
  motivo_cancelamento text
);

create table if not exists public.leitores (
  email text primary key,
  apelido text not null,
  criado_em timestamptz not null default timezone('utc', now()),
  atualizado_em timestamptz not null default timezone('utc', now())
);

create table if not exists public.leitura_progresso (
  email text not null references public.leitores(email) on delete cascade,
  slug text not null,
  progresso numeric(5,4) not null default 0,
  concluido boolean not null default false,
  atualizado_em timestamptz not null default timezone('utc', now()),
  primary key (email, slug)
);

create table if not exists public.comentarios (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  autor text not null,
  conteudo text not null,
  curtidas integer not null default 0,
  criado_em timestamptz not null default timezone('utc', now())
);

create index if not exists comentarios_slug_idx on public.comentarios (slug, criado_em);

create table if not exists public.comentario_curtidas (
  id uuid primary key default gen_random_uuid(),
  comentario_id uuid not null references public.comentarios(id) on delete cascade,
  ip text not null,
  registrado_em timestamptz not null default timezone('utc', now()),
  constraint comentario_curtidas_unico unique (comentario_id, ip)
);

create or replace function public.increment_comentario_curtidas(comentario_id uuid)
returns void
language plpgsql
as $$
begin
  update public.comentarios
  set curtidas = curtidas + 1
  where id = comentario_id;
end;
$$;

alter table public.newsletter_inscricoes enable row level security;
alter table public.leitores enable row level security;
alter table public.leitura_progresso enable row level security;
alter table public.comentarios enable row level security;
alter table public.comentario_curtidas enable row level security;
