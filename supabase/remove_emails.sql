-- Remove registros de uma lista de e-mails em tabelas conhecidas
-- Edite o array emails_alvo e execute no Supabase SQL Editor

DO $$
DECLARE
  emails_alvo text[] := ARRAY[
    'email1@exemplo.com',
    'email2@exemplo.com'
  ];
  patterns text[];
  cnt      bigint;
BEGIN
  -- monta padrões %email% para achar em autor/conteudo
  patterns := (
    SELECT array_agg('%' || lower(e) || '%') FROM unnest(emails_alvo) AS e
  );

  -- comentários e curtidas (remove curtidas antes por FK)
  IF to_regclass('public.comentarios') IS NOT NULL THEN
    IF to_regclass('public.comentario_curtidas') IS NOT NULL THEN
      EXECUTE $q$
        DELETE FROM public.comentario_curtidas
        WHERE comentario_id IN (
          SELECT id FROM public.comentarios
          WHERE lower(autor) = ANY($1) OR lower(conteudo) ILIKE ANY($2)
        )
      $q$ USING emails_alvo, patterns;
    END IF;

    EXECUTE $q$
      DELETE FROM public.comentarios
      WHERE lower(autor) = ANY($1) OR lower(conteudo) ILIKE ANY($2)
    $q$ USING emails_alvo, patterns;
  END IF;

  -- newsletter
  IF to_regclass('public.newsletter_inscricoes') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.newsletter_inscricoes WHERE lower(email) = ANY($1)'
      USING emails_alvo;
  END IF;

  -- enquetes
  IF to_regclass('public.poll_votes') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.poll_votes WHERE lower(email) = ANY($1)'
      USING emails_alvo;
  END IF;

  -- leitura (apaga progresso antes do leitor)
  IF to_regclass('public.leitura_progresso') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.leitura_progresso WHERE lower(email) = ANY($1)'
      USING emails_alvo;
  END IF;

  IF to_regclass('public.leitores') IS NOT NULL THEN
    EXECUTE 'DELETE FROM public.leitores WHERE lower(email) = ANY($1)'
      USING emails_alvo;
  END IF;
END $$;
