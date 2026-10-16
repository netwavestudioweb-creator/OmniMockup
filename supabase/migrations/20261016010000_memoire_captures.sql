-- ==============================================================================
-- Migration : mémoire des captures côté serveur (3 heures)
-- Fichier   : supabase/migrations/20261016010000_memoire_captures.sql
-- Espace PRIVÉ : seul le serveur (rôle service) lit et écrit ; aucune règle d'accès
-- pour les visiteurs. Fichiers JSON de 20 Mo au plus. Le script peut être relancé.
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('captures-cache', 'captures-cache', FALSE, 20971520, ARRAY['application/json'])
    ON CONFLICT (id) DO UPDATE
      SET public = FALSE, file_size_limit = 20971520, allowed_mime_types = ARRAY['application/json'];
  END IF;
END $$;

-- ROLLBACK (manuel) :
-- DELETE FROM storage.objects WHERE bucket_id = 'captures-cache'; DELETE FROM storage.buckets WHERE id = 'captures-cache';
