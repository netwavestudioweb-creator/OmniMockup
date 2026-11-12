import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifySaspayPayment } from '@/lib/saspay';
import { getSaspayItem } from '@/lib/saspay-apply';
import { MOBILE_MONEY_COUNTRIES } from '@/lib/paymentMethods';

export const dynamic = 'force-dynamic';

export interface SaspayReceipt {
  id: string;
  label: string;
  /** Prix de l'achat (hors frais de l'opérateur) */
  amountXof: number;
  /** Montant réellement débité, frais compris (lu chez SasPay ; null s'il n'a pas pu être lu) */
  debitedXof: number | null;
  feeXof: number | null;
  paidAt: string;
  reference: string | null;
  operator: string | null;
  activated: string;
}

/** Nom lisible d'un réseau SasPay (« mtn_bj » → « MTN, Bénin ») */
function operatorName(code: string | undefined): string | null {
  if (!code) return null;
  const [net, cc] = code.split('_');
  const country = { bj: 'Bénin', ci: 'Côte d’Ivoire', sn: 'Sénégal', tg: 'Togo', ml: 'Mali', bf: 'Burkina Faso', ne: 'Niger' }[cc || ''];
  const known = MOBILE_MONEY_COUNTRIES.flatMap((c) => c.operators).find((o) => o.toLowerCase().startsWith(net));
  return [known || net.toUpperCase(), country].filter(Boolean).join(', ');
}

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
      const num = (v: string | undefined) => (v !== undefined && Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);
      const activated = !item
        ? 'Achat enregistré'
        : item.kind === 'credits'
          ? `${item.credits} crédits ajoutés à votre compte (sans date de fin)`
          : `Forfait ${item.label.replace('Plan ', '')} activé`;
      return {
        id: row.id as string,
        label: item ? item.label.replace(/^Plan /, 'Forfait ') : (row.item_id as string),
        amountXof: row.amount_xof as number,
        debitedXof: num(payment?.debited_amount),
        feeXof: num(payment?.client_fee),
        paidAt: (row.applied_at || row.created_at) as string,
        reference: payment?.reference || (row.transaction_id as string | null),
        operator: operatorName(payment?.network_code),
        activated,
      };
    })
  );

  return NextResponse.json({ receipts });
}
