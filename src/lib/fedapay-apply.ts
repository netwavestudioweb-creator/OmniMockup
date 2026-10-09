import { createAdminClient } from '@/lib/supabase/admin';
import { FEDAPAY_PLANS_FCFA, getFedaPayTransaction } from '@/lib/fedapay';

export type FedaPayApplyResult =
  | { status: 'applied'; kind: 'plan'; plan: string }
  | { status: 'applied'; kind: 'credits'; credits: number }
  | { status: 'already_applied' }
  | { status: 'pending' }
  | { status: 'failed'; reason: string };

/**
 * Applique un paiement FedaPay au compte de l'utilisateur, UNE SEULE FOIS.
 *
 * Appelée à la fois par le retour navigateur (callback) et par le webhook :
 * le premier des deux applique le paiement, le second ne fait rien.
 * Les informations viennent toujours de l'API officielle FedaPay (clé secrète),
 * jamais de l'URL ou du navigateur.
 */
export async function applyFedaPayTransaction(
  transactionId: string | number
): Promise<FedaPayApplyResult> {
  const tx = await getFedaPayTransaction(transactionId);
  if (!tx) return { status: 'failed', reason: 'transaction_not_found' };

  if (tx.status === 'pending') return { status: 'pending' };
  if (tx.status !== 'approved' && tx.status !== 'transferred') {
    return { status: 'failed', reason: `status_${tx.status}` };
  }

  const metadata = (tx.custom_metadata || {}) as Record<string, unknown>;
  const userId = String(metadata.userId || metadata.user_id || '');
  const itemId = String(metadata.plan || '');
  const billingCycle = metadata.billingCycle === 'annual' ? 'annual' : 'monthly';
  const item = Object.prototype.hasOwnProperty.call(FEDAPAY_PLANS_FCFA, itemId)
    ? FEDAPAY_PLANS_FCFA[itemId]
    : undefined;

  if (!userId || !item) {
    return { status: 'failed', reason: 'invalid_metadata' };
  }

  // Le montant payé doit correspondre au prix attendu (protection anti-fraude)
  const expectedAmount = item.isCreditPack
    ? item.monthlyPrice
    : billingCycle === 'annual'
      ? item.annualTotal
      : item.monthlyPrice;
  if (Number(tx.amount) < expectedAmount) {
    console.error(`[FedaPay] Montant incorrect pour tx #${tx.id} : ${tx.amount} < ${expectedAmount}`);
    return { status: 'failed', reason: 'amount_mismatch' };
  }

  const admin = createAdminClient();
  const externalRef = `fedapay:${tx.id}`;

  // Verrou anti-rejeu + mise à jour du compte dans UNE transaction SQL :
  // soit tout est appliqué, soit rien (le webhook pourra réessayer).
  if (item.isCreditPack) {
    const credits = item.credits || 0;
    const { data, error } = await admin.rpc('grant_credits_once', {
      p_user_id: userId,
      p_delta: credits,
      p_reason: `fedapay_${itemId}`,
      p_stripe_event: null,
      p_external_ref: externalRef,
    });
    if (error) {
      console.error('[FedaPay] Échec de l’ajout des crédits :', error);
      return { status: 'failed', reason: 'apply_failed' };
    }
    if (data === 'already_applied') return { status: 'already_applied' };
    return { status: 'applied', kind: 'credits', credits };
  }

  const plan = itemId === 'studio' ? 'agence' : itemId;
  const { data, error } = await admin.rpc('apply_fedapay_plan', {
    p_user_id: userId,
    p_plan: plan,
    p_cycle: billingCycle,
    p_external_ref: externalRef,
    p_tx_id: String(tx.id),
  });
  if (error) {
    console.error('[FedaPay] Échec de l’activation du plan :', error);
    return { status: 'failed', reason: 'apply_failed' };
  }
  if (data === 'already_applied') return { status: 'already_applied' };
  return { status: 'applied', kind: 'plan', plan };
}
