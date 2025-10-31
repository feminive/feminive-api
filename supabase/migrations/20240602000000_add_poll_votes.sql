-- Tabela para armazenar votos de enquetes
create table if not exists public.poll_votes (
  id uuid primary key default gen_random_uuid(),
  poll_id text not null,
  option_id text not null,
  email text not null,
  voted_at timestamptz not null default timezone('utc', now()),
  constraint poll_votes_email_lowercase check (email = lower(email)),
  constraint poll_votes_unique_vote unique (poll_id, email)
);

create index if not exists poll_votes_poll_id_idx on public.poll_votes (poll_id);
create index if not exists poll_votes_email_idx on public.poll_votes (email);

alter table public.poll_votes enable row level security;
