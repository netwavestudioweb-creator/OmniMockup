'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { UrlInputForm } from '@/components/UrlInputForm';
import { SceneEditor } from '@/components/SceneEditor';
import { safeFetchJson } from '@/lib/api';
import {
  CaptureItemResult,
  CaptureResponse,
  SmartAnalyzeResponse,
} from '@/types/analyzer';
import { useUser } from '@/context/UserContext';
import {
  Sparkles,
  Loader2,
  Monitor,
  Layers,
  Wand2,
} from 'lucide-react';

export default function HomePage() {
  const { isPremiumUser } = useUser();

  // État principal : Capture Active ➔ Ouvre immédiatement l'Éditeur Studio type shots.so
  const [activeCaptureItem, setActiveCaptureItem] = useState<CaptureItemResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 1. Soumission d'URL direct ➔ Capture 3-Tiers ➔ Studio
  const handleAnalyzeUrl = async (urlToCapture: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Étape A : Capture rapide de la page web entière
      const captureData = await safeFetchJson<CaptureResponse>('/api/capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targets: [urlToCapture] }),
      });

      const firstSuccess = captureData.results?.find((r) => r.success && r.screenshotBase64);

      if (firstSuccess) {
        setActiveCaptureItem(firstSuccess);
        setIsLoading(false);

        // Étape B (arrière-plan non-bloquant) : Analyse des sections Gemini
        safeFetchJson<SmartAnalyzeResponse>('/api/smart-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToCapture, isPremiumUser }),
        }).catch(() => {});
      } else {
        throw new Error('Impossible de réaliser la capture d’écran de cette page web.');
      }
    } catch (err: unknown) {
      const e = err as { message?: string };
      setErrorMessage(e?.message || 'Erreur lors de la capture de l’URL.');
      setIsLoading(false);
    }
  };

  // 2. Dépot d'Image Locale direct ➔ Ouverture immédiate du Studio
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
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900 w-full max-w-full overflow-x-hidden">
      <Navbar onReset={activeCaptureItem ? handleReset : undefined} />

      {activeCaptureItem ? (
        /* MODE STUDIO SHOTS.SO : Ouverture directe de l'éditeur de scène */
        <div className="flex-1 w-full flex flex-col animate-fade-in">
          <SceneEditor
            captureItem={activeCaptureItem}
            initialMockup="browser"
            onClose={handleReset}
          />
        </div>
      ) : (
        /* MODE ACCUEIL : Entrée URL + Téléversement Image Direct */
        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20 relative max-w-5xl mx-auto w-full">
          {/* Badge d'en-tête */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-violet-100/80 border border-violet-200 text-violet-800 text-xs font-semibold mb-6 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
            <span>Studio de Mockups Instantané · Style shots.so</span>
          </div>

          {/* Titre Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-center text-stone-900 max-w-3xl leading-[1.15]">
            Transformez vos URLs &amp; Captures en{' '}
            <span className="bg-gradient-to-r from-violet-600 via-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Mockups Sublimes
            </span>
          </h1>

          <p className="mt-4 text-sm sm:text-base text-stone-600 text-center max-w-2xl leading-relaxed">
            Entrez une URL ou déposez une capture d&apos;écran pour accéder directement au studio d&apos;édition (Cadres Apple, Navigateurs, Arrière-plans Mesh, Effets 3D et Export 4K).
          </p>

          {/* Formulaire d'Entrée URL / Upload */}
          <div className="mt-8 sm:mt-10 w-full">
            <UrlInputForm
              onAnalyze={handleAnalyzeUrl}
              onUploadImage={handleUploadImage}
              isLoading={isLoading}
              errorMessage={errorMessage}
            />
          </div>

          {/* Overlay de chargement dynamique */}
          {isLoading && (
            <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-stone-100">
                <div className="w-14 h-14 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Loader2 className="w-7 h-7 animate-spin" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900">
                  Capture du site en cours...
                </h3>
                <p className="text-xs sm:text-sm text-stone-500 mt-1.5 leading-relaxed">
                  Notre moteur prépare la capture haute résolution pour l&apos;ouverture immédiate dans le Studio.
                </p>
              </div>
            </div>
          )}

          {/* Grille de fonctionnalités clés */}
          <div className="mt-16 sm:mt-24 grid grid-cols-1 sm:grid-cols-3 gap-6 w-full">
            <div className="p-5 rounded-2xl bg-white/80 border border-sand-200 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
                <Monitor className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-stone-900 text-sm">Cadres &amp; Mockups Rétina</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Safari, Chrome, iPhone 15 Pro, MacBook Pro, iPad Pro et style Window sans bordures.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 border border-sand-200 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                <Wand2 className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-stone-900 text-sm">Arrière-plans &amp; Ombres 3D</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Dégradés Mesh dynamiques, verre trempé (Glassmorphism), rotation 3D et ombres réalistes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 border border-sand-200 shadow-xs hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center mb-3">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="font-semibold text-stone-900 text-sm">Exportation PNG 4K</h4>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Téléchargement haute définition 4K instantané ou copie directe dans le presse-papier.
              </p>
            </div>
          </div>
        </main>
      )}

      {/* Footer minimaliste */}
      <footer className="py-6 border-t border-sand-200 text-center text-xs text-stone-500 bg-white/50">
        <p>© {new Date().getFullYear()} OmniMockup · Studio de Mockups Web &amp; Mobile</p>
      </footer>
    </div>
  );
}
