'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { useUser } from '@/context/UserContext';
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
} from 'lucide-react';

interface UsageData {
  email: string;
  plan: 'free' | 'pro' | 'agence';
  month: string;
  analyses_ia_count: number;
  limit: number;
  exports_count: number;
  hasStripeCustomer: boolean;
  createdAt: string;
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccessCheckout = searchParams.get('success') === 'true';

  const { user, profile, isLoading: isUserLoading, signOut, refreshProfile } = useUser();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(true);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);

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

  const handleOpenBillingPortal = async () => {
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

  if (isUserLoading || isUsageLoading) {
    return (
      <div className="min-h-screen bg-sand-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  const currentPlan = profile?.plan || usage?.plan || 'free';
  const isPremium = currentPlan === 'pro' || currentPlan === 'agence';
  const planLabel = currentPlan === 'agence' ? 'Agence' : currentPlan === 'pro' ? 'Pro' : 'Gratuit (Free)';

  const count = usage?.analyses_ia_count ?? 0;
  const maxQuota = isPremium ? 999999 : 3;
  const progressPercent = isPremium ? 100 : Math.min(100, Math.round((count / maxQuota) * 100));

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900">
      <Navbar showPricingLink={true} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Fil d'ariane & retour */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sand-100 text-stone-600 hover:text-stone-900 border border-sand-200 text-xs font-medium transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour au studio</span>
          </Link>
        </div>

        {/* Bannière de confirmation Stripe Checkout */}
        {isSuccessCheckout && (
          <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3.5 shadow-sm animate-slide-up">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs sm:text-sm">
              <h3 className="font-bold text-emerald-950">Félicitations, votre abonnement est actif !</h3>
              <p className="text-emerald-800 leading-relaxed">
                Vous bénéficiez maintenant d&apos;un accès illimité aux analyses IA complètes avec les avis et justifications détaillées du Directeur Artistique.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-1.5 font-bold text-emerald-700 hover:text-emerald-900 underline"
                >
                  Lancer une analyse complète dès maintenant →
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
        <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-lg shadow-2xs">
              <UserIcon className="w-7 h-7 text-violet-600" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-stone-900 tracking-tight">
                  Mon Compte
                </h1>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isPremium
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-sand-100 text-stone-700 border border-sand-200'
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

        {/* Section Quota & Consommation du mois */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-stone-900 font-bold text-sm sm:text-base">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>Analyses IA du mois ({usage?.month || 'Ce mois'})</span>
                </div>
                <span className="text-xs font-mono font-bold text-stone-500">
                  {isPremium ? 'Illimité' : `${count} / ${maxQuota}`}
                </span>
              </div>

              {/* Barre de progression */}
              <div className="space-y-2">
                <div className="w-full h-3 bg-sand-100 rounded-full overflow-hidden p-0.5 border border-sand-200">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isPremium
                        ? 'bg-violet-600 w-full'
                        : count >= maxQuota
                        ? 'bg-rose-500'
                        : 'bg-violet-600'
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-stone-400">
                  <span>{isPremium ? 'Accès Pro débloqué' : `${maxQuota - count} analyse(s) restante(s)`}</span>
                  <span>{isPremium ? '100% illimité' : `${progressPercent}% utilisé`}</span>
                </div>
              </div>

              {!isPremium && count >= maxQuota && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Vous avez utilisé vos 3 analyses gratuites du mois. Passez à la formule Pro pour débloquer les analyses et justifications illimitées.
                  </span>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-sand-100">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-xs font-semibold text-violet-700 hover:text-violet-900"
              >
                <Layers className="w-3.5 h-3.5 text-violet-600" />
                <span>Analyser une nouvelle page</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Section Facturation / Formule */}
          <div className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-xs flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-stone-900 font-bold text-sm sm:text-base">
                <CreditCard className="w-4 h-4 text-violet-600" />
                <span>Abonnement & Facturation</span>
              </div>

              <div className="p-4 rounded-2xl bg-sand-50/80 border border-sand-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Formule actuelle</span>
                  <span className="text-xs font-bold text-stone-900">{planLabel}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-500">Statut du compte</span>
                  <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    Actif
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-sand-100">
              {isPremium ? (
                <button
                  type="button"
                  onClick={handleOpenBillingPortal}
                  disabled={isPortalLoading}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-stone-800 bg-sand-100 hover:bg-sand-200 border border-sand-200 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
                >
                  {isPortalLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-stone-600" />
                      <span>Ouverture du portail Stripe...</span>
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 text-violet-600" />
                      <span>Gérer mon abonnement (Factures, Résiliation)</span>
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-violet-600 hover:bg-violet-700 flex items-center justify-center gap-2 transition-all shadow-sm shadow-violet-600/20 active:scale-[0.99]"
                >
                  <Sparkles className="w-4 h-4 text-violet-200" />
                  <span>Passer à la formule Pro (19€/mois)</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sand-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
