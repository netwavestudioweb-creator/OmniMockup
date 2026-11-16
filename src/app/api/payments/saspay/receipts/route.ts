import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifySaspayPayment } from '@/lib/saspay';
import { getSaspayItem } from '@/lib/saspay-apply';
import { buildSaspayReceipt, type SaspayReceipt } from '@/lib/saspayReceipt';

export const dynamic = 'force-dynamic';

export type { SaspayReceipt };

/**
 * Reçus des paiements SasPay du client connecté.
 * Seuls les paiements déjà appliqués côté serveur (statut « applied ») ont un reçu ; le montant débité,
 * les frais et la référence sont relus chez SasPay, jamais pris dans le navigateur.
 */
export async function GET() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ receipts: [] }, { status: 401 });

  const { data: rows, error } = await createAdminClient()
    .from('saspay_checkouts')
    .select('id, item_id, kind, billing_cycle, amount_xof, transaction_id, applied_at, created_at')
    .eq('user_id', auth.user.id)
    .eq('status', 'applied')
    .order('applied_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ receipts: [], error: 'Reçus indisponibles' }, { status: 500 });

  const receipts: SaspayReceipt[] = await Promise.all(
    (rows || []).map(async (row) => {
      const item = getSaspayItem(row.item_id as string, row.billing_cycle as string | null);
      let payment: Awaited<ReturnType<typeof verifySaspayPayment>> | null = null;
      if (row.transaction_id) {
        try {
          payment = await verifySaspayPayment(row.transaction_id as string);
        } catch {
          payment = null;
        }
      }
      return buildSaspayReceipt({
        id: row.id as string,
        itemId: row.item_id as string,
        item,
        amountXof: row.amount_xof as number,
        payment,
        paidAt: (row.applied_at || row.created_at) as string,
        transactionId: row.transaction_id as string | null,
      });
    })
  );

  return NextResponse.json({ receipts });
}
