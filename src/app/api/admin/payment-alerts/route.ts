import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';
import { getSaspayCheckout } from '@/lib/saspay';

export const dynamic = 'force-dynamic';

export type PaymentAlertState = 'reussi' | 'echoue' | 'paye_non_active' | 'abandonne' | 'en_cours';

/**
 * Tous les paiements SasPay des 7 derniers jours, réussis ou non, pour le bandeau en haut de /admin.
 * Un paiement encore « pending » chez nous est revérifié chez SasPay : s'il y est payé, c'est un client
 * qui a payé sans que son forfait s'active (à régler le jour même).
 */
export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const admin = createAdminClient();

  const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
  const { data: rows, error } = await admin
    .from('saspay_checkouts')
    .select('id, user_id, item_id, billing_cycle, amount_xof, status, session_id, created_at, applied_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Paiements illisibles' }, { status: 500 });

  // Revérification chez SasPay des paiements restés en attente (30 au plus, les plus récents)
  const pending = (rows || []).filter((r) => r.status === 'pending' && r.session_id).slice(0, 30);
  const sessionStatus: Record<string, string> = {};
  await Promise.all(
    pending.map(async (r) => {
      try {
        sessionStatus[r.id] = (await getSaspayCheckout(r.session_id as string)).status;
      } catch {
        sessionStatus[r.id] = 'UNKNOWN';
      }
    })
  );

  const stateOf = (r: { id: string; status: string; session_id: string | null }): PaymentAlertState => {
    if (r.status === 'applied') return 'reussi';
    if (r.status === 'failed') return 'echoue';
    const s = sessionStatus[r.id];
    if (s === 'PAID') return 'paye_non_active';
    if (s === 'EXPIRED' || s === 'CANCELLED' || !r.session_id) return 'abandonne';
    return 'en_cours';
  };

  const ids = Array.from(new Set((rows || []).map((r) => r.user_id).filter(Boolean))) as string[];
  const { data: emails } = ids.length ? await admin.from('profiles').select('id, email').in('id', ids) : { data: [] };
  const emailOf = Object.fromEntries((emails || []).map((e) => [e.id, e.email]));

  const list = (rows || []).map((r) => ({
    id: r.id,
    state: stateOf(r),
    item: r.item_id,
    billing: r.billing_cycle,
    amount: r.amount_xof,
    email: r.user_id ? emailOf[r.user_id] || null : null,
    created_at: r.created_at,
  }));
  const count = (s: PaymentAlertState) => list.filter((p) => p.state === s).length;

  return NextResponse.json(
    {
      list,
      counts: {
        reussi: count('reussi'),
        echoue: count('echoue'),
        paye_non_active: count('paye_non_active'),
        abandonne: count('abandonne'),
        en_cours: count('en_cours'),
      },
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
