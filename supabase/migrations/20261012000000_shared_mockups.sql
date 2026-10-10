-- ==============================================================================
-- Migration : OmniMockup Studio — Liens de partage d'un mockup (page publique pour le client)
-- Fichier   : supabase/migrations/20261012000000_shared_mockups.sql
-- Les liens sont créés et supprimés uniquement par le serveur (clé service_role), après
-- vérification du compte et de la limite du forfait (gratuit : 5 liens actifs).
-- Les images sont dans le bucket public « shared-mockups » (chemin aléatoire par lien).
-- Le script peut être relancé sans danger.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.shared_mockups (
  id          TEXT PRIMARY KEY CHECK (id ~ '^[a-z0-9]{8,16}$'),
  -- NULL uniquement pour la session de démonstration en développement local
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL DEFAULT '' CHECK (char_length(title) <= 120),
  image_path  TEXT NOT NULL,
  width       INTEGER NOT NULL CHECK (width > 0),
  height      INTEGER NOT NULL CHECK (height > 0),
  view_count  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  revoked_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_shared_mockups_user ON public.shared_mockups(user_id, created_at DESC)
  WHERE revoked_at IS NULL;

ALTER TABLE public.shared_mockups ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.shared_mockups FROM anon, authenticated;
GRANT SELECT ON public.shared_mockups TO authenticated;
GRANT ALL ON public.shared_mockups TO service_role;

-- Un utilisateur connecté ne voit que ses propres liens (aucune écriture directe)
DROP POLICY IF EXISTS "shared_mockups_select_own" ON public.shared_mockups;
CREATE POLICY "shared_mockups_select_own" ON public.shared_mockups
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Compteur de vues, appelé par la page publique (serveur)
CREATE OR REPLACE FUNCTION public.increment_share_view(p_id TEXT)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.shared_mockups SET view_count = view_count + 1 WHERE id = p_id AND revoked_at IS NULL;
$$;
REVOKE ALL ON FUNCTION public.increment_share_view(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_share_view(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_share_view(TEXT) TO service_role;

-- Bucket public pour les images partagées (écriture réservée au serveur : aucune politique d'insertion)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES ('shared-mockups', 'shared-mockups', TRUE, 8388608, ARRAY['image/jpeg', 'image/png'])
    ON CONFLICT (id) DO UPDATE
      SET public = TRUE, file_size_limit = 8388608, allowed_mime_types = ARRAY['image/jpeg', 'image/png'];
  END IF;
END $$;

-- ROLLBACK (manuel) :
-- DROP FUNCTION IF EXISTS public.increment_share_view(TEXT);
-- DROP TABLE IF EXISTS public.shared_mockups;
-- DELETE FROM storage.objects WHERE bucket_id = 'shared-mockups'; DELETE FROM storage.buckets WHERE id = 'shared-mockups';
