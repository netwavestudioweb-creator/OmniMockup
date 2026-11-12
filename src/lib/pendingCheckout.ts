import { CREDIT_PACKS, PLANS } from '@/lib/pricing';

/**
 * Achat choisi avant l'inscription : /pricing?checkout=<forfait ou pack>&billing=monthly|annual.
 * Le lien passe par /signup et /login (paramètre redirect), puis /pricing ouvre directement le paiement.
 */
export type PendingCheckout = { id: string; billing: 'monthly' | 'annual'; label: string };

const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;

export function checkoutPath(id: string, billing?: 'monthly' | 'annual'): string {
  return `/pricing?checkout=${encodeURIComponent(id)}${billing ? `&billing=${billing}` : ''}`;
}

export function parsePendingCheckout(id: string | null, billingRaw: string | null): PendingCheckout | null {
  if (!id) return null;
  const billing = billingRaw === 'annual' ? 'annual' : 'monthly';
  const plan = PLANS.find((p) => p.id === id && p.id !== 'free');
  if (plan) {
    const label =
      billing === 'annual'
        ? `Forfait ${plan.name}, ${fcfa(plan.annualFcfa)} pour 1 an`
        : `Forfait ${plan.name}, ${fcfa(plan.monthlyFcfa)} par mois`;
    return { id: plan.id, billing, label };
  }
  const pack = CREDIT_PACKS.find((p) => p.id === id);
  if (pack) return { id: pack.id, billing, label: `${pack.name}, ${pack.credits} crédits pour ${fcfa(pack.priceFcfa)}` };
  return null;
}

/** Lit l'achat choisi dans une adresse de redirection (« /pricing?checkout=solo&billing=monthly ») */
export function pendingCheckoutFromPath(path: string): PendingCheckout | null {
  try {
    const url = new URL(path, 'https://exemple.invalid');
    if (url.pathname !== '/pricing') return null;
    return parsePendingCheckout(url.searchParams.get('checkout'), url.searchParams.get('billing'));
  } catch {
    return null;
  }
}
