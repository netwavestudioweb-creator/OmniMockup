-- ==============================================================================
-- Migration : OmniMockup Studio — Kit de marque (logo, couleurs, police, signature)
-- Fichier   : supabase/migrations/20261011000000_brand_kits.sql
-- Un kit par utilisateur, lisible et modifiable uniquement par son propriétaire.
-- Le script peut être relancé sans danger.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.brand_kits (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL DEFAULT 'Mon agence' CHECK (char_length(name) <= 80),
  -- Logo en data URL (image), limité à ~400 Ko
  logo        TEXT CHECK (logo IS NULL OR (logo LIKE 'data:image/%' AND char_length(logo) <= 560000)),
  colors      JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(colors) = 'array' AND jsonb_array_length(colors) <= 5),
  font        TEXT CHECK (font IS NULL OR char_length(font) <= 40),
  signature   TEXT CHECK (signature IS NULL OR char_length(signature) <= 80),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

ALTER TABLE public.brand_kits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lire son kit de marque" ON public.brand_kits;
CREATE POLICY "Lire son kit de marque"
  ON public.brand_kits FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Créer son kit de marque" ON public.brand_kits;
CREATE POLICY "Créer son kit de marque"
  ON public.brand_kits FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Modifier son kit de marque" ON public.brand_kits;
CREATE POLICY "Modifier son kit de marque"
  ON public.brand_kits FOR UPDATE TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Supprimer son kit de marque" ON public.brand_kits;
CREATE POLICY "Supprimer son kit de marque"
  ON public.brand_kits FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

REVOKE ALL ON public.brand_kits FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.brand_kits TO authenticated;
GRANT ALL ON public.brand_kits TO service_role;

-- ROLLBACK (manuel) : DROP TABLE IF EXISTS public.brand_kits;
