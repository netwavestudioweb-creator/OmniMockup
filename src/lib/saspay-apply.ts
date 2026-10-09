import { createAdminClient } from '@/lib/supabase/admin';
import { getSaspayCheckout, verifySaspayPayment } from '@/lib/saspay';
import { PLANS, CREDIT_PACKS } from '@/lib/pricing';

export type SaspayItem =
  | { kind: 'plan'; itemId: string; plan: 'solo' | 'pro' | 'agence'; cycle: 'monthly' | 'annual'; amount: number; label: string }
  | { kind: 'credits'; itemId: string; credits: number; amount: number; label: string };

/**
 * Article vendu via SasPay, avec son prix en FCFA.
 * Source unique des prix : src/lib/pricing.ts (jamais un montant envoyé par le navigateur).
 */
export function getSaspayItem(itemId: string, cycle: string | null | undefined): SaspayItem | null {
  const pack = CREDIT_PACKS.find((p) => p.id === itemId);
  if (pack) {
    return {
      kind: 'credits',
      itemId,
      credits: pack.credits,
      amount: pack.priceFcfa,
      label: `${pack.name} (${pack.credits} crédits)`,
    };
  }

  const plan = PLANS.find((p) => p.id === itemId && p.id !== 'free');
  if (plan) {
    const annual = cycle === 'annual';
    return {
      kind: 'plan',
      itemId,
      plan: plan.id as 'solo' | 'pro' | 'agence',
      cycle: annual ? 'annual' : 'monthly',
      amount: annual ? plan.annualFcfa : plan.monthlyFcfa,
      label: `Plan ${plan.name} (${annual ? '1 an' : '1 mois'})`,
    };
  }
  return null;
}

export type SaspayApplyResult =
  | { status: 'applied'; kind: 'plan'; plan: string }
  | { status: 'applied'; kind: 'credits'; credits: number }
  | { status: 'already_applied' }
  | { status: 'pending' }
  | { status: 'failed'; reason: string };

/**
 * Applique un paiement SasPay au compte de l'utilisateur, UNE SEULE FOIS.
 *
 * Appelée par le retour navigateur ET par le webhook : le premier des deux
 * applique le paiement, le second ne fait rien. L'état du paiement est
 * toujours relu auprès de l'API SasPay ; l'article et le compte viennent de
 * notre table saspay_checkouts (écrite par le serveur), jamais de l'URL.
 */
export async function applySaspayCheckout(checkoutRef: string): Promise<SaspayApplyResult> {
  const admin = createAdminClient();

  const { data: row, error: rowError } = await admin
    .from('saspay_checkouts')
    .select('id, user_id, session_id, item_id, kind, billing_cycle, amount_xof, status')
    .eq('id', checkoutRef)
    .maybeSingle();

  if (rowError) {
    console.error('[SasPay] Lecture de la session impossible :', rowError);
    return { status: 'failed', reason: 'apply_failed' };
  }
  if (!row || !row.session_id) return { status: 'failed', reason: 'checkout_not_found' };
  if (row.status === 'applied') return { status: 'already_applied' };

  const item = getSaspayItem(row.item_id, row.billing_cycle);
  if (!item || item.kind !== row.kind) return { status: 'failed', reason: 'invalid_item' };

  // 1. La session doit être payée, avec le montant et la devise attendus
  const session = await getSaspayCheckout(row.session_id);
  if (session.status === 'PENDING') return { status: 'pending' };
  if (session.status !== 'PAID' || !session.transaction) {
    return { status: 'failed', reason: `session_${session.status.toLowerCase()}` };
  }

  // 2. Le paiement lui-même est revérifié auprès de SasPay
  const payment = await verifySaspayPayment(session.transaction);
  if (payment.status === 'PENDING') return { status: 'pending' };
  if (payment.status !== 'SUCCESS') return { status: 'failed', reason: `payment_${payment.status.toLowerCase()}` };

  if (payment.currency !== 'XOF' || Number(payment.requested_amount) < row.amount_xof) {
    console.error(
      `[SasPay] Montant incorrect pour ${payment.id} : ${payment.requested_amount} ${payment.currency} < ${row.amount_xof} XOF`
    );
    return { status: 'failed', reason: 'amount_mismatch' };
  }

  // 3. Verrou anti-rejeu + mise à jour du compte dans UNE transaction SQL
  const externalRef = `saspay:${payment.id}`;
  let result: SaspayApplyResult;

  if (item.kind === 'credits') {
    const { data, error } = await admin.rpc('grant_credits_once', {
      p_user_id: row.user_id,
      p_delta: item.credits,
      p_reason: `saspay_${item.itemId}`,
      p_stripe_event: null,
      p_external_ref: externalRef,
    });
    if (error) {
      console.error('[SasPay] Échec de l’ajout des crédits :', error);
      return { status: 'failed', reason: 'apply_failed' };
    }
    result = data === 'already_applied'
      ? { status: 'already_applied' }
      : { status: 'applied', kind: 'credits', credits: item.credits };
  } else {
    const { data, error } = await admin.rpc('apply_one_time_plan', {
      p_user_id: row.user_id,
      p_plan: item.plan,
      p_cycle: item.cycle,
      p_external_ref: externalRef,
      p_provider: 'saspay',
    });
    if (error) {
      console.error('[SasPay] Échec de l’activation du plan :', error);
      return { status: 'failed', reason: 'apply_failed' };
    }
    result = data === 'already_applied'
      ? { status: 'already_applied' }
      : { status: 'applied', kind: 'plan', plan: item.plan };
  }

  await admin
    .from('saspay_checkouts')
    .update({ status: 'applied', transaction_id: payment.id, applied_at: new Date().toISOString() })
    .eq('id', row.id);

  return result;
}
