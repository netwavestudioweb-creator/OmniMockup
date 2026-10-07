-- ==============================================================================
-- Migration Supabase : Ajout support FedaPay (MTN MoMo Bénin & Afrique) & Plans complets
-- ==============================================================================

-- 1. Mettre à jour la contrainte CHECK sur le plan de profiles pour accepter tous les plans
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_plan_check 
CHECK (plan IN ('free', 'starter', 'creator', 'pro', 'agence'));

-- 2. Ajouter les colonnes de suivi de paiement FedaPay / MoMo
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS fedapay_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS momo_phone TEXT;

-- Index pour recherche rapide par transaction FedaPay
CREATE INDEX IF NOT EXISTS idx_profiles_fedapay_tx 
ON public.profiles(fedapay_transaction_id);
