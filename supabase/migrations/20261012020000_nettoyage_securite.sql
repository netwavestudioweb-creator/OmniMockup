-- ==============================================================================
-- Migration : OmniMockup — Nettoyage de sécurité (alertes du conseiller Supabase)
-- Fichier   : supabase/migrations/20261012020000_nettoyage_securite.sql
-- 1. handle_new_user (création du profil à l'inscription) et rls_auto_enable (activation
--    automatique du RLS) ne peuvent plus être appelées depuis l'API publique. Elles restent
--    déclenchées automatiquement : PostgreSQL ne vérifie pas ce droit quand un déclencheur s'exécute.
-- 2. set_updated_at : chemin de recherche fixé (plus de « search_path » modifiable).
-- Le script peut être relancé sans danger.
-- ==============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
             WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable') THEN
    REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
  END IF;
END $$;

ALTER FUNCTION public.set_updated_at() SET search_path = '';

-- ROLLBACK (manuel) :
-- GRANT EXECUTE ON FUNCTION public.handle_new_user() TO PUBLIC;
-- GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO PUBLIC;
-- ALTER FUNCTION public.set_updated_at() RESET search_path;
