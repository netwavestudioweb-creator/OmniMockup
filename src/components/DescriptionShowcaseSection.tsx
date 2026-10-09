'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  ArrowRight,
  CheckCircle2,
  Zap,
  Star,
  Copy,
  Download,
  TrendingUp,
  BarChart3,
  ShieldCheck,
  Briefcase,
  Rocket,
  Palette,
  ShoppingBag,
} from 'lucide-react';

interface ShowcasePreset {
  id: string;
  name: string;
  category: string;
  device: 'browser' | 'macbook' | 'iphone' | 'ipad';
  url: string;
  gradient: string;
  description: string;
  tag: string;
}

const PRESET_SHOWCASES: ShowcasePreset[] = [
  {
    id: 'saas-dashboard',
    name: 'SaaS Analytics Dashboard',
    category: 'Startups & B2B',
    device: 'macbook',
    url: 'https://nextjs.org',
    gradient: 'from-violet-600 via-indigo-600 to-cyan-500',
    description: 'Présentation de tableau de bord financier avec indicateurs clés et graphiques en temps réel.',
    tag: 'B2B & SaaS',
  },
  {
    id: 'fintech-mobile',
    name: 'Application Mobile FinTech',
    category: 'Mobile iOS & Android',
    device: 'iphone',
    url: 'https://stripe.com',
    gradient: 'from-fuchsia-600 via-purple-600 to-indigo-700',
    description: 'Interface iPhone 16 Pro avec Dynamic Island, flux de virement instantané et carte bancaire.',
    tag: 'App Mobile',
  },
  {
    id: 'agency-portfolio',
    name: 'Studio Design & Portfolio',
    category: 'Agences & Studios',
    device: 'browser',
    url: 'https://tailwindcss.com',
    gradient: 'from-amber-500 via-rose-500 to-violet-600',
    description: 'Mise en valeur d’une identité de marque épurée avec fenêtre Safari macOS et ombres douces.',
    tag: 'Agence Web',
  },
  {
    id: 'ecommerce-store',
    name: 'Boutique E-commerce D2C',
    category: 'E-commerce & Retail',
    device: 'ipad',
    url: 'https://apple.com',
    gradient: 'from-emerald-500 via-teal-600 to-indigo-700',
    description: 'Vitrine produit haute fidélité sur tablette tactile avec navigation fluide et fiche descriptive.',
    tag: 'E-commerce',
  },
];

const USE_CASES = [
  {
    icon: Briefcase,
    title: 'Agences Web & Freelances',
    subtitle: 'Valorisez vos livrables clients',
    description:
      'Ne livrez plus de simples captures d’écran plates. Présentez les sites de vos clients dans des MacBook et iPhone 3D pour justifier vos tarifs et décrocher des contrats à forte valeur.',
    badge: 'Gain de temps × 10',
    badgeColor: 'bg-violet-100 text-violet-800 border-violet-200',
  },
  {
    icon: Rocket,
    title: 'Fondateurs & Équipes SaaS',
    subtitle: 'Convertissez vos visiteurs',
    description:
      'Générez des visuels percutants pour vos lancements Product Hunt, vos bannières Twitter/X, vos posts LinkedIn et les sections de votre landing page en moins de 30 secondes.',
    badge: 'Conversion Boostée',
    badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    icon: Palette,
    title: 'Designers & Développeurs',
    subtitle: 'Sublimez vos portfolios',
    description:
      'Mettez en scène vos réalisations sur Dribbble, Behance ou GitHub avec des perspectives 3D personnalisées (angles X/Y, reflets Apple, verre trempé) sans ouvrir Photoshop ni Figma.',
    badge: 'Qualité Dribbble',
    badgeColor: 'bg-pink-100 text-pink-800 border-pink-200',
  },
  {
    icon: ShoppingBag,
    title: 'E-commerces & Créateurs',
    subtitle: 'Publicités & Réseaux Sociaux',
    description:
      'Exportez vos visuels directement au bon format : 16:9 pour les bannières, 1:1 pour les posts Instagram carrés ou 9:16 pour vos stories et vidéos de démonstration.',
    badge: 'Multi-Formats 4K',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'OmniMockup nous a fait gagner au moins 3 heures par semaine sur nos présentations de fin de sprint. Les clients adorent voir leur site tourner sur un MacBook 3D avant même la mise en ligne.',
    author: 'Thomas R.',
    role: 'Lead Designer chez NovaStudio',
    stars: 5,
  },
  {
    quote:
      'J’ai préparé tous les visuels de mon lancement Product Hunt avec OmniMockup en 10 minutes. Résultat : Top 3 du jour et plus de 2 000 inscriptions.',
    author: 'Sarah M.',
    role: 'Fondatrice de MetricFlow SaaS',
    stars: 5,
  },
  {
    quote:
      'La fonction de copie directe dans le presse-papier est magique. Je colle l’URL du site, je choisis l’iPhone, je fais Ctrl+V dans mon thread Twitter et c’est plié !',
    author: 'Alexandre B.',
    role: 'Développeur Fullstack & Freelance',
    stars: 5,
  },
];

interface DescriptionShowcaseSectionProps {
  onSelectPreset?: (url: string) => void;
}

export const DescriptionShowcaseSection: React.FC<DescriptionShowcaseSectionProps> = ({
  onSelectPreset,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<'browser' | 'macbook' | 'iphone' | 'ipad'>('browser');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="w-full py-16 sm:py-24 bg-white border-t border-sand-200" id="showcase-description">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">

        {/* 1. EN-TÊTE DE SECTION PRINCIPALE */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Galerie Interactive &amp; Exemples Concrets</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Des présentations de calibre international,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600">
              en un claquement de doigts
            </span>
          </h2>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
            Découvrez comment OmniMockup transforme n&apos;importe quelle page web ou capture en un visuel 3D percutant, prêt à captiver votre audience.
          </p>
        </div>

        {/* 2. DÉMONSTRATION CENTRALE INTERACTIVE D'UN SAAS MODERNE (SANS FAUX BURGER) */}
        <div className="bg-sand-50 rounded-3xl border border-sand-200 p-4 sm:p-8 lg:p-10 shadow-xl space-y-8">
          
          {/* Barre de sélection d'appareil interactive */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-sand-200">
            <div>
              <h3 className="font-extrabold text-stone-900 text-base sm:text-lg">
                Aperçu en Direct du Rendu 3D
              </h3>
              <p className="text-xs text-stone-500">
                Changez d&apos;appareil en 1 clic pour visualiser l&apos;adaptation automatique du cadre.
              </p>
            </div>

            <div className="flex items-center p-1 bg-white rounded-xl border border-sand-200 shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setSelectedDevice('browser')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDevice === 'browser'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-sand-50'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Navigateur</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDevice('macbook')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDevice === 'macbook'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-sand-50'
                }`}
              >
                <Laptop className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">MacBook</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDevice('iphone')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDevice === 'iphone'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-sand-50'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">iPhone</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDevice('ipad')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedDevice === 'ipad'
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-sand-50'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">iPad</span>
              </button>
            </div>
          </div>

          {/* Scène de Démonstration 3D Haute Résolution */}
          <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-950 to-stone-950 p-6 sm:p-12 lg:p-16 flex items-center justify-center min-h-[380px] sm:min-h-[500px] border border-stone-800 shadow-2xl">
            {/* Grille d'arrière-plan tech */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#818cf8_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Cadre de l'Appareil Actif */}
            <div className={`relative z-10 w-full transition-all duration-500 transform hover:scale-[1.01] ${
              selectedDevice === 'iphone'
                ? 'max-w-xs'
                : selectedDevice === 'ipad'
                ? 'max-w-xl'
                : 'max-w-3xl'
            }`}>
              
              {/* STYLE NAVIGATEUR & MACBOOK */}
              {(selectedDevice === 'browser' || selectedDevice === 'macbook') && (
                <div className="rounded-2xl overflow-hidden bg-stone-900/95 border border-stone-700/80 shadow-2xl backdrop-blur-md">
                  {/* Barre d'adresse Safari / macOS */}
                  <div className="bg-stone-950/80 px-4 py-3 border-b border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-rose-500/90" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/90" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/90" />
                    </div>
                    <div className="px-4 py-1 rounded-lg bg-stone-800/90 text-[11px] font-mono text-stone-300 border border-stone-700 flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>https://analytics-cloud.io/dashboard</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-violet-500/20 text-violet-300 border border-violet-500/30">
                        Export 4K
                      </span>
                    </div>
                  </div>

                  {/* Contenu de Démonstration Pro : Dashboard SaaS */}
                  <div className="p-5 sm:p-7 bg-stone-900 text-white space-y-5">
                    {/* Top KPI row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-stone-800">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-stone-400">Projet Actif</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                            En Ligne
                          </span>
                        </div>
                        <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white mt-0.5">
                          OmniMetrics Cloud Suite
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-md">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Période : 30 derniers jours</span>
                        </span>
                      </div>
                    </div>

                    {/* Grille de 3 KPIs */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                        <div className="flex items-center justify-between text-stone-400 text-xs">
                          <span>Revenus Mensuels</span>
                          <TrendingUp className="w-4 h-4 text-emerald-400" />
                        </div>
                        <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">48 920 €</p>
                        <p className="text-[11px] text-emerald-400 font-semibold">+24.5% vs mois précédent</p>
                      </div>

                      <div className="p-4 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                        <div className="flex items-center justify-between text-stone-400 text-xs">
                          <span>Utilisateurs Actifs</span>
                          <BarChart3 className="w-4 h-4 text-violet-400" />
                        </div>
                        <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">124 500</p>
                        <p className="text-[11px] text-violet-400 font-semibold">+18% nouvelles inscriptions</p>
                      </div>

                      <div className="p-4 rounded-xl bg-stone-800/60 border border-stone-700/60 space-y-1">
                        <div className="flex items-center justify-between text-stone-400 text-xs">
                          <span>Taux de Conversion</span>
                          <Sparkles className="w-4 h-4 text-amber-400" />
                        </div>
                        <p className="text-xl sm:text-2xl font-extrabold text-white font-mono">4.82 %</p>
                        <p className="text-[11px] text-amber-400 font-semibold">Supérieur à la moyenne B2B</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE IPHONE 16 PRO */}
              {selectedDevice === 'iphone' && (
                <div className="rounded-[40px] p-3 bg-stone-800 border-4 border-stone-700 shadow-2xl relative">
                  {/* Dynamic Island */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-stone-900 border border-stone-700 mr-2" />
                  </div>

                  <div className="rounded-[32px] overflow-hidden bg-stone-900 text-white p-5 pt-12 space-y-4">
                    <div className="text-center space-y-1">
                      <p className="text-[11px] text-stone-400 uppercase font-semibold">Solde Total</p>
                      <p className="text-3xl font-extrabold font-mono text-white">8 450.00 €</p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white space-y-2 shadow-lg">
                      <p className="text-xs font-bold">Carte Virtuelle Pro</p>
                      <p className="text-sm font-mono tracking-widest">•••• 8824</p>
                      <div className="flex justify-between items-center text-[10px] opacity-80 pt-1">
                        <span>EXP : 12/28</span>
                        <span>VISA PLATINUM</span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-bold text-stone-400">Activité Récente</p>
                      <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-stone-800/80">
                        <span>Abonnement SaaS</span>
                        <span className="font-mono text-emerald-400 font-bold">+ 149.00 €</span>
                      </div>
                      <div className="flex justify-between items-center text-xs p-2 rounded-xl bg-stone-800/80">
                        <span>Paiement Stripe</span>
                        <span className="font-mono text-stone-300 font-bold">- 19.00 €</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STYLE IPAD PRO */}
              {selectedDevice === 'ipad' && (
                <div className="rounded-3xl p-3 bg-stone-800 border-2 border-stone-700 shadow-2xl">
                  <div className="rounded-2xl overflow-hidden bg-stone-900 text-white p-6 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-stone-800">
                      <h4 className="font-bold text-sm">Portfolio Édition Tablette</h4>
                      <span className="text-xs text-stone-400 font-mono">Dalle Liquid Retina 120Hz</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="h-28 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 p-3 flex flex-col justify-end">
                        <span className="text-xs font-bold">Identité Graphique</span>
                      </div>
                      <div className="h-28 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-3 flex flex-col justify-end">
                        <span className="text-xs font-bold">Expérience Mobile</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Barre d'action rapide sous la démonstration */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 text-xs text-stone-600">
              <span className="flex items-center gap-1 font-semibold text-stone-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Perspective 3D dynamique
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-stone-800">
                <Copy className="w-4 h-4 text-violet-600" />
                Copie presse-papier 1 clic
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold text-stone-800">
                <Download className="w-4 h-4 text-indigo-600" />
                Exportation 4K
              </span>
            </div>

            <button
              type="button"
              onClick={scrollToTop}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <span>Créer un Mockup avec mon site</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. GRILLE DES 4 CAS D'USAGE MÉTIERS */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Pensé pour tous les professionnels du numérique
            </h3>
            <p className="text-xs sm:text-sm text-stone-500">
              Que vous soyez une agence, un fondateur de startup ou un designer indépendant, OmniMockup sublime votre travail.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {USE_CASES.map((uc, idx) => {
              const IconComp = uc.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-sand-50/70 border border-sand-200/80 hover:border-violet-300 hover:bg-white shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider mb-2 ${uc.badgeColor}`}>
                        {uc.badge}
                      </span>
                      <h4 className="font-extrabold text-stone-900 text-base">{uc.title}</h4>
                      <p className="text-xs text-violet-700 font-semibold">{uc.subtitle}</p>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed">
                      {uc.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={scrollToTop}
                    className="pt-3 border-t border-sand-200/60 flex items-center justify-between text-xs font-bold text-violet-700 hover:text-violet-900 group"
                  >
                    <span>Essayer maintenant</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. MODÈLES DE DÉMONSTRATION DIRECTS (SaaS, Mobile, E-commerce, Design) */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-sand-200 pb-4">
            <div>
              <h3 className="text-lg sm:text-2xl font-bold text-stone-900">
                Exemples de Réalisations Populaires
              </h3>
              <p className="text-xs text-stone-500">
                Cliquez sur n&apos;importe quel exemple pour lancer instantanément la capture dans notre studio.
              </p>
            </div>
            <span className="text-xs font-bold text-violet-600 font-mono hidden sm:inline">
              Sélectionnez un preset pour tester →
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRESET_SHOWCASES.map((item) => {
              const DeviceIcon =
                item.device === 'macbook'
                  ? Laptop
                  : item.device === 'iphone'
                  ? Smartphone
                  : item.device === 'ipad'
                  ? Tablet
                  : Monitor;

              return (
                <div
                  key={item.id}
                  onClick={() => onSelectPreset && onSelectPreset(item.url)}
                  className="group bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-violet-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  {/* Bannière avec dégradé d'ambiance */}
                  <div className={`relative h-44 bg-gradient-to-br ${item.gradient} p-4 flex items-center justify-center overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />

                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] font-semibold flex items-center gap-1.5 z-10">
                      <DeviceIcon className="w-3 h-3 text-amber-300" />
                      <span>{item.category}</span>
                    </div>

                    {/* Simulation d'appareil 3D miniature */}
                    <div className="relative z-10 w-[85%] bg-stone-900 rounded-xl shadow-2xl p-3 border border-white/30 transform group-hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-1 mb-2 pb-1 border-b border-stone-800">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 bg-stone-700 rounded w-3/4" />
                        <div className="h-1.5 bg-stone-800 rounded w-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Détails du modèle */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                        {item.tag}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 group-hover:text-violet-600 transition-colors">
                        {item.name}
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-sand-100 flex items-center justify-between text-xs font-semibold text-violet-700">
                      <span>Tester ce modèle</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. LANCEMENT & PREMIERS RETOURS */}
        <div className="bg-sand-50/70 rounded-3xl border border-sand-200 p-6 sm:p-10 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 bg-violet-100 px-3 py-1 rounded-full border border-violet-200 inline-block">
              Lancé en octobre 2026
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-stone-900">
              Les premiers retours arrivent bientôt
            </h3>
            <p className="text-xs text-stone-500">
              OmniMockup Studio vient d&apos;être lancé. Testez le studio et partagez vos impressions pour façonner les prochaines fonctionnalités.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-sand-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-base">🚀</span>
                <h4 className="text-sm font-bold text-stone-900">Moteur 3D Temps Réel 60fps</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Rendu WebGL haute précision : ajustez les angles, les ombrages et les reflets instantanément sur MacBook Pro et iPhone 16.
                </p>
              </div>
              <div className="pt-2 border-t border-sand-100 text-[11px] font-semibold text-violet-700">
                100% interactif dans votre navigateur
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-sand-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-base">✨</span>
                <h4 className="text-sm font-bold text-stone-900">Exports 4K Retina & Vidéo</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Exportez en qualité ultra-haute fidélité sans filigrane, ou générez une vidéo animée prête pour vos posts sur les réseaux sociaux.
                </p>
              </div>
              <div className="pt-2 border-t border-sand-100 text-[11px] font-semibold text-violet-700">
                Format prêt pour Twitter/X & LinkedIn
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-sand-200 shadow-xs space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-base">💬</span>
                <h4 className="text-sm font-bold text-stone-900">Développé avec vos suggestions</h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Vous avez une idée de mockup, d&apos;appareil ou d&apos;effet ? Notre équipe prend en compte chaque retour pour les mises à jour hebdomadaires.
                </p>
              </div>
              <div className="pt-2 border-t border-sand-100 text-[11px] font-semibold text-violet-700">
                Support réactif & direct
              </div>
            </div>
          </div>
        </div>

        {/* 6. BANNIÈRE D'APPEL À L'ACTION FINALE */}
        <div className="relative rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 p-8 sm:p-12 text-white text-center shadow-xl overflow-hidden space-y-6">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]" />
          
          <div className="relative z-10 max-w-2xl mx-auto space-y-3">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Prêt à sublimer votre prochain projet ?
            </h3>
            <p className="text-xs sm:text-sm text-violet-100 leading-relaxed">
              Rejoignez les créateurs qui exportent leurs mockups 3D en quelques clics. C&apos;est gratuit et sans inscription pour démarrer.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={scrollToTop}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-white hover:bg-stone-100 text-violet-800 font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span>Créer mon premier Mockup</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
