-- ==============================================================================
-- Migration : OmniMockup Studio — Monétisation v2 + Sécurité RLS P0
-- Fichier   : supabase/migrations/20241008000000_monetisation_v2.sql
-- Rollback  : voir section ROLLBACK en bas de fichier
-- À exécuter manuellement dans : Supabase Dashboard → SQL Editor
-- ==============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. MISE À JOUR DE LA CONTRAINTE DE PLAN (ajout de 'solo')
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- Convertir les anciens noms de plans (sinon la nouvelle contrainte échoue)
UPDATE public.profiles SET plan = 'solo' WHERE plan = 'starter';
UPDATE public.profiles SET plan = 'pro'  WHERE plan = 'creator';
UPDATE public.profiles SET plan = 'free' WHERE plan NOT IN ('free', 'solo', 'pro', 'agence');

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_plan_check
  CHECK (plan IN ('free', 'solo', 'pro', 'agence'));

-- ────────────────────────────────────────────────────────────────────────────
-- 2. NOUVELLES COLONNES SUR PROFILES
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS credit_balance     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS billing_cycle      TEXT DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual'));

-- Index pour accès rapide au solde de crédits
CREATE INDEX IF NOT EXISTS idx_profiles_credit_balance ON public.profiles(credit_balance);

-- ────────────────────────────────────────────────────────────────────────────
-- 3. TABLE CREDIT_TRANSACTIONS (historique idempotent des mouvements de crédits)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta           INTEGER NOT NULL,
  reason          TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_credit_tx_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_stripe_event ON public.credit_transactions(stripe_event_id);

-- RLS sur credit_transactions : lecture seule par le propriétaire
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Utilisateur peut lire ses propres transactions" ON public.credit_transactions;
CREATE POLICY "Utilisateur peut lire ses propres transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. TABLE EVENTS (tracking analytique simple, insertion seule)
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}',
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_events_name ON public.events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_user ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON public.events(created_at DESC);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent insérer leurs propres événements (lecture interdite côté client)
DROP POLICY IF EXISTS "Utilisateur peut insérer des events" ON public.events;
CREATE POLICY "Utilisateur peut insérer des events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ────────────────────────────────────────────────────────────────────────────
-- 5. TABLE USAGE — ajout de png_exports_count pour le quota Solo (20/mois)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.usage
  ADD COLUMN IF NOT EXISTS png_exports_count INTEGER NOT NULL DEFAULT 0;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. CORRECTION SÉCURITÉ P0 — Politique RLS sur profiles
--
-- PROBLÈME ACTUEL : la politique UPDATE existante permet à tout utilisateur
-- connecté de modifier son propre profil, y compris les colonnes plan et
-- credit_balance — ce qui permettrait une auto-promotion gratuite.
--
-- CORRECTION : supprimer la politique UPDATE côté client.
-- plan et credit_balance ne sont modifiables QUE via la clé service_role
-- (utilisée dans le webhook Stripe côté serveur).
-- ────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;

-- Aucune nouvelle politique UPDATE côté client.
-- La clé service_role (SUPABASE_SERVICE_ROLE_KEY) contourne RLS côté serveur.

-- On s'assure que le service_role a bien accès complet :
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.credit_transactions TO service_role;
GRANT ALL ON public.events TO service_role;
GRANT ALL ON public.usage TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (à exécuter manuellement si nécessaire)
-- ────────────────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.credit_transactions CASCADE;
-- DROP TABLE IF EXISTS public.events CASCADE;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS credit_balance;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS subscription_status;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS billing_cycle;
-- ALTER TABLE public.usage DROP COLUMN IF EXISTS png_exports_count;
-- ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_plan_check;
-- ALTER TABLE public.profiles ADD CONSTRAINT profiles_plan_check
--   CHECK (plan IN ('free', 'starter', 'creator', 'pro', 'agence'));
-- CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
--   ON public.profiles FOR UPDATE USING (auth.uid() = id);
