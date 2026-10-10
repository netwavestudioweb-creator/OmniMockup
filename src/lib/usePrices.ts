'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { CREDIT_PACKS, PLANS, formatPrice, getCreditPackPrice, getPlanMonthlyPrice } from '@/lib/pricing';

/** Prix affichés dans la devise choisie (€ ou $), pour les fenêtres d'offre et le compte. */
export function usePrices() {
  const { currency } = useCurrency();
  const plan = (id: 'solo' | 'pro' | 'agence') => getPlanMonthlyPrice(PLANS.find((p) => p.id === id)!, currency);
  const pack = (id: string) => CREDIT_PACKS.find((p) => p.id === id)!;
  const solo = plan('solo');
  const pro = plan('pro');
  const grand = pack('credit_grand');
  const petit = pack('credit_petit');
  const perCredit = (p: typeof grand) => (currency === 'USD' ? p.pricePerCreditUsd : p.pricePerCreditEur);
  const f = (n: number) => formatPrice(n, currency);
  return {
    solo: f(solo),
    pro: f(pro),
    agence: f(plan('agence')),
    proMinusSolo: f(pro - solo),
    grandPack: f(getCreditPackPrice(grand, currency)),
    grandCredits: grand.credits,
    grandPerCredit: f(perCredit(grand)),
    petitPack: f(getCreditPackPrice(petit, currency)),
    petitCredits: petit.credits,
    petitPerCredit: f(perCredit(petit)),
  };
}
