-- ==============================================================================
-- Migration : PitchMySite — Accès administrateur séparé des comptes clients
-- Le tableau de bord ne s'ouvre plus avec un compte client : mot de passe + code à 6 chiffres
-- (variables ADMIN_… sur Vercel). Le journal des actions n'est donc plus lié à un compte.
-- La table app_admins n'est plus utilisée par le site.
-- ==============================================================================
ALTER TABLE public.admin_actions ALTER COLUMN admin_id DROP NOT NULL;
