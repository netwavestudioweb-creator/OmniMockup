'use client';

import { useCurrency } from '@/context/CurrencyContext';
import { CREDIT_PACKS, PLANS, formatPrice, getCreditPackPrice, getPlanMonthlyPrice } from '@/lib/pricing';

/** Prix affichés en FCFA (montant payé par Mobile Money), suivis de l'euro ou du dollar, pour les fenêtres d'offre et le compte. */
export function usePrices() {
  const { currency } = useCurrency();
  const planOf = (id: 'solo' | 'pro' | 'agence') => PLANS.find((p) => p.id === id)!;
  const plan = (id: 'solo' | 'pro' | 'agence') => getPlanMonthlyPrice(planOf(id), currency);
  const dual = (fcfa: number, other: number) => `${formatPrice(fcfa, 'XOF')} (${formatPrice(other, currency)})`;
  const pack = (id: string) => CREDIT_PACKS.find((p) => p.id === id)!;
  const solo = plan('solo');
  const pro = plan('pro');
  const grand = pack('credit_grand');
  const petit = pack('credit_petit');
  const perCredit = (p: typeof grand) => (currency === 'USD' ? p.pricePerCreditUsd : p.pricePerCreditEur);
  return {
    solo: dual(planOf('solo').monthlyFcfa, solo),
    pro: dual(planOf('pro').monthlyFcfa, pro),
    agence: dual(planOf('agence').monthlyFcfa, plan('agence')),
    proMinusSolo: dual(planOf('pro').monthlyFcfa - planOf('solo').monthlyFcfa, pro - solo),
    grandPack: dual(grand.priceFcfa, getCreditPackPrice(grand, currency)),
    grandCredits: grand.credits,
    grandPerCredit: dual(grand.pricePerCreditFcfa, perCredit(grand)),
    petitPack: dual(petit.priceFcfa, getCreditPackPrice(petit, currency)),
    petitCredits: petit.credits,
    petitPerCredit: dual(petit.pricePerCreditFcfa, perCredit(petit)),
  };
}
