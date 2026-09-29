'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useUser } from '@/context/UserContext';
import {
  Check,
  X as XIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building2,
  HelpCircle,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Flame,
  CheckCircle2,
  Gift,
  Layers,
  Crown,
  TrendingUp,
  Percent,
  Clock,
  PlusCircle,
  Info,
} from 'lucide-react';

interface PricingPlan {
  id: 'starter' | 'creator' | 'pro' | 'agence';
  name: string;
  badge?: string;
  badgeIcon?: React.ElementType;
  badgeColor?: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  isPopular?: boolean;
  ctaText: string;
  savingsAnnually: string;
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
    tooltip?: string;
  }[];
}

const PLANS: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    badge: 'Découverte',
    badgeIcon: Sparkles,
    badgeColor: 'bg-stone-100 text-stone-700 border-sand-300',
    monthlyPrice: 9,
    annualPrice: 7,
    savingsAnnually: 'Économisez 24€ / an',
    description: 'Pour les besoins occasionnels et les premiers tests de visuels.',
    isPopular: false,
    ctaText: 'Commencer à 9€',
    features: [
      { name: '10 Captures Web HD par mois', included: true },
      { name: 'Analyseur de sections basique', included: true },
      { name: 'Cadres Mockups Standard (Chrome & Safari)', included: true },
      { name: 'Avis Directeur Artistique IA', included: false },
      { name: 'Exports 4K sans filigrane', included: false },
      { name: 'Studio 3D & Effets Glassmorphism', included: false },
      { name: 'Marque blanche totale', included: false },
    ],
  },
  {
    id: 'creator',
    name: 'Essentiel',
    badge: 'Indépendant',
    badgeIcon: Zap,
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    monthlyPrice: 27,
    annualPrice: 22,
    savingsAnnually: 'Économisez 60€ / an',
    description: 'Pour les créateurs indépendants avec des besoins réguliers.',
    isPopular: false,
    ctaText: 'Choisir Essentiel',
    features: [
      { name: '50 Captures Web HD par mois', included: true },
      { name: 'Analyseur de sections complet', included: true },
      { name: 'Cadres Mockups Standard & Mobile', included: true },
      { name: 'Avis DA IA (10 analyses / mois)', included: true },
      { name: 'Exports HD 2x sans filigrane', included: true },
      { name: 'Studio 3D & Effets Glassmorphism', included: false },
      { name: 'Marque blanche & Multi-projets', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Unlimited',
    badge: 'Recommandé — Le Plus Populaire',
    badgeIcon: Flame,
    badgeColor: 'bg-violet-600 text-white border-violet-500 shadow-violet-500/30',
    monthlyPrice: 29,
    annualPrice: 23,
    savingsAnnually: 'Économisez 72€ / an',
    description: 'Accès totalement illimité à tout le studio. Seulement +2€ par rapport à l’Essentiel !',
    isPopular: true,
    ctaText: 'Débloquer l’Illimité à 29€',
    features: [
      { name: 'Captures Web HD ILLIMITÉES', included: true, highlight: true },
      { name: 'Analyseur de sections IA ILLIMITÉ', included: true, highlight: true },
      { name: 'Directeur Artistique IA ILLIMITÉ', included: true, highlight: true },
      { name: 'Tous les Cadres 3D (MacBook, iPhone, iMac)', included: true, highlight: true },
      { name: 'Exports Ultra-HD 4K sans filigrane', included: true, highlight: true },
      { name: 'Studio 3D, Inset & Effets Glassmorphism', included: true, highlight: true },
      { name: 'Marque blanche sur vos exports', included: true },
    ],
  },
  {
    id: 'agence',
    name: 'Studio Agence',
    badge: 'Équipes & Agences',
    badgeIcon: Building2,
    badgeColor: 'bg-stone-900 text-white border-stone-800',
    monthlyPrice: 79,
    annualPrice: 59,
    savingsAnnually: 'Économisez 240€ / an',
    description: 'Pour les agences web et équipes créatives gérant plusieurs clients.',
    isPopular: false,
    ctaText: 'Passer au Pack Agence',
    features: [
      { name: 'Tout le plan Pro Unlimited inclus', included: true },
      { name: 'Jusqu’à 5 accès collaborateurs', included: true, highlight: true },
      { name: 'Multi-projets clients dédiés', included: true, highlight: true },
      { name: 'Export Marque Blanche Totale avec logo client', included: true, highlight: true },
      { name: 'API de capture prioritaire dédiée', included: true, highlight: true },
      { name: 'Support VIP 7j/7 dédié', included: true },
    ],
  },
];

interface CrossSellAddon {
  id: string;
  title: string;
  price: string;
  regularPrice: string;
  description: string;
  icon: React.ElementType;
}

const CROSS_SELL_ADDONS: CrossSellAddon[] = [
  {
    id: 'addon-templates',
    title: 'Kit 50+ Templates Canvas HD SaaS & E-commerce',
    price: '15€',
    regularPrice: '49€',
    description: 'Mises en scène prêtes à l’emploi pour vos publicités Meta, LinkedIn et Product Hunt.',
    icon: Layers,
  },
  {
    id: 'addon-audit-da',
    title: 'Pack 100 Crédits Audit IA Deep-Check Conversion',
    price: '19€',
    regularPrice: '59€',
    description: 'Analyse UX/UI approfondie avec scoring de lisibilité et propositions de copywriting.',
    icon: Crown,
  },
  {
    id: 'addon-brand',
    title: 'Option Marque Blanche Express & Logo Personnalisé',
    price: '12€',
    regularPrice: '39€',
    description: 'Apposez directement le logo et filigrane de vos clients sur vos rendus.',
    icon: Sparkles,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, profile } = useUser();

  const [isAnnual, setIsAnnual] = useState(true);
  const [selectedAddons, setSelectedAddons] = useState<string[]>(['addon-templates']);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showDownsellBanner, setShowDownsellBanner] = useState(true);

  const toggleAddon = (id: string) => {
    setSelectedAddons((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handlePlanClick = async (plan: PricingPlan) => {
    if (!user) {
      router.push(`/signup?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    if (profile?.plan === plan.id) {
      router.push('/account');
      return;
    }

    setLoadingPlan(plan.id);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          billing: isAnnual ? 'annual' : 'monthly',
          addons: selectedAddons,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Impossible d’initialiser la session de paiement.');
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCheckoutError(e?.message || 'Erreur lors de la redirection vers Stripe.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900">
      <Navbar showPricingLink={false} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Navigation retour */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sand-100 text-stone-600 hover:text-stone-900 border border-sand-200 text-xs font-medium transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-stone-500" />
            <span>Retour à l&apos;application</span>
          </Link>
        </div>

        {/* BANNIÈRE DE BIENVENUE */}
        {showDownsellBanner && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-violet-950 to-stone-900 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 border border-violet-800/40 animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0 shadow-xs">
                <Gift className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider bg-amber-400/15 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/25 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Offre de Bienvenue
                  </span>
                  <span className="text-xs text-stone-300 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-violet-300" /> Durée limitée
                  </span>
                </div>
                <h4 className="text-sm sm:text-base font-semibold text-white mt-1">
                  Profitez de <span className="text-amber-300 font-bold">-50% sur votre premier mois</span> du plan Pro avec le code <span className="font-mono font-bold bg-white/10 px-2 py-0.5 rounded border border-white/20 text-amber-200">WELCOME50</span>.
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handlePlanClick(PLANS.find((p) => p.id === 'pro')!)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Appliquer la réduction</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setShowDownsellBanner(false)}
                className="p-2 text-stone-400 hover:text-white rounded-lg transition-colors"
                title="Fermer"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {checkoutError && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Header & Titre */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-900 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
            <span>Formules Simples & Sans Engagement</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Des visuels haute définition pour valoriser{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-indigo-600">
              vos projets web
            </span>.
          </h1>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Générez des mockups 3D d&apos;exception avec les conseils intégrés du Directeur Artistique IA. Annulation en un clic à tout moment.
          </p>

          {/* TOGGLE MENSUEL / ANNUEL */}
          <div className="pt-4 flex items-center justify-center gap-3">
            <span
              className={`text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                !isAnnual ? 'text-stone-900' : 'text-stone-400'
              }`}
              onClick={() => setIsAnnual(false)}
            >
              Facturation mensuelle
            </span>

            <button
              type="button"
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 rounded-full bg-stone-900 p-1 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-300 flex items-center justify-center ${
                  isAnnual ? 'translate-x-7 bg-violet-600' : 'translate-x-0'
                }`}
              >
                {isAnnual && <Percent className="w-3 h-3 text-violet-600 stroke-[3]" />}
              </div>
            </button>

            <div
              className="flex items-center gap-1.5 cursor-pointer"
              onClick={() => setIsAnnual(true)}
            >
              <span
                className={`text-xs sm:text-sm font-semibold transition-colors ${
                  isAnnual ? 'text-violet-700' : 'text-stone-400'
                }`}
              >
                Facturation annuelle
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                2 mois offerts (-25%)
              </span>
            </div>
          </div>
        </div>

        {/* GRILLE DES 4 PLANS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch max-w-7xl mx-auto mb-16">
          {PLANS.map((plan) => {
            const priceToShow = isAnnual ? plan.annualPrice : plan.monthlyPrice;
            const BadgeIcon = plan.badgeIcon || Sparkles;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-white via-violet-50/40 to-white border-violet-500 shadow-2xl shadow-violet-500/20 ring-2 ring-violet-500/40 scale-[1.02] z-10'
                    : 'bg-white border-sand-200 shadow-xs hover:border-sand-300 hover:shadow-md'
                }`}
              >
                {/* Badge top */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-full text-center px-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-sm border ${
                        plan.badgeColor || 'bg-stone-900 text-white'
                      }`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{plan.badge}</span>
                    </span>
                  </div>
                )}

                <div>
                  {/* Nom du plan & Description */}
                  <div className="space-y-1.5 mt-1">
                    <h3 className="text-lg font-bold text-stone-900 flex items-center gap-1.5">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-stone-500 min-h-[36px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Highlight optionnel sur le plan Pro */}
                  {plan.id === 'pro' && (
                    <div className="my-2.5 p-2 rounded-xl bg-violet-50 border border-violet-200 text-violet-900 text-[11px] font-medium leading-tight flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                      <span>Profitez de l&apos;accès illimité pour seulement <strong>+2€</strong> par rapport au plan Essentiel.</span>
                    </div>
                  )}

                  {/* Zone de Prix */}
                  <div className="my-5 pb-5 border-b border-sand-100 flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 font-mono">
                      {priceToShow}€
                    </span>
                    <span className="text-xs font-medium text-stone-500 font-sans">
                      / mois {isAnnual ? '(facturé annuellement)' : ''}
                    </span>
                  </div>

                  {isAnnual && (
                    <p className="text-[11px] font-semibold text-emerald-700 -mt-3 mb-4 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {plan.savingsAnnually}
                    </p>
                  )}

                  {/* Liste des fonctionnalités */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 font-mono">
                      Fonctionnalités incluses :
                    </p>

                    <ul className="space-y-2.5 text-xs">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          {feat.included ? (
                            <div
                              className={`p-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                                feat.highlight
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="p-0.5 rounded-full mt-0.5 flex-shrink-0 bg-sand-100 text-stone-400">
                              <XIcon className="w-3 h-3 stroke-[2]" />
                            </div>
                          )}

                          <span
                            className={`leading-tight ${
                              feat.included
                                ? feat.highlight
                                  ? 'font-semibold text-stone-900'
                                  : 'text-stone-700'
                                : 'text-stone-400 line-through opacity-70'
                            }`}
                          >
                            {feat.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bouton d'action */}
                <div className="mt-7 pt-4 border-t border-sand-100">
                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 ${
                      plan.isPopular
                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/30'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-current" />
                        <span>Redirection Stripe...</span>
                      </>
                    ) : (
                      <>
                        <span>{plan.ctaText}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* SECTION MODULES OPTIONNELS (CROSS-SELL) */}
        <div className="max-w-5xl mx-auto mb-16 p-8 rounded-3xl bg-white border border-sand-200 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-violet-100 text-violet-900 text-xs font-bold mb-2">
                <PlusCircle className="w-3.5 h-3.5 text-violet-600" />
                <span>Modules & Packs Optionnels</span>
              </div>
              <h3 className="text-xl font-bold text-stone-900">
                Enrichissez votre expérience créative
              </h3>
              <p className="text-xs text-stone-500">
                Cochez les options souhaitées pour les inclure directement lors de votre validation Stripe.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {CROSS_SELL_ADDONS.map((addon) => {
              const isSelected = selectedAddons.includes(addon.id);
              const IconComp = addon.icon;

              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddon(addon.id)}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-violet-50/60 border-violet-500 ring-2 ring-violet-400/30 shadow-sm'
                      : 'bg-sand-50/50 border-sand-200 hover:border-sand-300 hover:bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="p-2 rounded-xl bg-white border border-sand-200 text-violet-600 shadow-2xs">
                        <IconComp className="w-4 h-4" />
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-violet-600 border-violet-600 text-white'
                            : 'border-sand-300 bg-white'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>

                    <h4 className="text-xs font-bold text-stone-900 leading-snug">
                      {addon.title}
                    </h4>
                    <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                      {addon.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-sand-200/60 flex items-baseline gap-2">
                    <span className="text-base font-extrabold text-stone-900 font-mono">
                      +{addon.price}
                    </span>
                    <span className="text-xs text-stone-400 line-through font-mono">
                      {addon.regularPrice}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 ml-auto flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" /> Ajouté au checkout
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION VALEUR & ROI */}
        <div className="max-w-4xl mx-auto mb-16 rounded-3xl bg-stone-900 text-white p-8 sm:p-10 shadow-xl border border-stone-800 relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs font-semibold">
                <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                <span>Un Investissement Rentabilisé Rapidement</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                Un gain de temps et d&apos;argent garanti dès vos premières créations
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                Faire réaliser une maquette par un studio graphique coûte habituellement entre <strong>250€ et 500€</strong>. Avec OmniMockup, vous générez des visuels d&apos;une qualité équivalente en quelques secondes.
              </p>
            </div>

            <div className="bg-stone-800/80 p-5 rounded-2xl border border-stone-700 space-y-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Gain par projet
              </p>
              <div className="text-3xl font-extrabold text-amber-400 font-mono">
                +500€
              </div>
              <p className="text-[11px] text-stone-300 leading-tight">
                Économie directe équivalente à plus d&apos;un an d&apos;abonnement Pro.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION GARANTIE & FAQ */}
        <div className="max-w-3xl mx-auto rounded-3xl bg-white border border-sand-200 p-8 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-violet-100 text-violet-700">
              <ShieldCheck className="w-6 h-6 text-violet-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Garantie Satisfait ou Remboursé 14 Jours
              </h3>
              <p className="text-xs text-stone-500">
                Essayez OmniMockup en toute sérénité. Si la qualité de vos visuels ne vous donne pas entière satisfaction, notre support vous rembourse immédiatement sur simple demande.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-sand-100 text-xs text-stone-600">
            <div className="space-y-1.5">
              <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
                Quelle est la différence entre les formules Essentiel et Pro Unlimited ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                La formule Pro Unlimited vous offre un accès totalement illimité à l&apos;ensemble de nos outils (captures illimitées, exports 4K sans filigrane, cadres 3D et conseils IA) pour seulement 2€ de plus par mois.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
                Puis-je modifier ou résilier mon offre à tout moment ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Absolument, vous pouvez gérer, faire évoluer ou résilier votre abonnement en un clic depuis votre espace membre via notre portail sécurisé Stripe.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
