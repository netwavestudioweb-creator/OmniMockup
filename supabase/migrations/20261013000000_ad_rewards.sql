-- ==============================================================================
-- Migration : PitchMySite — Pubs récompensées pour la formule gratuite
-- Fichier   : supabase/migrations/20261013000000_ad_rewards.sql
-- Règle : 1 pub regardée jusqu'au bout = 1 export Standard de plus, 3 pubs par jour au plus.
-- Formules payantes : jamais de pub.
-- Anti-triche : une pub doit être « commencée » côté serveur, puis « terminée » au moins
-- 8 secondes plus tard (les pubs durent en général 15 à 30 s) ; chaque pub ne compte qu'une fois.
-- Réservé au serveur (clé service_role). Le script peut être relancé sans danger.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.ad_rewards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_ip   TEXT,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  granted_at  TIMESTAMPTZ,
  CHECK (user_id IS NOT NULL OR client_ip IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_ad_rewards_user ON public.ad_rewards(user_id, started_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ad_rewards_ip ON public.ad_rewards(client_ip, started_at DESC) WHERE user_id IS NULL;

ALTER TABLE public.ad_rewards ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ad_rewards FROM anon, authenticated;
GRANT ALL ON public.ad_rewards TO service_role;

-- Nombre de pubs récompensées aujourd'hui (UTC) pour une identité
CREATE OR REPLACE FUNCTION public.ad_rewards_today(p_user_id UUID, p_client_ip TEXT)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::int
    FROM public.ad_rewards
   WHERE granted_at >= date_trunc('day', timezone('utc', now()))
     AND (CASE WHEN p_user_id IS NOT NULL THEN user_id = p_user_id
               ELSE user_id IS NULL AND client_ip = p_client_ip END);
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Commencer une pub : renvoie { allowed, reward_id, used, max }
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.start_ad_reward(p_user_id UUID, p_client_ip TEXT, p_plan TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max  CONSTANT INTEGER := 3;
  v_used INTEGER;
  v_id   UUID;
BEGIN
  IF p_user_id IS NULL AND (p_client_ip IS NULL OR p_client_ip = '') THEN
    RAISE EXCEPTION 'missing_identity';
  END IF;
  IF COALESCE(p_plan, 'free') <> 'free' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'paid_plan', 'used', 0, 'max', v_max);
  END IF;

  PERFORM pg_advisory_xact_lock(hashtext('ad:' || COALESCE(p_user_id::text, 'ip:' || p_client_ip)));
  v_used := public.ad_rewards_today(p_user_id, p_client_ip);
  IF v_used >= v_max THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'daily_max', 'used', v_used, 'max', v_max);
  END IF;

  INSERT INTO public.ad_rewards (user_id, client_ip)
  VALUES (p_user_id, CASE WHEN p_user_id IS NULL THEN p_client_ip END)
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('allowed', true, 'reward_id', v_id, 'used', v_used, 'max', v_max);
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- Pub terminée : accorde le bonus une seule fois. Renvoie { granted, reason, used, max }
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.grant_ad_reward(p_reward_id UUID, p_user_id UUID, p_client_ip TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max  CONSTANT INTEGER := 3;
  v_row  public.ad_rewards%ROWTYPE;
  v_used INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('ad:' || COALESCE(p_user_id::text, 'ip:' || COALESCE(p_client_ip, ''))));

  SELECT * INTO v_row FROM public.ad_rewards WHERE id = p_reward_id FOR UPDATE;
  IF NOT FOUND
     OR (p_user_id IS NOT NULL AND v_row.user_id IS DISTINCT FROM p_user_id)
     OR (p_user_id IS NULL AND (v_row.user_id IS NOT NULL OR v_row.client_ip IS DISTINCT FROM p_client_ip)) THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'unknown_reward');
  END IF;
  IF v_row.granted_at IS NOT NULL THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'already_granted');
  END IF;
  IF timezone('utc', now()) - v_row.started_at < interval '8 seconds' THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'too_fast');
  END IF;
  IF timezone('utc', now()) - v_row.started_at > interval '15 minutes' THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'expired');
  END IF;

  v_used := public.ad_rewards_today(p_user_id, p_client_ip);
  IF v_used >= v_max THEN
    RETURN jsonb_build_object('granted', false, 'reason', 'daily_max', 'used', v_used, 'max', v_max);
  END IF;

  UPDATE public.ad_rewards SET granted_at = timezone('utc', now()) WHERE id = p_reward_id;
  RETURN jsonb_build_object('granted', true, 'reason', NULL, 'used', v_used + 1, 'max', v_max);
END;
$$;

-- ────────────────────────────────────────────────────────────────────────────
-- authorize_export : identique à la version du 11/10/2026, sauf la limite gratuite
-- (3 exports par jour + 1 par pub récompensée aujourd'hui).
-- ────────────────────────────────────────────────────────────────────────────
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
    v_limit := CASE v_plan WHEN 'free' THEN 3 + public.ad_rewards_today(p_user_id, p_client_ip)
                           WHEN 'solo' THEN 20 ELSE NULL END;
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

  IF v_included AND NOT p_use_credits THEN
    INSERT INTO public.export_events (user_id, client_ip, kind, quality)
    VALUES (p_user_id, CASE WHEN p_user_id IS NULL THEN p_client_ip END, p_kind, v_req);
    RETURN jsonb_build_object('allowed', true, 'quality', v_req, 'watermark', v_watermark, 'reason', NULL,
                              'used', v_used + 1, 'limit', v_limit, 'cost', 0, 'credits_used', 0);
  END IF;

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

  RETURN jsonb_build_object('allowed', false, 'quality', CASE WHEN (v_rank->>v_req)::int <= (v_rank->>v_cap)::int THEN v_req ELSE v_cap END, 'watermark', v_watermark,
                            'reason', COALESCE(v_reason, 'insufficient_credits'), 'used', v_used, 'limit', v_limit,
                            'cost', v_cost, 'balance', v_balance, 'credits_used', 0);
END;
$$;

REVOKE ALL ON FUNCTION public.ad_rewards_today(UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.start_ad_reward(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_ad_reward(UUID, UUID, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.authorize_export(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ad_rewards_today(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.start_ad_reward(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_ad_reward(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.authorize_export(UUID, TEXT, TEXT, TEXT, TEXT, BOOLEAN) TO service_role;

-- ROLLBACK (manuel) : réappliquer 20261011010000_export_limits.sql (authorize_export d'origine), puis
-- DROP FUNCTION IF EXISTS public.grant_ad_reward(UUID, UUID, TEXT);
-- DROP FUNCTION IF EXISTS public.start_ad_reward(UUID, TEXT, TEXT);
-- DROP FUNCTION IF EXISTS public.ad_rewards_today(UUID, TEXT);
-- DROP TABLE IF EXISTS public.ad_rewards;
