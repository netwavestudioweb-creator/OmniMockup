-- ==============================================================================
-- Migration : PitchMySite — Tableau de bord administrateur
-- Fichier   : supabase/migrations/20261014000000_admin_dashboard.sql
-- 1. app_admins     : comptes autorisés à ouvrir /admin (le compte de Dodo uniquement)
-- 2. admin_actions  : journal de chaque action faite depuis /admin (formule, crédits)
-- 3. payments       : chaque paiement encaissé (Stripe et SasPay), pour le chiffre d'affaires
-- 4. admin_stats()  : tous les chiffres du tableau de bord en un seul appel
-- Tout est réservé au serveur (clé service_role). Le script peut être relancé sans danger.
-- ==============================================================================

-- 1. Administrateurs
CREATE TABLE IF NOT EXISTS public.app_admins (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
ALTER TABLE public.app_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.app_admins FROM anon, authenticated;
GRANT ALL ON public.app_admins TO service_role;

-- Compte de Dodo (netwave.studio.web@gmail.com)
INSERT INTO public.app_admins (user_id)
SELECT id FROM auth.users WHERE id = '1a14758d-c77b-4b53-a8cc-1aa377a8798d'
ON CONFLICT (user_id) DO NOTHING;

-- 2. Journal des actions d'administration
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id          BIGSERIAL PRIMARY KEY,
  admin_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  details     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created ON public.admin_actions(created_at DESC);
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.admin_actions FROM anon, authenticated;
GRANT ALL ON public.admin_actions TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.admin_actions_id_seq TO service_role;

-- 3. Paiements encaissés (une ligne par paiement, jamais deux fois grâce à external_id)
CREATE TABLE IF NOT EXISTS public.payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    TEXT NOT NULL CHECK (provider IN ('stripe', 'saspay')),
  external_id TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  kind        TEXT NOT NULL CHECK (kind IN ('plan', 'credits')),
  item        TEXT,
  amount      NUMERIC(12, 2) NOT NULL,
  currency    TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (provider, external_id)
);
CREATE INDEX IF NOT EXISTS idx_payments_created ON public.payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.payments FROM anon, authenticated;
GRANT ALL ON public.payments TO service_role;

-- Suivi d'usage : recherche rapide par type d'événement
CREATE INDEX IF NOT EXISTS idx_events_name_created ON public.events(event_name, created_at DESC);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS user_id UUID;

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Statistiques du tableau de bord
-- Montants : le FCFA est arrimé à l'euro (1 € = 655,957 FCFA) ; les dollars restent à part.
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  d7  TIMESTAMPTZ := timezone('utc', now()) - interval '7 days';
  d30 TIMESTAMPTZ := timezone('utc', now()) - interval '30 days';
  r   JSONB;
BEGIN
  WITH eff AS (
    SELECT p.*, CASE WHEN p.plan <> 'free' AND p.plan_expires_at IS NOT NULL AND p.plan_expires_at < now()
                     THEN 'free' ELSE COALESCE(p.plan, 'free') END AS eplan
      FROM public.profiles p
  ),
  ev AS (SELECT * FROM public.events WHERE created_at >= d30)
  SELECT jsonb_build_object(
    'generated_at', now(),
    'overview', jsonb_build_object(
      'users_total',      (SELECT count(*) FROM eff),
      'users_new_7d',     (SELECT count(*) FROM eff WHERE created_at >= d7),
      'anon_exporters_7d',(SELECT count(DISTINCT client_ip) FROM export_events WHERE user_id IS NULL AND created_at >= d7),
      'captures_7d',      (SELECT count(*) FROM events WHERE event_name = 'capture_result' AND created_at >= d7),
      'captures_ok_7d',   (SELECT count(*) FROM events WHERE event_name = 'capture_result' AND created_at >= d7 AND properties->>'ok' = 'true'),
      'exports_7d',       (SELECT count(*) FROM export_events WHERE created_at >= d7),
      'exports_total',    (SELECT count(*) FROM export_events),
      'revenue_xof',      (SELECT COALESCE(sum(CASE WHEN currency IN ('XOF') THEN amount
                                                    WHEN currency = 'EUR' THEN round(amount * 655.957) END), 0) FROM payments),
      'revenue_usd',      (SELECT COALESCE(sum(amount), 0) FROM payments WHERE currency = 'USD'),
      'revenue_30d_xof',  (SELECT COALESCE(sum(CASE WHEN currency IN ('XOF') THEN amount
                                                    WHEN currency = 'EUR' THEN round(amount * 655.957) END), 0) FROM payments WHERE created_at >= d30),
      'revenue_by_provider', (SELECT COALESCE(jsonb_object_agg(provider || '_' || currency, total), '{}'::jsonb)
                                FROM (SELECT provider, currency, sum(amount) total FROM payments GROUP BY 1, 2) t)
    ),
    'customers', jsonb_build_object(
      'never_paid',  (SELECT count(*) FROM eff WHERE id NOT IN (SELECT user_id FROM payments WHERE user_id IS NOT NULL)),
      'paid_once',   (SELECT count(DISTINCT user_id) FROM payments WHERE user_id IS NOT NULL),
      'plans',       (SELECT jsonb_build_object(
                        'free',   count(*) FILTER (WHERE eplan = 'free'),
                        'solo',   count(*) FILTER (WHERE eplan = 'solo'),
                        'pro',    count(*) FILTER (WHERE eplan = 'pro'),
                        'agence', count(*) FILTER (WHERE eplan = 'agence')) FROM eff),
      'expiring_7d', (SELECT count(*) FROM eff WHERE eplan <> 'free' AND plan_expires_at BETWEEN now() AND now() + interval '7 days'),
      'credit_purchases', (SELECT count(*) FROM payments WHERE kind = 'credits'),
      'credit_revenue_xof', (SELECT COALESCE(sum(CASE WHEN currency = 'XOF' THEN amount WHEN currency = 'EUR' THEN round(amount * 655.957) END), 0)
                               FROM payments WHERE kind = 'credits'),
      'credit_revenue_usd', (SELECT COALESCE(sum(amount), 0) FROM payments WHERE kind = 'credits' AND currency = 'USD')
    ),
    'features', jsonb_build_object(
      'exports_by_kind',    (SELECT COALESCE(jsonb_object_agg(kind, n), '{}'::jsonb) FROM (SELECT kind, count(*) n FROM export_events WHERE created_at >= d30 GROUP BY 1) t),
      'exports_by_quality', (SELECT COALESCE(jsonb_object_agg(quality, n), '{}'::jsonb) FROM (SELECT quality, count(*) n FROM export_events WHERE created_at >= d30 GROUP BY 1) t),
      'pitch_30d',          (SELECT count(*) FROM pitch_events WHERE created_at >= d30),
      'pitch_failed_30d',   (SELECT count(*) FROM ev WHERE event_name = 'pitch_result' AND properties->>'ok' = 'false'),
      'shares_30d',         (SELECT count(*) FROM shared_mockups WHERE created_at >= d30),
      'ads_started_30d',    (SELECT count(*) FROM ad_rewards WHERE started_at >= d30),
      'ads_granted_30d',    (SELECT count(*) FROM ad_rewards WHERE granted_at >= d30),
      'templates',          (SELECT COALESCE(jsonb_object_agg(k, n), '{}'::jsonb) FROM (SELECT properties->>'template' k, count(*) n FROM ev WHERE event_name = 'template_applied' GROUP BY 1 ORDER BY 2 DESC LIMIT 15) t),
      'layouts',            (SELECT COALESCE(jsonb_object_agg(k, n), '{}'::jsonb) FROM (SELECT properties->>'layout' k, count(*) n FROM ev WHERE event_name = 'layout_selected' GROUP BY 1) t),
      'usage',              (SELECT COALESCE(jsonb_object_agg(event_name, n), '{}'::jsonb) FROM (SELECT event_name, count(*) n FROM ev
                               WHERE event_name IN ('whatsapp_status', 'pdf_generated', 'carousel_generated', 'photo_scene_used', 'art_director_run', 'video_exported') GROUP BY 1) t)
    ),
    'funnel', jsonb_build_object(
      'home_views',     (SELECT count(*) FROM ev WHERE event_name = 'home_view'),
      'captures_ok',    (SELECT count(*) FROM ev WHERE event_name = 'capture_result' AND properties->>'ok' = 'true'),
      'exports',        (SELECT count(*) FROM export_events WHERE created_at >= d30),
      'quota_reached',  (SELECT count(*) FROM ev WHERE event_name = 'quota_reached'),
      'pricing_views',  (SELECT count(*) FROM ev WHERE event_name = 'pricing_view'),
      'checkout_starts',(SELECT count(*) FROM ev WHERE event_name = 'checkout_start'),
      'payments',       (SELECT count(*) FROM payments WHERE created_at >= d30)
    ),
    'health', jsonb_build_object(
      'captures_30d',      (SELECT count(*) FROM ev WHERE event_name = 'capture_result'),
      'captures_failed_30d',(SELECT count(*) FROM ev WHERE event_name = 'capture_result' AND properties->>'ok' = 'false'),
      'capture_fail_reasons',(SELECT COALESCE(jsonb_object_agg(k, n), '{}'::jsonb) FROM (SELECT COALESCE(properties->>'reason', 'autre') k, count(*) n FROM ev
                               WHERE event_name = 'capture_result' AND properties->>'ok' = 'false' GROUP BY 1) t),
      'capture_engines',   (SELECT COALESCE(jsonb_object_agg(k, n), '{}'::jsonb) FROM (SELECT COALESCE(properties->>'engine', '?') k, count(*) n FROM ev
                               WHERE event_name = 'capture_result' AND properties->>'ok' = 'true' GROUP BY 1) t),
      'capture_avg_ms',    (SELECT round(avg((properties->>'ms')::numeric)) FROM ev WHERE event_name = 'capture_result' AND properties->>'ok' = 'true' AND properties ? 'ms'),
      'ai_failures_30d',   (SELECT count(*) FROM ev WHERE event_name IN ('pitch_result', 'art_director_result') AND properties->>'ok' = 'false'),
      'saspay_pending',    (SELECT count(*) FROM saspay_checkouts WHERE status = 'pending' AND session_id IS NOT NULL AND created_at < now() - interval '1 hour' AND created_at >= d30)
    ),
    'series', (
      SELECT jsonb_agg(jsonb_build_object('day', d::date,
               'signups', (SELECT count(*) FROM eff WHERE created_at::date = d::date),
               'exports', (SELECT count(*) FROM export_events WHERE created_at::date = d::date),
               'revenue_xof', (SELECT COALESCE(sum(CASE WHEN currency = 'XOF' THEN amount WHEN currency = 'EUR' THEN round(amount * 655.957) END), 0)
                                 FROM payments WHERE created_at::date = d::date)) ORDER BY d)
        FROM generate_series((now() - interval '29 days')::date, now()::date, interval '1 day') d
    )
  ) INTO r;
  RETURN r;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_stats() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_stats() TO service_role;

-- ROLLBACK (manuel) :
-- DROP FUNCTION IF EXISTS public.admin_stats();
-- DROP TABLE IF EXISTS public.payments; DROP TABLE IF EXISTS public.admin_actions; DROP TABLE IF EXISTS public.app_admins;
