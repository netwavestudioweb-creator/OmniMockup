import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/** Derniers paiements, paiements SasPay à vérifier et journal des actions d'administration. */
export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const admin = createAdminClient();

  const [payments, pending, actions] = await Promise.all([
    admin.from('payments').select('id, provider, external_id, user_id, kind, item, amount, currency, created_at').order('created_at', { ascending: false }).limit(100),
    admin
      .from('saspay_checkouts')
      .select('id, user_id, item_id, amount_xof, status, created_at')
      .eq('status', 'pending')
      .not('session_id', 'is', null)
      .lt('created_at', new Date(Date.now() - 3600 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50),
    admin.from('admin_actions').select('id, target_user, action, details, created_at').order('created_at', { ascending: false }).limit(50),
  ]);

  // E-mails des comptes concernés (affichés seulement ici, pour le support)
  const ids = Array.from(
    new Set([...(payments.data || []), ...(pending.data || [])].map((r) => r.user_id).concat((actions.data || []).map((a) => a.target_user)).filter(Boolean))
  ) as string[];
  const { data: emails } = ids.length ? await admin.from('profiles').select('id, email').in('id', ids) : { data: [] };
  const emailOf = Object.fromEntries((emails || []).map((e) => [e.id, e.email]));

  return NextResponse.json(
    {
      payments: (payments.data || []).map((p) => ({ ...p, email: p.user_id ? emailOf[p.user_id] || null : null })),
      saspayPending: (pending.data || []).map((p) => ({ ...p, email: emailOf[p.user_id] || null })),
      actions: (actions.data || []).map((a) => ({ ...a, email: a.target_user ? emailOf[a.target_user] || null : null })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
