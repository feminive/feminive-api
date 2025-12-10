-- Comentários inline por parágrafo
alter table public.comentarios
  add column if not exists anchor_type text not null default 'general',
  add column if not exists paragraph_id text,
  add column if not exists start_offset integer,
  add column if not exists end_offset integer,
  add column if not exists quote text;

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
