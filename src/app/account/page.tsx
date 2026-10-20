'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { usePrices } from '@/lib/usePrices';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useUser } from '@/context/UserContext';
import { trackEvent } from '@/lib/tracking';
import {
  User as UserIcon,
  Zap,
  Shield,
  CreditCard,
  Sparkles,
  ArrowRight,
  ExternalLink,
  LogOut,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  Layers,
  ArrowLeft,
  Coins,
  AlertTriangle,
  HeartHandshake,
  X,
} from 'lucide-react';

interface UsageData {
  email: string;
  plan: 'free' | 'solo' | 'pro' | 'agence';
  credit_balance: number;
  subscription_status: string;
  billing_cycle: 'monthly' | 'annual';
  month: string;
  analyses_ia_count: number;
  limit: number;
  exports_count: number;
  png_exports_count: number;
  png_limit: number;
  hasStripeCustomer: boolean;
  plan_expires_at: string | null;
  createdAt: string;
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccessCheckout = searchParams.get('success') === 'true';
  const checkoutType = searchParams.get('type');

  const { user, profile, isLoading: isUserLoading, signOut, refreshProfile } = useUser();
  const price = usePrices();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

  // Modale de rétention avant Customer Portal
  const [showRetentionModal, setShowRetentionModal] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login?redirect=/account');
      return;
    }

    async function loadUsage() {
      try {
        const res = await fetch('/api/user/usage');
        const data = await res.json();
        if (data.success) {
          setUsage(data);
        }
      } catch (err) {
        console.error('Erreur chargement usage :', err);
      } finally {
        setIsUsageLoading(false);
      }
    }

    if (user) {
      loadUsage();
      if (isSuccessCheckout) {
        refreshProfile();
      }
    }
  }, [user, isUserLoading, router, isSuccessCheckout, refreshProfile]);

  const handleOpenBillingPortalDirect = async () => {
    setIsPortalLoading(true);
    setPortalError(null);

    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Impossible d’ouvrir le portail client Stripe.');
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setPortalError(e?.message || 'Erreur d’accès au portail Stripe.');
      setIsPortalLoading(false);
    }
  };

  const handleOpenBillingPortal = () => {
    const plan = profile?.plan || usage?.plan || 'free';
    if (plan === 'pro' || plan === 'agence') {
      trackEvent('downsell_shown', { source: 'account_cancellation_intent', current_plan: plan });
      setShowRetentionModal(true);
    } else {
      handleOpenBillingPortalDirect();
    }
  };

  if (isUserLoading || isUsageLoading) {
    return (
      <div className="min-h-screen bg-pms-surface flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-pms-accent" />
      </div>
    );
  }

  const currentPlan = profile?.plan || usage?.plan || 'free';
  const isPremium = currentPlan === 'pro' || currentPlan === 'agence';
  const isSolo = currentPlan === 'solo';
  const creditBalance = usage?.credit_balance ?? profile?.credit_balance ?? 0;
  const subscriptionStatus = usage?.subscription_status ?? profile?.subscription_status ?? 'active';
  const isPastDue = subscriptionStatus === 'past_due';
  // Plan payé en une fois (SasPay) : date de fin fixe, pas de portail Stripe
  const planExpiresAt = usage?.plan_expires_at ?? profile?.plan_expires_at ?? null;
  const isOneTimePlan = currentPlan !== 'free' && !!planExpiresAt;

  const planLabel =
    currentPlan === 'agence'
      ? 'Agence'
      : currentPlan === 'pro'
      ? 'Pro'
      : currentPlan === 'solo'
      ? 'Solo'
      : 'Gratuit (Découverte)';

  const count = usage?.analyses_ia_count ?? 0;
  const maxQuota = isPremium ? 999999 : 3;
  const progressPercent = isPremium ? 100 : Math.min(100, Math.round((count / maxQuota) * 100));

  const pngCount = usage?.png_exports_count ?? 0;
  const pngLimit = isSolo ? 20 : isPremium ? 999999 : 3;

  return (
    <div className="min-h-screen bg-pms-surface text-stone-900 flex flex-col selection:bg-pms-accent-tint selection:text-pms-accent">
      <Navbar showPricingLink={true} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Fil d'ariane & retour */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-pms-surface text-stone-600 hover:text-stone-900 border border-pms-line text-xs font-medium transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au studio</span>
          </Link>
        </div>

        {/* Bannière paiement échoué (invoice.payment_failed) */}
        {isPastDue && (
          <div className="p-5 rounded-3xl bg-amber-500/10 border-2 border-amber-500 text-amber-950 flex items-start justify-between gap-4 shadow-sm animate-pulse">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <h3 className="font-semibold text-amber-950">Action requise : Paiement en attente</h3>
                <p className="text-amber-800 leading-relaxed">
                  Le dernier prélèvement sur votre carte bancaire a échoué. Mettez à jour vos coordonnées bancaires pour conserver l&apos;accès illimité sans filigrane.
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenBillingPortalDirect}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shrink-0 transition-colors"
            >
              Mettre à jour
            </button>
          </div>
        )}

        {/* Bannière de confirmation Stripe Checkout */}
        {isSuccessCheckout && (
          <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5 shadow-sm animate-slide-up">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <h3 className="font-semibold text-emerald-950">
                {checkoutType === 'credits'
                  ? 'Vos crédits ont été ajoutés avec succès !'
                  : 'Félicitations, votre abonnement est actif !'}
              </h3>
              <p className="text-emerald-800 leading-relaxed">
                {checkoutType === 'credits'
                  ? 'Vos crédits sont immédiatement utilisables dans le studio. Ils n’expirent jamais.'
                  : 'Vous bénéficiez maintenant d’un accès complet selon votre plan avec exports prioritaires.'}
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Accéder au studio dès maintenant →
                </Link>
              </div>
            </div>
          </div>
        )}

        {portalError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{portalError}</span>
          </div>
        )}

        {/* En-tête profil */}
        <div className="bg-white rounded-3xl border border-pms-line p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-pms-accent-tint text-pms-accent flex items-center justify-center font-semibold text-lg shadow-2xs">
              <UserIcon className="w-7 h-7 text-pms-accent" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-stone-900 tracking-tight">
                  Mon Compte
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    isPremium
                      ? 'bg-pms-accent text-white shadow-xs'
                      : isSolo
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-pms-surface text-stone-700 border border-pms-line'
                  }`}
                >
                  {isPremium ? <Zap className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                  {planLabel}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 font-medium">
                {user?.email}
              </p>
              {usage?.createdAt && (
                <p className="text-[11px] text-stone-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Membre depuis {new Date(usage.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200/60 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Se déconnecter</span>
          </button>
        </div>

        {/* Grille : Quotas & Solde de crédits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 1. Solde de crédits à vie */}
          <div className="bg-white rounded-3xl border border-pms-line p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-600" />
                  Crédits à la carte
                </span>
                <span className="text-[10px] font-semibold text-stone-400">À vie</span>
              </div>
              <div className="text-3xl font-semibold text-stone-900">
                {creditBalance} <span className="text-sm font-sans font-normal text-stone-500">crédit(s)</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                Utilisables pour les exports HD, 4K, Vidéo et Kits IA sans abonnement.
              </p>
            </div>
            <Link
              href="/pricing#credits"
              className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold border border-amber-200 text-center transition-colors"
            >
              + Recharger des crédits
            </Link>
          </div>

          {/* 2. Quota Analyses IA */}
          <div className="bg-white rounded-3xl border border-pms-line p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-pms-accent flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-pms-accent" />
                  Analyses IA ({usage?.month || 'Ce mois'})
                </span>
                <span className="text-xs font-semibold text-stone-600">
                  {isPremium ? 'Illimité' : `${count} / ${maxQuota}`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-pms-surface rounded-full overflow-hidden p-0.5 border border-pms-line">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPremium ? 'bg-pms-accent w-full' : count >= maxQuota ? 'bg-rose-500' : 'bg-pms-accent'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-400">
                {isPremium ? 'Accès illimité Directeur Artistique' : `${Math.max(0, maxQuota - count)} analyse(s) restante(s)`}
              </p>
            </div>
            {!isPremium && (
              <Link
                href="/pricing"
                className="w-full py-2 px-3 rounded-xl bg-pms-accent-tint hover:bg-pms-accent-tint text-pms-accent text-xs font-semibold border border-pms-accent-tint text-center transition-colors"
              >
                Passer au Pro ({price.pro})
              </Link>
            )}
          </div>

          {/* 3. Quota Exports PNG */}
          <div className="bg-white rounded-3xl border border-pms-line p-6 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-stone-600" />
                  Exports PNG ({isSolo ? 'Mois' : 'Jour'})
                </span>
                <span className="text-xs font-semibold text-stone-600">
                  {isPremium ? 'Illimité' : `${pngCount} / ${pngLimit}`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-pms-surface rounded-full overflow-hidden p-0.5 border border-pms-line">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isPremium ? 'bg-stone-900 w-full' : pngCount >= pngLimit ? 'bg-rose-500' : 'bg-stone-900'
                  }`}
                  style={{ width: `${isPremium ? 100 : Math.min(100, Math.round((pngCount / pngLimit) * 100))}%` }}
                />
              </div>
              <p className="text-[11px] text-stone-400">
                {isPremium ? 'Zéro filigrane, HD 2x & 4K' : isSolo ? '20 exports HD/mois' : '3 exports/jour (1x)'}
              </p>
            </div>
            {currentPlan === 'solo' && (
              <Link
                href="/pricing"
                className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold text-center transition-colors"
              >
                +{price.proMinusSolo} pour Pro illimité
              </Link>
            )}
          </div>
        </div>

        {/* Section Facturation */}
        <div className="bg-white rounded-3xl border border-pms-line p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-stone-900 font-semibold text-sm sm:text-base">
            <CreditCard className="w-4 h-4 text-pms-accent" />
            <span>Gestion de l&apos;Abonnement & Facturation</span>
          </div>

          <div className="p-4 rounded-2xl bg-pms-surface border border-pms-line/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-stone-900">{planLabel}</span>
                <span className="text-xs text-stone-500">
                  ({usage?.billing_cycle === 'annual' ? 'Facturation annuelle' : 'Facturation mensuelle'})
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Statut : <span className={isPastDue ? 'text-amber-700 font-semibold' : 'text-emerald-600 font-semibold'}>{isPastDue ? 'Paiement en attente' : 'Actif'}</span>
                {isOneTimePlan && planExpiresAt && (
                  <> · Paiement unique, actif jusqu&apos;au {new Date(planExpiresAt).toLocaleDateString('fr-FR')}</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {isOneTimePlan ? (
                <Link
                  href="/pricing"
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs text-stone-800 bg-white hover:bg-pms-surface border border-pms-line flex items-center justify-center gap-2 transition-all shadow-2xs"
                >
                  <ArrowRight className="w-4 h-4 text-stone-600" />
                  <span>Prolonger mon plan</span>
                </Link>
              ) : currentPlan !== 'free' ? (
                <button
                  type="button"
                  onClick={handleOpenBillingPortal}
                  disabled={isPortalLoading}
                  className="py-2.5 px-4 rounded-xl font-semibold text-xs text-stone-800 bg-white hover:bg-pms-surface border border-pms-line flex items-center justify-center gap-2 transition-all shadow-2xs disabled:opacity-60"
                >
                  {isPortalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
                      <span>Chargement...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 text-stone-600" />
                      <span>Gérer la facturation & Résiliation</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="py-2.5 px-5 rounded-xl font-semibold text-xs text-white bg-pms-accent hover:bg-pms-accent flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  <Sparkles className="w-4 h-4 text-pms-accent" />
                  <span>Passer au Pro ({price.pro}/mois)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* MODALE DE RÉTENTION (DOWNSELL ÉTAPE 5) */}
        {showRetentionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-pms-line relative space-y-6 animate-scale-up">
              <button
                type="button"
                onClick={() => setShowRetentionModal(false)}
                className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-pms-surface transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
                  <HeartHandshake className="w-7 h-7 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-stone-900">
                    Avant de nous quitter...
                  </h3>
                  <p className="text-xs text-stone-500">
                    Avez-vous besoin d&apos;une solution plus économique adaptée à votre rythme ?
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Option 1 : Downsell vers Solo (5€) */}
                <div className="p-4 rounded-2xl border border-pms-accent-tint bg-pms-accent-tint flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-pms-accent block">Passer au forfait Solo</span>
                    <span className="text-[11px] text-pms-accent">Seulement {price.solo}/mois : 20 exports HD + 3 analyses IA.</span>
                  </div>
                  <Link
                    href="/pricing?switch=solo"
                    onClick={() => {
                      trackEvent('downsell_accepted', { offer: 'solo_plan', previous_plan: currentPlan });
                      setShowRetentionModal(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-pms-accent hover:bg-pms-accent text-white font-semibold text-xs shrink-0"
                  >
                    Choisir Solo ({price.solo})
                  </Link>
                </div>

                {/* Option 2 : Downsell vers Pack crédits (4€) */}
                <div className="p-4 rounded-2xl border border-pms-line bg-pms-surface flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-stone-900 block">Packs de crédits sans abonnement</span>
                    <span className="text-[11px] text-stone-600">Achetez {price.petitCredits} crédits à vie pour {price.petitPack} sans prélèvement mensuel.</span>
                  </div>
                  <Link
                    href="/pricing#credits"
                    onClick={() => {
                      trackEvent('downsell_accepted', { offer: 'credit_pack', previous_plan: currentPlan });
                      setShowRetentionModal(false);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shrink-0"
                  >
                    Voir crédits ({price.petitPack})
                  </Link>
                </div>
              </div>

              {/* Bouton pour continuer quand même */}
              <div className="pt-2 flex items-center justify-between border-t border-pms-line">
                <button
                  type="button"
                  onClick={() => setShowRetentionModal(false)}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900"
                >
                  Garder mon abonnement actuel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRetentionModal(false);
                    handleOpenBillingPortalDirect();
                  }}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 underline"
                >
                  Continuer vers Stripe pour résilier
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

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-pms-surface flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-pms-accent" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
