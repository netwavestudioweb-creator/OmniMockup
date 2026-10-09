-- ==============================================================================
-- Migration : OmniMockup Studio — Limites d'export contrôlées par le serveur
-- Fichier   : supabase/migrations/20261011010000_export_limits.sql
-- Chaque export autorisé est enregistré ; la vérification du quota et
-- l'enregistrement se font dans une seule transaction (pas de contournement
-- par double-clic). Réservé au serveur (clé service_role).
-- Le script peut être relancé sans danger.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.export_events (
  id          BIGSERIAL PRIMARY KEY,
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_ip   TEXT,
  kind        TEXT NOT NULL CHECK (kind IN ('image', 'pack', 'video')),
  quality     TEXT NOT NULL CHECK (quality IN ('standard', 'hd', '4k')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  CHECK (user_id IS NOT NULL OR client_ip IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_export_events_user ON public.export_events(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_export_events_ip ON public.export_events(client_ip, created_at DESC) WHERE user_id IS NULL;

ALTER TABLE public.export_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.export_events FROM anon, authenticated;
GRANT ALL ON public.export_events TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.export_events_id_seq TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- Autoriser (et enregistrer) un export.
-- Inclus dans le forfait : gratuit 3 / jour (standard) ; solo 20 / mois (HD) ;
-- pro illimité jusqu'en 4K + 10 vidéos / mois ; agence illimité.
-- Hors forfait : payable en crédits si l'utilisateur l'accepte (p_use_credits) :
--   image HD ou standard sans filigrane = 1, image 4K = 2, vidéo = 3, pack = 4.
-- Renvoie : { allowed, quality, watermark, reason, used, limit, cost, balance, credits_used }
-- ────────────────────────────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.authorize_export(UUID, TEXT, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.authorize_export(
  p_user_id     UUID,
  p_client_ip   TEXT,
  p_plan        TEXT,
  p_kind        TEXT,
  p_quality     TEXT,
  p_use_credits BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan      TEXT := CASE WHEN p_plan IN ('free', 'solo', 'pro', 'agence') THEN p_plan ELSE 'free' END;
  v_req       TEXT := CASE WHEN p_quality IN ('standard', 'hd', '4k') THEN p_quality ELSE 'standard' END;
  v_cap       TEXT;
  v_rank      JSONB := '{"standard": 1, "hd": 2, "4k": 3}'::jsonb;
  v_limit     INTEGER;
  v_since     TIMESTAMPTZ;
  v_used      INTEGER;
  v_kinds     TEXT[];
  v_included  BOOLEAN;
  v_reason    TEXT;
  v_cost      INTEGER;
  v_balance   INTEGER := 0;
  v_watermark BOOLEAN := v_plan IN ('free', 'solo');
BEGIN
  IF p_kind NOT IN ('image', 'pack', 'video') THEN
    RAISE EXCEPTION 'invalid_kind';
  END IF;
  IF p_user_id IS NULL AND (p_client_ip IS NULL OR p_client_ip = '') THEN
    RAISE EXCEPTION 'missing_identity';
  END IF;

  v_cap := CASE v_plan WHEN 'free' THEN 'standard' WHEN 'solo' THEN 'hd' ELSE '4k' END;

  -- Verrou par identité : deux demandes simultanées ne peuvent pas dépasser le quota
  PERFORM pg_advisory_xact_lock(hashtext(COALESCE(p_user_id::text, 'ip:' || p_client_ip)));

  IF p_kind = 'video' THEN
    v_limit := CASE v_plan WHEN 'pro' THEN 10 WHEN 'agence' THEN NULL ELSE 0 END;
    v_since := date_trunc('month', timezone('utc', now()));
    v_kinds := ARRAY['video'];
  ELSE
    v_limit := CASE v_plan WHEN 'free' THEN 3 WHEN 'solo' THEN 20 ELSE NULL END;
    v_since := CASE WHEN v_plan = 'free' THEN date_trunc('day', timezone('utc', now()))
                    ELSE date_trunc('month', timezone('utc', now())) END;
    v_kinds := ARRAY['image', 'pack'];
  END IF;

  SELECT count(*) INTO v_used
    FROM public.export_events
   WHERE kind = ANY (v_kinds)
     AND created_at >= v_since
     AND (CASE WHEN p_user_id IS NOT NULL THEN user_id = p_user_id
               ELSE user_id IS NULL AND client_ip = p_client_ip END);

  v_included := (v_limit IS NULL OR v_used < v_limit) AND (v_rank->>v_req)::int <= (v_rank->>v_cap)::int;
  v_reason := CASE
    WHEN p_kind = 'video' AND v_limit = 0 THEN 'video_not_included'
    WHEN v_limit IS NOT NULL AND v_used >= v_limit THEN 'quota_reached'
    WHEN (v_rank->>v_req)::int > (v_rank->>v_cap)::int THEN 'quality_not_included'
  END;

  -- 1. Inclus dans le forfait (sans crédits demandés)
  IF v_included AND NOT p_use_credits THEN
    INSERT INTO public.export_events (user_id, client_ip, kind, quality)
    VALUES (p_user_id, CASE WHEN p_user_id IS NULL THEN p_client_ip END, p_kind, v_req);
    RETURN jsonb_build_object('allowed', true, 'quality', v_req, 'watermark', v_watermark, 'reason', NULL,
                              'used', v_used + 1, 'limit', v_limit, 'cost', 0, 'credits_used', 0);
  END IF;

  -- 2. Hors forfait : coût en crédits (réservé aux comptes)
  v_cost := CASE WHEN p_kind = 'video' THEN 3 WHEN p_kind = 'pack' THEN 4 WHEN v_req = '4k' THEN 2 ELSE 1 END;
  IF p_user_id IS NOT NULL THEN
    SELECT credit_balance INTO v_balance FROM public.profiles WHERE id = p_user_id FOR UPDATE;
    v_balance := COALESCE(v_balance, 0);
  END IF;

  IF p_use_credits AND p_user_id IS NOT NULL AND v_balance >= v_cost THEN
    UPDATE public.profiles
       SET credit_balance = credit_balance - v_cost, updated_at = timezone('utc', now())
     WHERE id = p_user_id;
    INSERT INTO public.credit_transactions (user_id, delta, reason)
    VALUES (p_user_id, -v_cost, 'export_' || p_kind || '_' || v_req);
    INSERT INTO public.export_events (user_id, client_ip, kind, quality)
    VALUES (p_user_id, NULL, p_kind, v_req);
    RETURN jsonb_build_object('allowed', true, 'quality', v_req, 'watermark', false, 'reason', NULL,
                              'used', v_used, 'limit', v_limit, 'cost', v_cost, 'credits_used', v_cost,
                              'balance', v_balance - v_cost);
  END IF;

  -- 3. Refusé : le navigateur peut proposer les crédits ou un forfait
  RETURN jsonb_build_object('allowed', false, 'quality', CASE WHEN (v_rank->>v_req)::int <= (v_rank->>v_cap)::int THEN v_req ELSE v_cap END, 'watermark', v_watermark,
                            'reason', COALESCE(v_reason, 'insufficient_credits'), 'used', v_used, 'limit', v_limit,
                            'cost', v_cost, 'balance', v_balance, 'credits_used', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.authorize_export(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.authorize_export(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_export(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;

-- ROLLBACK (manuel) :
-- DROP FUNCTION IF EXISTS public.authorize_export(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN);
-- DROP TABLE IF EXISTS public.export_events;
