-- Cleanup script: remove personal emails across related tables
-- Safe to run even if some tables don't exist (guards with to_regclass)
-- Usage: paste in Supabase SQL Editor and run once.
-- Emails targeted (lowercased comparisons):
--   - feminivefanfics@gmail.com
--   - cefasheli@gmail.com
--   - balduros@gmail.com
--   - cefassathler@gmail.com

DO $$
DECLARE
  emails   text[] := ARRAY['feminivefanfics@gmail.com','cefasheli@gmail.com','balduros@gmail.com','cefassathler@gmail.com'];
  patterns text[];  -- for matching comments that contain these emails in autor/conteudo
  cnt      bigint;
BEGIN
  -- Build LIKE patterns such as %email%
  patterns := (
    SELECT array_agg('%' || e || '%') FROM unnest(emails) AS e
  );

  -- Comentários e curtidas (remove curtidas antes por FK)
  IF to_regclass('public.comentarios') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.comentarios WHERE autor ILIKE ANY($1) OR conteudo ILIKE ANY($1)'
      INTO cnt USING patterns;
    RAISE NOTICE 'comentarios a remover: %', cnt;

    IF to_regclass('public.comentario_curtidas') IS NOT NULL THEN
      EXECUTE 'SELECT count(*) FROM public.comentario_curtidas WHERE comentario_id IN (
                 SELECT id FROM public.comentarios WHERE autor ILIKE ANY($1) OR conteudo ILIKE ANY($1)
               )'
        INTO cnt USING patterns;
      RAISE NOTICE 'comentario_curtidas a remover: %', cnt;

      EXECUTE 'DELETE FROM public.comentario_curtidas WHERE comentario_id IN (
                 SELECT id FROM public.comentarios WHERE autor ILIKE ANY($1) OR conteudo ILIKE ANY($1)
               )'
        USING patterns;
    END IF;

    EXECUTE 'DELETE FROM public.comentarios WHERE autor ILIKE ANY($1) OR conteudo ILIKE ANY($1)'
      USING patterns;
  END IF;

  -- Newsletter
  IF to_regclass('public.newsletter_inscricoes') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.newsletter_inscricoes WHERE lower(email) = ANY($1)'
      INTO cnt USING emails;
    RAISE NOTICE 'newsletter_inscricoes a remover: %', cnt;
    EXECUTE 'DELETE FROM public.newsletter_inscricoes WHERE lower(email) = ANY($1)'
      USING emails;
  END IF;

  -- Enquetes
  IF to_regclass('public.poll_votes') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.poll_votes WHERE lower(email) = ANY($1)'
      INTO cnt USING emails;
    RAISE NOTICE 'poll_votes a remover: %', cnt;
    EXECUTE 'DELETE FROM public.poll_votes WHERE lower(email) = ANY($1)'
      USING emails;
  END IF;

  -- Leitura (apaga progresso antes do leitor)
  IF to_regclass('public.leitura_progresso') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.leitura_progresso WHERE lower(email) = ANY($1)'
      INTO cnt USING emails;
    RAISE NOTICE 'leitura_progresso a remover: %', cnt;
    EXECUTE 'DELETE FROM public.leitura_progresso WHERE lower(email) = ANY($1)'
      USING emails;
  END IF;

  IF to_regclass('public.leitores') IS NOT NULL THEN
    EXECUTE 'SELECT count(*) FROM public.leitores WHERE lower(email) = ANY($1)'
      INTO cnt USING emails;
    RAISE NOTICE 'leitores a remover: %', cnt;
    EXECUTE 'DELETE FROM public.leitores WHERE lower(email) = ANY($1)'
      USING emails;
  END IF;
END $$;
