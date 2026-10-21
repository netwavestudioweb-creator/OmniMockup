import { createAdminClient } from '@/lib/supabase/admin';
import { LOYALTY_GRACE_DAYS, LOYALTY_MAX_STEPS } from '@/lib/pricing';

const DAY_MS = 24 * 60 * 60 * 1000;

function addOneMonth(date: Date): Date {
  const d = new Date(date);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return d;
}

type PaidPlanRow = { item_id: string; billing_cycle: string | null; applied_at: string | null };

/** Formules payées par Mobile Money, de la plus ancienne à la plus récente */
async function getPaidPlanRows(userId: string): Promise<PaidPlanRow[] | null> {
  const { data, error } = await createAdminClient()
    .from('saspay_checkouts')
    .select('item_id, billing_cycle, applied_at')
    .eq('user_id', userId)
    .eq('kind', 'plan')
    .eq('status', 'applied')
    .not('applied_at', 'is', null)
    .order('applied_at', { ascending: true });
  if (error) console.error('[Fidélité] Lecture de l’historique impossible :', error);
  return error ? null : (data as PaidPlanRow[]);
}

/**
 * Nombre de baisses de fidélité auxquelles a droit le PROCHAIN mois payé (0 à LOYALTY_MAX_STEPS).
 *
 * Calculé depuis l'historique des paiements SasPay appliqués (table saspay_checkouts),
 * sans colonne supplémentaire : on rejoue les mois payés de cette formule, comme le fait
 * apply_one_time_plan (un mois payé en avance s'ajoute à la fin du mois en cours).
 * Un mois payé plus de LOYALTY_GRACE_DAYS jours après la fin du précédent remet le compteur à zéro.
 * Changer de formule ou payer à l'année ne compte pas dans la série.
 */
export function computeLoyaltyStep(rows: PaidPlanRow[], planId: string, now: Date): number {
  const grace = LOYALTY_GRACE_DAYS * DAY_MS;
  let streak = 0; // mois payés d'affilée sur cette formule
  let periodEnd: Date | null = null;

  for (const row of rows) {
    const paidAt = new Date(row.applied_at as string);
    // Autre formule ou paiement annuel : la série mensuelle s'arrête
    if (row.item_id !== planId || row.billing_cycle !== 'monthly') {
      streak = 0;
      periodEnd = null;
      continue;
    }
    if (periodEnd && paidAt.getTime() <= periodEnd.getTime() + grace) {
      streak += 1;
      periodEnd = addOneMonth(periodEnd > paidAt ? periodEnd : paidAt);
    } else {
      streak = 1;
      periodEnd = addOneMonth(paidAt);
    }
  }

  if (!periodEnd || now.getTime() > periodEnd.getTime() + grace) return 0;
  return Math.min(streak, LOYALTY_MAX_STEPS);
}

/** Baisses de fidélité pour le prochain mois d'une formule (0 en cas d'erreur : jamais moins cher par erreur) */
export async function getNextLoyaltyStep(userId: string, planId: string, now = new Date()): Promise<number> {
  const rows = await getPaidPlanRows(userId);
  return rows ? computeLoyaltyStep(rows, planId, now) : 0;
}

/** Baisses de fidélité pour chaque formule payante, en une seule lecture */
export async function getLoyaltySteps(userId: string, now = new Date()): Promise<Record<'solo' | 'pro' | 'agence', number>> {
  const rows = (await getPaidPlanRows(userId)) || [];
  return {
    solo: computeLoyaltyStep(rows, 'solo', now),
    pro: computeLoyaltyStep(rows, 'pro', now),
    agence: computeLoyaltyStep(rows, 'agence', now),
  };
}
