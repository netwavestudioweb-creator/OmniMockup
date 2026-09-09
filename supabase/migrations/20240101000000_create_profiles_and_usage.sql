-- ==============================================================================
-- Migration Supabase : Tables profiles & usage avec triggers et RLS
-- OmniMockup Studio - SaaS Mockup & Analyse IA
-- ==============================================================================

-- 1. EXTENSIONS NÉCESSAIRES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'agence')),
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- Activer Row Level Security (RLS) sur profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour profiles
DROP POLICY IF EXISTS "Les utilisateurs peuvent consulter leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent consulter leur propre profil"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- 3. TRIGGER AUTOMATIQUE POUR CRÉER UN PROFIL À L'INSCRIPTION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, plan)
    VALUES (
        new.id,
        COALESCE(new.email, ''),
        'free'
    )
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. TABLE USAGE (QUOTAS MENSUELS)
CREATE TABLE IF NOT EXISTS public.usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_ip TEXT,
    month TEXT NOT NULL, -- Format YYYY-MM
    analyses_ia_count INTEGER NOT NULL DEFAULT 0,
    exports_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Contraintes d'unicité pour assurer 1 enregistrement par mois
CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_user_month 
    ON public.usage(user_id, month) 
    WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_usage_ip_month 
    ON public.usage(client_ip, month) 
    WHERE user_id IS NULL AND client_ip IS NOT NULL;

-- Activer Row Level Security (RLS) sur usage
ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour usage (lecture de son propre usage)
DROP POLICY IF EXISTS "Les utilisateurs peuvent consulter leur propre consommation" ON public.usage;
CREATE POLICY "Les utilisateurs peuvent consulter leur propre consommation"
    ON public.usage FOR SELECT
    USING (auth.uid() = user_id);

-- Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS tr_usage_updated_at ON public.usage;
CREATE TRIGGER tr_usage_updated_at
    BEFORE UPDATE ON public.usage
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
