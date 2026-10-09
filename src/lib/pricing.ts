/**
 * src/lib/pricing.ts
 * SOURCE UNIQUE DE VERITE — OmniMockup Studio
 * Toute modification de prix, quota ou crédit SE FAIT ICI UNIQUEMENT.
 * Importé par : /pricing, /account, setup-stripe, webhook, usage.ts
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

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
  monthlyFcfa: number;
  annualFcfa: number;
  description: string;
  isPopular?: boolean;
  isAnchor?: boolean;
  ctaText: string;
  features: PlanFeature[];
  quotas: PlanQuota;
}

// ─────────────────────────────────────────────────────────────────────────────
// GRILLE D'ABONNEMENTS
// Annuel = 10 mois payés ("2 mois offerts") → −16,67 % ≈ −17 %
// ─────────────────────────────────────────────────────────────────────────────

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Découverte',
    badge: '100% Gratuit',
    monthlyEur: 0,
    annualEur: 0,
    monthlyFcfa: 0,
    annualFcfa: 0,
    description: 'Studio complet sans carte bancaire. Testez et concevez librement.',
    ctaText: 'Commencer gratuitement',
    isPopular: false,
    quotas: { pngExportsPerDay: 3, watermark: true, aiAnalysesPerMonth: 3 },
    features: [
      { name: 'Studio complet (MacBook, iPhone, Duo, Trio)', included: true },
      { name: '3 exports PNG par jour (qualité 1x)', included: true },
      { name: 'Filigrane "Fait avec OmniMockup"', included: true },
      { name: 'Templates de base (6 catégories)', included: true },
      { name: 'Contrôles 3D, rotation & ombrages', included: true },
      { name: '3 analyses IA par mois', included: true },
      { name: 'Exports PNG HD 2x & 4K Retina', included: false },
      { name: 'Export Vidéo MP4 animée', included: false },
      { name: 'IA Pitch Kit', included: false },
      { name: 'Historique cloud', included: false },
    ],
  },
  {
    id: 'solo',
    name: 'Solo',
    badge: 'Entrée de gamme',
    monthlyEur: 5,
    annualEur: 50,
    monthlyFcfa: 3280,
    annualFcfa: 32800,
    description: 'Pour les créateurs occasionnels. 20 exports HD/mois avec filigrane discret.',
    ctaText: 'Choisir Solo',
    isPopular: false,
    quotas: { pngExportsPerMonth: 20, watermark: true, aiAnalysesPerMonth: 3 },
    features: [
      { name: 'Studio complet', included: true },
      { name: '20 exports PNG HD 2x / mois', included: true, highlight: true },
      { name: 'Filigrane discret (non intrusif)', included: true },
      { name: '3 analyses IA par mois', included: true },
      { name: '50+ templates', included: true },
      { name: 'Exports 4K Retina', included: false },
      { name: 'Export Vidéo MP4', included: false },
      { name: 'IA Pitch Kit', included: false },
      { name: 'Historique cloud', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Le plus populaire',
    monthlyEur: 9,
    annualEur: 90,
    monthlyFcfa: 5900,
    annualFcfa: 59000,
    description: 'Exports illimités HD+4K, vidéo MP4, ZÉRO filigrane. Le meilleur rapport valeur/prix.',
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
      { name: 'Exports PNG HD 2x & 4K ILLIMITÉS', included: true, highlight: true },
      { name: 'ZÉRO filigrane (rendus 100 % neutres)', included: true, highlight: true },
      { name: '10 exports Vidéo MP4 60fps / mois', included: true, highlight: true },
      { name: 'IA Pitch Kit (5 générations / mois)', included: true, highlight: true },
      { name: 'Analyses IA illimitées (mode Directeur Artistique)', included: true, highlight: true },
      { name: '50+ templates exclusifs Pro & Social Media', included: true },
      { name: 'Historique cloud 30 jours', included: true },
      { name: 'Partage par lien public haute fidélité', included: true },
      { name: 'Support email 24h', included: true },
      { name: '5 sièges collaborateurs', included: false },
      { name: 'Marque blanche totale', included: false },
    ],
  },
  {
    id: 'agence',
    name: 'Agence',
    badge: 'Agences & Startups',
    monthlyEur: 29,
    annualEur: 290,
    monthlyFcfa: 19000,
    annualFcfa: 190000,
    description: 'Suite complète : marque blanche, 5 sièges, vidéo illimitée, support WhatsApp 7j/7.',
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
      { name: 'Tout le plan Pro inclus', included: true },
      { name: '5 sièges collaborateurs', included: true, highlight: true },
      { name: 'Marque blanche totale (White Label)', included: true, highlight: true },
      { name: 'Vidéos MP4 ILLIMITÉES', included: true, highlight: true },
      { name: 'Pack OmniExport 1-clic (5 formats réseau)', included: true, highlight: true },
      { name: 'Kit Vente & Devis IA', included: true, highlight: true },
      { name: 'Pack App Store & Play Store', included: true },
      { name: 'Historique cloud 1 an', included: true },
      { name: 'Support WhatsApp 7j/7', included: true, highlight: true },
    ],
  },
];

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((p) => p.id === id);
  if (!plan) throw new Error(`Plan inconnu : ${id}`);
  return plan;
}

export function monthlyEquivalentFromAnnual(plan: Plan): { eur: number; fcfa: number } {
  if (plan.monthlyEur === 0) return { eur: 0, fcfa: 0 };
  return {
    eur: Math.round((plan.annualEur / 12) * 100) / 100,
    fcfa: Math.round(plan.annualFcfa / 12),
  };
}

export function annualSavings(plan: Plan): { eur: number; fcfa: number } {
  return {
    eur: plan.monthlyEur * 12 - plan.annualEur,
    fcfa: plan.monthlyFcfa * 12 - plan.annualFcfa,
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
  priceFcfa: number;
  pricePerCreditEur: number;
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
    priceEur: 4,
    priceFcfa: 2600,
    pricePerCreditEur: 0.40,
    pricePerCreditFcfa: 260,
    badge: 'Découverte',
  },
  {
    id: 'credit_moyen',
    name: 'Pack Moyen',
    credits: 30,
    priceEur: 10,
    priceFcfa: 6600,
    pricePerCreditEur: 0.33,
    pricePerCreditFcfa: 220,
    isDecoy: true,
  },
  {
    id: 'credit_grand',
    name: 'Grand Pack',
    credits: 75,
    priceEur: 15,
    priceFcfa: 9800,
    pricePerCreditEur: 0.20,
    pricePerCreditFcfa: 131,
    badge: 'Meilleure valeur : -50 %',
    isTarget: true,
  },
];

export function getCreditPack(id: CreditPackId): CreditPack {
  const pack = CREDIT_PACKS.find((p) => p.id === id);
  if (!pack) throw new Error(`Pack crédits inconnu : ${id}`);
  return pack;
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
  priceFcfa: 1300,
  creditsEquivalent: 10,
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// LOOKUP KEYS STRIPE (idempotence — pas de doublons à chaque setup)
// ─────────────────────────────────────────────────────────────────────────────

export const STRIPE_LOOKUP_KEYS = {
  solo_monthly:   'omnimockup_solo_monthly_v2',
  solo_annual:    'omnimockup_solo_annual_v2',
  pro_monthly:    'omnimockup_pro_monthly_v2',
  pro_annual:     'omnimockup_pro_annual_v2',
  agence_monthly: 'omnimockup_agence_monthly_v2',
  agence_annual:  'omnimockup_agence_annual_v2',
  credit_petit:   'omnimockup_credit_petit_v2',
  credit_moyen:   'omnimockup_credit_moyen_v2',
  credit_grand:   'omnimockup_credit_grand_v2',
  bump_pitch_kit: 'omnimockup_bump_pitch_kit_v2',
} as const;

export type StripeLookupKey = (typeof STRIPE_LOOKUP_KEYS)[keyof typeof STRIPE_LOOKUP_KEYS];
