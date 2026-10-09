import type { PlanId } from '@/lib/pricing';

const VALID_PLANS: PlanId[] = ['free', 'solo', 'pro', 'agence'];

/**
 * Plan réellement actif d'un utilisateur.
 *
 * Les plans payés en une fois (hors abonnement Stripe) sont des paiements uniques de
 * 1 mois ou 1 an : ils ont une date de fin (plan_expires_at). Une fois cette
 * date passée, l'utilisateur repasse en "free", même si la base n'a pas encore
 * été nettoyée. Les abonnements Stripe n'ont pas de date de fin ici : c'est
 * Stripe qui prévient le site par webhook en cas de résiliation.
 */
export function getEffectivePlan(
  profile: { plan?: string | null; plan_expires_at?: string | null } | null | undefined
): PlanId {
  const raw = (profile?.plan || 'free') as PlanId;
  const plan = VALID_PLANS.includes(raw) ? raw : 'free';
  if (plan === 'free') return 'free';

  const expiresAt = profile?.plan_expires_at;
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    return 'free';
  }
  return plan;
}
