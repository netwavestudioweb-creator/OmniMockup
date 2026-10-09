import { createClient } from '@supabase/supabase-js';

// Client d'administration Supabase (bypasse RLS avec SUPABASE_SERVICE_ROLE_KEY)
// Utilisé exclusivement côté serveur : webhooks Stripe, incrémentations quotas, migrations
export function createAdminClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  // IMPORTANT : pas de repli sur la clé publique (anon). Avec la clé anon,
  // les mises à jour de plan échoueraient en silence à cause du RLS.
  // Sans clé admin, les appels échouent visiblement (erreur dans les logs Vercel).
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('[Supabase admin] SUPABASE_SERVICE_ROLE_KEY manquante : les paiements ne pourront pas être appliqués.');
  }
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder-service-key';

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
