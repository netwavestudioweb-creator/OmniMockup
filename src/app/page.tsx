'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { UrlInputForm } from '@/components/UrlInputForm';
import { SceneEditor } from '@/components/SceneEditor';

import { Footer } from '@/components/Footer';
import { safeFetchJson } from '@/lib/api';
import {
  CaptureItemResult,
  CaptureResponse,
  SmartAnalyzeResponse,
} from '@/types/analyzer';
import { useUser } from '@/context/UserContext';
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
  Package,
  Palette,
  ScanLine,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  Globe,
  Layout,
  Shield,
  Wand2,
  Rocket,
  Users,
  BadgeCheck,
  Watch,
} from 'lucide-react';

export default function HomePage() {
  const { isPremiumUser } = useUser();

  const [activeCaptureItem, setActiveCaptureItem] = useState<CaptureItemResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState<string>('Connexion au serveur...');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activePricingPlan, setActivePricingPlan] = useState<number>(1); // 0=Gratuit, 1=Pro (recommandé par défaut), 2=Agence
  const [activeStep, setActiveStep] = useState<number>(0); // 0=01 Collez, 1=02 Personnalisez, 2=03 Exportez
  const [activeUseCase, setActiveUseCase] = useState<number>(0); // 0=Agences, 1=SaaS, 2=Designers, 3=Ecommerce
  const [activeTestimonial, setActiveTestimonial] = useState<number>(0); // 0=TR, 1=SM, 2=AB
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

        safeFetchJson<SmartAnalyzeResponse>('/api/smart-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToCapture, isPremiumUser }),
        }).catch(() => {});
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

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col selection:bg-violet-500/30 selection:text-violet-200 w-full max-w-full overflow-x-hidden">
      <Navbar onReset={activeCaptureItem ? handleReset : undefined} />

      {activeCaptureItem ? (
        /* ─── STUDIO MODE ─── */
        <div className="flex-1 w-full flex flex-col animate-fade-in">
          <SceneEditor
            captureItem={activeCaptureItem}
            initialMockup="browser"
            onClose={handleReset}
          />
        </div>
      ) : (
        <>
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
                Studio de Mockups 3D Professionnel
                <span className="px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-200 text-[10px] font-bold border border-violet-400/30">NEW</span>
              </div>

              {/* Titre principal centré — Phrase complète sans coupure artificielle */}
              <h1 className="animate-fade-in delay-100 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.1] mb-6">
                Transformez votre site en <span className="shimmer-text">mockup 3D premium</span>
              </h1>

              {/* Sous-titre centré — Complet et équilibré */}
              <p className="animate-fade-in delay-200 text-base sm:text-lg md:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-8">
                Collez simplement votre URL. Obtenez instantanément des visuels ultra-réalistes sur MacBook Pro, iPhone 16 Pro et iPad avec perspective 3D et export 4K.
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
                  Export 4K Retina
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:block" />
                <span className="flex items-center gap-1.5">
                  <Copy className="w-4 h-4 text-emerald-400" />
                  1 clic presse-papier
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden sm:block" />
                <span className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-amber-400" />
                  Sans inscription requise
                </span>
              </div>

              {/* Preuve sociale centrée */}
              <div className="animate-fade-in delay-500 flex items-center justify-center gap-3 mb-12 sm:mb-16">
                <div className="flex -space-x-2">
                  {['V', 'S', 'A', 'T', 'M'].map((l, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full border-2 border-zinc-900 flex items-center justify-center text-[10px] font-bold text-white shadow-md"
                      style={{ background: ['#7c3aed', '#6366f1', '#8b5cf6', '#a855f7', '#c084fc'][i] }}
                    >
                      {l}
                    </div>
                  ))}
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-400">
                    <span className="text-zinc-200 font-bold">2 400+</span> créateurs satisfaits
                  </p>
                </div>
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
                            <div className="p-4 rounded-2xl bg-zinc-900/90 border border-violet-500/30 shadow-xl space-y-3">
                              <div className="flex items-center justify-between text-xs text-zinc-400">
                                <span className="font-semibold text-white">Score Performance</span>
                                <span className="text-emerald-400 font-mono font-bold">100 / 100</span>
                              </div>
                              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full w-full bg-emerald-500 rounded-full" />
                              </div>
                              <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                                <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                                  <p className="text-zinc-500">LCP</p>
                                  <p className="font-bold text-white font-mono">0.6s</p>
                                </div>
                                <div className="p-2 rounded-lg bg-zinc-800/80 border border-zinc-700/50">
                                  <p className="text-zinc-500">Conversion</p>
                                  <p className="font-bold text-emerald-400 font-mono">+240%</p>
                                </div>
                              </div>
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
                            Super Retina XDR 6.9"
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
                { icon: Rocket, label: 'Product Hunt #1' },
                { icon: ScanLine, label: 'Export 4K Retina' },
                { icon: Smartphone, label: 'iPhone 16 Pro' },
                { icon: Monitor, label: 'MacBook Pro M3' },
                { icon: Zap, label: 'Résultat en 5 sec' },
                { icon: Shield, label: 'Sans inscription' },
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
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">Comparatif Rapide</p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white mb-4">
                  L&apos;ancienne méthode face à la <span className="shimmer-text">nouvelle façon</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  Arrêtez de perdre des heures sur des logiciels complexes comme Figma ou Photoshop. Obtenez un rendu studio 3D en quelques secondes.
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
                    'Des heures passées à ajuster des calques sur Figma ou Photoshop',
                    'Obligation de faire appel à un designer pour chaque maquette',
                    'Résultats statiques, génériques et sans relief valorisant',
                    'Difficulté d\'itérer et de créer des déclinaisons rapidement',
                    'Captures plates qui n\'attirent pas l\'attention des clients',
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
                    'Mockup 3D ultra-réaliste généré en moins de 5 secondes',
                    'Zéro compétence technique requise : tout est automatique',
                    'Rendu professionnel haut de gamme prêt pour Product Hunt',
                    'Personnalisation en direct de l\'appareil, de l\'angle et du fond',
                    'Export 4K Retina instantané et copie dans le presse-papier en 1 clic',
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

          {/* ═══════════ USE CASES ═══════════ */}
          <section className="bg-zinc-900 py-20 sm:py-28">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">Cas d&apos;Usage</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                  Conçu sur mesure pour chaque <span className="shimmer-text">créateur numérique</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  Découvrez comment les professionnels du web valorisent leur travail et convertissent davantage.
                </p>
              </div>

              {/* Desktop 2x2 Grid */}
              <div className="hidden sm:grid sm:grid-cols-2 gap-5">
                {[
                  {
                    icon: Users,
                    title: 'Agences & Freelances',
                    sub: 'Valorisez vos livrables',
                    desc: 'Ne livrez plus de simples captures plates. Présentez les créations de vos clients dans des MacBook 3D pour justifier vos tarifs et décrocher des contrats plus ambitieux.',
                    badge: 'Gain de temps ×10',
                    badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
                    gradient: 'from-violet-600 to-indigo-600',
                  },
                  {
                    icon: Rocket,
                    title: 'Fondateurs SaaS',
                    sub: 'Optimisez vos conversions',
                    desc: 'Préparez tous vos visuels Product Hunt, bannières Twitter/X et posts LinkedIn en moins de 60 secondes, sans attendre la disponibilité d\'un graphiste.',
                    badge: 'Top 3 Product Hunt',
                    badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
                    gradient: 'from-indigo-600 to-fuchsia-600',
                  },
                  {
                    icon: Palette,
                    title: 'Designers & Développeurs',
                    sub: 'Sublimez vos portfolios',
                    desc: 'Mettez en scène vos réalisations sur Dribbble, Behance et GitHub avec des perspectives 3D remarquables sans ouvrir Photoshop ni Figma.',
                    badge: 'Qualité Studio',
                    badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
                    gradient: 'from-fuchsia-600 to-rose-600',
                  },
                  {
                    icon: Globe,
                    title: 'Boutiques E-commerce',
                    sub: 'Publicités & Réseaux Sociaux',
                    desc: 'Créez vos visuels produits pour Instagram, TikTok et vos campagnes publicitaires directement depuis votre boutique en ligne dans tous les ratios.',
                    badge: 'Multi-Formats 4K',
                    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
                    gradient: 'from-amber-500 to-orange-500',
                  },
                ].map((uc, i) => (
                  <div key={i} className="group relative p-6 sm:p-7 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/70 transition-all flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${uc.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                          <uc.icon className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-base">{uc.title}</h3>
                          <p className="text-xs text-violet-400 font-semibold mt-0.5">{uc.sub}</p>
                        </div>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${uc.badgeClass}`}>{uc.badge}</span>
                    </div>
                    <p className="text-sm text-zinc-400 leading-relaxed">{uc.desc}</p>
                    <button
                      type="button"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                      className="self-start flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors group-hover:gap-2.5"
                    >
                      Essayer maintenant
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Mobile View: Interactive Persona Tabs (no vertical stacking) */}
              <div className="block sm:hidden">
                {(() => {
                  const cases = [
                    {
                      label: 'Agences',
                      icon: Users,
                      title: 'Agences & Freelances',
                      sub: 'Valorisez vos livrables',
                      desc: 'Ne livrez plus de simples captures plates. Présentez les créations de vos clients dans des MacBook 3D pour justifier vos tarifs et décrocher des contrats plus ambitieux.',
                      badge: 'Gain de temps ×10',
                      badgeClass: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
                      gradient: 'from-violet-600 to-indigo-600',
                    },
                    {
                      label: 'SaaS',
                      icon: Rocket,
                      title: 'Fondateurs SaaS',
                      sub: 'Optimisez vos conversions',
                      desc: 'Préparez tous vos visuels Product Hunt, bannières Twitter/X et posts LinkedIn en moins de 60 secondes, sans attendre la disponibilité d\'un graphiste.',
                      badge: 'Top 3 Product Hunt',
                      badgeClass: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
                      gradient: 'from-indigo-600 to-fuchsia-600',
                    },
                    {
                      label: 'Designers',
                      icon: Palette,
                      title: 'Designers & Développeurs',
                      sub: 'Sublimez vos portfolios',
                      desc: 'Mettez en scène vos réalisations sur Dribbble, Behance et GitHub avec des perspectives 3D remarquables sans ouvrir Photoshop ni Figma.',
                      badge: 'Qualité Studio',
                      badgeClass: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25',
                      gradient: 'from-fuchsia-600 to-rose-600',
                    },
                    {
                      label: 'E-commerce',
                      icon: Globe,
                      title: 'Boutiques E-commerce',
                      sub: 'Publicités & Réseaux Sociaux',
                      desc: 'Créez vos visuels produits pour Instagram, TikTok et vos campagnes publicitaires directement depuis votre boutique en ligne dans tous les ratios.',
                      badge: 'Multi-Formats 4K',
                      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
                      gradient: 'from-amber-500 to-orange-500',
                    },
                  ];
                  const current = cases[activeUseCase];

                  return (
                    <div className="flex flex-col gap-4">
                      {/* Horizontal pill tabs */}
                      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {cases.map((c, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveUseCase(idx)}
                            className={`shrink-0 py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                              activeUseCase === idx
                                ? 'bg-violet-600 text-white shadow-md'
                                : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            <c.icon className="w-3.5 h-3.5" />
                            {c.label}
                          </button>
                        ))}
                      </div>

                      {/* Spotlight Card */}
                      <div className="p-6 rounded-2xl bg-zinc-800/60 border border-zinc-700/70 flex flex-col gap-4 shadow-xl">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${current.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                              <current.icon className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <h3 className="font-bold text-white text-base">{current.title}</h3>
                              <p className="text-xs text-violet-400 font-semibold mt-0.5">{current.sub}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${current.badgeClass}`}>
                            {current.badge}
                          </span>
                        </div>

                        <p className="text-sm text-zinc-300 leading-relaxed">{current.desc}</p>

                        <div className="pt-2 border-t border-zinc-700/50 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                            className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
                          >
                            Essayer maintenant
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <div className="flex gap-1">
                            {cases.map((_, dotIdx) => (
                              <button
                                key={dotIdx}
                                type="button"
                                onClick={() => setActiveUseCase(dotIdx)}
                                className={`w-1.5 h-1.5 rounded-full transition-all ${
                                  activeUseCase === dotIdx ? 'w-4 bg-violet-500' : 'bg-zinc-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </section>

          {/* ═══════════ TESTIMONIALS ═══════════ */}
          <section className="bg-zinc-950 py-20 sm:py-28">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">Retours d&apos;Expérience</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                  Approuvé par plus de <span className="shimmer-text">2 400 créateurs</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  Découvrez comment nos utilisateurs créent des présentations qui font la différence au quotidien.
                </p>
              </div>

              {/* Défilé continu automatique de témoignages (sans boutons, défilement fluide infini) */}
              {(() => {
                const testimonials = [
                  {
                    q: 'OmniMockup nous fait gagner plusieurs heures chaque semaine sur nos présentations clients. Le rendu 3D impressionne immédiatement dès le premier coup d\'œil.',
                    name: 'Thomas R.',
                    role: 'Lead Designer · NovaStudio',
                    initials: 'TR',
                    color: '#7c3aed',
                  },
                  {
                    q: 'J\'ai préparé tous les visuels de notre lancement Product Hunt avec OmniMockup en quelques minutes. Résultat : Top 3 du jour et plus de 2 000 inscriptions.',
                    name: 'Sarah M.',
                    role: 'Fondatrice · MetricFlow SaaS',
                    initials: 'SM',
                    color: '#6366f1',
                  },
                  {
                    q: 'La copie instantanée dans le presse-papier est un bonheur au quotidien. URL, choix de l\'iPhone, Ctrl+V sur Twitter : visuel posté en 30 secondes chrono.',
                    name: 'Alexandre B.',
                    role: 'Développeur Fullstack · Freelance',
                    initials: 'AB',
                    color: '#a855f7',
                  },
                  {
                    q: 'La précision des textures aluminium et des reflets vitrés sur MacBook Pro et iPhone 16 est bluffante. On a complètement abandonné nos vieux templates Figma.',
                    name: 'Camille D.',
                    role: 'Directrice Artistique · Studio Kroma',
                    initials: 'CD',
                    color: '#ec4899',
                  },
                  {
                    q: 'Idéal pour nos campagnes publicitaires Meta et LinkedIn. On teste 10 déclinaisons de mockups d\'une même page en 2 minutes sans graphiste.',
                    name: 'Marc V.',
                    role: 'Growth Marketer · ScaleFast',
                    initials: 'MV',
                    color: '#10b981',
                  },
                ];

                return (
                  <div className="flex flex-col gap-4">
                    <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] py-2">
                      <div className="animate-marquee flex gap-5 py-2">
                        {[...testimonials, ...testimonials].map((t, i) => (
                          <div
                            key={i}
                            className="w-[300px] sm:w-[360px] shrink-0 p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between gap-4 shadow-xl hover:border-violet-500/50 hover:bg-zinc-900 transition-all text-left"
                          >
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, s) => (
                                <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                              ))}
                            </div>
                            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">&ldquo;{t.q}&rdquo;</p>
                            <div className="flex items-center gap-3 pt-3 border-t border-zinc-800/80">
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-md"
                                style={{ background: t.color }}
                              >
                                {t.initials}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{t.name}</p>
                                <p className="text-[10px] text-zinc-500">{t.role}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-center text-[11px] text-zinc-500 flex items-center justify-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Défilement continu automatique · Survolez ou touchez pour marquer une pause</span>
                    </p>
                  </div>
                );
              })()}
            </div>
          </section>

          {/* ═══════════ PRICING ═══════════ */}
          <section className="bg-zinc-900 py-20 sm:py-28">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center max-w-3xl mx-auto mb-14">
                <p className="text-xs font-bold text-violet-400 uppercase tracking-[0.2em] mb-3">Tarification Transparente</p>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
                  Une offre claire, <span className="shimmer-text">sans aucun coût caché</span>
                </h2>
                <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
                  Commencez gratuitement sans engagement. Choisissez la formule qui correspond au volume de vos créations.
                </p>
              </div>

              {/* Desktop View: 3 cols side-by-side (taille normale, bien lisibles) */}
              <div className="hidden md:grid md:grid-cols-3 gap-5 items-stretch">
                {[
                  {
                    name: 'Gratuit',
                    price: '0€',
                    period: 'pour toujours',
                    desc: 'Idéal pour tester OmniMockup et créer vos premiers visuels.',
                    cta: 'Démarrer gratuitement',
                    href: '/signup',
                    highlighted: false,
                    badge: null,
                    features: [
                      '5 mockups par mois',
                      'Résolution standard HD',
                      '3 appareils disponibles',
                      'Téléchargement PNG direct',
                    ],
                  },
                  {
                    name: 'Pro',
                    price: '19€',
                    period: 'par mois',
                    desc: 'Pour les créateurs qui souhaitent une qualité irréprochable.',
                    cta: 'Passer au Pro',
                    href: '/pricing',
                    highlighted: true,
                    badge: 'Populaire',
                    features: [
                      'Mockups illimités',
                      'Export 4K Retina Ultra-HD',
                      'Tous les 7 appareils Apple',
                      'Copie presse-papier en 1 clic',
                      'Suppression automatique des bannières',
                      'Support client prioritaire',
                    ],
                  },
                  {
                    name: 'Agence',
                    price: '49€',
                    period: 'par mois',
                    desc: 'Pour les agences et les équipes aux livrables réguliers.',
                    cta: 'Contacter l\'équipe',
                    href: '/pricing',
                    highlighted: false,
                    badge: null,
                    features: [
                      'Tous les avantages du plan Pro',
                      'Membres d\'équipe illimités',
                      'Rapports et analytics de marque',
                      'Accès API programmatique',
                      'SLA de disponibilité garanti',
                      'Accompagnement personnalisé',
                    ],
                  },
                ].map((plan, i) => (
                  <div
                    key={i}
                    className={`relative flex flex-col gap-6 p-6 sm:p-7 rounded-2xl border transition-all ${
                      plan.highlighted
                        ? 'bg-gradient-to-b from-violet-600/10 to-zinc-900 border-violet-500/50 shadow-2xl shadow-violet-600/10 scale-[1.02]'
                        : 'bg-zinc-800/40 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                  >
                    {plan.badge && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet-600 text-white text-xs font-bold shadow-lg">
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">{plan.name}</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-4xl font-black text-white">{plan.price}</span>
                        <span className="text-sm text-zinc-500">/ {plan.period}</span>
                      </div>
                      <p className="text-sm text-zinc-400 mt-2 leading-relaxed">{plan.desc}</p>
                    </div>

                    <ul className="flex flex-col gap-2.5 flex-1">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2.5 text-sm">
                          <CheckCircle2 className={`w-4 h-4 mt-0.5 shrink-0 ${plan.highlighted ? 'text-violet-400' : 'text-emerald-500'}`} />
                          <span className="text-zinc-300">{f}</span>
                        </li>
                      ))}
                    </ul>

                    <Link
                      href={plan.href}
                      className={`w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm transition-all active:scale-[0.98] ${
                        plan.highlighted
                          ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                          : 'bg-zinc-700/70 hover:bg-zinc-700 text-zinc-200 border border-zinc-600'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                ))}
              </div>

              {/* Mobile View: Cartes empilées l'une derrière l'autre avec plan recommandé devant */}
              <div className="block md:hidden">
                {(() => {
                  const plans = [
                    {
                      id: 0,
                      name: 'Gratuit',
                      price: '0€',
                      period: 'pour toujours',
                      desc: 'Idéal pour tester OmniMockup et créer vos premiers visuels.',
                      cta: 'Démarrer gratuitement',
                      href: '/signup',
                      highlighted: false,
                      badge: null,
                      features: [
                        '5 mockups par mois',
                        'Résolution standard HD',
                        '3 appareils disponibles',
                        'Téléchargement PNG direct',
                      ],
                    },
                    {
                      id: 1,
                      name: 'Pro',
                      price: '19€',
                      period: 'par mois',
                      desc: 'Pour les créateurs qui souhaitent une qualité irréprochable.',
                      cta: 'Passer au Pro',
                      href: '/pricing',
                      highlighted: true,
                      badge: 'Recommandé',
                      features: [
                        'Mockups illimités',
                        'Export 4K Retina Ultra-HD',
                        'Tous les 7 appareils Apple',
                        'Copie presse-papier en 1 clic',
                        'Suppression des bannières',
                        'Support client prioritaire',
                      ],
                    },
                    {
                      id: 2,
                      name: 'Agence',
                      price: '49€',
                      period: 'par mois',
                      desc: 'Pour les agences et les équipes aux livrables réguliers.',
                      cta: 'Contacter l\'équipe',
                      href: '/pricing',
                      highlighted: false,
                      badge: null,
                      features: [
                        'Tous les avantages du plan Pro',
                        'Membres d\'équipe illimités',
                        'Rapports et analytics de marque',
                        'Accès API programmatique',
                        'SLA de disponibilité garanti',
                        'Accompagnement personnalisé',
                      ],
                    },
                  ];

                  return (
                    <div className="flex flex-col gap-5">
                      {/* Sélecteur d'onglets mobile */}
                      <div className="flex p-1.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 max-w-sm mx-auto w-full shadow-inner">
                        {[
                          { id: 0, label: 'Gratuit' },
                          { id: 1, label: '★ Recommandé' },
                          { id: 2, label: 'Agence' },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActivePricingPlan(tab.id)}
                            className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                              activePricingPlan === tab.id
                                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                                : 'text-zinc-400 hover:text-zinc-200'
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Stack de cartes l'une derrière l'autre */}
                      <div className="relative h-[480px] w-full max-w-sm mx-auto mt-4">
                        {plans.map((p, i) => {
                          const isActive = activePricingPlan === i;
                          // Calcul du décalage pour l'effet "l'un derrière l'autre"
                          const offset = (i - activePricingPlan + 3) % 3;
                          let transformClass = '';
                          let zIndexClass = '';
                          let opacityClass = '';

                          if (isActive) {
                            transformClass = 'translate-y-0 scale-100';
                            zIndexClass = 'z-30 pointer-events-auto';
                            opacityClass = 'opacity-100 shadow-2xl';
                          } else if (offset === 1) {
                            // Immédiatement derrière
                            transformClass = '-translate-y-3.5 scale-[0.94]';
                            zIndexClass = 'z-20 cursor-pointer pointer-events-auto';
                            opacityClass = 'opacity-60 blur-[0.4px] hover:opacity-85';
                          } else {
                            // Tout au fond
                            transformClass = '-translate-y-7 scale-[0.88]';
                            zIndexClass = 'z-10 cursor-pointer pointer-events-auto';
                            opacityClass = 'opacity-35 blur-[0.8px] hover:opacity-75';
                          }

                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                if (!isActive) setActivePricingPlan(p.id);
                              }}
                              className={`absolute inset-0 transition-all duration-300 ease-out flex flex-col justify-between p-6 rounded-2xl border ${transformClass} ${zIndexClass} ${opacityClass} ${
                                p.highlighted
                                  ? 'bg-gradient-to-b from-violet-950/90 via-zinc-900 to-zinc-900 border-violet-500/70 shadow-violet-600/20'
                                  : 'bg-zinc-900/95 border-zinc-700/60'
                              }`}
                            >
                              {p.badge && (
                                <span className="self-center -mt-9 px-4 py-1 rounded-full bg-violet-600 text-white text-xs font-bold shadow-lg shadow-violet-600/40">
                                  {p.badge}
                                </span>
                              )}

                              <div>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{p.name}</p>
                                  {!isActive && (
                                    <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                                      Toucher pour afficher
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-baseline gap-1.5 mt-2">
                                  <span className="text-3xl font-black text-white">{p.price}</span>
                                  <span className="text-xs text-zinc-500">/ {p.period}</span>
                                </div>
                                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">{p.desc}</p>
                              </div>

                              <ul className="flex flex-col gap-2 my-2">
                                {p.features.map((f, j) => (
                                  <li key={j} className="flex items-start gap-2 text-xs">
                                    <CheckCircle2 className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${p.highlighted ? 'text-violet-400' : 'text-emerald-500'}`} />
                                    <span className="text-zinc-300">{f}</span>
                                  </li>
                                ))}
                              </ul>

                              <Link
                                href={p.href}
                                tabIndex={isActive ? 0 : -1}
                                className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all active:scale-[0.98] ${
                                  p.highlighted
                                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-600/30'
                                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                                }`}
                              >
                                {p.cta}
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          );
                        })}
                      </div>

                      {/* Contrôles interactifs sous les cartes */}
                      <div className="flex items-center justify-center gap-4 mt-2">
                        <button
                          type="button"
                          onClick={() => setActivePricingPlan((prev) => (prev - 1 + 3) % 3)}
                          className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-white"
                          aria-label="Plan précédent"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex gap-1.5">
                          {[0, 1, 2].map((idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setActivePricingPlan(idx)}
                              className={`h-1.5 rounded-full transition-all ${
                                activePricingPlan === idx ? 'w-5 bg-violet-500' : 'w-2 bg-zinc-700'
                              }`}
                              aria-label={`Plan ${idx + 1}`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setActivePricingPlan((prev) => (prev + 1) % 3)}
                          className="p-2 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-300 hover:text-white"
                          aria-label="Plan suivant"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
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
                    q: 'Comment fonctionne la capture automatique d\'URL ?',
                    a: 'Notre moteur lance un navigateur headless haute performance, charge votre page en résolution HD, masque automatiquement les bandeaux de consentement et génère une capture nette en moins de 5 secondes.',
                  },
                  {
                    q: 'Est-il obligatoire de créer un compte pour commencer ?',
                    a: 'Non ! Vous pouvez générer gratuitement jusqu\'à 5 mockups par mois sans inscription. Le compte Pro débloque les créations illimitées et l\'export 4K Retina.',
                  },
                  {
                    q: 'Quels sont les formats d\'exportation proposés ?',
                    a: 'Vous pouvez exporter votre visuel au format image PNG haute définition (4K Retina avec le plan Pro) ou le copier d\'un clic directement dans votre presse-papier pour l\'insérer partout.',
                  },
                  {
                    q: 'Quels appareils puis-je utiliser pour mes présentations ?',
                    a: 'Vous avez accès au MacBook Pro M3, iPhone 16 Pro avec Dynamic Island, iPad Pro, navigateur Safari macOS, Chrome, ainsi qu\'à un mode épuré sans cadre.',
                  },
                  {
                    q: 'Puis-je importer une capture d\'écran faite par mes soins ?',
                    a: 'Absolument. Si votre projet est hébergé en local ou protégé par mot de passe, déposez simplement votre capture PNG, JPG ou WebP dans l\'onglet dédié.',
                  },
                  {
                    q: 'Comment s\'effectue la gestion des abonnements ?',
                    a: 'Les paiements sont traités de façon sécurisée via Stripe. Vous pouvez modifier ou résilier votre abonnement à tout moment en un clic depuis votre espace membre.',
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
                Prêt à créer votre <span className="shimmer-text">premier mockup 3D ?</span>
              </h2>
              <p className="text-zinc-400 text-sm sm:text-base mb-10 leading-relaxed max-w-2xl mx-auto">
                Rejoignez les 2 400+ créateurs qui génèrent des visuels d&apos;exception en quelques secondes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="group w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-2xl shadow-violet-600/35 active:scale-[0.98]"
                >
                  <Wand2 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  <span>Créer mon Mockup gratuitement</span>
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
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-violet-400" /> Résultat en 5 secondes</span>
                <span className="flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5 text-indigo-400" /> Mobile, Tablette & Desktop</span>
              </div>
            </div>
          </section>


        </>
      )}

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
