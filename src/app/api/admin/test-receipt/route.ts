import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';
import { verifySaspayPayment } from '@/lib/saspay';
import { getSaspayItem } from '@/lib/saspay-apply';
import { buildSaspayReceipt, sendSaspayReceiptEmail } from '@/lib/saspayReceipt';

export const dynamic = 'force-dynamic';

/**
 * Reçu de test, sans paiement : renvoie le reçu du dernier paiement SasPay réussi au compte qui l'a payé,
 * avec « [Test] » dans l'objet. Sert à vérifier l'e-mail (Resend, mise en page, boîte de réception).
 */
export async function POST() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const { data: row } = await createAdminClient()
    .from('saspay_checkouts')
    .select('id, user_id, item_id, billing_cycle, amount_xof, transaction_id, applied_at, created_at')
    .eq('status', 'applied')
    .order('applied_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!row) return NextResponse.json({ ok: false, message: 'Aucun paiement réussi à renvoyer.' });

  let payment = null;
  if (row.transaction_id) {
    try {
      payment = await verifySaspayPayment(row.transaction_id as string);
    } catch {
      payment = null;
    }
  }
  const receipt = buildSaspayReceipt({
    id: row.id as string,
    itemId: row.item_id as string,
    item: getSaspayItem(row.item_id as string, row.billing_cycle as string | null),
    amountXof: row.amount_xof as number,
    payment,
    paidAt: (row.applied_at || row.created_at) as string,
    transactionId: row.transaction_id as string | null,
  });
  const result = await sendSaspayReceiptEmail({ checkoutId: row.id as string, userId: row.user_id as string, receipt, test: true });

  const message = result.ok
    ? 'Reçu de test envoyé à l’adresse du compte qui a payé.'
    : result.reason === 'no_api_key'
      ? 'La clé RESEND_API_KEY n’est pas encore dans Vercel : aucun e-mail envoyé.'
      : `Envoi impossible (${result.reason}). Voir l’onglet Logs de Resend.`;
  return NextResponse.json({ ok: result.ok, message });
}
