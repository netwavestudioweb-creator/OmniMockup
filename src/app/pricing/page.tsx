'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PaymentResultPanel, type PaymentResult } from '@/components/PaymentResultPanel';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useUser } from '@/context/UserContext';
import { useCurrency } from '@/context/CurrencyContext';
import {
  PLANS,
  CREDIT_PACKS,
  getPlanMonthlyPrice,
  getPlanAnnualPrice,
  formatPrice,
  getCreditPackPrice,
  getLoyaltyMonthlyFcfa,
  getLoyaltyFloorFcfa,
  AI_KEY_PROVIDERS,
  Plan,
  CreditPack,
} from '@/lib/pricing';
import { trackEvent } from '@/lib/tracking';
import { checkoutPath, parsePendingCheckout } from '@/lib/pendingCheckout';
import { CARD_PROVIDER, cardPaymentsEnabled } from '@/lib/paymentConfig';
import { MOBILE_MONEY_SHORT } from '@/lib/paymentMethods';
import { PaymentMethodsNote, PaymentCountriesList } from '@/components/PaymentMethodsNote';
import {
  Check,
  X as XIcon,
  ArrowRight,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Clock,
  Smartphone,
  CreditCard,
  Globe,
  Coins,
} from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const { user, profile, isLoading: userLoading } = useUser();
  const { currency, mobileMoneyRegion } = useCurrency();

  // Mobile Money (SasPay, en FCFA) toujours disponible. La carte bancaire se branche avec
  // NEXT_PUBLIC_CARD_PROVIDER (saspay ou stripe) ; sans ce réglage, son bouton reste grisé (« Bientôt »).
  const [method, setMethod] = useState<'mobile' | 'card'>('mobile');
  useEffect(() => {
    // Hors Afrique de l'Ouest et du Centre, la carte est proposée en premier quand elle est active
    if (cardPaymentsEnabled && !mobileMoneyRegion) setMethod('card');
  }, [mobileMoneyRegion]);
  const useStripe = method === 'card' && CARD_PROVIDER === 'stripe';
  const paymentMethod: 'stripe' | 'saspay' = useStripe ? 'stripe' : 'saspay';
  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);

  // Fidélité : baisses déjà acquises par le client connecté (prix du prochain mois)
  const [loyaltySteps, setLoyaltySteps] = useState<Record<string, number> | null>(null);
  useEffect(() => {
    if (!user) {
      setLoyaltySteps(null);
      return;
    }
    fetch('/api/payments/saspay/loyalty', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setLoyaltySteps(d?.steps || null))
      .catch(() => setLoyaltySteps(null));
  }, [user]);

  // Tracking pricing_view au chargement
  useEffect(() => {
    trackEvent('pricing_view', { is_annual_default: false });

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('success') === 'true') setPaymentResult('success');
      else if (params.get('canceled') === 'true') setPaymentResult('canceled');
      else if (params.get('failed') === 'true') setPaymentResult('failed');
      else if (params.get('expired') === 'true') setPaymentResult('expired');
      else if (params.get('pending') === 'true') setPaymentResult('pending');
      else if (params.get('error') === 'verification_failed') setPaymentResult('verification');
    }
  }, []);

  // Déclencheur clic sur un plan d'abonnement
  const handlePlanClick = (plan: Plan, billingChoice?: 'monthly' | 'annual') => {
    const billing = billingChoice || (isAnnual ? 'annual' : 'monthly');
    trackEvent('plan_click', { plan_id: plan.id, billing });

    if (plan.id === 'free') {
      router.push('/');
      return;
    }

    if (!user) {
      // Le forfait choisi suit l'inscription : /pricing ouvre ensuite directement son paiement
      router.push(`/signup?redirect=${encodeURIComponent(checkoutPath(plan.id, billing))}`);
      return;
    }

    // Même plan déjà actif : on renvoie vers le compte, sauf pour un plan payé
    // en une fois (SasPay), qu'on peut prolonger.
    if (profile?.plan === plan.id && !profile?.plan_expires_at) {
      router.push('/account');
      return;
    }

    if (useStripe) {
      startStripeCheckout({ plan: plan.id, billing }, plan.id);
      return;
    }
    startSaspayCheckout(plan.id, billing);
  };

  // Carte par Stripe (euros ou dollars) : redirection vers la page de paiement Stripe
  const startStripeCheckout = async (
    payload: { plan?: string; billing?: 'monthly' | 'annual'; pack?: string },
    itemId: string
  ) => {
    setCheckoutError(null);
    setLoadingPlan(itemId);
    try {
      trackEvent('checkout_start', { item_id: itemId, provider: 'stripe', billing: payload.billing });
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, currency: currency === 'USD' ? 'USD' : 'EUR' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Impossible de lancer le paiement par carte.');
      }
      window.location.href = data.url;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCheckoutError(e?.message || 'Erreur lors de la redirection vers la page de paiement.');
      setLoadingPlan(null);
    }
  };

  // Paiement SasPay (Mobile Money ou carte, en FCFA) : redirection vers la page hébergée
  const startSaspayCheckout = async (itemId: string, billingCycle?: 'monthly' | 'annual') => {
    setCheckoutError(null);
    setLoadingPlan(itemId);

    try {
      trackEvent('checkout_start', { item_id: itemId, provider: 'saspay', method, billing: billingCycle });

      const res = await fetch('/api/payments/saspay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item: itemId, billingCycle }),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.checkoutUrl) {
        throw new Error(data.error || 'Impossible de lancer le paiement.');
      }

      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCheckoutError(e?.message || 'Erreur lors de la redirection vers SasPay.');
      setLoadingPlan(null);
    }
  };

  // Achat d'un pack de crédits
  const handleCreditBuy = async (pack: CreditPack) => {
    trackEvent('plan_click', { pack_id: pack.id, type: 'credits' });

    if (!user) {
      router.push(`/signup?redirect=${encodeURIComponent(checkoutPath(pack.id))}`);
      return;
    }

    if (useStripe) {
      startStripeCheckout({ pack: pack.id }, pack.id);
      return;
    }
    startSaspayCheckout(pack.id);
  };

  // Prix du tableau comparatif : le même que sur les cartes, pour la durée choisie
  const tablePrice = (plan: Plan) =>
    useStripe
      ? `${formatPrice(isAnnual ? getPlanAnnualPrice(plan, currency) : getPlanMonthlyPrice(plan, currency), currency)} ${isAnnual ? 'par an' : 'par mois'}`
      : `${formatPrice(isAnnual ? plan.annualFcfa : plan.monthlyFcfa, 'XOF')} ${isAnnual ? 'par an' : 'par mois'}`;

  // Retour d'inscription ou de connexion avec un achat choisi (?checkout=…) : le paiement s'ouvre tout seul, une fois
  const resumedCheckout = useRef(false);
  useEffect(() => {
    if (userLoading || !user || resumedCheckout.current) return;
    const params = new URLSearchParams(window.location.search);
    const pending = parsePendingCheckout(params.get('checkout'), params.get('billing'));
    if (!pending) return;
    resumedCheckout.current = true;
    window.history.replaceState(null, '', '/pricing');
    const plan = PLANS.find((p) => p.id === pending.id);
    if (plan) {
      setIsAnnual(pending.billing === 'annual');
      handlePlanClick(plan, pending.billing);
      return;
    }
    const pack = CREDIT_PACKS.find((p) => p.id === pending.id);
    if (pack) handleCreditBuy(pack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]);

  // Filtrer les plans payants pour la grille principale (Solo, Pro, Agence)
  const paidPlans = PLANS.filter((p) => p.id !== 'free');

  return (
    <div className="min-h-screen bg-pms-surface text-stone-900 flex flex-col selection:bg-pms-accent-tint selection:text-pms-accent">
      <Navbar showPricingLink={false} />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* EN-TÊTE DE PAGE */}
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
          <h1 className="text-3xl sm:text-5xl font-normal text-pms-ink tracking-[-0.02em] leading-tight">
            Des visuels qui font signer, au juste prix
          </h1>

          <p className="mt-4 text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
            Exports 4K sans filigrane, vidéos et GIF animés, Pitch IA. Choisissez l&apos;abonnement adapté à votre rythme ou achetez vos crédits à la carte.
          </p>
        </div>

        {/* NOTIFICATIONS & MESSAGES */}
        {paymentResult && (
          <PaymentResultPanel
            result={paymentResult}
            paymentMethod={paymentMethod}
            onRetry={() => {
              setPaymentResult(null);
              document.getElementById('formules')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            onSwitchMethod={
              cardPaymentsEnabled
                ? () => {
                    setMethod((m) => (m === 'card' ? 'mobile' : 'card'));
                    setPaymentResult(null);
                    document.getElementById('formules')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                : undefined
            }
            onClose={() => setPaymentResult(null)}
          />
        )}

        {checkoutError && (
          <div className="max-w-3xl mx-auto mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3 shadow-sm animate-shake">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <p className="flex-1 font-medium">{checkoutError}</p>
          </div>
        )}

        {/* SÉLECTEUR DE MOYEN DE PAIEMENT, DEVISE & TOGGLE ANNUEL/MENSUEL */}
        <div className="max-w-5xl mx-auto mb-10 flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl bg-white border border-pms-line shadow-sm">
          {/* Moyen de paiement : Mobile Money, carte bancaire (grisée tant qu'elle n'est pas activée) */}
          <div className="flex flex-col items-center md:items-start gap-1.5 w-full md:w-auto md:max-w-md">
            <div className="flex items-center gap-1 p-1 bg-pms-surface rounded-2xl border border-pms-line w-full md:w-auto" role="radiogroup" aria-label="Moyen de paiement">
              <button
                type="button"
                role="radio"
                aria-checked={method === 'mobile'}
                onClick={() => setMethod('mobile')}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl text-xs font-semibold transition-all ${
                  method === 'mobile' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Smartphone className="w-4 h-4 text-pms-ink" />
                <span className="whitespace-nowrap">Mobile Money</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={method === 'card'}
                aria-disabled={!cardPaymentsEnabled}
                disabled={!cardPaymentsEnabled}
                onClick={() => setMethod('card')}
                title={cardPaymentsEnabled ? undefined : 'Paiement par carte bientôt disponible'}
                className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-2 px-2.5 sm:px-3.5 rounded-xl text-xs font-semibold transition-all ${
                  !cardPaymentsEnabled
                    ? 'text-stone-400 cursor-not-allowed'
                    : method === 'card'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CreditCard className={`w-4 h-4 ${cardPaymentsEnabled ? 'text-pms-accent' : 'text-stone-400'}`} />
                <span className="whitespace-nowrap">Carte bancaire</span>
                {!cardPaymentsEnabled && (
                  <span className="px-1.5 py-0.5 rounded-md bg-stone-200 text-stone-500 text-[9px] font-semibold">
                    Bientôt
                  </span>
                )}
              </button>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed text-center md:text-left">
              {method === 'mobile'
                ? `Via SasPay, en FCFA : ${MOBILE_MONEY_SHORT} selon votre pays. Paiement unique pour 1 mois ou 1 an, sans renouvellement automatique.`
                : CARD_PROVIDER === 'stripe'
                  ? `Visa, Mastercard ou American Express via Stripe, débitée en ${currency === 'USD' ? 'dollars' : 'euros'}. Abonnement résiliable à tout moment depuis votre compte.`
                  : 'Visa ou Mastercard via SasPay : choisissez « Carte » sur la page de paiement. Paiement unique pour 1 mois ou 1 an, sans renouvellement automatique.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 w-full md:w-auto">
            {/* Devise détectée automatiquement selon le pays (pas de sélecteur, choix de Dodo) */}
            {/* Toggle Facturation Annuel / Mensuel (Annuel par défaut : le prix le plus bas) */}
            <div className="flex items-center gap-3">
              <span
                onClick={() => setIsAnnual(false)}
                className={`text-xs font-semibold cursor-pointer transition-colors ${
                  !isAnnual ? 'text-stone-900 font-semibold' : 'text-stone-500 hover:text-stone-600'
                }`}
              >
                Mensuel
              </span>

              <button
                type="button"
                role="switch"
                aria-checked={isAnnual}
                aria-label="Paiement annuel"
                onClick={() => setIsAnnual(!isAnnual)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pms-accent focus:ring-offset-2 ${
                  isAnnual ? 'bg-pms-accent' : 'bg-stone-300'
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
                className={`text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-colors ${
                  isAnnual ? 'text-pms-accent font-semibold' : 'text-stone-500 hover:text-stone-600'
                }`}
              >
                <span>Annuel</span>
                <span className="text-stone-500 font-normal">(prix le plus bas)</span>
              </span>
            </div>
          </div>
        </div>
        {method === 'mobile' && <PaymentCountriesList className="max-w-5xl mx-auto -mt-6 mb-10 px-1" />}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* GRILLE DES 3 PLANS PAYANTS (Solo, Pro ⭐, Agence) — EFFET LEURRE POPCORN */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div id="formules" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-16 items-stretch">
          {paidPlans.map((plan) => {
            const isTarget = plan.isPopular; // Pro

            const monthlyPrice = getPlanMonthlyPrice(plan, currency);
            const annualPrice = getPlanAnnualPrice(plan, currency);

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 ${
                  isTarget
                    ? 'bg-white border-2 border-pms-accent shadow-xl lg:-translate-y-2 lg:scale-[1.02] z-10'
                    : 'bg-white/80 border border-pms-line shadow-md hover:border-pms-accent hover:shadow-lg'
                }`}
              >
                <div>
                  {/* Titre et description */}
                  <div className="mb-6 pt-2">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl sm:text-2xl font-semibold text-pms-ink tracking-tight">
                        {plan.name}
                      </h2>
                      {isTarget && <span className="text-[15px] text-pms-accent">recommandé</span>}
                    </div>
                    <p className="text-xs text-stone-500 mt-2 leading-relaxed min-h-[36px]">
                      {plan.description}
                    </p>
                  </div>

                  {/* Prix : le montant payé par Mobile Money (FCFA) en premier, l'euro ou le dollar en petit */}
                  <div className="p-4 rounded-2xl bg-pms-surface border border-pms-line/80 mb-6">
                    {(() => {
                      const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;
                      const otherPrice = isAnnual ? annualPrice : monthlyPrice;
                      if (useStripe) {
                        return (
                          <>
                            <div className="flex items-baseline gap-1.5 flex-wrap">
                              <span className="text-3xl sm:text-4xl font-semibold text-stone-950 tracking-tight tabular-nums">{formatPrice(otherPrice, currency)}</span>
                              <span className="text-sm text-stone-500 font-semibold">{isAnnual ? 'par an' : 'par mois'}</span>
                            </div>
                            <p className="mt-1 text-[13px] text-stone-500">Abonnement par carte, résiliable à tout moment depuis votre compte.</p>
                          </>
                        );
                      }
                      const step = loyaltySteps?.[plan.id] || 0;
                      const monthFcfa = getLoyaltyMonthlyFcfa(plan, step);
                      return (
                        <>
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-3xl sm:text-4xl font-semibold text-stone-950 tracking-tight tabular-nums whitespace-nowrap">
                              {fcfa(isAnnual ? plan.annualFcfa : monthFcfa)}
                            </span>
                            <span className="text-sm text-stone-500 font-semibold">{isAnnual ? 'pour 1 an' : 'par mois'}</span>
                          </div>
                          {!isAnnual && step > 0 && (
                            <p className="mt-1 text-[13px] text-stone-600">
                              Au lieu de <s>{fcfa(plan.monthlyFcfa)}</s> : votre prix fidélité ({step + 1}e mois d’affilée).
                            </p>
                          )}
                          <p className="mt-1 text-[13px] text-stone-500">
                            Soit {formatPrice(otherPrice, currency)}
                            {isAnnual && `, ou ${fcfa(Math.round(plan.annualFcfa / 12))} par mois`}
                          </p>
                          <p className="mt-1 text-[13px] text-stone-600">
                            {isAnnual ? `Au mois : ${fcfa(plan.monthlyFcfa)}, puis ` : 'Puis '}
                            {fcfa(plan.loyaltyStepFcfa)} de moins chaque mois payé d’affilée, jusqu’à {fcfa(getLoyaltyFloorFcfa(plan))}.
                          </p>
                          <p className="mt-1 text-[13px] text-stone-500">
                            {isAnnual ? '1 an' : '1 mois'}, sans engagement ni renouvellement automatique.
                          </p>
                        </>
                      );
                    })()}
                  </div>

                  {/* Liste des fonctionnalités — Éléments non inclus avec ✕ et texte barré bien visibles */}
                  <ul className="space-y-2.5 text-xs">
                    {plan.features.filter((feat) => feat.included).map((feat, i) => (
                      <li
                        key={i}
                        className={`flex items-start gap-2.5 ${
                          feat.included ? 'text-stone-800' : 'text-stone-500 line-through opacity-75'
                        }`}
                      >
                        {feat.included ? (
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              feat.highlight ? 'text-pms-accent stroke-[2.5]' : 'text-stone-600'
                            }`}
                          />
                        ) : (
                          <XIcon className="w-4 h-4 shrink-0 mt-0.5 text-stone-500 stroke-[2]" />
                        )}
                        <span className={feat.highlight ? 'font-semibold text-stone-900' : ''}>
                          {feat.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bouton CTA */}
                <div className="mt-8 pt-4 border-t border-pms-line">
                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-3.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 ${
                      isTarget
                        ? 'bg-pms-accent hover:bg-pms-accent text-white'
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
                  {!useStripe && <PaymentMethodsNote className="mt-4" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* BANDEAU PLAN DÉCOUVERTE (FREE) */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-4xl mx-auto mb-16 p-6 rounded-3xl bg-white border border-pms-line flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="space-y-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className="font-semibold text-sm text-stone-900">Vous débutez ? Essayez le plan Découverte</span>
            </div>
            <p className="text-xs text-stone-500">
              3 exports par jour en qualité Standard, filigrane discret, studio complet, sans carte bancaire.
            </p>
          </div>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-semibold border border-pms-line transition-colors shrink-0"
          >
            Ouvrir le studio gratuitement
          </Link>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION CRÉDITS À LA CARTE (PAY-PER-USE / STRATÉGIE POPCORN) */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div id="credits" className="max-w-6xl mx-auto mb-16 p-6 sm:p-10 rounded-3xl bg-white border border-pms-line shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-stone-900">
                Packs de crédits à la carte
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
                Sans abonnement : un crédit = une image HD sans filigrane. Vos crédits n&apos;expirent jamais.
              </p>
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {CREDIT_PACKS.map((pack) => {
              const isTargetPack = pack.isTarget;
              const packPrice = getCreditPackPrice(pack, currency);
              const fcfaFirst = !useStripe;
              const priceDisplay = fcfaFirst ? formatPrice(pack.priceFcfa, 'XOF') : formatPrice(packPrice, currency);
              const perCreditDisplay = fcfaFirst
                ? `${formatPrice(pack.pricePerCreditFcfa, 'XOF')} par crédit, soit ${formatPrice(packPrice, currency)} le pack`
                : `${formatPrice(packPrice / pack.credits, currency)} par crédit`;

              return (
                <div
                  key={pack.id}
                  className={`p-6 rounded-2xl border flex flex-col justify-between transition-all ${
                    isTargetPack
                      ? 'bg-pms-accent-tint border-2 border-pms-accent shadow-md relative'
                      : 'bg-pms-surface border-pms-line hover:bg-white hover:border-pms-accent'
                  }`}
                >
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">{pack.name}</h3>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-stone-950 whitespace-nowrap">
                        {priceDisplay}
                      </span>
                      <span className="text-xs font-semibold text-pms-accent bg-pms-accent-tint px-2 py-0.5 rounded-md">
                        {pack.credits} crédits
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-stone-500 mt-1">
                      {perCreditDisplay}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-pms-line flex items-center justify-between">
                    <span className="text-[12px] text-stone-500">Paiement unique{!useStripe && ', par Mobile Money'}</span>
                    <button
                      type="button"
                      onClick={() => handleCreditBuy(pack)}
                      disabled={loadingPlan !== null}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs ${
                        isTargetPack
                          ? 'bg-pms-accent hover:bg-pms-accent text-white'
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
          <div className="mt-8 pt-6 border-t border-pms-line">
            <h4 className="text-xs font-semibold text-stone-500 mb-3">
              Coût en crédits par action dans le studio :
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-pms-surface border border-pms-line text-center">
                <div className="font-semibold text-stone-900">1 Crédit</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Image HD sans filigrane</div>
              </div>
              <div className="p-3 rounded-xl bg-pms-surface border border-pms-line text-center">
                <div className="font-semibold text-stone-900">2 Crédits</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Image 4K</div>
              </div>
              <div className="p-3 rounded-xl bg-pms-surface border border-pms-line text-center">
                <div className="font-semibold text-stone-900">3 Crédits</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Vidéo ou GIF animé</div>
              </div>
              <div className="p-3 rounded-xl bg-pms-surface border border-pms-line text-center">
                <div className="font-semibold text-stone-900">4 Crédits</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Pack de formats (réseaux, App Store, Google Play)</div>
              </div>
              <div className="p-3 rounded-xl bg-pms-surface border border-pms-line text-center">
                <div className="font-semibold text-stone-900">0 crédit</div>
                <div className="text-[11px] text-stone-500 mt-0.5">Pitch IA, avec votre clé IA : {AI_KEY_PROVIDERS}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TABLEAU COMPARATIF COMPLET DES PLANS */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-6xl mx-auto mb-16 rounded-3xl bg-white border border-pms-line p-6 sm:p-10 shadow-xs">
          <h2 className="text-xl sm:text-2xl font-semibold text-stone-900 mb-6 text-center">
            Les forfaits en détail
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-pms-line">
                  <th className="py-3 px-4 font-semibold text-stone-500">Fonctionnalité</th>
                  <th className="py-3 px-4 font-semibold text-stone-600 text-center">
                    Découverte (gratuit)
                  </th>
                  <th className="py-3 px-4 font-semibold text-stone-900 text-center">
                    Solo ({tablePrice(PLANS[1])})
                  </th>
                  <th className="py-3 px-4 font-semibold text-pms-accent text-center bg-pms-accent-tint rounded-t-xl">
                    Pro ({tablePrice(PLANS[2])})
                  </th>
                  <th className="py-3 px-4 font-semibold text-stone-900 text-center">
                    Agence ({tablePrice(PLANS[3])})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pms-line">
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Exports d&apos;images</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">3 / jour (Standard)</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-stone-900">20 / mois (HD)</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent bg-pms-accent-tint">Illimité</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Filigrane</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">Oui</td>
                  <td className="py-3.5 px-4 text-center text-stone-600">Discret</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent bg-pms-accent-tint">Aucun</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent">Aucun</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Qualité 4K</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent bg-pms-accent-tint">Illimité</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Vidéos et GIF animés</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent bg-pms-accent-tint">10 / mois</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Analyses IA Directeur Artistique</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">3 / mois</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">3 / mois</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent bg-pms-accent-tint">Illimité</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Pitch IA, avec votre propre clé IA</td>
                  <td className="py-3.5 px-4 text-center text-stone-700">Inclus</td>
                  <td className="py-3.5 px-4 text-center text-stone-700">Inclus</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent bg-pms-accent-tint">Inclus</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-stone-900">Inclus</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Marque blanche (pages de partage à votre marque)</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center text-stone-300">—</td>
                  <td className="py-3.5 px-4 text-center text-stone-300 bg-pms-accent-tint">—</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent">Inclus</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Liens de partage pour vos clients</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">5 actifs</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-stone-900">Illimité</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent bg-pms-accent-tint">Illimité</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-stone-900">Illimité</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-medium text-stone-800">Support</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">E-mail</td>
                  <td className="py-3.5 px-4 text-center text-stone-500">E-mail</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent bg-pms-accent-tint">E-mail</td>
                  <td className="py-3.5 px-4 text-center font-semibold text-pms-accent">WhatsApp prioritaire</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* SECTION GARANTIE & FAQ MISE À JOUR */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-white border border-pms-line p-8 sm:p-10 shadow-xs space-y-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-pms-accent-tint text-pms-accent">
              <ShieldCheck className="w-7 h-7 text-pms-accent" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-stone-900">
                Vos questions sur le paiement
              </h3>
              <p className="text-xs text-stone-500">
                Tout ce que vous devez savoir sur le paiement, les devises et les exports.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-pms-line text-xs text-stone-600">
            <div className="space-y-1.5">
              <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-pms-accent shrink-0" />
                Quels sont les moyens de paiement acceptés selon ma région ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Pour l&apos;instant, par Mobile Money via SasPay (MTN, Moov, Celtiis, Orange, Wave… selon votre pays), en FCFA. Un paiement couvre 1 mois ou 1 an, sans renouvellement automatique : vous repayez seulement si vous voulez continuer. {cardPaymentsEnabled
                  ? CARD_PROVIDER === 'stripe'
                    ? ' Vous pouvez aussi payer par carte Visa, Mastercard ou American Express via Stripe, en euros ou en dollars : c’est alors un abonnement, résiliable à tout moment depuis votre compte.'
                    : ' Vous pouvez aussi payer par carte Visa ou Mastercard sur la même page SasPay.'
                  : ' Le paiement par carte bancaire arrive bientôt.'}
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-pms-accent shrink-0" />
                Dans quelle devise sont affichés les prix ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                En FCFA d&apos;abord : c&apos;est le montant payé par Mobile Money (plus les frais de l&apos;opérateur, affichés avant de valider). L&apos;équivalent en euros, ou en dollars hors d&apos;Europe et d&apos;Afrique, est indiqué en petit dessous.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-pms-accent shrink-0" />
                Comment marche le prix fidélité ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                En payant au mois par Mobile Money, chaque mois payé d&apos;affilée sur la même formule baisse le prix du mois suivant, trois fois au maximum (Solo : 5 500, 5 000, 4 500 puis 4 000 FCFA). Repayez au plus tard 3 jours après la fin de votre mois pour garder votre prix. Un mois raté vous ramène au prix de départ.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-pms-accent shrink-0" />
                Les crédits à la carte expirent-ils ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Non ! Les crédits achetés à la carte restent disponibles sur votre compte indéfiniment. Utilisez-les à votre propre rythme pour vos livraisons clients.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-semibold text-stone-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-pms-accent shrink-0" />
                Faut-il résilier ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                {CARD_PROVIDER === 'stripe'
                  ? 'Par Mobile Money, il n’y a rien à résilier : un paiement couvre 1 mois ou 1 an, sans renouvellement automatique. Par carte, c’est un abonnement : vous l’arrêtez en un clic depuis votre compte et gardez vos accès jusqu’à la fin de la période payée.'
                  : 'Non, il n’y a rien à résilier. Un paiement couvre 1 mois ou 1 an, sans renouvellement automatique : vous repayez seulement si vous voulez continuer.'}
              </p>
            </div>
          </div>
        </div>


      </main>

      <Footer />
    </div>
  );
}
