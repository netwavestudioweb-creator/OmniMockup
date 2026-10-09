'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { UrlInputForm } from '@/components/UrlInputForm';
import { SceneEditor } from '@/components/SceneEditor';

import { Footer } from '@/components/Footer';
import { FounderApplicationForm } from '@/components/FounderApplicationForm';
import { safeFetchJson } from '@/lib/api';
import {
  CaptureItemResult,
  CaptureResponse,
} from '@/types/analyzer';
import { useCurrency } from '@/context/CurrencyContext';
import { PLANS, formatPrice, getPlanMonthlyPrice, getPlanMonthlyEquivalent } from '@/lib/pricing';
import {
  Loader2,
  Monitor,
  Smartphone,
  ArrowRight,
  Zap,
  Download,
  Copy,
  Link2,
  ImagePlus,
  Aperture,
  Palette,
  ScanLine,
  CheckCircle2,
  XCircle,
  X as XIcon,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Globe,
  Layout,
  Shield,
  Wand2,
  Rocket,
  Users,
  BadgeCheck,
  Watch,
} from 'lucide-react';

const AGENCY_USES = [
  {
    label: 'Devis',
    icon: Wand2,
    title: 'Propositions commerciales',
    sub: 'Gagnez le client',
    desc: 'Montrez à votre prospect à quoi ressemblera son futur site, ou présentez vos réalisations dans des mockups dignes d\'une grande agence.',
    gradient: 'from-violet-600 to-indigo-600',
  },
  {
    label: 'Livraison',
    icon: BadgeCheck,
    title: 'Livraison du site au client',
    sub: 'Marquez la fin du projet',
    desc: 'Remettez le site avec un kit de visuels prêts à publier : ordinateur, mobile et tablette, dans les formats des réseaux sociaux.',
    gradient: 'from-indigo-600 to-fuchsia-600',
  },
  {
    label: 'Portfolio',
    icon: Layout,
    title: 'Portfolio & page Réalisations',
    sub: 'Valorisez votre travail',
    desc: 'Mettez à jour votre page Réalisations en quelques minutes, avec un rendu homogène pour tous vos projets.',
    gradient: 'from-fuchsia-600 to-rose-600',
  },
  {
    label: 'Réseaux',
    icon: Users,
    title: 'Annonce sur LinkedIn & Instagram',
    sub: 'Attirez les prochains clients',
    desc: 'Annoncez chaque site livré avec un visuel au bon format : 1.91:1 pour LinkedIn, 1:1 et 9:16 pour Instagram.',
    gradient: 'from-amber-500 to-orange-500',
  },
];

export default function HomePage() {
  const { currency } = useCurrency();

  const [activeCaptureItem, setActiveCaptureItem] = useState<CaptureItemResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('Connexion au serveur...');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePricingPlan, setActivePricingPlan] = useState<number>(2); // 0=Découverte, 1=Solo, 2=Pro (recommandé), 3=Agence
  const [activeStep, setActiveStep] = useState<number>(0); // 0=01 Collez, 1=02 Personnalisez, 2=03 Exportez
  const [activeUseCase, setActiveUseCase] = useState<number>(0); // index dans AGENCY_USES
  const [heroMobileDevice, setHeroMobileDevice] = useState<'iphone' | 'watch'>('iphone');

  const handleAnalyzeUrl = async (urlToCapture: string, settings?: import('@/types/analyzer').CaptureSettings) => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingStep('Lancement du moteur de capture...');

    try {
      const stepTimer1 = setTimeout(() => {
        setLoadingStep('Rendu HD & suppression des bannières...');
      }, 900);

      const stepTimer2 = setTimeout(() => {
        setLoadingStep('Préparation du Studio 3D...');
      }, 2200);

      const captureData = await safeFetchJson<CaptureResponse>('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targets: [urlToCapture],
          fullPage: settings?.fullPage ?? true,
          hideBanners: settings?.hideBanners ?? true,
          viewport: settings
            ? { width: settings.viewportWidth, height: settings.viewportHeight }
            : { width: 1440, height: 900 },
        }),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      const firstSuccess = captureData.results?.find((r) => r.success && r.screenshotBase64);

      if (firstSuccess) {
        setActiveCaptureItem(firstSuccess);
        setIsLoading(false);
      } else {
        throw new Error('Impossible de réaliser la capture de cette page web.');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e?.message || 'Erreur lors de la capture.');
      setIsLoading(false);
    }
  };

  const handleUploadImage = (base64Image: string, title: string) => {
    setActiveCaptureItem({
      url: 'Image locale',
      title: title || 'Capture téléversée',
      success: true,
      screenshotBase64: base64Image,
      capturedAt: new Date().toISOString(),
      durationMs: 0,
    });
  };

  const handleReset = () => {
    setActiveCaptureItem(null);
    setErrorMessage(null);
  };

  if (activeCaptureItem) {
    return (
      <div className="fixed inset-0 z-50 w-screen h-screen bg-zinc-950 overflow-hidden flex flex-col select-none">
        <SceneEditor
          captureItem={activeCaptureItem}
          initialMockup="browser"
          onClose={handleReset}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-violet-500/30 selection:text-violet-200 w-full max-w-full overflow-x-hidden">
      <Navbar />
          {/* ═══════════ HERO SECTION ═══════════ */}
          <section className="relative hero-mesh noise overflow-hidden">
            {/* Background elements */}
            <div className="absolute inset-0 dot-grid opacity-60 pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-[700px] h-[700px] rounded-full bg-violet-700/10 blur-[120px] pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-indigo-700/10 blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-20 sm:pb-28 flex flex-col items-center text-center">
              {/* Badge centré */}
              <div className="animate-fade-in inline-flex items-center gap-2 px-4 py-2 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs sm:text-sm font-semibold mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500" />
                </span>
                Pour les agences web &amp; freelances
                <span className="px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-200 text-[10px] font-bold border border-violet-400/30">NEW</span>
              </div>

              {/* Titre principal centré — Phrase complète sans coupure artificielle */}
              <h1 className="animate-fade-in delay-100 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
                Présentez vos sites clients comme une <span className="shimmer-text">agence haut de gamme</span>
              </h1>

              {/* Sous-titre centré — Complet et équilibré */}
              <p className="animate-fade-in delay-200 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
                Collez l&apos;URL d&apos;un site. OmniMockup capture la page automatiquement et la met en scène sur MacBook, iPhone et iPad. Prêt à envoyer au client en quelques secondes.
              </p>

              {/* Champ de saisie d'URL centré et aéré — Pièce maîtresse */}
              <div className="animate-fade-in delay-300 w-full max-w-3xl mx-auto mb-8">
                <UrlInputForm
                  onAnalyze={handleAnalyzeUrl}
                  onUploadImage={handleUploadImage}
                  isLoading={isLoading}
                  errorMessage={errorMessage}
                />
              </div>

              {/* Éléments de réassurance centrés */}
              <div className="animate-fade-in delay-400 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs sm:text-sm text-zinc-400 font-medium mb-6">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-violet-400" />
                  Résultat en moins de 5 secondes
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:block" />
                <span className="flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-indigo-400" />
                  Export jusqu&apos;en 4K (plan Pro)
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:block" />
                <span className="flex items-center gap-1.5">
                  <Copy className="w-4 h-4 text-emerald-400" />
                  1 clic presse-papier
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:block" />
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Essai sans inscription ni carte bancaire
                </span>
              </div>

              {/* Lancement (sans fausse preuve sociale) */}
              <div className="animate-fade-in delay-500 flex items-center justify-center mb-12 sm:mb-16">
                <a
                  href="#agences-fondatrices"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs sm:text-sm text-zinc-300 font-medium hover:border-violet-400/40 hover:text-white transition-colors"
                >
                  <Rocket className="w-4 h-4 text-violet-400" />
                  Lancé en octobre 2026 · Nous cherchons 10 agences fondatrices
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Prévisualisation Produit 3D — Spécifique PC (MacBook Pro) et Mobile (iPhone 16 Pro) */}
              <div className="animate-fade-in delay-500 relative w-full max-w-4xl mx-auto">
                {/* ═══════════ AFFICHAGE PC (Grand Écran) : MacBook Pro M3 Traité avec Netwave Studio ═══════════ */}
                <div className="hidden sm:block">
                  <div className="animate-float glow-violet rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl w-full bg-zinc-950">
                    {/* Barre d'en-tête navigateur macOS */}
                    <div className="bg-zinc-900 px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                          <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                          <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                        </div>
                        <span className="text-[11px] font-mono text-zinc-500 ml-2">MacBook Pro M3</span>
                      </div>
                      
                      {/* Barre d'adresse URL réelle */}
                      <div className="flex-1 max-w-md mx-4 px-3 py-1.5 rounded-lg bg-zinc-800/90 text-xs font-mono text-zinc-300 flex items-center justify-between border border-zinc-700/60 shadow-inner">
                        <div className="flex items-center gap-2 truncate">
                          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="text-zinc-200 font-semibold truncate">https://netwavestudio.com</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono shrink-0 ml-2">SSL ACTIF</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 text-[11px] font-bold border border-violet-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3" /> Traitement 3D
                        </span>
                      </div>
                    </div>

                    {/* Vrai contenu traité : Netwave Studio & OmniMockup */}
                    <div className="relative bg-gradient-to-br from-zinc-950 via-zinc-900 to-black p-6 sm:p-8 text-left overflow-hidden">
                      {/* Halos lumineux en arrière-plan */}
                      <div className="absolute top-0 right-1/4 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute bottom-0 left-1/4 w-60 h-60 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

                      <div className="relative z-10 space-y-6">
                        {/* Mini Navbar du site capturé */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-black text-white text-xs shadow-md">
                              NW
                            </div>
                            <span className="font-bold text-white text-sm tracking-tight">NETWAVE STUDIO</span>
                          </div>
                          <div className="flex items-center gap-6 text-xs text-zinc-400 font-medium">
                            <span className="hover:text-white transition-colors cursor-pointer">Services</span>
                            <span className="hover:text-white transition-colors cursor-pointer">Méthodologie</span>
                            <span className="hover:text-white transition-colors cursor-pointer">Réalisations</span>
                            <span className="hover:text-white transition-colors cursor-pointer">Tarifs</span>
                          </div>
                          <span className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs font-semibold border border-white/15">
                            Lancer mon projet →
                          </span>
                        </div>

                        {/* Hero Section réelle du site capturé */}
                        <div className="grid grid-cols-12 gap-6 items-center pt-2">
                          <div className="col-span-7 space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                              Agence Web & Créateurs Numériques
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
                              Des expériences web <span className="shimmer-text">qui captivent</span> et convertissent.
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                              Conception de sites ultra-rapides, interfaces immersives et mockups 3D nouvelle génération pour propulser vos offres.
                            </p>
                            <div className="flex items-center gap-3 pt-1">
                              <div className="px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-600/30">
                                Découvrir nos réalisations
                              </div>
                              <div className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold border border-zinc-700">
                                Réserver un appel
                              </div>
                            </div>
                          </div>

                          {/* Carte d'illustration visuelle */}
                          <div className="col-span-5">
                            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-violet-500/30 shadow-xl space-y-2.5">
                              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                                <Layout className="w-3.5 h-3.5 text-violet-400" />
                                Formats prêts à envoyer
                              </div>
                              {[
                                { name: 'Présentation client', ratio: '16:9' },
                                { name: 'Post LinkedIn', ratio: '1.91:1' },
                                { name: 'Post Instagram', ratio: '1:1' },
                              ].map((row) => (
                                <div key={row.name} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50 text-[11px]">
                                  <span className="text-zinc-300">{row.name}</span>
                                  <span className="font-bold font-mono text-emerald-400">{row.ratio}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Barre d'action inférieure sur PC avec caractéristiques du traitement */}
                    <div className="bg-zinc-950 border-t border-white/8 px-6 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-zinc-400">
                        <span className="flex items-center gap-1.5 font-medium text-zinc-300">
                          <Monitor className="w-4 h-4 text-violet-400" /> MacBook Pro M3
                        </span>
                        <span className="text-zinc-700">|</span>
                        <span>Perspective 3D : 14°</span>
                        <span className="text-zinc-700">|</span>
                        <span className="text-emerald-400 font-semibold">Rendu 4K Ultra-HD</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
                      >
                        Tester avec mon site <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* ═══════════ AFFICHAGE MOBILE : Carrousel iPhone 16 Pro & Apple Watch Ultra ═══════════ */}
                <div className="block sm:hidden">
                  <div className="flex flex-col items-center gap-4">
                    {/* Sélecteur d'appareil mobile : iPhone vs Montre connectée */}
                    <div className="flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 shadow-inner w-full max-w-[280px]">
                      <button
                        type="button"
                        onClick={() => setHeroMobileDevice('iphone')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          heroMobileDevice === 'iphone'
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Smartphone className="w-3.5 h-3.5" />
                        iPhone 16 Pro Max
                      </button>
                      <button
                        type="button"
                        onClick={() => setHeroMobileDevice('watch')}
                        className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          heroMobileDevice === 'watch'
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        <Watch className="w-3.5 h-3.5" />
                        Apple Watch
                      </button>
                    </div>

                    {/* VUE 1 : iPhone 16 Pro Max — Image photoréaliste authentique */}
                    {heroMobileDevice === 'iphone' ? (
                      <div className="w-full max-w-[300px] mx-auto relative animate-fade-in">
                        {/* Halo lumineux violet derrière le téléphone */}
                        <div className="absolute inset-0 -z-10 rounded-[40px] blur-3xl opacity-50 bg-gradient-to-b from-violet-600/40 via-indigo-600/20 to-transparent scale-110" />

                        {/* Vraie image photoréaliste iPhone 16 Pro Max */}
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/iphone16-promax-netwave.jpg"
                          alt="iPhone 16 Pro Max affichant le site Netwave Studio"
                          className="w-full h-auto object-contain drop-shadow-[0_30px_60px_rgba(124,58,237,0.5)] animate-float"
                          loading="eager"
                        />

                        {/* Badge flottant Dynamic Island */}
                        <div className="absolute top-[18%] right-[-8px] flex flex-col items-end gap-1.5">
                          <div className="bg-black/80 backdrop-blur-sm border border-violet-500/40 text-[9px] font-bold text-violet-300 px-2 py-1 rounded-lg shadow-lg flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Dynamic Island
                          </div>
                          <div className="bg-black/80 backdrop-blur-sm border border-zinc-700/60 text-[9px] font-mono text-emerald-400 px-2 py-1 rounded-lg shadow-lg">
                            Super Retina XDR 6.9&quot;
                          </div>
                        </div>

                        {/* Badge Titane Natural en bas */}
                        <div className="absolute bottom-[12%] left-1/2 -translate-x-1/2">
                          <div className="bg-black/80 backdrop-blur-sm border border-zinc-700/60 text-[9px] font-bold text-zinc-300 px-3 py-1 rounded-full shadow-xl whitespace-nowrap flex items-center gap-1.5">
                            <Sparkles className="w-2.5 h-2.5 text-violet-400" />
                            iPhone 16 Pro Max · Titane Naturel
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* VUE 2 : Apple Watch Ultra connectée */
                      <div className="w-full max-w-[240px] mx-auto flex flex-col items-center animate-fade-in">
                        {/* Bracelet supérieur */}
                        <div className="w-28 h-3.5 bg-gradient-to-b from-zinc-800 to-zinc-700 rounded-t-lg shadow-sm border-t border-zinc-600" />

                        {/* Boîtier Apple Watch Ultra titane */}
                        <div className="w-full relative rounded-[38px] p-2.5 bg-gradient-to-b from-zinc-700 via-zinc-800 to-zinc-900 shadow-2xl border-2 border-zinc-600">
                          {/* Couronne numérique à droite */}
                          <div className="absolute -right-2 top-8 w-2 h-9 bg-gradient-to-b from-zinc-500 via-zinc-600 to-zinc-500 rounded-r-md border border-zinc-400 shadow-sm flex items-center justify-center">
                            <div className="w-0.5 h-6 bg-zinc-800 rounded-full" />
                          </div>

                          {/* Bouton latéral droit */}
                          <div className="absolute -right-1.5 top-20 w-1.5 h-7 bg-zinc-600 rounded-r-sm border border-zinc-500" />

                          {/* Écran montre tactile */}
                          <div className="relative rounded-[28px] overflow-hidden aspect-[4/5] bg-black p-3.5 flex flex-col justify-between text-left border border-white/10 shadow-inner">
                            {/* En-tête montre */}
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-mono font-bold text-amber-400">09:41</span>
                              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            </div>

                            {/* Contenu montre Netwave Studio */}
                            <div className="space-y-1.5 my-auto">
                              <div className="flex items-center gap-1.5">
                                <div className="w-4 h-4 rounded-sm bg-violet-600 flex items-center justify-center font-bold text-white text-[8px]">
                                  NW
                                </div>
                                <span className="text-[11px] font-black text-white tracking-tight">NETWAVE</span>
                              </div>
                              <p className="text-[10px] font-bold text-zinc-200">Studio Web & 3D</p>
                              <div className="flex items-center gap-1 text-[9px] text-emerald-400 font-mono">
                                <CheckCircle2 className="w-3 h-3" /> Mockup Prêt 4K
                              </div>
                            </div>

                            {/* Bouton d'action tactile montre */}
                            <button
                              type="button"
                              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                              className="w-full py-1.5 px-2 rounded-lg bg-violet-600 text-[10px] font-bold text-white text-center shadow-md active:scale-95 transition-transform"
                            >
                              Ouvrir en 3D
                            </button>
                          </div>
                        </div>

                        {/* Bracelet inférieur */}
                        <div className="w-28 h-3.5 bg-gradient-to-b from-zinc-700 to-zinc-800 rounded-b-lg shadow-sm border-b border-zinc-600" />
                      </div>
                    )}

                    {/* Contrôles du carrousel mobile (Précédent / Puces / Suivant) */}
                    <div className="flex items-center justify-center gap-3 mt-1">
                      <button
                        type="button"
                        onClick={() => setHeroMobileDevice((prev) => (prev === 'iphone' ? 'watch' : 'iphone'))}
                        className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-white"
                        aria-label="Appareil précédent"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => setHeroMobileDevice('iphone')}
                          className={`h-1.5 rounded-full transition-all ${
                            heroMobileDevice === 'iphone' ? 'w-5 bg-violet-500' : 'w-2 bg-zinc-700'
                          }`}
                          aria-label="iPhone 16 Pro Max"
                        />
                        <button
                          type="button"
                          onClick={() => setHeroMobileDevice('watch')}
                          className={`h-1.5 rounded-full transition-all ${
                            heroMobileDevice === 'watch' ? 'w-5 bg-violet-500' : 'w-2 bg-zinc-700'
                          }`}
                          aria-label="Apple Watch Ultra"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setHeroMobileDevice((prev) => (prev === 'iphone' ? 'watch' : 'iphone'))}
                        className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-white"
                        aria-label="Appareil suivant"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-[11px] text-zinc-400 font-medium">
                      {heroMobileDevice === 'iphone'
                        ? '📱 iPhone 16 Pro Max · Écran Super Retina XDR 6.9"'
                        : '⌚ Apple Watch Ultra · Cadran Titane 4K'}
                    </p>
                  </div>
                </div>

                {/* Badge flottant vérifié */}
                <div className="hidden sm:flex absolute -bottom-3 sm:-bottom-4 -right-2 sm:-right-4 bg-emerald-500 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-xl items-center gap-2">
                  <BadgeCheck className="w-4.5 h-4.5" /> Traitement 4K Haute Fidélité
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════ SOCIAL PROOF BAR ═══════════ */}
          <section className="border-y border-white/5 bg-zinc-900/40 py-5 overflow-hidden">
            <div className="max-w-5xl mx-auto px-4 flex flex-wrap items-center justify-center gap-6 sm:gap-10">
              {[
                { icon: Globe, label: 'Capture depuis l\'URL' },
                { icon: Zap, label: 'Résultat en quelques secondes' },
                { icon: Monitor, label: 'MacBook, iPhone, iPad' },
                { icon: ScanLine, label: 'Jusqu\'en 4K (Pro)' },
                { icon: BadgeCheck, label: 'Marque blanche (Agence)' },
                { icon: Shield, label: 'Sans inscription pour tester' },
              ].map((item, i) => (
                <React.Fragment key={i}>
                  <span className="flex items-center gap-2 text-sm text-zinc-400 font-semibold whitespace-nowrap">
                    <item.icon className="w-4 h-4 text-violet-400" />
                    {item.label}
                  </span>
                  {i < 5 && <span className="w-1 h-1 rounded-full bg-zinc-700 hidden sm:block" />}
                </React.Fragment>
              ))}
            </div>
          </section>

          {/* ═══════════ OLD WAY → NEW WAY ═══════════ */}
          <section className="bg-zinc-950 py-20 sm:py-28">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">Le problème</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
                  Vos clients jugent un site <span className="shimmer-text">sur une image</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  Proposition commerciale, livraison, portfolio : la première impression se joue sur un visuel. Une capture plate fait paraître un site à 3 000 € comme un site à 300 €.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Problems — Red */}
                <div className="rounded-2xl bg-rose-950/40 border border-rose-500/25 p-6 sm:p-8 flex flex-col gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                      <XCircle className="w-5 h-5 text-rose-400" />
                    </div>
                    <h3 className="font-bold text-rose-200 text-base sm:text-lg">Sans OmniMockup</h3>
                  </div>
                  {[
                    'Des captures plates qui ne mettent pas votre travail en valeur',
                    'Des heures non facturées à préparer des visuels sur Figma pour chaque client',
                    'Des captures d\'écran à refaire à la main à chaque modification du site',
                    'Des propositions commerciales qui ressemblent à celles de vos concurrents',
                    'Un portfolio d\'agence qui ne reflète pas le niveau de vos réalisations',
                  ].map((pb, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <XCircle className="w-4 h-4 text-rose-500 mt-1 shrink-0" />
                      <span className="text-rose-300/85 text-sm leading-relaxed">{pb}</span>
                    </div>
                  ))}
                </div>

                {/* Solutions — Green */}
                <div className="rounded-2xl bg-emerald-950/40 border border-emerald-500/25 p-6 sm:p-8 flex flex-col gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </div>
                    <h3 className="font-bold text-emerald-200 text-base sm:text-lg">Avec OmniMockup</h3>
                  </div>
                  {[
                    'Collez l\'URL : les pages sont capturées automatiquement, sans capture manuelle',
                    'Les bannières cookies et popups sont masquées automatiquement',
                    'Mise en scène sur MacBook, iPhone et iPad, angle et fond réglables',
                    'Tous les formats (présentation, LinkedIn, Instagram) en quelques clics',
                    'Vos mockups avec le logo de votre agence (marque blanche, plan Agence)',
                  ].map((sol, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-1 shrink-0" />
                      <span className="text-emerald-300/85 text-sm leading-relaxed">{sol}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ═══════════ HOW IT WORKS — 3 ÉTAPES ═══════════ */}
          <section className="bg-zinc-900 py-20 sm:py-28">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">Fonctionnement Intuitif</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
                  Trois étapes simples pour un <span className="shimmer-text">résultat instantané</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  Aucun logiciel à installer. Entrez votre URL et visualisez directement votre projet dans un appareil premium.
                </p>
              </div>

              {/* Desktop View: 3 cols side-by-side */}
              <div className="hidden sm:grid sm:grid-cols-3 gap-5">
                {[
                  {
                    step: '01',
                    icon: Link2,
                    title: 'Collez votre URL',
                    desc: 'Entrez l\'adresse web de votre choix ou glissez une capture d\'écran. Le moteur capture la page en haute définition.',
                    gradient: 'from-violet-600 to-indigo-600',
                    glow: 'shadow-violet-600/20',
                  },
                  {
                    step: '02',
                    icon: Palette,
                    title: 'Personnalisez en 3D',
                    desc: 'Sélectionnez un MacBook Pro, iPhone 16 ou iPad, réglez l\'angle de perspective et admirez le rendu en temps réel.',
                    gradient: 'from-indigo-600 to-fuchsia-600',
                    glow: 'shadow-indigo-600/20',
                  },
                  {
                    step: '03',
                    icon: Download,
                    title: 'Exportez en 4K',
                    desc: 'Téléchargez votre mockup en résolution 4K Retina ou copiez-le d\'un clic pour l\'insérer dans vos présentations.',
                    gradient: 'from-fuchsia-600 to-rose-600',
                    glow: 'shadow-fuchsia-600/20',
                  },
                ].map((item, i) => (
                  <div key={i} className="relative p-7 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/80 transition-all group flex flex-col items-center sm:items-start text-center sm:text-left gap-5">
                    <span className="absolute top-4 right-5 font-mono text-xs font-bold text-zinc-500">{item.step}</span>
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg ${item.glow} group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-sm text-zinc-400 leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Mobile View: Interactive Step Card (no vertical stacking) */}
              <div className="block sm:hidden">
                {/* Step Tabs */}
                <div className="flex p-1 rounded-xl bg-zinc-950/80 border border-zinc-800 mb-5">
                  {[
                    { idx: 0, label: '01 · URL' },
                    { idx: 1, label: '02 · 3D' },
                    { idx: 2, label: '03 · Export' },
                  ].map((s) => (
                    <button
                      key={s.idx}
                      type="button"
                      onClick={() => setActiveStep(s.idx)}
                      className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all text-center ${
                        activeStep === s.idx
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Active Step Content */}
                {(() => {
                  const steps = [
                    {
                      step: '01',
                      icon: Link2,
                      title: 'Collez votre URL',
                      desc: 'Entrez l\'adresse web de votre choix ou glissez une capture d\'écran. Le moteur capture la page en haute définition.',
                      gradient: 'from-violet-600 to-indigo-600',
                      glow: 'shadow-violet-600/30',
                    },
                    {
                      step: '02',
                      icon: Palette,
                      title: 'Personnalisez en 3D',
                      desc: 'Sélectionnez un MacBook Pro, iPhone 16 ou iPad, réglez l\'angle de perspective et admirez le rendu en temps réel.',
                      gradient: 'from-indigo-600 to-fuchsia-600',
                      glow: 'shadow-indigo-600/30',
                    },
                    {
                      step: '03',
                      icon: Download,
                      title: 'Exportez en 4K',
                      desc: 'Téléchargez votre mockup en résolution 4K Retina ou copiez-le d\'un clic pour l\'insérer dans vos présentations.',
                      gradient: 'from-fuchsia-600 to-rose-600',
                      glow: 'shadow-fuchsia-600/30',
                    },
                  ];
                  const current = steps[activeStep];
                  return (
                    <div className="p-6 rounded-2xl bg-zinc-800/70 border border-zinc-700/80 flex flex-col items-center text-center gap-4 shadow-xl">
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-mono font-bold text-violet-400 bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20">
                          Étape {current.step} / 03
                        </span>
                        <div className="flex gap-1.5">
                          {steps.map((_, dotIdx) => (
                            <button
                              key={dotIdx}
                              type="button"
                              onClick={() => setActiveStep(dotIdx)}
                              className={`w-2 h-2 rounded-full transition-all ${
                                activeStep === dotIdx ? 'w-5 bg-violet-500' : 'bg-zinc-700'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg ${current.glow} my-1`}>
                        <current.icon className="w-7 h-7 text-white" />
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{current.title}</h3>
                        <p className="text-sm text-zinc-300 leading-relaxed">{current.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveStep((prev) => (prev + 1) % steps.length)}
                        className="mt-2 w-full py-2.5 px-4 rounded-xl bg-zinc-700/60 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-zinc-600 flex items-center justify-center gap-2"
                      >
                        {activeStep < 2 ? 'Étape suivante' : 'Revoir depuis le début'}
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* ═══════════ FEATURES / ALL THAT YOU GET ═══════════ */}
          <section className="bg-gradient-to-b from-zinc-950 to-zinc-900 py-20 sm:py-28">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">Fonctionnalités Clés</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                  Tout ce qu&apos;il faut pour <span className="shimmer-text">impressionner vos clients</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  Une boîte à outils complète et élégante conçue pour sublimer tous vos supports de communication.
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {[
                  {
                    icon: Monitor,
                    title: '7 Appareils Réels',
                    desc: 'MacBook Pro M3, iPhone 16 Pro, iPad Pro, iMac, Apple Watch, Safari macOS et Flat.',
                    gradient: 'from-violet-600 to-indigo-600',
                  },
                  {
                    icon: Aperture,
                    title: 'Studio 3D Temps Réel',
                    desc: 'Ajustez l\'orientation 3D, l\'inclinaison, les ombres portées et les reflets en direct.',
                    gradient: 'from-indigo-600 to-fuchsia-600',
                  },
                  {
                    icon: ScanLine,
                    title: 'Export 4K & Presse-Papier',
                    desc: 'Téléchargement PNG haute résolution jusqu\'en 4K et copie instantanée en 1 clic.',
                    gradient: 'from-fuchsia-600 to-rose-600',
                  },
                  {
                    icon: Zap,
                    title: 'Capture Intelligente',
                    desc: 'Moteur de capture automatique avec masquage des bannières cookies et popups.',
                    gradient: 'from-amber-500 to-orange-500',
                  },
                  {
                    icon: Wand2,
                    title: 'Fonds Couleurs Magiques',
                    desc: 'Extraction automatique des couleurs dominantes de votre site, dégradés mesh et transparence.',
                    gradient: 'from-rose-600 to-pink-600',
                  },
                  {
                    icon: ImagePlus,
                    title: 'Import de Captures',
                    desc: 'Site local ou privé ? Importez directement une capture PNG, JPG ou WebP de votre choix.',
                    gradient: 'from-cyan-600 to-indigo-600',
                  },
                  {
                    icon: Layout,
                    title: 'Ratios Multi-Canaux',
                    desc: 'Prêt pour Product Hunt, Twitter/X, LinkedIn (16:9), Instagram (1:1) et Stories (9:16).',
                    gradient: 'from-emerald-600 to-cyan-600',
                  },
                  {
                    icon: Palette,
                    title: 'Calques Textes & Filtres',
                    desc: 'Ajoutez vos titres, slogans, logos et appliquez des filtres (grain cinéma, VHS, glitch).',
                    gradient: 'from-violet-600 to-fuchsia-600',
                  },
                ].map((feature, i) => (
                  <div key={i} className="group p-3.5 sm:p-5 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all flex flex-col items-center sm:items-start text-center sm:text-left gap-2 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                      <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-white text-xs sm:text-sm">{feature.title}</h3>
                    <p className="text-[11px] sm:text-xs text-zinc-400 leading-relaxed line-clamp-3 sm:line-clamp-none">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════ USAGES POUR UNE AGENCE ═══════════ */}
          <section className="bg-zinc-900 py-20 sm:py-28">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">Pour les agences</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                  Un visuel pro à chaque <span className="shimmer-text">étape du projet</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  De la proposition commerciale à l&apos;annonce du site livré, vos réalisations sont présentées comme elles le méritent.
                </p>
              </div>

              {/* Desktop 2x2 Grid */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-5">
                {AGENCY_USES.map((uc, i) => (
                  <div key={i} className="group relative p-6 sm:p-7 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${uc.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                        <uc.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-base">{uc.title}</h3>
                        <p className="text-xs text-violet-400 font-semibold mt-0.5">{uc.sub}</p>
                      </div>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{uc.desc}</p>
                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="self-start flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors group-hover:gap-2.5"
                    >
                      Tester avec le site d&apos;un client
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Mobile : onglets (pas d'empilement vertical) */}
              <div className="block sm:hidden">
                {(() => {
                  const current = AGENCY_USES[activeUseCase] ?? AGENCY_USES[0];
                  return (
                    <div className="flex flex-col gap-4">
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {AGENCY_USES.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveUseCase(idx)}
                            className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              activeUseCase === idx ? 'bg-violet-600 text-white shadow-md' : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <c.icon className="w-3.5 h-3.5" />
                            {c.label}
                          </button>
                        ))}
                      </div>
                      <div className="p-6 rounded-2xl bg-zinc-800/60 border border-zinc-700/70 flex flex-col gap-4 shadow-xl">
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                            <current.icon className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">{current.title}</h3>
                            <p className="text-xs text-violet-400 font-semibold mt-0.5">{current.sub}</p>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">{current.desc}</p>
                        <button
                          type="button"
                          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                          className="self-start flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          Tester avec le site d&apos;un client
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <p className="mt-8 text-center text-sm text-zinc-400">
                <BadgeCheck className="inline w-4 h-4 text-violet-400 mr-1.5 -mt-0.5" />
                Marque blanche : vos mockups avec le logo de votre agence (plan Agence).
              </p>
            </div>
          </section>

          {/* ═══════════ FONDATEURS SAAS (cible secondaire) ═══════════ */}
          <section className="bg-zinc-950 py-16 sm:py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-zinc-900 border border-indigo-500/25">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-fuchsia-600 flex items-center justify-center shrink-0">
                    <Rocket className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-white mb-1.5">Vous lancez votre SaaS ?</h2>
                    <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">
                      Tous vos visuels de lancement (Product Hunt, X, LinkedIn) en quelques minutes, sans abonnement : payez seulement les crédits dont vous avez besoin.
                    </p>
                  </div>
                </div>
                <Link
                  href="/pricing#credits"
                  className="shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-zinc-900 font-bold text-sm hover:bg-zinc-100 transition-colors"
                >
                  Voir les packs de crédits
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </section>

          {/* ═══════════ PROGRAMME AGENCES FONDATRICES ═══════════ */}
          <section className="bg-zinc-950 pb-20 sm:pb-28 scroll-mt-20" id="agences-fondatrices">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-10">
                <span className="inline-block text-[11px] font-black uppercase tracking-[0.2em] text-violet-400 bg-violet-950/60 border border-violet-800/60 px-3.5 py-1 rounded-full mb-3">
                  Lancé en octobre 2026
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                  Devenez l&apos;une des <span className="shimmer-text">10 agences fondatrices</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  1 mois de plan Pro offert. En échange, nous vous demandons simplement un retour honnête sur l&apos;outil après l&apos;avoir utilisé sur vos projets clients.
                </p>
              </div>
              <FounderApplicationForm />
            </div>
          </section>

          {/* ═══════════ PRICING ═══════════ */}
          <section className="bg-zinc-900 py-20 sm:py-28" id="pricing">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">Tarification Transparente</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                  Une offre claire, <span className="shimmer-text">sans aucun coût caché</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  Commencez gratuitement sans engagement. Choisissez la formule qui correspond au volume de vos créations.
                </p>
              </div>

              {/* Plans Homepage configurés dynamiquement avec la source unique src/lib/pricing.ts */}
              {(() => {
                const homepagePlans = [
                  {
                    id: 0,
                    name: 'Découverte',
                    price: formatPrice(0, currency),
                    period: 'Gratuit à vie',
                    desc: 'Studio complet sans carte bancaire requise. Testez et concevez librement.',
                    cta: 'Commencer gratuitement',
                    href: '#',
                    onCtaClick: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
                    highlighted: false,
                    badge: '100% Gratuit',
                    features: [
                      { name: 'Studio complet (MacBook, iPhone)', included: true },
                      { name: '3 exports PNG par jour (1x)', included: true },
                      { name: 'Filigrane discret OmniMockup', included: true },
                      { name: 'Exports 4K Retina', included: false },
                      { name: 'Export Vidéo MP4', included: false },
                    ],
                  },
                  {
                    id: 1,
                    name: 'Solo',
                    price: formatPrice(getPlanMonthlyPrice(PLANS[1], currency), currency),
                    period: 'par mois',
                    desc: 'Pour les créateurs occasionnels. 20 exports HD/mois avec filigrane discret.',
                    cta: 'Choisir Solo',
                    href: '/pricing',
                    highlighted: false,
                    badge: null,
                    features: [
                      { name: 'Studio complet 3D', included: true },
                      { name: '20 exports PNG HD 2x / mois', included: true },
                      { name: 'Filigrane discret (non intrusif)', included: true },
                      { name: 'Exports 4K Retina', included: false },
                      { name: 'Export Vidéo MP4', included: false },
                    ],
                  },
                  {
                    id: 2,
                    name: 'Pro',
                    price: formatPrice(getPlanMonthlyPrice(PLANS[2], currency), currency),
                    period: `par mois (${formatPrice(getPlanMonthlyEquivalent(PLANS[2], currency), currency)} en annuel)`,
                    desc: 'Exports illimités HD & 4K, ZÉRO filigrane, vidéo animée et kit IA. Le meilleur choix.',
                    cta: 'Débloquer Pro',
                    href: '/pricing',
                    highlighted: true,
                    badge: 'Populaire',
                    features: [
                      { name: 'Exports PNG HD 2x & 4K ILLIMITÉS', included: true },
                      { name: 'ZÉRO filigrane (rendus neutres)', included: true },
                      { name: '10 exports Vidéo MP4 60fps / mois', included: true },
                      { name: 'IA Pitch Kit (5 générations / mois)', included: true },
                      { name: 'Templates Pro & réseaux sociaux', included: true },
                    ],
                  },
                  {
                    id: 3,
                    name: 'Agence',
                    price: formatPrice(getPlanMonthlyPrice(PLANS[3], currency), currency),
                    period: 'par mois',
                    desc: 'La suite complète : marque blanche totale, vidéo illimitée, kit de vente IA et support WhatsApp.',
                    cta: 'Choisir Agence',
                    href: '/pricing',
                    highlighted: false,
                    badge: null,
                    features: [
                      { name: 'Tout le forfait Pro inclus', included: true },
                      { name: 'Kit Vente & Devis IA', included: true },
                      { name: 'Marque blanche totale (White Label)', included: true },
                      { name: 'Exports Vidéo MP4 ILLIMITÉS', included: true },
                      { name: 'Pack OmniExport 1-Click (5 formats)', included: true },
                      { name: 'Support WhatsApp direct 7j/7', included: true },
                    ],
                  },
                ];

                return (
                  <>
                    {/* Desktop View: 4 colonnes claires (Découverte 0€/0$/0FCFA en point d'ancrage gratuité) */}
                    <div className="hidden lg:grid lg:grid-cols-4 gap-4 items-stretch">
                      {homepagePlans.map((plan) => (
                        <div
                          key={plan.id}
                          className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all ${
                            plan.highlighted
                              ? 'bg-gradient-to-b from-violet-600/15 via-zinc-900 to-zinc-900 border-violet-500/60 shadow-2xl shadow-violet-600/20 scale-[1.02] z-10'
                              : 'bg-zinc-800/40 border-zinc-700/50 hover:border-zinc-600'
                          }`}
                        >
                          {plan.badge && (
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3.5 py-0.5 rounded-full bg-violet-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
                              {plan.badge}
                            </span>
                          )}

                          <div>
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">{plan.name}</p>
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-black text-white font-mono whitespace-nowrap shrink-0">{plan.price}</span>
                              <span className="text-xs text-zinc-500">/ {plan.period}</span>
                            </div>
                            <p className="text-xs text-zinc-400 mt-2 leading-relaxed min-h-[34px]">{plan.desc}</p>

                            <ul className="flex flex-col gap-2 mt-4 pt-4 border-t border-zinc-800 text-xs">
                              {plan.features.filter((f) => f.included).map((f, j) => (
                                <li
                                  key={j}
                                  className={`flex items-start gap-2 ${
                                    f.included ? 'text-zinc-300' : 'text-zinc-500 line-through opacity-70'
                                  }`}
                                >
                                  {f.included ? (
                                    <CheckCircle2
                                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                        plan.highlighted ? 'text-violet-400' : 'text-emerald-500'
                                      }`}
                                    />
                                  ) : (
                                    <XIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-500 stroke-[2]" />
                                  )}
                                  <span>{f.name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="mt-6 pt-4 border-t border-zinc-800/80">
                            {plan.onCtaClick ? (
                              <button
                                type="button"
                                onClick={plan.onCtaClick}
                                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-zinc-700/70 hover:bg-zinc-700 text-zinc-200 border border-zinc-600 transition-all active:scale-[0.98]"
                              >
                                <span>{plan.cta}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <Link
                                href={plan.href}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all active:scale-[0.98] ${
                                  plan.highlighted
                                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                                    : 'bg-zinc-700/70 hover:bg-zinc-700 text-zinc-200 border border-zinc-600'
                                }`}
                              >
                                <span>{plan.cta}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tablet & Mobile View: Sélecteur d'onglets pour les 4 plans */}
                    <div className="block lg:hidden">
                      <div className="flex p-1.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 max-w-md mx-auto w-full shadow-inner mb-6">
                        {homepagePlans.map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActivePricingPlan(tab.id)}
                            className={`flex-1 py-2 px-1 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center ${
                              activePricingPlan === tab.id
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30 font-black'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {tab.id === 2 ? '★ ' : ''}{tab.name}
                          </button>
                        ))}
                      </div>

                      {/* Carte active sélectionnée */}
                      {(() => {
                        const activePlan = homepagePlans[activePricingPlan] || homepagePlans[2];
                        return (
                          <div
                            className={`max-w-sm mx-auto p-6 sm:p-7 rounded-2xl border transition-all ${
                              activePlan.highlighted
                                ? 'bg-gradient-to-b from-violet-600/15 via-zinc-900 to-zinc-900 border-violet-500/70 shadow-2xl shadow-violet-600/20'
                                : 'bg-zinc-900 border-zinc-700'
                            }`}
                          >
                            {activePlan.badge && (
                              <div className="mb-2">
                                <span className="inline-block px-3 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-black uppercase">
                                  {activePlan.badge}
                                </span>
                              </div>
                            )}

                            <div>
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{activePlan.name}</p>
                              <div className="flex items-baseline gap-1 mt-1">
                                <span className="text-3xl font-black text-white font-mono">{activePlan.price}</span>
                                <span className="text-xs text-zinc-500">/ {activePlan.period}</span>
                              </div>
                              <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{activePlan.desc}</p>
                            </div>

                            <ul className="flex flex-col gap-2.5 my-5 pt-4 border-t border-zinc-800 text-xs">
                              {activePlan.features.filter((f) => f.included).map((f, j) => (
                                <li
                                  key={j}
                                  className={`flex items-start gap-2 ${
                                    f.included ? 'text-zinc-300' : 'text-zinc-500 line-through opacity-70'
                                  }`}
                                >
                                  {f.included ? (
                                    <CheckCircle2
                                      className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                                        activePlan.highlighted ? 'text-violet-400' : 'text-emerald-500'
                                      }`}
                                    />
                                  ) : (
                                    <XIcon className="w-3.5 h-3.5 mt-0.5 shrink-0 text-zinc-500 stroke-[2]" />
                                  )}
                                  <span>{f.name}</span>
                                </li>
                              ))}
                            </ul>

                            {activePlan.onCtaClick ? (
                              <button
                                type="button"
                                onClick={activePlan.onCtaClick}
                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 transition-all active:scale-[0.98]"
                              >
                                <span>{activePlan.cta}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <Link
                                href={activePlan.href}
                                className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs transition-all active:scale-[0.98] ${
                                  activePlan.highlighted
                                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700'
                                }`}
                              >
                                <span>{activePlan.cta}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </>
                );
              })()}
            </div>
          </section>

          {/* ═══════════ FAQ ═══════════ */}
          <section className="bg-zinc-950 py-20 sm:py-28">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <div className="text-center max-w-2xl mx-auto mb-14">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">FAQ</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                  Questions <span className="shimmer-text">fréquemment posées</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed">
                  Tout ce que vous devez savoir pour démarrer et créer vos mockups 3D en toute simplicité.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  {
                    q: 'Puis-je utiliser les mockups pour mes clients et à des fins commerciales ?',
                    a: 'Oui. Les visuels que vous créez avec OmniMockup peuvent être utilisés dans vos propositions commerciales, vos livrables clients, votre portfolio et vos publications, y compris à des fins commerciales.',
                  },
                  {
                    q: 'Comment fonctionne la marque blanche ?',
                    a: 'Avec le plan Agence, la mention OmniMockup disparaît et vous pouvez ajouter le logo de votre agence sur vos rendus. Vos clients voient uniquement votre marque.',
                  },
                  {
                    q: 'Que deviennent les captures des sites de mes clients ?',
                    a: 'La page est chargée par notre moteur de capture, puis l\'image est envoyée directement à votre navigateur. Nous ne conservons pas les captures sur nos serveurs.',
                  },
                  {
                    q: 'Faut-il créer un compte pour tester ?',
                    a: 'Non. Vous pouvez tester le studio et exporter jusqu\'à 3 images par jour (avec un filigrane discret) sans compte ni carte bancaire. Les exports HD sans filigrane commencent avec le plan Pro.',
                  },
                  {
                    q: 'Le site du client est en local ou protégé par mot de passe : comment faire ?',
                    a: 'Déposez simplement votre propre capture d\'écran (PNG, JPG ou WebP) : vous profitez de la même mise en scène.',
                  },
                  {
                    q: 'Comment puis-je payer ?',
                    a: 'Par carte bancaire (Visa, Mastercard, American Express), partout dans le monde, en euros ou en dollars. En Afrique de l\'Ouest et du Centre, vous pouvez aussi payer en FCFA par Mobile Money ou carte via SasPay.',
                  },
                  {
                    q: 'Puis-je annuler à tout moment ?',
                    a: 'Oui, sans engagement. Un abonnement par carte se résilie en un clic depuis votre espace membre et reste actif jusqu\'à la fin de la période payée. Un paiement en FCFA (SasPay) couvre 1 mois ou 1 an, sans renouvellement automatique.',
                  },
                ].map((faq, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      openFaq === i
                        ? 'bg-zinc-900 border-violet-500/30'
                        : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left"
                      onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    >
                      <span className="font-semibold text-white text-sm sm:text-base leading-snug">{faq.q}</span>
                      <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${openFaq === i ? 'bg-violet-600' : 'bg-zinc-800'}`}>
                        {openFaq === i
                          ? <ChevronUp className="w-4 h-4 text-white" />
                          : <ChevronDown className="w-4 h-4 text-zinc-300" />
                        }
                      </span>
                    </button>
                    {openFaq === i && (
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 animate-fade-in text-left">
                        <p className="text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ═══════════ CTA FINAL ═══════════ */}
          <section className="relative bg-zinc-900 py-20 sm:py-28 overflow-hidden">
            <div className="absolute inset-0 hero-mesh opacity-70" />
            <div className="absolute inset-0 dot-grid opacity-40" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-700/15 blur-[100px] pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-5">
                Testez avec le site de <span className="shimmer-text">votre dernier client</span>
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base mb-10 leading-relaxed max-w-2xl mx-auto">
                Collez son URL, choisissez l&apos;appareil et exportez. Gratuit pour tester, sans filigrane dès le plan Pro.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="group w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-2xl shadow-violet-600/35 active:scale-[0.98]"
                >
                  <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Tester avec le site d&apos;un client</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto px-8 py-4 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-semibold text-base flex items-center justify-center gap-2.5 border border-zinc-700 hover:border-zinc-600 transition-all active:scale-[0.98]"
                >
                  Voir les tarifs
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-xs text-zinc-500">
                <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-400" /> Sans carte bancaire</span>
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-violet-400" /> Sans inscription pour tester</span>
                <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Mobile, Tablette & Desktop</span>
              </div>
            </div>
          </section>



      {/* Overlay de chargement */}
      {isLoading && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 rounded-3xl p-7 sm:p-9 max-w-sm w-full text-center shadow-2xl border border-zinc-800 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-600/20 text-violet-400 flex items-center justify-center mx-auto animate-pulse-glow">
              <Loader2 className="w-7 h-7 animate-spin" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white">
              Génération de votre Mockup...
            </h3>
            <p className="text-xs sm:text-sm text-violet-400 font-semibold animate-pulse">
              {loadingStep}
            </p>
            <p className="text-[11px] text-zinc-500">
              Capture haute densité & habillage automatique
            </p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
