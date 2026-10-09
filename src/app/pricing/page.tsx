'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { CurrencySwitcher } from '@/components/CurrencySwitcher';
import { useUser } from '@/context/UserContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  PLANS,
  CREDIT_PACKS,
  ORDER_BUMP,
  getPlanMonthlyPrice,
  getPlanAnnualPrice,
  getPlanMonthlyEquivalent,
  getPlanAnnualSavings,
  formatPrice,
  getCreditPackPrice,
  getOrderBumpPrice,
  Plan,
  CreditPack,
  PlanId,
  Currency,
} from '@/lib/pricing';
import { trackEvent } from '@/lib/tracking';
import {
  Check,
  X as XIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Loader2,
  AlertCircle,
  Flame,
  CheckCircle2,
  Crown,
  Percent,
  Clock,
  Smartphone,
  CreditCard,
  Globe,
  Coins,
  Video,
  Layers,
  HelpCircle,
  Zap,
} from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user, profile } = useUser();
  const { currency, setCurrency } = useCurrency();

  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'momo'>(
    currency === 'XOF' ? 'momo' : 'stripe'
  );
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // Synchronisation du moyen de paiement par défaut quand la devise change
  useEffect(() => {
    if (currency === 'XOF') {
      setPaymentMethod('momo');
    } else {
      setPaymentMethod('stripe');
    }
  }, [currency]);

  // Étape 6 : Modal Order Bump avant redirection Checkout Stripe
  const [bumpModalPlan, setBumpModalPlan] = useState<Plan | null>(null);
  const [bumpAccepted, setBumpAccepted] = useState(false);
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);

  // Étape 5 : Modal Downsell Exit-Intent sur /pricing
  const [showExitDownsell, setShowExitDownsell] = useState(false);

  // Modal Mobile Money (FedaPay)
  const [momoItem, setMomoItem] = useState<{
    id: string;
    name: string;
    amountFcfa: number;
    isSubscription: boolean;
    isCreditPack?: boolean;
    credits?: number;
  } | null>(null);
  const [momoPhoneNumber, setMomoPhoneNumber] = useState('');
  const [isMomoSubmitting, setIsMomoSubmitting] = useState(false);

  // Tracking pricing_view au chargement
  useEffect(() => {
    trackEvent('pricing_view', { is_annual_default: true });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') {
        const provider = params.get('provider');
        if (provider === 'fedapay') {
          setPaymentSuccessMessage(
            '🎉 Félicitations ! Votre paiement MTN Mobile Money Bénin a été validé avec succès. Vos fonctionnalités sont débloquées immédiatement !'
          );
        } else {
          setPaymentSuccessMessage(
            '🎉 Paiement validé avec succès ! Votre compte a été mis à niveau.'
          );
        }
      } else if (params.get('canceled') === 'true') {
        setCheckoutError('Le paiement a été annulé. Vous pouvez réessayer à tout moment.');
      }
    }
  }, []);

  // Détection exit-intent pour le Downsell (une seule fois par session)
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 10 && !sessionStorage.getItem('downsell_pricing_shown')) {
        sessionStorage.setItem('downsell_pricing_shown', 'true');
        setShowExitDownsell(true);
        trackEvent('downsell_shown', { trigger: 'exit_intent' });
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  // Déclencheur clic sur un plan d'abonnement
  const handlePlanClick = (plan: Plan) => {
    trackEvent('plan_click', { plan_id: plan.id, billing: isAnnual ? 'annual' : 'monthly' });

    if (plan.id === 'free') {
      router.push('/');
      return;
    }

    if (!user) {
      router.push(`/signup?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    if (profile?.plan === plan.id) {
      router.push('/account');
      return;
    }

    if (paymentMethod === 'momo') {
      const amount = isAnnual ? plan.annualFcfa : plan.monthlyFcfa;
      setMomoItem({
        id: plan.id,
        name: `Abonnement ${plan.name} (${isAnnual ? 'Annuel' : 'Mensuel'})`,
        amountFcfa: amount,
        isSubscription: true,
      });
      setCheckoutError(null);
      return;
    }

    // Pour Stripe : ouvrir l'étape d'Order Bump
    setBumpAccepted(false);
    setBumpModalPlan(plan);
  };

  // Exécution du checkout Stripe avec ou sans Order Bump
  const proceedStripeCheckout = async (plan: Plan, withBump: boolean) => {
    setIsSubmittingCheckout(true);
    setCheckoutError(null);
    setLoadingPlan(plan.id);

    try {
      trackEvent('checkout_start', {
        plan_id: plan.id,
        billing: isAnnual ? 'annual' : 'monthly',
        with_bump: withBump,
      });

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          billing: isAnnual ? 'annual' : 'monthly',
          withBump,
          currency: currency === 'USD' ? 'USD' : 'EUR',
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
      setIsSubmittingCheckout(false);
      setBumpModalPlan(null);
    }
  };

  // Achat d'un pack de crédits
  const handleCreditBuy = async (pack: CreditPack) => {
    trackEvent('plan_click', { pack_id: pack.id, type: 'credits' });

    if (!user) {
      router.push(`/signup?redirect=${encodeURIComponent('/pricing#credits')}`);
      return;
    }

    if (paymentMethod === 'momo') {
      setMomoItem({
        id: pack.id,
        name: `${pack.name} (${pack.credits} Crédits)`,
        amountFcfa: pack.priceFcfa,
        isSubscription: false,
        isCreditPack: true,
        credits: pack.credits,
      });
      setCheckoutError(null);
      return;
    }

    setLoadingPlan(pack.id);
    setCheckoutError(null);

    try {
      trackEvent('checkout_start', { pack_id: pack.id, type: 'credits' });

      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pack: pack.id,
          currency: currency === 'USD' ? 'USD' : 'EUR',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Erreur initialisation session crédits.');
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCheckoutError(e?.message || 'Erreur paiement crédits.');
      setLoadingPlan(null);
    }
  };

  // Validation formulaire MTN MoMo Bénin
  const handleMomoCheckout = async () => {
    if (!momoItem) return;

    const cleanedNumber = momoPhoneNumber.replace(/\s+/g, '');
    if (!cleanedNumber || cleanedNumber.length < 8) {
      setCheckoutError('Veuillez saisir un numéro de téléphone valide à 8 chiffres (sans indicatif).');
      return;
    }

    setIsMomoSubmitting(true);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/payments/fedapay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: momoItem.id,
          billingCycle: isAnnual ? 'annual' : 'monthly',
          phoneNumber: `+229${cleanedNumber}`,
          isCreditPack: momoItem.isCreditPack,
          credits: momoItem.credits,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success || !data.checkoutUrl) {
        throw new Error(data.error || 'Impossible d’initialiser le paiement MTN MoMo via FedaPay.');
      }

      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCheckoutError(e?.message || 'Erreur lors du traitement FedaPay.');
      setIsMomoSubmitting(false);
    }
  };

  // Filtrer les plans payants pour la grille principale (Solo, Pro, Agence)
  const paidPlans = PLANS.filter((p) => p.id !== 'free');

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900">
      <Navbar showPricingLink={false} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* EN-TÊTE DE PAGE */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-800 border border-violet-200 text-xs font-black tracking-wide uppercase mb-4 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Tarification Transparente & Sans Surprise</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-stone-900 tracking-tight leading-tight">
            Des mockups 3D qui convertissent.{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Le juste prix.
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
            Exports 4K sans filigrane, vidéo animée et kit IA. Choisissez l&apos;abonnement adapté à votre rythme ou achetez vos crédits à la carte.
          </p>
        </div>

        {/* NOTIFICATIONS & MESSAGES */}
        {paymentSuccessMessage && (
          <div className="max-w-3xl mx-auto mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{paymentSuccessMessage}</p>
              <div className="mt-2">
                <Link href="/" className="inline-flex items-center gap-1 font-bold text-emerald-700 underline">
                  Lancer le studio et exporter dès maintenant →
                </Link>
              </div>
            </div>
          </div>
        )}

        {checkoutError && (
          <div className="max-w-3xl mx-auto mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{checkoutError}</p>
          </div>
        )}

        {/* SÉLECTEUR DE MOYEN DE PAIEMENT, DEVISE & TOGGLE ANNUEL/MENSUEL */}
        <div className="max-w-5xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-sand-200 shadow-sm">
          {/* Moyen de paiement adapté à la devise */}
          <div className="flex items-center gap-1 p-1 bg-sand-100 rounded-2xl border border-sand-200 w-full md:w-auto">
            {currency === 'XOF' ? (
              <>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('momo')}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                    paymentMethod === 'momo'
                      ? 'bg-amber-400 text-stone-950 shadow-xs font-black'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-stone-950" />
                  <span>Mobile Money (FedaPay)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                    paymentMethod === 'stripe'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-violet-600" />
                  <span>Carte bancaire (Stripe)</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('stripe')}
                  className={`flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold transition-all ${
                    paymentMethod === 'stripe'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-violet-600" />
                  <span>Carte bancaire (Stripe)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrency('XOF');
                    setPaymentMethod('momo');
                  }}
                  className="flex-1 md:flex-initial flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 transition-all"
                  title="Bascule vers la facturation en FCFA et Mobile Money"
                >
                  <Smartphone className="w-4 h-4 text-stone-600" />
                  <span>Mobile Money (FCFA)</span>
                </button>
              </>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
            {/* Sélecteur de devise */}
            <CurrencySwitcher />

            {/* Toggle Facturation Annuel / Mensuel (Annuel par défaut avec 2 mois offerts) */}
            <div className="flex items-center gap-3">
              <span
                onClick={() => setIsAnnual(false)}
                className={`text-xs font-bold cursor-pointer transition-colors ${
                  !isAnnual ? 'text-stone-900 font-extrabold' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                Mensuel
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={isAnnual}
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-violet-600 focus:ring-offset-2 ${
                  isAnnual ? 'bg-violet-600' : 'bg-stone-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isAnnual ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>

              <span
                onClick={() => setIsAnnual(true)}
                className={`text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-colors ${
                  isAnnual ? 'text-violet-900 font-extrabold' : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <span>Annuel</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-black tracking-wide shadow-2xs">
                  2 mois offerts (-17 %)
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* GRILLE DES 3 PLANS PAYANTS (Solo, Pro ⭐, Agence) — EFFET LEURRE POPCORN */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16 items-stretch">
          {paidPlans.map((plan) => {
            const isTarget = plan.isPopular; // Pro
            const isAnchor = plan.isAnchor;  // Agence

            const monthlyPrice = getPlanMonthlyPrice(plan, currency);
            const annualPrice = getPlanAnnualPrice(plan, currency);
            const eq = getPlanMonthlyEquivalent(plan, currency);
            const savings = getPlanAnnualSavings(plan, currency);

            const displayPrice = isAnnual ? eq : monthlyPrice;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isTarget
                    ? 'bg-white border-2 border-violet-600 shadow-xl shadow-violet-500/10 lg:-translate-y-2 lg:scale-[1.02] z-10'
                    : 'bg-white/80 border border-sand-200 shadow-md hover:border-violet-300 hover:shadow-lg'
                }`}
              >
                {/* Badge supérieur */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1.5 ${
                        isTarget
                          ? 'bg-violet-600 text-white shadow-violet-500/30 ring-2 ring-violet-400/40'
                          : 'bg-stone-900 text-white'
                      }`}
                    >
                      {isTarget && <Flame className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />}
                      {isAnchor && <Crown className="w-3.5 h-3.5 text-amber-300" />}
                      <span>{plan.badge}</span>
                    </span>
                  </div>
                )}

                <div>
                  {/* Titre et description */}
                  <div className="mb-6 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                        {plan.name}
                      </h3>
                      {isTarget && (
                        <span className="text-[11px] font-bold text-violet-600 bg-violet-50 px-2.5 py-0.5 rounded-full border border-violet-200">
                          Pack Cible
                        </span>
                      )}
                      {isAnchor && (
                        <span className="text-[11px] font-bold text-stone-600 bg-sand-100 px-2.5 py-0.5 rounded-full border border-sand-300">
                          Sans Limite
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-2 leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Prix — Une seule devise affichée */}
                  <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 mb-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl sm:text-5xl font-black text-stone-950 font-mono tracking-tight">
                        {formatPrice(displayPrice, currency, false)}
                      </span>
                      <span className="text-xs text-stone-500 font-semibold">
                        {currency === 'EUR' ? '€ / mois' : currency === 'USD' ? '$ / mois' : 'FCFA / mois'}
                      </span>
                    </div>

                    {/* Économie annuelle ou facturation */}
                    <div className="mt-2 text-[11px] font-semibold text-stone-600 flex flex-col gap-0.5">
                      {isAnnual ? (
                        <>
                          <span className="text-emerald-700 font-bold">
                            Facturé {formatPrice(annualPrice, currency)} / an (2 mois offerts)
                          </span>
                          <span className="text-stone-400">
                            Économie : {formatPrice(savings, currency)} par an
                          </span>
                        </>
                      ) : (
                        <span className="text-stone-500">
                          Facturation mensuelle sans engagement
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Liste des fonctionnalités — Éléments non inclus avec ✕ et texte barré bien visibles */}
                  <ul className="space-y-2.5 text-xs">
                    {plan.features.map((feat, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2.5 ${
                          feat.included ? 'text-stone-800' : 'text-stone-400 line-through opacity-75'
                        }`}
                      >
                        {feat.included ? (
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              feat.highlight ? 'text-violet-600 stroke-[2.5]' : 'text-stone-600'
                            }`}
                          />
                        ) : (
                          <XIcon className="w-4 h-4 shrink-0 mt-0.5 text-stone-400 stroke-[2]" />
                        )}
                        <span className={feat.highlight ? 'font-bold text-stone-900' : ''}>
                          {feat.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bouton CTA */}
                <div className="mt-8 pt-4 border-t border-sand-200">
                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 ${
                      paymentMethod === 'momo'
                        ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 border-2 border-stone-950 font-black'
                        : isTarget
                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/30'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-current" />
                        <span>Redirection sécurisée...</span>
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

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* BANDEAU PLAN DÉCOUVERTE (FREE) */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-4xl mx-auto mb-16 p-6 rounded-3xl bg-white border border-sand-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="font-extrabold text-sm text-stone-900">Vous débutez ? Essayez le plan Découverte</span>
              <span className="text-[10px] bg-sand-100 text-stone-700 px-2 py-0.5 rounded-full font-bold">100% Gratuit</span>
            </div>
            <p className="text-xs text-stone-500">
              3 exports PNG par jour (1x), filigrane discret, studio complet sans carte bancaire requise.
            </p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-bold border border-sand-300 transition-colors shrink-0"
          >
            Ouvrir le Studio Gratuit
          </Link>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION CRÉDITS À LA CARTE (PAY-PER-USE / STRATÉGIE POPCORN) */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div id="credits" className="max-w-6xl mx-auto mb-16 p-6 sm:p-10 rounded-3xl bg-white border border-sand-200 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 text-amber-950 text-xs font-black mb-2 border border-amber-200">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>Stratégie Popcorn — Pas d&apos;abonnement, payez à l&apos;usage</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-stone-900">
                Packs de Crédits à la Carte (Pay-per-use)
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
                Besoin ponctuel pour un pitch client ou une release ? Achetez des crédits valables à vie sans aucun abonnement récurrent.
              </p>
            </div>

            <div className="text-xs text-stone-600 bg-sand-50 px-3.5 py-2 rounded-xl border border-sand-200 shrink-0">
              💡 <strong>Crédits à vie :</strong> vos crédits n&apos;expirent jamais.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CREDIT_PACKS.map((pack) => {
              const isTargetPack = pack.isTarget;
              const packPrice = getCreditPackPrice(pack, currency);
              const priceDisplay = formatPrice(packPrice, currency);
              const perCredit = packPrice / pack.credits;
              const perCreditDisplay = `${formatPrice(perCredit, currency)} / crédit`;

              return (
                <div
                  key={pack.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                    isTargetPack
                      ? 'bg-violet-50/50 border-2 border-violet-600 shadow-md relative'
                      : 'bg-sand-50/50 border-sand-200 hover:bg-white hover:border-violet-300'
                  }`}
                >
                  {pack.badge && (
                    <div className="mb-2">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isTargetPack
                            ? 'bg-violet-600 text-white'
                            : 'bg-stone-200 text-stone-800'
                        }`}
                      >
                        {pack.badge}
                      </span>
                    </div>
                  )}

                  <div>
                    <h3 className="text-lg font-black text-stone-900">{pack.name}</h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-black text-stone-950 font-mono">
                        {priceDisplay}
                      </span>
                      <span className="text-xs font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md">
                        {pack.credits} crédits
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-stone-500 mt-1">
                      Soit seulement {perCreditDisplay}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-sand-200 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">Paiement unique</span>
                    <button
                      type="button"
                      onClick={() => handleCreditBuy(pack)}
                      disabled={loadingPlan !== null}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                        isTargetPack
                          ? 'bg-violet-600 hover:bg-violet-700 text-white'
                          : 'bg-stone-900 hover:bg-stone-800 text-white'
                      }`}
                    >
                      <span>Acheter ce pack</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grille du coût des crédits */}
          <div className="mt-8 pt-6 border-t border-sand-200">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-3">
              Coût en crédits par action dans le studio :
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-center">
                <div className="font-bold text-stone-900">1 Crédit</div>
                <div className="text-[11px] text-stone-500 mt-0.5">PNG HD 2x sans filigrane</div>
              </div>
              <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-center">
                <div className="font-bold text-stone-900">2 Crédits</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Export 4K Retina</div>
              </div>
              <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-center">
                <div className="font-bold text-stone-900">3 Crédits</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Vidéo MP4 60fps</div>
              </div>
              <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-center">
                <div className="font-bold text-stone-900">4 Crédits</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Pack 5 Ratios en 1-clic</div>
              </div>
              <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-center">
                <div className="font-bold text-stone-900">2 Crédits</div>
                <div className="text-[11px] text-stone-500 mt-0.5">IA Pitch Kit</div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TABLEAU COMPARATIF COMPLET DES PLANS */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto mb-16 rounded-3xl bg-white border border-sand-200 p-6 sm:p-10 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-black text-stone-900 mb-6 text-center">
            Tableau Comparatif Détaillé des Fonctionnalités
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-sand-200">
                  <th className="py-3 px-4 font-bold text-stone-500 uppercase tracking-wider">Fonctionnalité</th>
                  <th className="py-3 px-4 font-bold text-stone-600 text-center">
                    Découverte ({formatPrice(0, currency)})
                  </th>
                  <th className="py-3 px-4 font-bold text-stone-900 text-center">
                    Solo ({formatPrice(getPlanMonthlyPrice(PLANS[1], currency), currency)})
                  </th>
                  <th className="py-3 px-4 font-bold text-violet-700 text-center bg-violet-50/80 rounded-t-xl">
                    Pro ({formatPrice(getPlanMonthlyPrice(PLANS[2], currency), currency)}) ⭐
                  </th>
                  <th className="py-3 px-4 font-bold text-stone-900 text-center">
                    Agence ({formatPrice(getPlanMonthlyPrice(PLANS[3], currency), currency)})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Exports PNG HD 2x</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">1x uniquement (3/j)</td>
                  <td className="py-3.5 px-4 text-center font-bold text-stone-900">20 / mois</td>
                  <td className="py-3.5 px-4 text-center font-bold text-violet-700 bg-violet-50/50">Illimité</td>
                  <td className="py-3.5 px-4 text-center font-bold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Filigrane</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">Oui</td>
                  <td className="py-3.5 px-4 text-center text-stone-600">Discret</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600 bg-violet-50/50">ZÉRO filigrane</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600">ZÉRO filigrane</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Exports 4K Retina</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-violet-700 bg-violet-50/50">Illimité</td>
                  <td className="py-3.5 px-4 text-center font-bold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Export Vidéo animée MP4</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-violet-700 bg-violet-50/50">10 / mois</td>
                  <td className="py-3.5 px-4 text-center font-bold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Analyses IA Directeur Artistique</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">3 / mois</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">3 / mois</td>
                  <td className="py-3.5 px-4 text-center font-bold text-violet-700 bg-violet-50/50">Illimité</td>
                  <td className="py-3.5 px-4 text-center font-bold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">IA Pitch Kit</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-violet-700 bg-violet-50/50">5 / mois</td>
                  <td className="py-3.5 px-4 text-center font-bold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Marque Blanche (White Label)</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center text-stone-300 bg-violet-50/50">—</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600">Inclus</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Sièges collaborateurs</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">1</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">1</td>
                  <td className="py-3.5 px-4 text-center text-stone-500 bg-violet-50/50">1</td>
                  <td className="py-3.5 px-4 text-center font-bold text-stone-900">5 sièges</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Support prioritaire</td>
                  <td className="py-3.5 px-4 text-center text-stone-400">Communautaire</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">Email</td>
                  <td className="py-3.5 px-4 text-center font-bold text-violet-700 bg-violet-50/50">Email 24h</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-600">WhatsApp 7j/7</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION GARANTIE & FAQ MISE À JOUR */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-sand-200 p-8 sm:p-10 shadow-xs space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-violet-100 text-violet-700">
              <ShieldCheck className="w-7 h-7 text-violet-600" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-stone-900">
                Garantie Qualité & Questions Fréquentes
              </h3>
              <p className="text-xs text-stone-500">
                Tout ce que vous devez savoir sur le paiement, les devises et les exports.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-sand-100 text-xs text-stone-600">
            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                Quels sont les moyens de paiement acceptés selon ma région ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                <strong>International (Europe, États-Unis, Canada &amp; reste du monde) :</strong> Carte bancaire Visa, Mastercard, American Express via Stripe sécurisé 3D Secure.<br />
                <strong>Bénin &amp; Afrique de l&apos;Ouest (zone FCFA / UEMOA) :</strong> MTN Mobile Money, Moov Money et Wave via FedaPay avec validation PIN sur votre mobile. La carte bancaire internationale reste également disponible.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                Comment changer la devise d&apos;affichage (€, $, FCFA) ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                OmniMockup détecte automatiquement votre région mais vous pouvez basculer à tout moment entre EUR (€), USD ($) et FCFA grâce au sélecteur en haut de page ou dans le pied de page. Votre choix est sauvegardé pour vos prochaines visites.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                Les crédits à la carte expirent-ils ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Non ! Les crédits achetés à la carte restent disponibles sur votre compte indéfiniment. Utilisez-les à votre propre rythme pour vos livraisons clients.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                Puis-je résilier mon abonnement à tout moment ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Absolument. Aucun engagement de durée : vous pouvez suspendre ou résilier votre abonnement en un clic depuis votre espace compte. Vous conservez vos accès jusqu&apos;à la fin de la période facturée.
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* MODAL ÉTAPE 6 : ORDER BUMP AU PAIEMENT (KIT IA PITCH) */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {bumpModalPlan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-sand-300 relative space-y-5 animate-scale-up">
              <button
                type="button"
                onClick={() => setBumpModalPlan(null)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-sand-100 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 text-[10px] font-black uppercase">
                  Offre exclusive de paiement
                </div>
                <h3 className="text-lg font-black text-stone-900">
                  Souscription : OmniMockup {bumpModalPlan.name}
                </h3>
                <p className="text-xs text-stone-500">
                  {isAnnual ? 'Facturation annuelle' : 'Facturation mensuelle'} — Paiement sécurisé via Stripe
                </p>
              </div>

              {/* Box Order Bump avec case à cocher */}
              <div
                onClick={() => {
                  const nextState = !bumpAccepted;
                  setBumpAccepted(nextState);
                  if (nextState) {
                    trackEvent('bump_accepted', { plan_id: bumpModalPlan.id });
                  }
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  bumpAccepted
                    ? 'border-violet-600 bg-violet-50/70 shadow-sm'
                    : 'border-sand-300 bg-sand-50/50 hover:border-violet-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={bumpAccepted}
                    onChange={(e) => {
                      setBumpAccepted(e.target.checked);
                      if (e.target.checked) {
                        trackEvent('bump_accepted', { plan_id: bumpModalPlan.id });
                      }
                    }}
                    className="mt-1 w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        {ORDER_BUMP.name}
                      </span>
                      <span className="text-xs font-black text-violet-700 font-mono">
                        +{formatPrice(getOrderBumpPrice(currency), currency)}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {ORDER_BUMP.description} (+10 crédits équivalents crédités immédiatement).
                    </p>
                  </div>
                </div>
              </div>

              {/* Bouton de confirmation */}
              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => proceedStripeCheckout(bumpModalPlan, bumpAccepted)}
                  disabled={isSubmittingCheckout}
                  className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmittingCheckout ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Redirection vers Stripe...</span>
                    </>
                  ) : (
                    <>
                      <span>Continuer vers le paiement sécurisé</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setBumpModalPlan(null)}
                  disabled={isSubmittingCheckout}
                  className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* MODAL ÉTAPE 5 : DOWNSELL EXIT-INTENT (PROPOSER PRO FACE À AGENCE) */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {showExitDownsell && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-sand-300 relative space-y-5 animate-scale-up text-center">
              <button
                type="button"
                onClick={() => setShowExitDownsell(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-sand-100 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-700 mx-auto flex items-center justify-center font-bold">
                <Flame className="w-6 h-6 text-violet-600 fill-violet-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-stone-900">
                  Vous hésitez sur le plan Agence ?
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Le forfait <strong>Pro</strong> vous offre déjà les exports HD/4K <strong>illimités</strong>, <strong>zéro filigrane</strong> et 10 vidéos par mois pour seulement <strong>{formatPrice(getPlanMonthlyPrice(PLANS[2], currency), currency)}/mois</strong> (ou {formatPrice(getPlanMonthlyEquivalent(PLANS[2], currency), currency)} en annuel) !
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    trackEvent('downsell_accepted', { offer: 'pro_exit_downsell' });
                    setShowExitDownsell(false);
                    const proPlan = PLANS.find((p) => p.id === 'pro');
                    if (proPlan) handlePlanClick(proPlan);
                  }}
                  className="w-full py-3.5 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <span>Passer au Pro ({formatPrice(getPlanMonthlyPrice(PLANS[2], currency), currency)}/mois)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setShowExitDownsell(false)}
                  className="w-full py-2 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors"
                >
                  Non merci, je continue de regarder
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* MODAL PAIEMENT MTN MOBILE MONEY BÉNIN / AFRIQUE (FEDAPAY) */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {momoItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-sand-300 relative space-y-5 animate-scale-up">
              <button
                type="button"
                onClick={() => {
                  setMomoItem(null);
                  setIsMomoSubmitting(false);
                }}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-sand-100 transition-colors"
              >
                <XIcon className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 text-stone-950 flex items-center justify-center font-black text-xl shadow-md border-2 border-stone-950">
                  MoMo
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🇧🇯</span>
                    <h3 className="font-black text-stone-900 text-base sm:text-lg">
                      Paiement MTN MoMo Bénin
                    </h3>
                  </div>
                  <p className="text-xs text-stone-500">
                    Règlement : <strong>{momoItem.name}</strong>
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-amber-900">
                    Montant total à régler
                  </p>
                  <p className="text-xs text-stone-600 mt-0.5">
                    {momoItem.isSubscription
                      ? isAnnual
                        ? 'Facturation annuelle (2 mois offerts)'
                        : 'Facturation mensuelle'
                      : 'Achat unique sans engagement'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-stone-950 font-mono">
                    {momoItem.amountFcfa.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-xs font-bold text-stone-700 ml-1">FCFA</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-800">
                  Votre Numéro de Téléphone MTN Mobile Money :
                </label>
                <div className="flex rounded-xl border border-sand-300 focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/40 overflow-hidden shadow-2xs">
                  <span className="inline-flex items-center px-3.5 bg-sand-100 text-stone-700 text-xs font-bold border-r border-sand-300 select-none">
                    🇧🇯 +229
                  </span>
                  <input
                    type="tel"
                    value={momoPhoneNumber}
                    onChange={(e) => setMomoPhoneNumber(e.target.value)}
                    placeholder="97 00 00 00"
                    className="flex-1 px-3.5 py-2.5 text-sm font-mono text-stone-900 focus:outline-none"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  💡 Indiquez votre numéro MTN Bénin. Une notification sécurisée sera immédiatement envoyée sur votre téléphone pour valider avec votre code PIN.
                </p>
              </div>

              {checkoutError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{checkoutError}</span>
                </div>
              )}

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={handleMomoCheckout}
                  disabled={isMomoSubmitting}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.99] border-2 border-stone-950"
                >
                  {isMomoSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-stone-950" />
                      <span>Connexion à MTN Mobile Money...</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4 text-stone-950" />
                      <span>Valider & Débiter sur mon MoMo</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setMomoItem(null)}
                  disabled={isMomoSubmitting}
                  className="w-full py-2.5 text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
