-- ==============================================================================
-- Migration : limites anti-abus partagées + droits des comptes resserrés
-- Fichier   : supabase/migrations/20261016000000_limites_partagees.sql
-- Le script peut être relancé sans danger.
-- ==============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. COMPTEUR ANTI-ABUS COMMUN À TOUS LES SERVEURS
--    Sur Vercel, chaque serveur avait son propre compteur en mémoire : la limite
--    ne s'appliquait pas. Une ligne par (clé, fenêtre de temps) ; la clé contient
--    le nom de la route et une empreinte de l'adresse IP (jamais l'adresse en clair).
-- ────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket        TEXT        NOT NULL,
  window_start  TIMESTAMPTZ NOT NULL,
  hits          INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (bucket, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;

/**
 * Compte un passage et dit s'il est autorisé.
 * Fenêtre fixe de p_window_seconds secondes ; renvoie le nombre de passages et l'autorisation.
 */
CREATE OR REPLACE FUNCTION public.hit_rate_limit(p_bucket TEXT, p_max INTEGER, p_window_seconds INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_window TIMESTAMPTZ;
  v_hits   INTEGER;
BEGIN
  IF p_bucket IS NULL OR length(p_bucket) > 200 OR p_max < 1 OR p_window_seconds < 1 OR p_window_seconds > 86400 THEN
    RAISE EXCEPTION 'invalid_rate_limit';
  END IF;

  v_window := to_timestamp(floor(extract(epoch FROM now()) / p_window_seconds) * p_window_seconds);

  INSERT INTO public.rate_limits (bucket, window_start, hits)
  VALUES (p_bucket, v_window, 1)
  ON CONFLICT (bucket, window_start) DO UPDATE SET hits = public.rate_limits.hits + 1
  RETURNING hits INTO v_hits;

  -- Ménage léger : de temps en temps, on efface les fenêtres de plus d'un jour
  IF random() < 0.01 THEN
    DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
  END IF;

  RETURN jsonb_build_object(
    'allowed', v_hits <= p_max,
    'hits', v_hits,
    'retry_after', GREATEST(1, ceil(extract(epoch FROM (v_window + make_interval(secs => p_window_seconds) - now())))::int)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.hit_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.hit_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2. LES COMPTES NE PEUVENT PLUS MODIFIER LEUR FORMULE NI LEURS CRÉDITS
--    Aujourd'hui, seule la sécurité par ligne (RLS, sans règle de modification)
--    les en empêche. On retire aussi le droit lui-même : toutes les modifications
--    passent par le serveur (paiements, admin), qui utilise le rôle service.
-- ────────────────────────────────────────────────────────────────────────────
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.credit_transactions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.usage FROM anon, authenticated;
