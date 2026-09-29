'use client';

import React from 'react';
import {
  Sparkles,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  ArrowRight,
  CheckCircle2,
  Wand2,
} from 'lucide-react';

interface ShowcaseItem {
  id: string;
  title: string;
  category: string;
  description: string;
  device: 'browser' | 'macbook' | 'iphone' | 'ipad';
  gradient: string;
  badge: string;
  presetUrl: string;
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  {
    id: 'foodtruck-app',
    title: 'FoodTruck Ordering SaaS',
    category: 'Application Web & Mobile',
    description: 'Interface de commande en ligne pour camion gourmand avec paiement Stripe et géolocalisation.',
    device: 'browser',
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
    badge: 'Restauration & E-commerce',
    presetUrl: 'https://stripe.com',
  },
  {
    id: 'pulse-analytics',
    title: 'Pulse Analytics Dashboard 4K',
    category: 'SaaS B2B & Metrics',
    description: 'Tableau de bord financier pour startups SaaS avec visualisations de graphiques en temps réel.',
    device: 'macbook',
    gradient: 'from-violet-600 via-indigo-600 to-cyan-500',
    badge: 'Fintech & Analytics',
    presetUrl: 'https://nextjs.org',
  },
  {
    id: 'mobile-fitness',
    title: 'FitPulse iOS Application',
    category: 'Application Mobile iOS',
    description: 'Mockup iPhone 15 Pro Dynamic Island avec suivi d’entraînement et capteurs de rythme cardiaque.',
    device: 'iphone',
    gradient: 'from-emerald-500 via-teal-600 to-cyan-600',
    badge: 'Santé & Mobile',
    presetUrl: 'https://apple.com',
  },
  {
    id: 'creative-studio',
    title: 'Minimalist Portfolio & Agency',
    category: 'Site Vitrine Haute Fidélité',
    description: 'Présentation de portfolio d’agence créative avec typographie suisse et verre trempé.',
    device: 'ipad',
    gradient: 'from-stone-900 via-indigo-950 to-violet-950',
    badge: 'Studio & Design',
    presetUrl: 'https://tailwindcss.com',
  },
];

interface DescriptionShowcaseSectionProps {
  onSelectPreset?: (url: string) => void;
}

export const DescriptionShowcaseSection: React.FC<DescriptionShowcaseSectionProps> = ({
  onSelectPreset,
}) => {
  return (
    <section className="w-full py-16 sm:py-24 bg-white border-t border-sand-200" id="showcase-description">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* EN-TÊTE DE SECTION */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-100 border border-violet-200 text-violet-800 text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Galerie de Présentations &amp; Modèles de Description</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-stone-900 leading-tight">
            Des présentations produits digne des{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600">
              plus grands studios Dribbble
            </span>
          </h2>

          <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
            Chaque mockup est conçu pour mettre en valeur le design de votre site web, votre application mobile ou votre SaaS avec un réalisme photo 4K immédiat.
          </p>
        </div>

        {/* HERO CARDE DE DESCRIPTION STYLE DRIBBBLE (Inspiré de l'Image 2) */}
        <div className="bg-sand-50 rounded-3xl border border-sand-200/80 p-6 sm:p-10 shadow-xl space-y-8">
          
          {/* Mockup Grand Format Central avec Fenêtre de Navigateur */}
          <div className="relative rounded-2xl overflow-hidden bg-stone-900 border border-stone-800 shadow-2xl group">
            {/* Barre de contrôle Navigateur Dribbble */}
            <div className="bg-stone-950/90 px-4 py-3 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
              </div>
              <div className="px-4 py-1 rounded-lg bg-stone-800/80 text-[11px] font-mono text-stone-300 border border-stone-700 flex items-center gap-2">
                <span>https://foodtruck-ordering-app.com</span>
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-stone-400">
                <span className="px-2 py-0.5 rounded bg-violet-600/30 text-violet-300 border border-violet-500/30">HD 4K</span>
              </div>
            </div>

            {/* Arrière-plan & Visuel Produit */}
            <div className="relative min-h-[320px] sm:min-h-[440px] bg-gradient-to-br from-indigo-900 via-slate-900 to-stone-900 flex items-center justify-center p-6 sm:p-12 overflow-hidden">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px]" />
              
              <div className="relative z-10 max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-4 border border-sand-200 transform group-hover:scale-[1.01] transition-transform duration-500">
                <div className="flex items-center justify-between pb-3 border-b border-sand-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                      🍔
                    </div>
                    <div>
                      <h4 className="font-extrabold text-stone-900 text-base">Gourmet Truck Express</h4>
                      <p className="text-xs text-stone-500">Commande en ligne &amp; Click &amp; Collect</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    Ouvert · 15-20 min
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
                    <p className="font-bold text-stone-900">Burger Signature Truffe</p>
                    <p className="text-stone-500">Bœuf d&apos;Aubrac &amp; Gouda truffé</p>
                    <p className="font-mono font-bold text-violet-600 text-sm mt-1">16.90 €</p>
                  </div>
                  <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 space-y-1">
                    <p className="font-bold text-stone-900">Frites Maison Romarin</p>
                    <p className="text-stone-500">Double cuisson traditionnelle</p>
                    <p className="font-mono font-bold text-violet-600 text-sm mt-1">4.50 €</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectPreset && onSelectPreset('https://stripe.com')}
                  className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
                >
                  <span>Commander maintenant</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Description & Fiche Créateur (Inspirée du layout Dribbble Image 2) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
            <div className="lg:col-span-8 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-violet-700 uppercase tracking-wider font-mono">
                <Wand2 className="w-4 h-4 text-violet-600" />
                <span>Cas d&apos;étude &amp; Description Produit</span>
              </div>

              <h3 className="text-xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
                Création d&apos;un système automatisé de commande en ligne pour Restauration &amp; SaaS
              </h3>

              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Une application web intuitive pensée pour optimiser les ventes directes. Grâce à l&apos;analyseur d&apos;OmniMockup, la capture est transformée instantanément en un visuel 4K haute résolution, idéal pour vos présentations d&apos;agences, portfolios Dribbble ou campagnes réseaux sociaux.
              </p>
            </div>

            {/* Carte Profil Auteur / Directeur IA */}
            <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-sand-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-bold text-base flex items-center justify-center shrink-0 border-2 border-white shadow-md">
                DA
              </div>
              <div className="space-y-0.5 min-w-0">
                <h4 className="text-xs font-extrabold text-stone-900 truncate">Directeur Artistique IA</h4>
                <p className="text-[11px] text-stone-500 truncate">Expertise UX/UI &amp; Composition</p>
                <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span>Disponible pour audit 1-Clic</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GRILLE DES 4 MODÈLES SHOWCASE ("Voir d'autres réalisations") */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-sand-200 pb-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-stone-900">
                Modèles de Présentation Populaires
              </h3>
              <p className="text-xs text-stone-500">
                Cliquez sur n&apos;importe quel modèle pour l&apos;essayer directement dans notre studio d&apos;édition.
              </p>
            </div>
            <span className="text-xs font-bold text-violet-600 font-mono hidden sm:inline">
              4 Modèles Réalisés →
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {SHOWCASE_ITEMS.map((item) => {
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
                  onClick={() => onSelectPreset && onSelectPreset(item.presetUrl)}
                  className="group bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-violet-300 transition-all duration-300 cursor-pointer flex flex-col justify-between"
                >
                  {/* Image de fond avec gradient */}
                  <div className={`relative h-44 bg-gradient-to-br ${item.gradient} p-4 flex items-center justify-center overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                    
                    {/* Badge de cadre */}
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/40 backdrop-blur-md border border-white/20 text-white text-[10px] font-semibold flex items-center gap-1.5 z-10">
                      <DeviceIcon className="w-3 h-3 text-amber-300" />
                      <span>{item.category}</span>
                    </div>

                    {/* Simulation de carte mockup */}
                    <div className="relative z-10 w-[85%] bg-white rounded-xl shadow-2xl p-3 border border-white/40 transform group-hover:scale-105 transition-transform duration-300">
                      <div className="flex items-center gap-1 mb-2 pb-1 border-b border-sand-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="h-2 bg-sand-200 rounded w-3/4" />
                        <div className="h-1.5 bg-sand-100 rounded w-1/2" />
                      </div>
                    </div>
                  </div>

                  {/* Contenu carte */}
                  <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600">
                        {item.badge}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900 group-hover:text-violet-600 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-sand-100 flex items-center justify-between text-xs font-semibold text-violet-700">
                      <span>Ouvrir ce modèle</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
