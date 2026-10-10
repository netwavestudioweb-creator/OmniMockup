-- ==============================================================================
-- Migration : OmniMockup Studio — Limites du Pitch IA (texte de vente généré par l'IA)
-- Fichier   : supabase/migrations/20261012010000_pitch_limits.sql
-- Gratuit et Solo : 2 crédits par génération ; Pro : 5 par mois puis 2 crédits ;
-- Agence : illimité. Compte obligatoire. Réservé au serveur (clé service_role).
-- Une génération qui échoue côté IA est remboursée (refund_pitch).
-- Le script peut être relancé sans danger.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.pitch_events (
  id            BIGSERIAL PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credits_used  INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_pitch_events_user ON public.pitch_events(user_id, created_at DESC);

ALTER TABLE public.pitch_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.pitch_events FROM anon, authenticated;
GRANT ALL ON public.pitch_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.pitch_events_id_seq TO service_role;

-- Renvoie : { allowed, reason, event_id, used, limit, cost, balance, credits_used }
CREATE OR REPLACE FUNCTION public.authorize_pitch(p_user_id UUID, p_plan TEXT, p_use_credits BOOLEAN DEFAULT FALSE)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan    TEXT := CASE WHEN p_plan IN ('free', 'solo', 'pro', 'agence') THEN p_plan ELSE 'free' END;
  v_limit   INTEGER := CASE v_plan WHEN 'pro' THEN 5 WHEN 'agence' THEN NULL ELSE 0 END;
  v_used    INTEGER := 0;
  v_cost    INTEGER := 2;
  v_balance INTEGER := 0;
  v_id      BIGINT;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'login_required', 'cost', v_cost);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('pitch:' || p_user_id::text));

  SELECT count(*) INTO v_used FROM public.pitch_events
   WHERE user_id = p_user_id AND credits_used = 0
     AND created_at >= date_trunc('month', timezone('utc', now()));

  -- Inclus dans le forfait
  IF v_limit IS NULL OR v_used < v_limit THEN
    IF NOT p_use_credits THEN
      INSERT INTO public.pitch_events (user_id, credits_used) VALUES (p_user_id, 0) RETURNING id INTO v_id;
      RETURN jsonb_build_object('allowed', true, 'reason', NULL, 'event_id', v_id, 'used', v_used + 1,
                                'limit', v_limit, 'cost', 0, 'credits_used', 0);
    END IF;
  END IF;

  -- Hors forfait : payable en crédits
  SELECT credit_balance INTO v_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
  v_balance := COALESCE(v_balance, 0);
  IF p_use_credits AND v_balance >= v_cost THEN
    UPDATE public.profiles SET credit_balance = credit_balance - v_cost, updated_at = timezone('utc', now())
     WHERE id = p_user_id;
    INSERT INTO public.credit_transactions (user_id, delta, reason) VALUES (p_user_id, -v_cost, 'pitch_ia');
    INSERT INTO public.pitch_events (user_id, credits_used) VALUES (p_user_id, v_cost) RETURNING id INTO v_id;
    RETURN jsonb_build_object('allowed', true, 'reason', NULL, 'event_id', v_id, 'used', v_used, 'limit', v_limit,
                              'cost', v_cost, 'credits_used', v_cost, 'balance', v_balance - v_cost);
  END IF;

  RETURN jsonb_build_object('allowed', false,
                            'reason', CASE WHEN v_limit = 0 THEN 'not_included' ELSE 'quota_reached' END,
                            'used', v_used, 'limit', v_limit, 'cost', v_cost, 'balance', v_balance, 'credits_used', 0);
END;
$$;

-- Génération échouée côté IA : l'utilisation (et les crédits éventuels) sont rendus
CREATE OR REPLACE FUNCTION public.refund_pitch(p_event_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID;
  v_cost INTEGER;
BEGIN
  DELETE FROM public.pitch_events WHERE id = p_event_id RETURNING user_id, credits_used INTO v_user, v_cost;
  IF v_user IS NOT NULL AND v_cost > 0 THEN
    UPDATE public.profiles SET credit_balance = credit_balance + v_cost, updated_at = timezone('utc', now())
     WHERE id = v_user;
    INSERT INTO public.credit_transactions (user_id, delta, reason) VALUES (v_user, v_cost, 'remboursement_pitch_ia');
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.authorize_pitch(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_pitch(UUID, TEXT, BOOLEAN) TO service_role;
REVOKE ALL ON FUNCTION public.refund_pitch(BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.refund_pitch(BIGINT) TO service_role;

-- ROLLBACK (manuel) :
-- DROP FUNCTION IF EXISTS public.refund_pitch(BIGINT);
-- DROP FUNCTION IF EXISTS public.authorize_pitch(UUID, TEXT, BOOLEAN);
-- DROP TABLE IF EXISTS public.pitch_events;
