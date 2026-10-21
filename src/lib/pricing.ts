/**
 * src/lib/pricing.ts
 * SOURCE UNIQUE DE VERITE — PitchMySite
 * Toute modification de prix, quota ou crédit SE FAIT ICI UNIQUEMENT.
 * Importé par : /pricing, /account, setup-stripe, webhook, usage.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export type Currency = 'EUR' | 'USD' | 'XOF';

export type PlanId = 'free' | 'solo' | 'pro' | 'agence';

export interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanQuota {
  pngExportsPerDay?: number;
  pngExportsPerMonth?: number;
  pngExportsUnlimited?: boolean;
  export4K?: boolean;
  videoExportsPerMonth?: number;
  videoExportsUnlimited?: boolean;
  aiAnalysesPerMonth?: number;
  aiAnalysesUnlimited?: boolean;
  aiPitchKitPerMonth?: number;
  aiPitchKitUnlimited?: boolean;
  watermark: boolean;
  cloudHistoryDays?: number;
  seats?: number;
  whiteLabel?: boolean;
  omniExportPack?: boolean;
  saleKit?: boolean;
  appStorePack?: boolean;
  linkSharing?: boolean;
  emailSupport?: boolean;
  whatsappSupport?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  badge?: string;
  monthlyEur: number;
  annualEur: number;
  monthlyUsd: number;
  annualUsd: number;
  monthlyFcfa: number;
  annualFcfa: number;
  /** Fidélité (Mobile Money) : baisse en FCFA à chaque mois payé d'affilée, jusqu'à LOYALTY_MAX_STEPS baisses */
  loyaltyStepFcfa: number;
  description: string;
  isPopular?: boolean;
  isAnchor?: boolean;
  ctaText: string;
  features: PlanFeature[];
  quotas: PlanQuota;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYS ET DÉTECTION GÉOGRAPHIQUE
// ─────────────────────────────────────────────────────────────────────────────

// Pays de la zone FCFA (UEMOA) : affichage des prix en FCFA
export const XOF_COUNTRIES = ['BJ', 'CI', 'SN', 'TG', 'ML', 'BF', 'NE', 'GW'] as const;

// Pays zone Euro + Europe principale
export const EUR_COUNTRIES = [
  'FR', 'DE', 'IT', 'ES', 'BE', 'NL', 'PT', 'AT', 'IE', 'FI',
  'GR', 'LU', 'CY', 'MT', 'SI', 'SK', 'EE', 'LV', 'LT', 'GB',
  'CH', 'NO', 'SE', 'DK', 'PL', 'CZ', 'RO', 'BG', 'HR', 'HU',
  'AD', 'MC', 'SM', 'VA',
] as const;

export function detectCurrencyFromCountry(countryCode?: string | null): Currency {
  if (!countryCode) return 'USD';
  const upper = countryCode.toUpperCase();
  // Affichage en € ou $ uniquement : le FCFA (arrimé à l'euro) n'est utilisé qu'au paiement SasPay
  if ((XOF_COUNTRIES as readonly string[]).includes(upper)) return 'EUR';
  if ((EUR_COUNTRIES as readonly string[]).includes(upper)) return 'EUR';
  return 'USD';
}

// ─────────────────────────────────────────────────────────────────────────────
// GRILLE D'ABONNEMENTS (validée par Dodo le 21/10/2026)
// Mensuel FCFA : prix de départ, puis baisse de fidélité à chaque mois payé d'affilée
// (3 baisses au maximum ; un mois raté → retour au prix de départ).
// Annuel = 12 × le prix plancher de la fidélité. Euros ≈ FCFA ÷ 656, arrondis.
// ─────────────────────────────────────────────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Découverte',
    badge: '100% Gratuit',
    monthlyEur: 0,
    annualEur: 0,
    monthlyUsd: 0,
    annualUsd: 0,
    monthlyFcfa: 0,
    annualFcfa: 0,
    loyaltyStepFcfa: 0,
    description: 'Le studio complet, sans carte bancaire. Idéal pour tester sur vos projets.',
    ctaText: 'Commencer gratuitement',
    isPopular: false,
    quotas: { pngExportsPerDay: 3, watermark: true, aiAnalysesPerMonth: 3 },
    features: [
      { name: 'Studio complet : 9 appareils, scènes photo, annotations', included: true },
      { name: '3 exports par jour en qualité Standard (1280 px)', included: true },
      { name: 'Filigrane « Réalisé avec PitchMySite »', included: true },
      { name: '5 liens de partage actifs', included: true },
      { name: '3 analyses IA directeur artistique par mois', included: true },
      { name: 'Exports HD et 4K', included: false },
      { name: 'Vidéos et GIF animés', included: false },
      { name: 'Pitch IA avec votre clé Gemini ou Claude', included: true },
    ],
  },
  {
    id: 'solo',
    name: 'Solo',
    badge: 'Entrée de gamme',
    monthlyEur: 8,
    annualEur: 73,
    monthlyUsd: 8,
    annualUsd: 73,
    monthlyFcfa: 5500,
    annualFcfa: 48000,
    loyaltyStepFcfa: 500,
    description: 'Pour les créateurs occasionnels : 20 exports HD par mois.',
    ctaText: 'Choisir Solo',
    isPopular: false,
    quotas: { pngExportsPerMonth: 20, watermark: true, aiAnalysesPerMonth: 3 },
    features: [
      { name: 'Studio complet', included: true },
      { name: '20 exports HD par mois (1920 px)', included: true, highlight: true },
      { name: 'Filigrane discret', included: true },
      { name: 'Liens de partage illimités', included: true },
      { name: '3 analyses IA directeur artistique par mois', included: true },
      { name: 'Exports 4K', included: false },
      { name: 'Vidéos et GIF animés', included: false },
      { name: 'Pitch IA avec votre clé Gemini ou Claude', included: true },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Le plus populaire',
    monthlyEur: 14,
    annualEur: 119,
    monthlyUsd: 14,
    annualUsd: 119,
    monthlyFcfa: 9500,
    annualFcfa: 78000,
    loyaltyStepFcfa: 1000,
    description: 'Exports illimités jusqu’en 4K, sans filigrane, avec vidéos et GIF. Le meilleur choix.',
    isPopular: true,
    ctaText: 'Choisir Pro',
    quotas: {
      pngExportsUnlimited: true,
      export4K: true,
      watermark: false,
      videoExportsPerMonth: 10,
      aiAnalysesUnlimited: true,
      aiPitchKitPerMonth: 5,
      cloudHistoryDays: 30,
      linkSharing: true,
      emailSupport: true,
    },
    features: [
      { name: 'Exports HD et 4K illimités', included: true, highlight: true },
      { name: 'Aucun filigrane', included: true, highlight: true },
      { name: '10 vidéos ou GIF animés par mois', included: true, highlight: true },
      { name: 'Analyses IA directeur artistique illimitées', included: true },
      { name: 'Pitch IA avec votre clé Gemini ou Claude', included: true },
      { name: 'Liens de partage illimités', included: true },
      { name: 'Support par e-mail', included: true },
      { name: 'Marque blanche', included: false },
    ],
  },
  {
    id: 'agence',
    name: 'Agence',
    badge: 'Agences & Startups',
    monthlyEur: 29,
    annualEur: 290,
    monthlyUsd: 29,
    annualUsd: 290,
    monthlyFcfa: 19000,
    annualFcfa: 192000,
    loyaltyStepFcfa: 1000,
    description: 'Tout le forfait Pro en illimité, avec vos pages de partage à votre marque.',
    isPopular: false,
    isAnchor: true,
    ctaText: 'Choisir Agence',
    quotas: {
      pngExportsUnlimited: true,
      export4K: true,
      watermark: false,
      videoExportsUnlimited: true,
      aiAnalysesUnlimited: true,
      aiPitchKitUnlimited: true,
      cloudHistoryDays: 365,
      seats: 5,
      whiteLabel: true,
      omniExportPack: true,
      saleKit: true,
      appStorePack: true,
      linkSharing: true,
      whatsappSupport: true,
    },
    features: [
      { name: 'Tout le forfait Pro inclus', included: true },
      { name: 'Vidéos et GIF animés illimités', included: true, highlight: true },
      { name: 'Pitch IA avec votre clé Gemini ou Claude', included: true },
      { name: 'Marque blanche : pages de partage à votre nom et logo, sans mention de PitchMySite', included: true, highlight: true },
      { name: 'Support WhatsApp prioritaire', included: true, highlight: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// FIDÉLITÉ (Mobile Money, paiement au mois)
// ─────────────────────────────────────────────────────────────────────────────

/** Nombre maximum de baisses de fidélité (atteint dès le 4e mois payé d'affilée) */
export const LOYALTY_MAX_STEPS = 3;
/** Délai accordé après la fin du mois pour repayer sans perdre la fidélité */
export const LOYALTY_GRACE_DAYS = 3;

/** Prix d'un mois en FCFA après `step` baisses de fidélité (0 = prix de départ) */
export function getLoyaltyMonthlyFcfa(plan: Plan, step: number): number {
  const s = Math.max(0, Math.min(LOYALTY_MAX_STEPS, Math.floor(step)));
  return plan.monthlyFcfa - s * plan.loyaltyStepFcfa;
}

/** Prix plancher en FCFA (client fidèle depuis 4 mois ou plus) */
export function getLoyaltyFloorFcfa(plan: Plan): number {
  return getLoyaltyMonthlyFcfa(plan, LOYALTY_MAX_STEPS);
}

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Plan inconnu : ${id}`);
  return plan;
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS CALCULS ET PRIX MULTI-DEVISES
// ─────────────────────────────────────────────────────────────────────────────

export function getPlanMonthlyPrice(plan: Plan, currency: Currency): number {
  if (currency === 'EUR') return plan.monthlyEur;
  if (currency === 'USD') return plan.monthlyUsd;
  return plan.monthlyFcfa;
}

export function getPlanAnnualPrice(plan: Plan, currency: Currency): number {
  if (currency === 'EUR') return plan.annualEur;
  if (currency === 'USD') return plan.annualUsd;
  return plan.annualFcfa;
}

export function getPlanMonthlyEquivalent(plan: Plan, currency: Currency): number {
  const annual = getPlanAnnualPrice(plan, currency);
  if (annual === 0) return 0;
  if (currency === 'XOF') {
    return Math.round(annual / 12);
  }
  return Math.round((annual / 12) * 100) / 100;
}

export function getPlanAnnualSavings(plan: Plan, currency: Currency): number {
  const monthly = getPlanMonthlyPrice(plan, currency);
  const annual = getPlanAnnualPrice(plan, currency);
  return monthly * 12 - annual;
}

export function formatPrice(amount: number, currency: Currency, showUnit = true): string {
  if (currency === 'EUR') {
    // Écriture française : virgule décimale (4,17 €)
    const formatted = (amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2)).replace('.', ',');
    return showUnit ? `${formatted} €` : formatted;
  }
  if (currency === 'USD') {
    const formatted = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
    return showUnit ? `$${formatted}` : formatted;
  }
  // XOF
  const formatted = Math.round(amount).toLocaleString('fr-FR');
  return showUnit ? `${formatted} FCFA` : formatted;
}

// Rétrocompatibilité
export function monthlyEquivalentFromAnnual(plan: Plan): { eur: number; fcfa: number } {
  return {
    eur: getPlanMonthlyEquivalent(plan, 'EUR'),
    fcfa: getPlanMonthlyEquivalent(plan, 'XOF'),
  };
}

export function annualSavings(plan: Plan): { eur: number; fcfa: number } {
  return {
    eur: getPlanAnnualSavings(plan, 'EUR'),
    fcfa: getPlanAnnualSavings(plan, 'XOF'),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CRÉDITS À LA CARTE — Psychologie popcorn
// Petit (appât) → Moyen (leurre) → Grand (cible ⭐)
// ─────────────────────────────────────────────────────────────────────────────

export type CreditPackId = 'credit_petit' | 'credit_moyen' | 'credit_grand';

export interface CreditPack {
  id: CreditPackId;
  name: string;
  credits: number;
  priceEur: number;
  priceUsd: number;
  priceFcfa: number;
  pricePerCreditEur: number;
  pricePerCreditUsd: number;
  pricePerCreditFcfa: number;
  badge?: string;
  isTarget?: boolean;
  isDecoy?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'credit_petit',
    name: 'Petit Pack',
    credits: 10,
    priceEur: 5,
    priceUsd: 5,
    priceFcfa: 3200,
    pricePerCreditEur: 0.50,
    pricePerCreditUsd: 0.50,
    pricePerCreditFcfa: 320,
    badge: 'Découverte',
  },
  {
    id: 'credit_moyen',
    name: 'Pack Moyen',
    credits: 30,
    priceEur: 11,
    priceUsd: 11,
    priceFcfa: 7500,
    pricePerCreditEur: 0.37,
    pricePerCreditUsd: 0.37,
    pricePerCreditFcfa: 250,
    isDecoy: true,
  },
  {
    id: 'credit_grand',
    name: 'Grand Pack',
    credits: 75,
    priceEur: 19,
    priceUsd: 19,
    priceFcfa: 12500,
    pricePerCreditEur: 0.25,
    pricePerCreditUsd: 0.25,
    pricePerCreditFcfa: 167,
    badge: 'Meilleure valeur : -48 %',
    isTarget: true,
  },
];

export function getCreditPack(id: CreditPackId): CreditPack {
  const pack = CREDIT_PACKS.find((p) => p.id === id);
  if (!pack) throw new Error(`Pack crédits inconnu : ${id}`);
  return pack;
}

export function getCreditPackPrice(pack: CreditPack, currency: Currency): number {
  if (currency === 'EUR') return pack.priceEur;
  if (currency === 'USD') return pack.priceUsd;
  return pack.priceFcfa;
}

// ─────────────────────────────────────────────────────────────────────────────
// COÛTS EN CRÉDITS PAR TYPE D'ACTION
// ─────────────────────────────────────────────────────────────────────────────

export const CREDIT_COSTS = {
  png_hd_2x:   1,
  export_4k:   2,
  video_mp4:   3,
  omni_export: 4,
  pitch_kit:   2,
} as const;

export type CreditCostKey = keyof typeof CREDIT_COSTS;

// ─────────────────────────────────────────────────────────────────────────────
// ORDER BUMP
// ─────────────────────────────────────────────────────────────────────────────

export const ORDER_BUMP = {
  id: 'bump_pitch_kit',
  name: 'Kit IA Pitch (5 générations)',
  description: 'Génération IA de vos textes de vente, pitch deck et arguments-clés.',
  priceEur: 2,
  priceUsd: 2,
  priceFcfa: 1300,
  creditsEquivalent: 10,
} as const;

export function getOrderBumpPrice(currency: Currency): number {
  if (currency === 'EUR') return ORDER_BUMP.priceEur;
  if (currency === 'USD') return ORDER_BUMP.priceUsd;
  return ORDER_BUMP.priceFcfa;
}

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP KEYS STRIPE (idempotence — multi-devises EUR et USD)
// v3 : nouveaux prix du 21/10/2026 (relancer scripts/setup-stripe-products.ts avant d'activer la carte)
// ─────────────────────────────────────────────────────────────────────────────

export const STRIPE_LOOKUP_KEYS = {
  // Plans mensuels
  solo_monthly_eur:   'omnimockup_solo_monthly_eur_v3',
  solo_monthly_usd:   'omnimockup_solo_monthly_usd_v3',
  pro_monthly_eur:    'omnimockup_pro_monthly_eur_v3',
  pro_monthly_usd:    'omnimockup_pro_monthly_usd_v3',
  agence_monthly_eur: 'omnimockup_agence_monthly_eur_v3',
  agence_monthly_usd: 'omnimockup_agence_monthly_usd_v3',

  // Plans annuels
  solo_annual_eur:    'omnimockup_solo_annual_eur_v3',
  solo_annual_usd:    'omnimockup_solo_annual_usd_v3',
  pro_annual_eur:     'omnimockup_pro_annual_eur_v3',
  pro_annual_usd:     'omnimockup_pro_annual_usd_v3',
  agence_annual_eur:  'omnimockup_agence_annual_eur_v3',
  agence_annual_usd:  'omnimockup_agence_annual_usd_v3',

  // Packs crédits
  credit_petit_eur:   'omnimockup_credit_petit_eur_v3',
  credit_petit_usd:   'omnimockup_credit_petit_usd_v3',
  credit_moyen_eur:   'omnimockup_credit_moyen_eur_v3',
  credit_moyen_usd:   'omnimockup_credit_moyen_usd_v3',
  credit_grand_eur:   'omnimockup_credit_grand_eur_v3',
  credit_grand_usd:   'omnimockup_credit_grand_usd_v3',

  // Order Bump
  bump_pitch_kit_eur: 'omnimockup_bump_pitch_kit_eur_v2',
  bump_pitch_kit_usd: 'omnimockup_bump_pitch_kit_usd_v2',

  // Rétrocompatibilité V2 (pointe vers EUR)
  solo_monthly:       'omnimockup_solo_monthly_eur_v3',
  solo_annual:        'omnimockup_solo_annual_eur_v3',
  pro_monthly:        'omnimockup_pro_monthly_eur_v3',
  pro_annual:         'omnimockup_pro_annual_eur_v3',
  agence_monthly:     'omnimockup_agence_monthly_eur_v3',
  agence_annual:      'omnimockup_agence_annual_eur_v3',
  credit_petit:       'omnimockup_credit_petit_eur_v3',
  credit_moyen:       'omnimockup_credit_moyen_eur_v3',
  credit_grand:       'omnimockup_credit_grand_eur_v3',
  bump_pitch_kit:     'omnimockup_bump_pitch_kit_eur_v2',
} as const;

export type StripeLookupKey = (typeof STRIPE_LOOKUP_KEYS)[keyof typeof STRIPE_LOOKUP_KEYS];
