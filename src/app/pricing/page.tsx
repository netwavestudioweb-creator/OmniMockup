'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
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
} from 'lucide-react';

interface PricingPlan {
  id: 'free' | 'pro' | 'agence';
  name: string;
  badge?: string;
  price: string;
  period: string;
  description: string;
  isPopular?: boolean;
  ctaText: string;
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
    tooltip?: string;
  }[];
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '0€',
    period: 'pour toujours',
    description: 'Idéal pour tester le générateur de mockups et analyser des pages individuelles.',
    isPopular: false,
    ctaText: 'Commencer gratuitement',
    features: [
      { name: 'Détection automatique des pages (Sitemap & DOM)', included: true },
      { name: 'Capture par section haute résolution', included: true },
      { name: 'Analyse IA des sections (labels simples)', included: true },
      {
        name: 'Avis DA Marketing (Justification & raisonnement IA)',
        included: false,
        tooltip: 'Réservé aux plans Pro et Agence',
      },
      { name: 'Export PNG sans filigrane (Watermark)', included: false },
      { name: 'Export haute résolution 4K / Studio 2x', included: false },
      { name: 'Multi-projets clients dédiés', included: false },
      { name: 'Export en marque blanche totale', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Recommandé',
    price: '19€',
    period: 'par mois',
    description: 'Pour les créateurs, designers et indépendants qui souhaitent des mockups marketing percutants.',
    isPopular: true,
    ctaText: 'Passer Pro',
    features: [
      { name: 'Détection automatique des pages (Sitemap & DOM)', included: true },
      { name: 'Capture par section haute résolution', included: true },
      { name: 'Analyse IA des sections (labels simples)', included: true },
      {
        name: 'Avis DA Marketing (Justification & raisonnement IA)',
        included: true,
        highlight: true,
        tooltip: 'Directeur Artistique IA avec justifications écrites et verdict marketing',
      },
      { name: 'Export PNG sans filigrane (Watermark)', included: true, highlight: true },
      { name: 'Export haute résolution 4K / Studio 2x', included: true },
      { name: 'Multi-projets clients dédiés', included: false },
      { name: 'Export en marque blanche totale', included: false },
    ],
  },
  {
    id: 'agence',
    name: 'Agence',
    badge: 'Équipes & Studios',
    price: '49€',
    period: 'par mois',
    description: 'Pour les agences web, studios créatifs et équipes gérant plusieurs marques et clients.',
    isPopular: false,
    ctaText: 'Passer Agence',
    features: [
      { name: 'Détection automatique des pages (Sitemap & DOM)', included: true },
      { name: 'Capture par section haute résolution', included: true },
      { name: 'Analyse IA des sections (labels simples)', included: true },
      {
        name: 'Avis DA Marketing (Justification & raisonnement IA)',
        included: true,
        highlight: true,
      },
      { name: 'Export PNG sans filigrane (Watermark)', included: true },
      { name: 'Export haute résolution 4K / Studio 2x', included: true },
      { name: 'Multi-projets clients dédiés', included: true, highlight: true },
      { name: 'Export en marque blanche totale', included: true, highlight: true },
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, profile } = useUser();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handlePlanClick = async (plan: PricingPlan) => {
    if (plan.id === 'free') {
      router.push('/');
      return;
    }

    // Si non connecté, rediriger vers /signup avec retour automatique sur /pricing
    if (!user) {
      router.push(`/signup?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    // Si l'utilisateur est déjà sur ce plan
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
        body: JSON.stringify({ plan: plan.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Impossible d’initialiser la session de paiement.');
      }

      // Redirection immédiate vers Stripe Checkout
      window.location.href = data.url;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCheckoutError(e?.message || 'Erreur lors de la redirection vers Stripe.');
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900">
      {/* Navigation supérieure */}
      <Navbar showPricingLink={false} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Fil d'ariane / retour */}
        <div className="mb-8 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sand-100 text-stone-600 hover:text-stone-900 border border-sand-200 text-xs font-medium transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l&apos;application</span>
          </Link>
        </div>

        {checkoutError && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        {/* Titre & En-tête de la page */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-xs font-semibold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Tarifs Simples & Transparents</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Des formules conçues pour booster{' '}
            <span className="text-violet-600">votre conversion</span>.
          </h1>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Créez des visuels de qualité studio sans graphiste. Bénéficiez des conseils d’un Directeur Artistique IA et exportez vos mockups en haute résolution.
          </p>
        </div>

        {/* Grille des 3 Cartes Tarifaires */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
          {PLANS.map((plan) => {
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 border ${
                  plan.isPopular
                    ? 'bg-white border-violet-500 shadow-xl shadow-violet-500/10 ring-2 ring-violet-400/30 -translate-y-1 sm:-translate-y-2'
                    : 'bg-white border-sand-200 shadow-sm hover:border-sand-300 hover:shadow-md'
                }`}
              >
                {/* Badge "Populaire / Recommandé" sur Pro */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-xs ${
                        plan.isPopular
                          ? 'bg-violet-600 text-white shadow-violet-600/30'
                          : 'bg-sand-100 text-stone-700 border border-sand-200'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div>
                  {/* Nom du plan & Description */}
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-stone-900 flex items-center gap-2">
                      {plan.name}
                      {plan.id === 'pro' && <Zap className="w-4 h-4 text-violet-600" />}
                      {plan.id === 'agence' && <Building2 className="w-4 h-4 text-stone-500" />}
                    </h3>
                    <p className="text-xs text-stone-500 min-h-[36px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Prix */}
                  <div className="my-6 pb-6 border-b border-sand-100 flex items-baseline gap-1.5">
                    <span className="text-4xl sm:text-5xl font-extrabold tracking-tight text-stone-900 font-mono">
                      {plan.price}
                    </span>
                    <span className="text-xs font-medium text-stone-500 font-sans">
                      / {plan.period}
                    </span>
                  </div>

                  {/* Liste des fonctionnalités */}
                  <div className="space-y-3.5">
                    <p className="text-xs font-bold uppercase tracking-wider text-stone-400 font-mono">
                      Inclus dans cette formule :
                    </p>

                    <ul className="space-y-3 text-xs">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          {feat.included ? (
                            <div
                              className={`p-0.5 rounded-full mt-0.5 flex-shrink-0 ${
                                feat.highlight
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            </div>
                          ) : (
                            <div className="p-0.5 rounded-full mt-0.5 flex-shrink-0 bg-sand-100 text-stone-400">
                              <XIcon className="w-3.5 h-3.5 stroke-[2]" />
                            </div>
                          )}

                          <span
                            className={`leading-tight ${
                              feat.included
                                ? feat.highlight
                                  ? 'font-semibold text-stone-900'
                                  : 'text-stone-700'
                                : 'text-stone-400 line-through opacity-75'
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
                <div className="mt-8 pt-6 border-t border-sand-100">
                  {profile?.plan === plan.id ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 bg-sand-100 text-stone-500 border border-sand-200 cursor-default"
                    >
                      <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                      <span>Formule actuelle</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePlanClick(plan)}
                      disabled={loadingPlan !== null}
                      className={`w-full py-3 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 ${
                        plan.isPopular
                          ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/20'
                          : plan.id === 'free'
                          ? 'bg-sand-100 hover:bg-sand-200 text-stone-800 border border-sand-200'
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
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Section de confiance & FAQ rapide */}
        <div className="mt-20 max-w-3xl mx-auto rounded-3xl bg-white border border-sand-200 p-8 sm:p-10 shadow-xs space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-50 text-violet-700">
              <ShieldCheck className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900">
                Garanties & Questions Fréquentes
              </h3>
              <p className="text-xs text-stone-500">
                Transparence totale, aucun engagement et résiliation à tout moment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-4 border-t border-sand-100 text-xs text-stone-600">
            <div className="space-y-1.5">
              <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
                Qu&apos;est-ce que l&apos;Avis DA Marketing ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Notre intelligence artificielle analyse l&apos;équilibre visuel de chaque section de votre site et vous explique pourquoi elle fera ou non un bon mockup publicitaire.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-violet-600" />
                Puis-je changer de forfait plus tard ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Oui, vous pouvez basculer entre Free, Pro et Agence ou résilier en un clic via votre espace compte et le portail Stripe.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
