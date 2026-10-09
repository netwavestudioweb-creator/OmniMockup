-- ==============================================================================
-- Migration : OmniMockup Studio — Paiements SasPay (Mobile Money & carte en FCFA)
-- Fichier   : supabase/migrations/20261010000000_saspay.sql
-- À exécuter APRÈS 20261009000000_securite_fedapay.sql
-- Supabase Dashboard → SQL Editor. Le script peut être relancé sans danger.
-- ==============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. SESSIONS DE PAIEMENT SASPAY
--    Une ligne par tentative de paiement, créée par le serveur AVANT la
--    redirection vers SasPay. Elle relie la session SasPay au compte et à
--    l'article acheté (le webhook SasPay ne renvoie pas ces informations).
--    Aucune lecture ni écriture possible depuis le navigateur.
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.saspay_checkouts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id      TEXT UNIQUE,
  item_id         TEXT NOT NULL,
  kind            TEXT NOT NULL CHECK (kind IN ('plan', 'credits')),
  billing_cycle   TEXT CHECK (billing_cycle IN ('monthly', 'annual')),
  amount_xof      INTEGER NOT NULL CHECK (amount_xof > 0),
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'applied', 'failed')),
  transaction_id  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  applied_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_saspay_checkouts_pending
  ON public.saspay_checkouts(created_at DESC)
  WHERE status = 'pending';

ALTER TABLE public.saspay_checkouts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.saspay_checkouts FROM anon, authenticated;
GRANT ALL ON public.saspay_checkouts TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. PLAN PAYÉ EN UNE FOIS (1 mois ou 1 an, sans renouvellement automatique)
--    Remplace apply_fedapay_plan : même logique, le prestataire devient un
--    paramètre. Verrou anti-rejeu + mise à jour du compte dans UNE transaction.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.apply_one_time_plan(
  p_user_id      UUID,
  p_plan         TEXT,
  p_cycle        TEXT,
  p_external_ref TEXT,
  p_provider     TEXT
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
  IF p_external_ref IS NULL OR p_provider IS NULL THEN
    RAISE EXCEPTION 'missing_reference';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found';
  END IF;

  INSERT INTO public.credit_transactions (user_id, delta, reason, external_ref)
  VALUES (p_user_id, 0, p_provider || '_plan_' || p_plan || '_' || p_cycle, p_external_ref)
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
         payment_provider = p_provider,
         updated_at = timezone('utc', now())
   WHERE id = p_user_id;

  RETURN 'applied';
END;
$$;

REVOKE ALL ON FUNCTION public.apply_one_time_plan(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_one_time_plan(UUID, TEXT, TEXT, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_one_time_plan(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- FedaPay est retiré du site : son ancienne fonction n'est plus appelée.
DROP FUNCTION IF EXISTS public.apply_fedapay_plan(UUID, TEXT, TEXT, TEXT, TEXT);

-- ────────────────────────────────────────────────────────────────────────────
-- ROLLBACK (manuel)
-- ────────────────────────────────────────────────────────────────────────────
-- DROP FUNCTION IF EXISTS public.apply_one_time_plan(UUID, TEXT, TEXT, TEXT, TEXT);
-- DROP TABLE IF EXISTS public.saspay_checkouts;
