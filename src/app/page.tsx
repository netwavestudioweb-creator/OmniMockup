'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/Navbar';
import { Stepper, WizardStep } from '@/components/Stepper';
import { UrlInputForm } from '@/components/UrlInputForm';
import { PageGrid } from '@/components/PageGrid';
import { SmartSectionPicker } from '@/components/SmartSectionPicker';
import { MockupSelector } from '@/components/MockupSelector';
import { MockupFrame } from '@/components/MockupFrame';
import { SceneEditor } from '@/components/SceneEditor';
import { safeFetchJson } from '@/lib/api';
import {
  AnalyzeResponse,
  CaptureItemResult,
  CaptureResponse,
  SmartAnalyzeResponse,
  DetectedSection,
  MockupType,
} from '@/types/analyzer';
import Link from 'next/link';
import { useUser } from '@/context/UserContext';
import {
  Sparkles,
  ArrowRight,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  AlertCircle,
  Eye,
  Camera,
  X,
} from 'lucide-react';

export default function HomePage() {
  const { isPremiumUser } = useUser();
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Navigation du Wizard (1 à 5)
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [maxReachedStep, setMaxReachedStep] = useState<WizardStep>(1);

  // Étape 1 : URL & Analyse Détection
  const [analyzedUrl, setAnalyzedUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [analyzeData, setAnalyzeData] = useState<AnalyzeResponse | null>(null);

  // Étape 2 : Sélection des Pages Détectées
  const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [aiTargetUrl, setAiTargetUrl] = useState('');

  // Étape 3 : Analyse Intelligente Gemini Vision & Sections
  const [isSmartAnalyzing, setIsSmartAnalyzing] = useState(false);
  const [smartAnalyzeData, setSmartAnalyzeData] = useState<SmartAnalyzeResponse | null>(null);
  const [smartAnalyzeError, setSmartAnalyzeError] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  // Étape 4 & 5 : Mockup Choisi & Éditeur de Scène
  const [capturedItems, setCapturedItems] = useState<CaptureItemResult[]>([]);
  const [activeCaptureItem, setActiveCaptureItem] = useState<CaptureItemResult | null>(null);
  const [selectedMockupType, setSelectedMockupType] = useState<MockupType>('browser');

  // Navigation dans le stepper
  const goToStep = (step: WizardStep) => {
    setCurrentStep(step);
    if (step > maxReachedStep) {
      setMaxReachedStep(step);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      goToStep((currentStep - 1) as WizardStep);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setMaxReachedStep(1);
    setAnalyzedUrl('');
    setAnalyzeData(null);
    setAnalyzeError(null);
    setSelectedPageIds(new Set());
    setSearchQuery('');
    setSmartAnalyzeData(null);
    setSmartAnalyzeError(null);
    setCapturedItems([]);
    setActiveCaptureItem(null);
    setSelectedMockupType('browser');
  };

  // 1. Déclenchement de l'analyse d'URL (/api/analyze)
  const handleAnalyzeUrl = async (urlToAnalyze: string) => {
    setIsAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzedUrl(urlToAnalyze);

    try {
      const result = await safeFetchJson<AnalyzeResponse>('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToAnalyze }),
      });

      setAnalyzeData(result);
      setSelectedPageIds(new Set(result.pages.map((p) => p.id)));
      setAiTargetUrl(result.pages[0]?.url || result.targetUrl);

      // Passe à l'étape 2
      setIsAnalyzing(false);
      goToStep(2);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setAnalyzeError(e?.message || 'Impossible d’analyser ce site web.');
      setIsAnalyzing(false);
    }
  };

  // 2. Gestion de la sélection des pages (Étape 2)
  const togglePageSelection = (id: string) => {
    setSelectedPageIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllPages = () => {
    if (!analyzeData) return;
    setSelectedPageIds(new Set(analyzeData.pages.map((p) => p.id)));
  };

  const handleDeselectAllPages = () => {
    setSelectedPageIds(new Set());
  };

  // Filtrage réactif par recherche
  const filteredPages = useMemo(() => {
    if (!analyzeData) return [];
    if (!searchQuery.trim()) return analyzeData.pages;
    const query = searchQuery.toLowerCase().trim();
    return analyzeData.pages.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.url.toLowerCase().includes(query) ||
        p.path.toLowerCase().includes(query)
    );
  }, [analyzeData, searchQuery]);

  // 3. Déclenchement de l'analyse intelligente Gemini Vision (Étape 3)
  const triggerSmartAnalyze = async (overrideUrl?: string) => {
    const target = overrideUrl || aiTargetUrl || analyzedUrl;
    if (!target) return;

    setIsSmartAnalyzing(true);
    setSmartAnalyzeError(null);

    try {
      const smartResult = await safeFetchJson<SmartAnalyzeResponse>('/api/smart-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target, isPremiumUser }),
      });

      setSmartAnalyzeData(smartResult);

      if (smartResult.quotaExceeded) {
        setShowQuotaModal(true);
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setSmartAnalyzeError(e?.message || 'Erreur lors de l’analyse intelligente Gemini Vision.');
    } finally {
      setIsSmartAnalyzing(false);
    }
  };

  // Continuer de l'étape 2 vers l'étape 3
  const handleProceedToStep3 = () => {
    const selectedUrl =
      analyzeData?.pages.find((p) => selectedPageIds.has(p.id))?.url ||
      analyzeData?.targetUrl ||
      analyzedUrl;

    setAiTargetUrl(selectedUrl);
    goToStep(3);

    // Déclenche l'analyse Gemini si pas encore effectuée pour cette URL
    if (!smartAnalyzeData || smartAnalyzeData.url !== selectedUrl) {
      triggerSmartAnalyze(selectedUrl);
    }
  };

  // 4. Confirmation des sections sélectionnées ➔ Capture Playwright ➔ Étape 4 (Choix Mockup)
  const handleConfirmSectionCapture = async (selectedSections: DetectedSection[]) => {
    if (!smartAnalyzeData || selectedSections.length === 0 || isCapturing) return;

    setIsCapturing(true);
    setCaptureError(null);

    try {
      const targets = selectedSections.map((sec) => ({
        url: smartAnalyzeData.url,
        clip: sec.coordinates,
        label: sec.label,
      }));

      const captureData = await safeFetchJson<CaptureResponse>('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets }),
      });

      setCapturedItems(captureData.results);
      const firstSuccess = captureData.results.find((r) => r.success && r.screenshotBase64);

      if (firstSuccess) {
        setActiveCaptureItem(firstSuccess);
        setSelectedMockupType('browser');
        // Passe à l'étape 4 (Choix du Mockup avec preview)
        goToStep(4);
      } else {
        throw new Error('Aucune capture n’a pu être réalisée.');
      }
    } catch (cErr: unknown) {
      const e = cErr as { message?: string };
      setCaptureError(e?.message || 'Erreur lors de la capture des sections ciblées.');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900 w-full max-w-full overflow-x-hidden">
      {/* Barre de navigation supérieure */}
      <Navbar onReset={analyzeData ? handleReset : undefined} />

      {/* Stepper de progression (1/5 à 5/5) avec bouton Retour */}
      <Stepper
        currentStep={currentStep}
        maxReachedStep={maxReachedStep}
        onStepChange={goToStep}
        onPrevStep={handlePrevStep}
        canGoPrev={currentStep > 1}
      />

      {/* Zone de contenu principale de l'étape active */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 box-border overflow-x-hidden">
        {/* ========================================================================= */}
        {/* ÉTAPE 1 : CHAMP URL & ANALYSE INITIALE                                    */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="w-full max-w-4xl mx-auto py-4 sm:py-12 space-y-6 sm:space-y-8 animate-fade-in box-border">
            {isAnalyzing ? (
              /* Écran de chargement dédié pendant l'analyse d'URL */
              <div className="p-6 sm:p-14 rounded-3xl bg-white border border-sand-200 shadow-md text-center space-y-6 max-w-xl mx-auto w-full box-border">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-200">
                  <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Analyse de votre site en cours...</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                    Inspection de l&apos;URL, test du flux sitemap.xml et cartographie des pages accessibles.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 text-left space-y-2.5 text-xs text-stone-600 font-mono overflow-hidden">
                  <div className="flex items-center gap-2 text-violet-700 font-semibold truncate">
                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping shrink-0" />
                    <span className="truncate">Cible : {analyzedUrl}</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-500">
                    <span>1. Résolution DNS & connexion HTTP</span>
                    <span className="text-emerald-600 font-bold ml-auto">OK</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-700">
                    <span>2. Détection du sitemap / exploration DOM</span>
                    <span className="text-amber-600 font-bold ml-auto">En cours</span>
                  </div>
                </div>
              </div>
            ) : (
              /* Vue formulaire normale de l'Étape 1 */
              <div className="text-center space-y-4 sm:space-y-6 w-full max-w-full box-border">
                <div className="inline-flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-800 text-[11px] sm:text-xs font-semibold shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
                  <span>Étape 1 sur 5 • Saisie & Découverte des Routes</span>
                </div>

                <h1 className="text-2xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-stone-900 leading-tight break-words max-w-full">
                  Transformez n&apos;importe quel site en{' '}
                  <span className="text-violet-600">
                    mockups marketing d&apos;exception
                  </span>.
                </h1>

                <p className="text-stone-600 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-normal leading-relaxed break-words">
                  Collez l&apos;URL de votre site ou produit pour cartographier automatiquement ses pages, segmenter ses composants à l&apos;IA et exporter des scènes haute fidélité.
                </p>

                <div className="pt-2 sm:pt-4 w-full max-w-full">
                  <UrlInputForm
                    onAnalyze={handleAnalyzeUrl}
                    isLoading={isAnalyzing}
                    errorMessage={analyzeError}
                    initialUrl={analyzedUrl}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 2 : PAGES DÉTECTÉES & SÉLECTION MULTIPLE                              */}
        {/* ========================================================================= */}
        {currentStep === 2 && analyzeData && (
          <div className="space-y-6 animate-fade-in">
            {/* En-tête de l'étape 2 */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-sand-200 pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                    Pages Détectées sur le Site
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-violet-100 text-violet-800 border border-violet-200">
                    {analyzeData.domain}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-sand-100 text-stone-600 border border-sand-200">
                    Source : {analyzeData.source === 'sitemap' ? 'Sitemap XML' : 'Crawl HTML'}
                  </span>
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Sélectionnez les pages souhaitées puis continuez vers la segmentation IA.
                </p>
              </div>

              {/* Bouton Continuer vers Étape 3 */}
              <button
                type="button"
                onClick={handleProceedToStep3}
                disabled={selectedPageIds.size === 0}
                className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Continuer vers l&apos;Analyse IA</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Barre d'outils et recherche */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-white border border-sand-200 shadow-xs">
              {/* Barre de recherche */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une route ou un titre..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-sand-50 border border-sand-200 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {/* Contrôles de sélection globale */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-stone-700 border border-sand-200 text-xs font-medium transition-all"
                >
                  <CheckSquare className="w-3.5 h-3.5 text-stone-500" />
                  <span>Tout sélectionner</span>
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllPages}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-stone-500 hover:text-stone-800 border border-sand-200 text-xs font-medium transition-all"
                >
                  <Square className="w-3.5 h-3.5 text-stone-400" />
                  <span>Tout désélectionner</span>
                </button>
              </div>
            </div>

            {/* Grille des cartes de pages */}
            <PageGrid
              pages={filteredPages}
              selectedIds={selectedPageIds}
              onToggle={togglePageSelection}
              isLoading={false}
            />

            {/* Barre d'action inférieure */}
            <div className="p-4 rounded-2xl bg-white border border-sand-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xs">
              <div className="text-xs text-stone-600 text-center sm:text-left">
                <span className="font-semibold text-stone-900">{selectedPageIds.size}</span> sur{' '}
                <span className="font-semibold text-stone-900">{analyzeData.total}</span> pages sélectionnées.
              </div>

              <button
                type="button"
                onClick={handleProceedToStep3}
                disabled={selectedPageIds.size === 0}
                className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <span>Continuer ({selectedPageIds.size} sélectionnées)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 3 : ANALYSE INTELLIGENTE IA (GEMINI VISION) & SECTIONS               */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fade-in">
            {isCapturing ? (
              /* Écran de chargement dédié pendant la capture haute résolution Playwright */
              <div className="p-8 sm:p-14 rounded-3xl bg-white border border-sand-200 shadow-md text-center space-y-6 max-w-xl mx-auto my-12 animate-fade-in">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-200">
                  <Camera className="w-8 h-8 animate-pulse text-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Capture haute résolution en cours...</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                    Découpage précis des sections sélectionnées par Playwright en résolution retina 2x.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 text-left space-y-2.5 text-xs text-stone-600 font-mono">
                  <div className="flex items-center gap-2 text-stone-700">
                    <span>1. Isolation des coordonnées de découpe</span>
                    <span className="text-emerald-600 font-bold ml-auto">OK</span>
                  </div>
                  <div className="flex items-center gap-2 text-violet-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                    <span>2. Prise de vue Playwright (Chromium headless)</span>
                    <span className="text-amber-600 font-bold ml-auto">En cours</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-400">
                    <span>3. Transfert vers le Studio de cadrage</span>
                    <span className="text-stone-400 ml-auto">En attente</span>
                  </div>
                </div>
              </div>
            ) : isSmartAnalyzing ? (
              /* Écran de chargement dédié pendant l'analyse Gemini */
              <div className="p-8 sm:p-14 rounded-3xl bg-white border border-sand-200 shadow-md text-center space-y-6 max-w-xl mx-auto my-12">
                <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mx-auto border border-violet-200">
                  <Sparkles className="w-8 h-8 animate-spin text-violet-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stone-900">Analyse Gemini Vision en cours...</h3>
                  <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                    Capture haute résolution du DOM, découpe sémantique et génération des recommandations par format.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-sand-50 border border-sand-200 text-left space-y-2.5 text-xs text-stone-600 font-mono">
                  <div className="flex items-center gap-2 text-stone-700">
                    <span>1. Capture complète de la page Playwright</span>
                    <span className="text-emerald-600 font-bold ml-auto">OK</span>
                  </div>
                  <div className="flex items-center gap-2 text-stone-700">
                    <span>2. Calcul géométrique des rectangles DOM</span>
                    <span className="text-emerald-600 font-bold ml-auto">OK</span>
                  </div>
                  <div className="flex items-center gap-2 text-violet-700 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-violet-600 animate-ping" />
                    <span>3. Inférence Gemini Vision (Hero, Features, Pricing...)</span>
                    <span className="text-amber-600 font-bold ml-auto">En cours</span>
                  </div>
                </div>
              </div>
            ) : smartAnalyzeError ? (
              /* Écran d'erreur avec possibilité de réessayer */
              <div className="p-8 rounded-3xl bg-white border border-rose-200 shadow-xs text-center space-y-4 max-w-lg mx-auto my-12">
                <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-rose-900">Échec de l&apos;analyse intelligente</h3>
                <p className="text-xs text-rose-700">{smartAnalyzeError}</p>
                <button
                  type="button"
                  onClick={() => triggerSmartAnalyze()}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs shadow-xs"
                >
                  Réessayer l&apos;analyse
                </button>
              </div>
            ) : smartAnalyzeData ? (
              /* Sélecteur de sections découpées */
              <SmartSectionPicker
                url={smartAnalyzeData.url}
                fullPageScreenshot={smartAnalyzeData.fullPageScreenshot}
                screenshotWidth={smartAnalyzeData.screenshotWidth}
                screenshotHeight={smartAnalyzeData.screenshotHeight}
                sections={smartAnalyzeData.sections}
                recommendations={smartAnalyzeData.recommendations}
                isFallback={smartAnalyzeData.isFallback}
                fallbackMessage={smartAnalyzeData.fallbackMessage}
                onConfirmCapture={handleConfirmSectionCapture}
                isCapturing={isCapturing}
              />
            ) : null}

            {captureError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>{captureError}</span>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 4 : CHOIX DU FORMAT / MOCKUP (ÉCRAN DÉDIÉ AVEC LIVE PREVIEW)         */}
        {/* ========================================================================= */}
        {currentStep === 4 && activeCaptureItem && activeCaptureItem.screenshotBase64 && (
          <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sand-200 pb-5">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-stone-900">
                  Choix du Cadre & Habillage
                </h2>
                <p className="text-xs text-stone-500 mt-0.5">
                  Sélectionnez le type d&apos;appareil pour présenter votre capture.
                </p>
              </div>

              <button
                type="button"
                onClick={() => goToStep(5)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
              >
                <span>Continuer vers l&apos;Éditeur de Scène</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Sélecteur de capture si plusieurs sections ont été capturées */}
            {capturedItems.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-2 p-2 bg-white rounded-xl border border-sand-200">
                <span className="text-xs font-semibold text-stone-600 flex-shrink-0 px-2">
                  Captures disponibles ({capturedItems.length}) :
                </span>
                {capturedItems.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCaptureItem(item)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 flex-shrink-0 ${
                      activeCaptureItem?.title === item.title
                        ? 'bg-violet-600 text-white shadow-xs font-semibold'
                        : 'bg-sand-50 text-stone-600 hover:text-stone-900 border border-sand-200'
                    }`}
                  >
                    <span>{item.title || `Capture ${idx + 1}`}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Sélecteur de cadrage (3 options) */}
            <MockupSelector
              selectedType={selectedMockupType}
              onSelect={(type) => setSelectedMockupType(type)}
              targetUrl={activeCaptureItem.url}
            />

            {/* Zone de Preview Dédiée Pleine Largeur */}
            <div className="p-6 sm:p-10 rounded-3xl bg-white border border-sand-200 shadow-sm space-y-4 text-center">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-stone-500 pb-2 border-b border-sand-100">
                <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-violet-600 shrink-0" />
                  <span>Aperçu en direct du cadre {selectedMockupType.toUpperCase()}</span>
                </span>
                <span className="font-mono text-[11px] text-stone-400">
                  Résolution d&apos;affichage 1440 × 900
                </span>
              </div>

              <div className="max-w-3xl mx-auto py-4 flex items-center justify-center">
                <MockupFrame
                  type={selectedMockupType}
                  screenshotBase64={activeCaptureItem.screenshotBase64}
                  url={activeCaptureItem.url}
                  title={activeCaptureItem.title}
                />
              </div>

              <div className="pt-4 border-t border-sand-100 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => goToStep(5)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 sm:px-7 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all"
                >
                  <span>Valider et ouvrir dans le Studio (shots.so)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ÉTAPE 5 : ÉDITEUR DE SCÈNE FINAL (SHOTS.SO) & EXPORT                       */}
        {/* ========================================================================= */}
        {currentStep === 5 && activeCaptureItem && activeCaptureItem.screenshotBase64 && (
          <div className="space-y-6 animate-fade-in">
            <SceneEditor
              captureItem={activeCaptureItem}
              initialMockup={selectedMockupType}
              onClose={() => goToStep(4)}
            />
          </div>
        )}

        {/* MODALE DÉPASSEMENT DE QUOTA GRATUIT (ÉTAPE 3) */}
        {showQuotaModal && (
          <div
            className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setShowQuotaModal(false)}
          >
            <div
              className="bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-stone-900">
                      Analyses IA du mois atteintes
                    </h3>
                    <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                      Quota gratuit utilisé
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowQuotaModal(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-sand-100 transition-colors"
                  aria-label="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-amber-950 text-xs sm:text-sm leading-relaxed font-medium">
                Tu as utilisé tes analyses IA gratuites ce mois-ci. Passe Pro pour un accès illimité + justifications détaillées.
              </div>

              <p className="text-xs text-stone-500 leading-relaxed">
                Les sections de votre page restent détectées et cadrées, mais les avis de conversion et arguments graphiques du Directeur Artistique sont réservés aux membres Pro.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuotaModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-sand-100 hover:bg-sand-200 text-stone-700 text-xs font-semibold transition-all"
                >
                  Continuer
                </button>

                <Link
                  href="/pricing"
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition-all shadow-md shadow-violet-600/20 flex items-center gap-1.5 active:scale-[0.99]"
                >
                  <span>Passer Pro</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
