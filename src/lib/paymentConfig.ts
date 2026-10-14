/**
 * Paiement par carte bancaire : un seul réglage, la variable Vercel NEXT_PUBLIC_CARD_PROVIDER.
 *
 * - absente ou « none » : bouton « Carte bancaire » visible mais grisé (« Bientôt ») ;
 * - « saspay » : la carte passe par la page de paiement SasPay (même parcours que le Mobile Money) ;
 * - « stripe » : la carte passe par Stripe (euros ou dollars), avec les clés STRIPE_* dans Vercel.
 *
 * Variable NEXT_PUBLIC_ : elle est lue au moment du build, il faut redéployer après l'avoir changée.
 */
export type CardProvider = 'none' | 'saspay' | 'stripe';

function parseCardProvider(value: string | undefined): CardProvider {
  const v = (value || '').trim().toLowerCase();
  return v === 'saspay' || v === 'stripe' ? v : 'none';
}

export const CARD_PROVIDER: CardProvider = parseCardProvider(process.env.NEXT_PUBLIC_CARD_PROVIDER);

export const cardPaymentsEnabled = CARD_PROVIDER !== 'none';

/** Côté serveur : les routes Stripe ne répondent que si la carte passe par Stripe (ou l'ancien STRIPE_ENABLED=true). */
export function stripeEnabled(): boolean {
  return CARD_PROVIDER === 'stripe' || process.env.STRIPE_ENABLED === 'true';
}
