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
  Smartphone,
  CreditCard,
  Globe,
  Coins,
  Video,
  FileImage,
  Star,
  Users,
  ShieldAlert,
  Headphones,
  CheckCheck,
} from 'lucide-react';

export interface PricingPlan {
  id: 'free' | 'pro' | 'studio';
  name: string;
  badge?: string;
  badgeIcon?: React.ElementType;
  badgeColor?: string;
  monthlyPriceEur: number;
  annualPriceEur: number;
  monthlyPriceFcfa: number;
  annualPriceFcfa: number; // facturé annuellement
  description: string;
  isPopular?: boolean;
  ctaText: string;
  savingsAnnuallyFcfa: string;
  savingsAnnuallyEur: string;
  features: {
    name: string;
    included: boolean;
    highlight?: boolean;
    badge?: string;
  }[];
}

const PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Découverte',
    badge: '100% Gratuit',
    badgeIcon: Sparkles,
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    monthlyPriceEur: 0,
    annualPriceEur: 0,
    monthlyPriceFcfa: 0,
    annualPriceFcfa: 0,
    savingsAnnuallyFcfa: 'Sans frais',
    savingsAnnuallyEur: 'Sans engagement',
    description: 'Accès illimité au studio pour tester et concevoir sans sortir de carte bancaire.',
    isPopular: false,
    ctaText: 'Commencer gratuitement',
    features: [
      { name: 'Studio complet (MacBook, iPhone, Duo)', included: true },
      { name: 'Templates de base (6 catégories)', included: true },
      { name: 'Contrôles 3D, rotation & ombrages', included: true },
      { name: '3 exports PNG par jour (qualité 1x)', included: true },
      { name: 'Filigrane discret "Made with OmniMockup"', included: true },
      { name: 'Exports HD 2x & 4K Retina', included: false },
      { name: 'Export Vidéo animée MP4 60fps', included: false },
      { name: 'Templates exclusifs Pro (50+)', included: false },
      { name: 'IA Pitch Kit & Copywriting', included: false },
      { name: 'Marque blanche & Multi-comptes', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro Développeur',
    badge: 'Recommandé — Populaire',
    badgeIcon: Flame,
    badgeColor: 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-violet-500 shadow-violet-500/30',
    monthlyPriceEur: 5,
    annualPriceEur: 4,
    monthlyPriceFcfa: 3900,
    annualPriceFcfa: 3250, // 39 000 FCFA / an
    savingsAnnuallyFcfa: 'Économisez 7 800 FCFA (2 mois offerts)',
    savingsAnnuallyEur: 'Économisez 10€ / an (2 mois offerts)',
    description: 'Pour les freelances, devs et créateurs qui veulent des mockups impeccables sans filigrane.',
    isPopular: true,
    ctaText: 'Débloquer le forfait Pro',
    features: [
      { name: 'Studio complet & Mode Duo MacBook + iPhone', included: true },
      { name: 'Exports PNG HD 2x & 4K ILLIMITÉS', included: true, highlight: true },
      { name: 'ZÉRO filigrane (Rendus 100% neutres)', included: true, highlight: true },
      { name: '10 exports Vidéo animée MP4 60fps / mois', included: true, highlight: true },
      { name: '50+ Templates exclusifs Pro & Social Media', included: true, highlight: true },
      { name: 'IA Pitch Kit (5 générations / mois)', included: true },
      { name: 'Historique cloud de vos créations (30 jours)', included: true },
      { name: 'Partage par lien public haute fidélité', included: true },
      { name: 'Badges Tech Stack & Logo personnalisé', included: true },
      { name: 'Support prioritaire par email en 24h', included: true },
    ],
  },
  {
    id: 'studio',
    name: 'Studio Agence',
    badge: 'Agences & Startups',
    badgeIcon: Building2,
    badgeColor: 'bg-stone-900 text-white border-stone-800',
    monthlyPriceEur: 25,
    annualPriceEur: 20,
    monthlyPriceFcfa: 12900,
    annualPriceFcfa: 10750, // 129 000 FCFA / an
    savingsAnnuallyFcfa: 'Économisez 25 800 FCFA (2 mois offerts)',
    savingsAnnuallyEur: 'Économisez 50€ / an (2 mois offerts)',
    description: 'La suite complète pour les agences web, équipes produit et studios créatifs.',
    isPopular: false,
    ctaText: 'Choisir Studio Agence',
    features: [
      { name: 'Tout le forfait Pro Développeur inclus', included: true },
      { name: '5 sièges collaborateurs inclus', included: true, highlight: true },
      { name: 'Exports Vidéo animée MP4 ILLIMITÉS', included: true, highlight: true },
      { name: 'Marque blanche totale (White Label complet)', included: true, highlight: true },
      { name: 'Pack App Store & Play Store (5 écrans en 1 clic)', included: true, highlight: true },
      { name: 'IA Pitch Kit & Copywriting ILLIMITÉ', included: true, highlight: true },
      { name: 'Historique cloud permanent (1 an)', included: true },
      { name: 'Partage client avec révision & commentaires', included: true },
      { name: 'Accès API prioritaire pour intégration', included: true },
      { name: 'Support direct WhatsApp VIP 7j/7', included: true, highlight: true },
    ],
  },
];

interface PayPerUseCredit {
  id: string;
  name: string;
  description: string;
  priceFcfa: number;
  priceEur: number;
  tag?: string;
  icon: React.ElementType;
}

const PAY_PER_USE_CREDITS: PayPerUseCredit[] = [
  {
    id: 'credit_export_hd',
    name: '1 Export PNG HD sans filigrane',
    description: 'Rendu 2x ultra-net pour vos portfolios et posts réseaux.',
    priceFcfa: 490,
    priceEur: 0.5,
    tag: 'Populaire',
    icon: FileImage,
  },
  {
    id: 'credit_export_4k',
    name: '1 Export Ultra-HD 4K Retina',
    description: 'Résolution maximale pour affiches, print ou présentations géantes.',
    priceFcfa: 990,
    priceEur: 1.0,
    icon: Sparkles,
  },
  {
    id: 'credit_export_video',
    name: '1 Export Vidéo MP4 Animée',
    description: 'Animation 60fps fluide de votre mockup pour Instagram ou TikTok.',
    priceFcfa: 1490,
    priceEur: 1.5,
    tag: 'Tendance',
    icon: Video,
  },
  {
    id: 'credit_pitch_kit',
    name: '1 Kit IA Pitch Deck & Copywriting',
    description: 'Génération IA des textes de vente et arguments clés de votre site.',
    priceFcfa: 990,
    priceEur: 1.0,
    icon: Crown,
  },
  {
    id: 'credit_pack_10',
    name: 'Pack 10 Crédits Polyvalents',
    description: 'Utilisables sur tous les types d’exports sans date d’expiration.',
    priceFcfa: 3900,
    priceEur: 4.0,
    tag: 'Économique',
    icon: Coins,
  },
  {
    id: 'credit_pack_50',
    name: 'Pack 50 Crédits Studio',
    description: 'Pour freelances actifs. Soit seulement 298 FCFA par export.',
    priceFcfa: 14900,
    priceEur: 15.0,
    tag: 'Meilleur Tarif (-35%)',
    icon: Flame,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { user, profile } = useUser();

  const [paymentMethod, setPaymentMethod] = useState<'momo' | 'stripe' | 'flutterwave'>('momo');
  const [isAnnual, setIsAnnual] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showDownsellBanner, setShowDownsellBanner] = useState(true);
  const [paymentSuccessMessage, setPaymentSuccessMessage] = useState<string | null>(null);

  // Modal Mobile Money (gère plan ou pack de crédit)
  const [momoItem, setMomoItem] = useState<{
    id: string;
    name: string;
    amountFcfa: number;
    isSubscription: boolean;
  } | null>(null);
  const [momoPhoneNumber, setMomoPhoneNumber] = useState('');
  const [isMomoSubmitting, setIsMomoSubmitting] = useState(false);

  // Vérification retour de paiement
  React.useEffect(() => {
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

  const handlePlanClick = async (plan: PricingPlan) => {
    // Plan gratuit : redirection directe vers le studio
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

    if (paymentMethod === 'flutterwave') {
      setCheckoutError('Flutterwave est en cours de déploiement pour la zone anglophone. Veuillez utiliser MTN Mobile Money ou Carte Bancaire.');
      return;
    }

    if (paymentMethod === 'momo') {
      const amount = isAnnual ? plan.annualPriceFcfa * 12 : plan.monthlyPriceFcfa;
      setMomoItem({
        id: plan.id,
        name: `Abonnement ${plan.name} (${isAnnual ? 'Annuel' : 'Mensuel'})`,
        amountFcfa: amount,
        isSubscription: true,
      });
      setCheckoutError(null);
      return;
    }

    // Stripe checkout
    setLoadingPlan(plan.id);
    setCheckoutError(null);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          billing: isAnnual ? 'annual' : 'monthly',
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

  const handleCreditBuy = (credit: PayPerUseCredit) => {
    if (!user) {
      router.push(`/signup?redirect=${encodeURIComponent('/pricing')}`);
      return;
    }

    if (paymentMethod === 'momo') {
      setMomoItem({
        id: credit.id,
        name: credit.name,
        amountFcfa: credit.priceFcfa,
        isSubscription: false,
      });
      setCheckoutError(null);
      return;
    }

    setCheckoutError(`Le paiement par carte pour les micro-crédits sera disponible sous peu. Vous pouvez régler immédiatement via MTN MoMo (${credit.priceFcfa} FCFA).`);
  };

  const handleMomoCheckout = async () => {
    if (!momoItem) return;

    if (!momoPhoneNumber.trim() || momoPhoneNumber.trim().length < 8) {
      setCheckoutError('Veuillez renseigner un numéro de téléphone valide à 8 chiffres minimum.');
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
          phoneNumber: momoPhoneNumber.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success || !data.checkoutUrl) {
        throw new Error(data.error || 'Impossible de lancer le paiement MTN MoMo.');
      }

      // Redirection vers le guichet sécurisé FedaPay (Bénin / Afrique)
      window.location.href = data.checkoutUrl;
    } catch (err: unknown) {
      const e = err as { message?: string };
      setCheckoutError(e?.message || 'Erreur lors de la connexion à MTN Mobile Money.');
      setIsMomoSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900">
      <Navbar showPricingLink={false} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
        {/* Navigation retour */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sand-100 text-stone-600 hover:text-stone-900 border border-sand-200 text-xs font-medium transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-stone-500" />
            <span>Retour au Studio</span>
          </Link>

          <div className="hidden sm:flex items-center gap-2 text-xs text-stone-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Paiement sécurisé instantané</span>
          </div>
        </div>

        {/* BANNIÈRE DE BIENVENUE & CODE PROMO */}
        {showDownsellBanner && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-stone-900 via-violet-950 to-stone-900 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 border border-violet-800/40 animate-fade-in">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-violet-600/30 border border-violet-500/40 text-violet-300 flex items-center justify-center shrink-0 shadow-xs">
                <Gift className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-md border border-amber-400/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    Offre de Lancement Afrique & Monde
                  </span>
                  <span className="text-xs text-stone-300 hidden md:flex items-center gap-1">
                    <Clock className="w-3 h-3 text-violet-300" /> Accès immédiat
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-semibold text-white mt-1">
                  Passez au plan Pro à <span className="text-amber-300 font-extrabold">3 900 FCFA / mois</span> seulement, ou commencez gratuitement sans aucune carte !
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handlePlanClick(PLANS.find((p) => p.id === 'pro')!)}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all flex items-center gap-1.5"
              >
                <span>Choisir le Pro</span>
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

        {/* ALERTE SUCCÈS PAIEMENT */}
        {paymentSuccessMessage && (
          <div className="max-w-2xl mx-auto mb-8 p-4 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-sm flex items-center gap-3 shadow-lg animate-fade-in">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div className="flex-1 font-medium">{paymentSuccessMessage}</div>
            <button
              onClick={() => setPaymentSuccessMessage(null)}
              className="p-1 text-emerald-700 hover:text-emerald-950 rounded-lg"
            >
              <XIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {checkoutError && (
          <div className="max-w-xl mx-auto mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="flex-1 font-medium">{checkoutError}</span>
            <button
              onClick={() => setCheckoutError(null)}
              className="p-1 text-rose-600 hover:text-rose-900"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* HEADER & TITRE */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-900 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
            <span>Tarification Transparente & Modèle Freemium Popcorn</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-stone-900 leading-tight">
            Des mockups dignes d&apos;Apple.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-amber-600">
              Pour tous les budgets.
            </span>
          </h1>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Créez librement sur le studio sans payer. Passez au Pro pour supprimer le filigrane et débloquer les vidéos 4K, ou achetez des crédits à la pièce.
          </p>

          {/* SÉLECTEUR DE MÉTHODE DE PAIEMENT */}
          <div className="pt-2 flex flex-col items-center justify-center gap-3">
            <div className="p-1.5 rounded-2xl bg-white border border-sand-300 shadow-xs flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setPaymentMethod('momo')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  paymentMethod === 'momo'
                    ? 'bg-amber-400 text-stone-950 shadow-md ring-2 ring-amber-400/40 scale-[1.02]'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="text-base">🇧🇯</span>
                <Smartphone className="w-4 h-4 text-stone-950" />
                <span>MTN Mobile Money Bénin & Afrique</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-900 text-amber-300 font-black">
                  FCFA
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('stripe')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  paymentMethod === 'stripe'
                    ? 'bg-stone-900 text-white shadow-md ring-2 ring-violet-500/30 scale-[1.02]'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-current" />
                <span>Carte Bancaire Internationale</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sand-200 text-stone-800 font-semibold">
                  € / $
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('flutterwave')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  paymentMethod === 'flutterwave'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Pan-Afrique (Flutterwave)</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-200">
                  Bientôt
                </span>
              </button>
            </div>
          </div>

          {/* TOGGLE MENSUEL / ANNUEL */}
          <div className="pt-2 flex items-center justify-center gap-3">
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
              aria-label="Changer de cycle de facturation"
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
                  isAnnual ? 'text-violet-700 font-bold' : 'text-stone-400'
                }`}
              >
                Facturation annuelle
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold shadow-2xs">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                2 mois offerts (-16%)
              </span>
            </div>
          </div>
        </div>

        {/* GRILLE DES 3 PLANS PRINCIPAUX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch max-w-6xl mx-auto mb-16">
          {PLANS.map((plan) => {
            const isFcfa = paymentMethod === 'momo';
            const priceToShow = isFcfa
              ? plan.monthlyPriceFcfa === 0
                ? '0 FCFA'
                : isAnnual
                ? `${plan.annualPriceFcfa.toLocaleString('fr-FR')} FCFA`
                : `${plan.monthlyPriceFcfa.toLocaleString('fr-FR')} FCFA`
              : plan.monthlyPriceEur === 0
              ? '0€'
              : `${isAnnual ? plan.annualPriceEur : plan.monthlyPriceEur}€`;

            const savingsToShow = isFcfa ? plan.savingsAnnuallyFcfa : plan.savingsAnnuallyEur;
            const BadgeIcon = plan.badgeIcon || Sparkles;

            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border ${
                  plan.isPopular
                    ? 'bg-gradient-to-b from-white via-violet-50/50 to-white border-violet-500 shadow-2xl shadow-violet-500/20 ring-2 ring-violet-500/40 md:scale-105 z-10'
                    : 'bg-white border-sand-200 shadow-xs hover:border-sand-300 hover:shadow-md'
                }`}
              >
                {/* Badge top */}
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 w-full text-center px-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm border ${
                        plan.badgeColor || 'bg-stone-900 text-white'
                      }`}
                    >
                      <BadgeIcon className="w-3.5 h-3.5" />
                      <span>{plan.badge}</span>
                    </span>
                  </div>
                )}

                <div>
                  {/* Titre & Description */}
                  <div className="space-y-1.5 mt-2">
                    <h3 className="text-xl font-black text-stone-900 flex items-center gap-1.5">
                      {plan.name}
                    </h3>
                    <p className="text-xs text-stone-500 min-h-[36px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  {/* Highlight sur le plan Pro */}
                  {plan.id === 'pro' && (
                    <div className="my-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs font-semibold leading-tight flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>Exports illimités HD + Vidéo MP4 60fps sans filigrane !</span>
                    </div>
                  )}

                  {/* Prix */}
                  <div className="my-5 pb-5 border-b border-sand-100 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-3xl sm:text-4xl font-black tracking-tight text-stone-900 font-mono">
                      {priceToShow}
                    </span>
                    {plan.monthlyPriceFcfa > 0 && (
                      <span className="text-xs font-semibold text-stone-500 font-sans">
                        / mois {isAnnual ? '(facturé à l’année)' : ''}
                      </span>
                    )}
                  </div>

                  {isAnnual && plan.monthlyPriceFcfa > 0 && (
                    <p className="text-xs font-bold text-emerald-700 -mt-3 mb-4 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{savingsToShow}</span>
                    </p>
                  )}

                  {/* Fonctionnalités */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 font-mono">
                      Inclus dans cette formule :
                    </p>

                    <ul className="space-y-2.5 text-xs">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          {feat.included ? (
                            <div
                              className={`p-0.5 rounded-full mt-0.5 shrink-0 ${
                                feat.highlight
                                  ? 'bg-violet-100 text-violet-700'
                                  : 'bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              <Check className="w-3 h-3 stroke-[3]" />
                            </div>
                          ) : (
                            <div className="p-0.5 rounded-full mt-0.5 shrink-0 bg-sand-100 text-stone-400">
                              <XIcon className="w-3 h-3 stroke-[2]" />
                            </div>
                          )}

                          <span
                            className={`leading-tight ${
                              feat.included
                                ? feat.highlight
                                  ? 'font-bold text-stone-900'
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
                <div className="mt-8 pt-4 border-t border-sand-100">
                  <button
                    type="button"
                    onClick={() => handlePlanClick(plan)}
                    disabled={loadingPlan !== null}
                    className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 ${
                      plan.id === 'free'
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-900 border border-sand-300'
                        : paymentMethod === 'momo'
                        ? 'bg-amber-400 hover:bg-amber-300 text-stone-950 shadow-md border-2 border-stone-950 ring-2 ring-amber-400/40'
                        : plan.isPopular
                        ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-violet-500/30'
                        : 'bg-stone-900 hover:bg-stone-800 text-white'
                    }`}
                  >
                    {loadingPlan === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-current" />
                        <span>Redirection sécurisée...</span>
                      </>
                    ) : plan.id === 'free' ? (
                      <>
                        <span>Accéder au Studio Gratuit</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    ) : paymentMethod === 'momo' ? (
                      <>
                        <Smartphone className="w-4 h-4 text-stone-950" />
                        <span>Payer via MTN MoMo</span>
                        <ArrowRight className="w-4 h-4" />
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

        {/* SECTION POPCORN STRATEGY : CRÉDITS À LA CARTE (PAY-PER-USE) */}
        <div className="max-w-6xl mx-auto mb-16 p-6 sm:p-10 rounded-3xl bg-white border border-sand-200 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-100 text-amber-950 text-xs font-black mb-2 border border-amber-200">
                <Coins className="w-3.5 h-3.5 text-amber-600" />
                <span>Stratégie Popcorn — Pas d&apos;abonnement, payez à l&apos;unité</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-900">
                Crédits & Exports à la Carte (Pay-per-use)
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
                Vous avez un besoin ponctuel pour un seul client ou une seule présentation ? Achetez uniquement ce dont vous avez besoin sans engagement mensuel.
              </p>
            </div>

            <div className="text-xs text-stone-500 bg-sand-50 px-3.5 py-2 rounded-xl border border-sand-200 shrink-0">
              💡 <strong>Crédits à vie :</strong> vos achats n&apos;expirent jamais.
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {PAY_PER_USE_CREDITS.map((item) => {
              const IconComp = item.icon;
              const isFcfa = paymentMethod === 'momo';
              const priceDisplay = isFcfa
                ? `${item.priceFcfa.toLocaleString('fr-FR')} FCFA`
                : `${item.priceEur.toFixed(2)}€`;

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-sand-200 bg-sand-50/50 hover:bg-white hover:border-violet-300 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="p-2.5 rounded-xl bg-white border border-sand-200 text-violet-600 shadow-2xs">
                        <IconComp className="w-5 h-5" />
                      </div>
                      {item.tag && (
                        <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                          {item.tag}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-stone-900 leading-snug">
                      {item.name}
                    </h4>
                    <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-sand-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-lg font-black text-stone-900 font-mono">
                        {priceDisplay}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCreditBuy(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-violet-600 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 active:scale-95"
                    >
                      <span>Acheter</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION BANNIÈRE : POURQUOI LE MODÈLE FREEMIUM & POPCORN ? */}
        <div className="max-w-5xl mx-auto mb-16 rounded-3xl bg-gradient-to-br from-violet-900 via-indigo-950 to-stone-950 text-white p-8 sm:p-10 shadow-2xl relative overflow-hidden border border-violet-800/40">
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-violet-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-10 -top-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/30 text-violet-200 border border-violet-400/30 text-xs font-bold">
                <Globe className="w-3.5 h-3.5 text-amber-300" />
                <span>La Vision OmniMockup pour l&apos;Afrique et le Monde</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                L&apos;excellence du design accessible à chaque développeur
              </h3>
              <p className="text-stone-300 text-xs sm:text-sm leading-relaxed">
                Les grands outils américains facturent souvent 20$ à 40$ par mois en exigeant une carte de crédit internationale. Chez OmniMockup, nous croyons que les créateurs d&apos;Afrique francophone et du monde entier méritent les mêmes standards visuels qu&apos;Apple ou Airbnb, avec un débit direct en FCFA par MTN Mobile Money.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/15 space-y-3 text-center">
              <p className="text-xs font-extrabold uppercase tracking-wider text-amber-300">
                Économie Réalisée
              </p>
              <div className="text-3xl font-black text-white font-mono">
                150 000+ FCFA
              </div>
              <p className="text-[11px] text-stone-200 leading-tight">
                vs un graphiste externe ou une agence pour préparer vos captures de pitch.
              </p>
            </div>
          </div>
        </div>

        {/* SECTION GARANTIE & FAQ */}
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
                Tout ce que vous devez savoir sur le paiement, les abonnements et les exports.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-sand-100 text-xs text-stone-600">
            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                Puis-je payer avec MTN Mobile Money sans carte bancaire ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Oui, à 100% ! Grâce à notre passerelle sécurisée FedaPay, vous renseignez simplement votre numéro MTN Bénin (+229). Une notification USSD apparaît directement sur votre téléphone pour valider avec votre code secret PIN.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                Comment fonctionne le plan gratuit ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Vous pouvez utiliser le studio en illimité, changer de mockup, appliquer des dégradés et exporter jusqu&apos;à 3 images par jour avec un filigrane discret. Aucune carte bancaire n&apos;est requise.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                Les crédits à la carte ont-ils une date d&apos;expiration ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Non ! Vos packs de crédits restent enregistrés sur votre compte sans limitation dans le temps. Vous pouvez les utiliser à votre rythme lorsque vous avez des projets clients à livrer.
              </p>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-900 shrink-0" />
                Qu&apos;est-ce que la Marque Blanche (White Label) du plan Studio ?
              </h4>
              <p className="leading-relaxed text-stone-500">
                Elle vous permet de supprimer toute mention d&apos;OmniMockup et d&apos;apposer votre propre logo ou celui de votre agence sur les rendus, présentations et partages clients.
              </p>
            </div>
          </div>
        </div>

        {/* MODAL PAIEMENT MTN MOBILE MONEY BÉNIN / AFRIQUE */}
        {momoItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-sand-300 relative space-y-5 animate-scale-up">
              {/* Bouton fermer */}
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

              {/* En-tête modal */}
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
                    Souscription : <strong>{momoItem.name}</strong>
                  </p>
                </div>
              </div>

              {/* Récapitulatif montant */}
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

              {/* Saisie du Numéro MoMo Bénin */}
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

              {/* Bouton de confirmation */}
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
