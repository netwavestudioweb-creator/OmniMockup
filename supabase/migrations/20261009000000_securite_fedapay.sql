-- ==============================================================================
-- Migration : OmniMockup Studio — Sécurité + Mobile Money (FedaPay)
-- Fichier   : supabase/migrations/20261009000000_securite_fedapay.sql
-- À exécuter APRÈS 20241008000000_monetisation_v2.sql
-- Supabase Dashboard → SQL Editor. Le script peut être relancé sans danger.
-- ==============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. DATE D'EXPIRATION DES PLANS PAYÉS PAR MOBILE MONEY
--    (Stripe gère ses abonnements lui-même ; FedaPay = paiement unique
--     de 1 mois ou 1 an, il faut donc une date de fin)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. ANTI-REJEU DES PAIEMENTS FEDAPAY
--    Chaque transaction FedaPay n'est appliquée qu'une seule fois.
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.credit_transactions
  ADD COLUMN IF NOT EXISTS external_ref TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_tx_external_ref
  ON public.credit_transactions(external_ref)
  WHERE external_ref IS NOT NULL;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. APPLICATION DES PAIEMENTS EN UNE SEULE TRANSACTION
--    Le verrou anti-rejeu et la mise à jour du compte sont écrits ensemble :
--    soit tout réussit, soit rien n'est enregistré (le paiement pourra être
--    réappliqué). Réservé au serveur (clé service_role).
-- ────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.add_credits(UUID, INTEGER);

-- 3a. Crédits (packs Stripe, order bump, packs FedaPay)
CREATE OR REPLACE FUNCTION public.grant_credits_once(
  p_user_id      UUID,
  p_delta        INTEGER,
  p_reason       TEXT,
  p_stripe_event TEXT DEFAULT NULL,
  p_external_ref TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  PERFORM 1 FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  IF p_stripe_event IS NOT NULL THEN
    INSERT INTO public.credit_transactions (user_id, delta, reason, stripe_event_id)
    VALUES (p_user_id, p_delta, p_reason, p_stripe_event)
    ON CONFLICT (stripe_event_id) DO NOTHING;
  ELSE
    INSERT INTO public.credit_transactions (user_id, delta, reason, external_ref)
    VALUES (p_user_id, p_delta, p_reason, p_external_ref)
    ON CONFLICT (external_ref) WHERE external_ref IS NOT NULL DO NOTHING;
  END IF;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN 'already_applied';
  END IF;

  UPDATE public.profiles
     SET credit_balance = GREATEST(0, credit_balance + p_delta),
         updated_at = timezone('utc', now())
   WHERE id = p_user_id;

  RETURN 'applied';
END;
$$;

-- 3b. Plan payé par Mobile Money (1 mois ou 1 an, sans renouvellement)
CREATE OR REPLACE FUNCTION public.apply_fedapay_plan(
  p_user_id      UUID,
  p_plan         TEXT,
  p_cycle        TEXT,
  p_external_ref TEXT,
  p_tx_id        TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_rows    INTEGER;
  v_start   TIMESTAMPTZ;
BEGIN
  IF p_plan NOT IN ('solo', 'pro', 'agence') OR p_cycle NOT IN ('monthly', 'annual') THEN
    RAISE EXCEPTION 'invalid_plan';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  INSERT INTO public.credit_transactions (user_id, delta, reason, external_ref)
  VALUES (p_user_id, 0, 'fedapay_plan_' || p_plan || '_' || p_cycle, p_external_ref)
  ON CONFLICT (external_ref) WHERE external_ref IS NOT NULL DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  IF v_rows = 0 THEN
    RETURN 'already_applied';
  END IF;

  -- Même plan encore actif : la nouvelle période s'ajoute à la fin de l'actuelle
  IF v_profile.plan = p_plan AND v_profile.plan_expires_at IS NOT NULL AND v_profile.plan_expires_at > now() THEN
    v_start := v_profile.plan_expires_at;
  ELSE
    v_start := now();
  END IF;

  UPDATE public.profiles
     SET plan = p_plan,
         plan_expires_at = v_start + CASE WHEN p_cycle = 'annual' THEN interval '1 year' ELSE interval '1 month' END,
         billing_cycle = p_cycle,
         subscription_status = 'active',
         payment_provider = 'fedapay',
         fedapay_transaction_id = p_tx_id,
         updated_at = timezone('utc', now())
   WHERE id = p_user_id;

  RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.grant_credits_once(UUID, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_credits_once(UUID, INTEGER, TEXT, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grant_credits_once(UUID, INTEGER, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.apply_fedapay_plan(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_fedapay_plan(UUID, TEXT, TEXT, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_fedapay_plan(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. DURCISSEMENT
-- ────────────────────────────────────────────────────────────────────────────
-- 4a. La fonction de création de profil s'exécute avec des droits élevés :
--     on fixe son search_path (recommandation Supabase).
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- 4b. Les événements analytiques sont écrits uniquement par le serveur
--     (route /api/events avec la clé admin). On retire l'écriture directe
--     depuis le navigateur, qui permettait à n'importe qui de remplir la table.
DROP POLICY IF EXISTS "Utilisateur peut insérer des events" ON public.events;

-- 4c. Rappel : aucune politique UPDATE / INSERT / DELETE côté client sur
--     profiles (supprimée dans la migration v2). On le réaffirme ici.
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;

GRANT ALL ON public.credit_transactions TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 5. PROGRAMME "AGENCES FONDATRICES" (formulaire de la page d'accueil)
--    Écrit uniquement par le serveur (route /api/founders) ; aucune lecture
--    ni écriture possible depuis le navigateur.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.founder_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name       TEXT NOT NULL,
  agency_name     TEXT NOT NULL,
  agency_website  TEXT,
  email           TEXT NOT NULL,
  sites_per_month TEXT,
  status          TEXT NOT NULL DEFAULT 'new',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_founder_applications_created
  ON public.founder_applications(created_at DESC);

ALTER TABLE public.founder_applications ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.founder_applications FROM anon, authenticated;
GRANT ALL ON public.founder_applications TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 6. OPTIONNEL — Remettre en "free" les plans Mobile Money expirés, chaque heure.
--    Le site considère déjà un plan expiré comme "free" ; ce job nettoie
--    simplement la base. Nécessite l'extension pg_cron
--    (Dashboard → Database → Extensions → pg_cron). Retire les "--" pour l'activer.
-- ────────────────────────────────────────────────────────────────────────────
-- SELECT cron.schedule(
--   'expire-fedapay-plans',
--   '0 * * * *',
--   $$UPDATE public.profiles
--        SET plan = 'free', subscription_status = 'expired'
--      WHERE plan <> 'free'
--        AND plan_expires_at IS NOT NULL
--        AND plan_expires_at < now()$$
-- );

-- ────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (manuel)
-- ────────────────────────────────────────────────────────────────────────────
-- DROP TABLE IF EXISTS public.founder_applications;
-- DROP FUNCTION IF EXISTS public.grant_credits_once(UUID, INTEGER, TEXT, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.apply_fedapay_plan(UUID, TEXT, TEXT, TEXT, TEXT);
-- DROP INDEX IF EXISTS public.idx_credit_tx_external_ref;
-- ALTER TABLE public.credit_transactions DROP COLUMN IF EXISTS external_ref;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS plan_expires_at;
