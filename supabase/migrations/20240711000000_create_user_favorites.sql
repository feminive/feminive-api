-- Tabela de favoritos por usuária
create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  post_slug text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint user_favorites_user_post_unique unique (user_id, post_slug)
);

create index if not exists user_favorites_user_id_idx on public.user_favorites (user_id, created_at desc);
create index if not exists user_favorites_post_slug_idx on public.user_favorites (post_slug);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists user_favorites_updated_at on public.user_favorites;
create trigger user_favorites_updated_at
  before update on public.user_favorites
  for each row execute procedure public.touch_updated_at();

alter table public.user_favorites enable row level security;
