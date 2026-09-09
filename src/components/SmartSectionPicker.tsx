'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  DetectedSection,
  SectionRecommendations,
  SectionCoordinates,
} from '@/types/analyzer';
import {
  Sparkles,
  Smartphone,
  Monitor,
  Share2,
  Check,
  CheckSquare,
  Square,
  Camera,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
} from 'lucide-react';

interface SmartSectionPickerProps {
  url: string;
  fullPageScreenshot: string;
  screenshotWidth: number;
  screenshotHeight: number;
  sections: DetectedSection[];
  recommendations: SectionRecommendations;
  isFallback: boolean;
  fallbackMessage?: string;
  onConfirmCapture: (selectedSections: DetectedSection[]) => void;
  isCapturing?: boolean;
}

type FormatTab = 'mobile' | 'desktop' | 'social';

// Sous-composant de recadrage visuel Canvas haute fidélité
const SectionThumbnail: React.FC<{
  fullImage: string;
  coordinates: SectionCoordinates;
  title: string;
}> = ({ fullImage, coordinates, title }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Échelle réelle entre le viewport 1440px et la résolution naturelle de l'image
      const imgW = img.naturalWidth || 1440;
      const scaleX = imgW / 1440;

      const sx = Math.max(0, Math.round((coordinates.x || 0) * scaleX));
      const sy = Math.max(0, Math.round((coordinates.y || 0) * scaleX));
      const sw = Math.min(imgW - sx, Math.round((coordinates.width || 1440) * scaleX));
      const sh = Math.max(10, Math.round((coordinates.height || 400) * scaleX));

      const targetWidth = 480;
      const targetHeight = Math.max(160, Math.min(320, Math.round((sh / (sw || 1)) * targetWidth)));

      canvas.width = targetWidth;
      canvas.height = targetHeight;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, targetWidth, targetHeight);
      setLoaded(true);
    };
    img.src = fullImage;
  }, [fullImage, coordinates]);

  return (
    <div className="relative w-full h-44 bg-sand-100 rounded-xl overflow-hidden border border-sand-200 flex items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 bg-sand-100 animate-pulse flex items-center justify-center">
          <Layers className="w-5 h-5 text-stone-400 animate-spin" />
        </div>
      )}
      <canvas
        ref={canvasRef}
        aria-label={title}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
};

export const SmartSectionPicker: React.FC<SmartSectionPickerProps> = ({
  url,
  fullPageScreenshot,
  sections,
  recommendations,
  isFallback,
  fallbackMessage,
  onConfirmCapture,
  isCapturing = false,
}) => {
  const [activeTab, setActiveTab] = useState<FormatTab>('desktop');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initialRecs = recommendations?.desktop || [];
    return new Set(initialRecs.length > 0 ? initialRecs : sections.slice(0, 3).map((s) => s.id));
  });

  const toggleSection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedIds(new Set(sections.map((s) => s.id)));
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectRecommended = () => {
    const recList = recommendations[activeTab] || [];
    if (recList.length > 0) {
      setSelectedIds(new Set(recList));
    }
  };

  const activeRecommendedIds = new Set(recommendations[activeTab] || []);

  const handleLaunchCapture = () => {
    const selectedList = sections.filter((s) => selectedIds.has(s.id));
    if (selectedList.length === 0) return;
    onConfirmCapture(selectedList);
  };

  return (
    <section className="space-y-6 animate-fade-in" id="smart-section-picker">
      {/* En-tête de la section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-violet-100 text-violet-700">
              <Sparkles className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
                Analyse & Découpe Intelligente
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200 font-sans font-semibold">
                  Gemini Vision
                </span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5 font-mono truncate max-w-xl">
                {url} • Sélectionnez les sections à habiller en mockup.
              </p>
            </div>
          </div>
        </div>

        {/* Bouton d'action principal */}
        <button
          type="button"
          onClick={handleLaunchCapture}
          disabled={selectedIds.size === 0 || isCapturing}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all self-start md:self-auto"
        >
          <Camera className="w-4 h-4" />
          <span>
            {isCapturing
              ? 'Capture Playwright en cours...'
              : `Capturer les sections sélectionnées (${selectedIds.size})`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Message d'état / Fallback discret */}
      {isFallback && fallbackMessage && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2.5 font-sans">
          <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <span>{fallbackMessage}</span>
        </div>
      )}

      {/* Barre de contrôle : Onglets de formats et actions de sélection */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-3.5 rounded-2xl bg-white border border-sand-200 shadow-xs">
        {/* Onglets des 3 formats recommandés avec scroll horizontal fluide sur mobile */}
        <div className="flex items-center bg-sand-100 p-1 rounded-xl border border-sand-200 text-xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => setActiveTab('desktop')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'desktop'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span>Desktop</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mobile')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'mobile'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span>Mobile</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social')}
            className={`px-3 sm:px-3.5 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'social'
                ? 'bg-violet-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 shrink-0" />
            <span>Social (1:1)</span>
          </button>
        </div>

        {/* Contrôles de sélection de masse */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSelectRecommended}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 text-xs font-semibold transition-all"
            title="Sélectionner les sections recommandées pour ce format"
          >
            <Sparkles className="w-3 h-3 text-violet-600" />
            <span>Recommandées</span>
          </button>

          <button
            type="button"
            onClick={handleSelectAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-sand-100 text-stone-700 border border-sand-200 text-xs font-medium transition-all"
          >
            <CheckSquare className="w-3 h-3 text-stone-500" />
            <span>Tout</span>
          </button>

          <button
            type="button"
            onClick={handleDeselectAll}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white hover:bg-sand-100 text-stone-500 hover:text-stone-800 border border-sand-200 text-xs font-medium transition-all"
          >
            <Square className="w-3 h-3 text-stone-400" />
            <span>Aucun</span>
          </button>
        </div>
      </div>

      {/* Grille des cartes de sections détectées : 1 col sur mobile (<640px), 2 col sm/md, 3 col lg+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full">
        {sections.map((section) => {
          const isSelected = selectedIds.has(section.id);
          const isRecommended = activeRecommendedIds.has(section.id);

          return (
            <div
              key={section.id}
              onClick={() => toggleSection(section.id)}
              className={`group relative rounded-2xl p-4 cursor-pointer transition-all duration-200 border flex flex-col justify-between space-y-4 ${
                isSelected
                  ? 'bg-violet-50/40 border-violet-500 shadow-md ring-2 ring-violet-200'
                  : 'bg-white hover:bg-sand-50/50 border-sand-200 hover:border-sand-300 hover:shadow-sm'
              }`}
            >
              {/* En-tête de carte : Label, Badge IA, Checkbox */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`text-sm sm:text-base font-bold tracking-tight truncate ${
                        isSelected ? 'text-stone-900' : 'text-stone-800 group-hover:text-stone-900'
                      }`}
                    >
                      {section.label}
                    </h3>

                    {isRecommended && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-100 text-violet-800 border border-violet-200">
                        <Sparkles className="w-2.5 h-2.5 text-violet-600" />
                        Recommandé
                      </span>
                    )}
                  </div>

                  {section.description && (
                    <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">
                      {section.description}
                    </p>
                  )}
                </div>

                {/* Checkbox stylisée */}
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 border ${
                    isSelected
                      ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                      : 'bg-white border-sand-300 group-hover:border-stone-400 text-transparent'
                  }`}
                >
                  <Check
                    className={`w-3.5 h-3.5 stroke-[3] ${
                      isSelected ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                </div>
              </div>

              {/* Rendu visuel Canvas découpé */}
              <SectionThumbnail
                fullImage={fullPageScreenshot}
                coordinates={section.coordinates}
                title={section.label}
              />

              {/* Avis & Justification Directeur Artistique */}
              {section.justification && (
                <div className="p-3 rounded-xl bg-sand-100/80 border border-sand-200/90 text-stone-700 relative group/da transition-all hover:bg-sand-100">
                  <div className="flex items-center justify-between gap-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="p-0.5 rounded bg-violet-100 text-violet-700">
                        <Sparkles className="w-3 h-3 text-violet-600" />
                      </span>
                      <span className="font-bold text-violet-800 text-[10px] uppercase tracking-wider">
                        Avis DA Marketing
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {section.verdict && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${
                            section.verdict === 'excellent'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : section.verdict === 'bon'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : section.verdict === 'moyen'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-stone-100 text-stone-700 border border-stone-200'
                          }`}
                        >
                          {section.verdict}
                        </span>
                      )}
                      <div className="relative group/tooltip">
                        <Info className="w-3.5 h-3.5 text-stone-400 hover:text-stone-700 transition-colors" />
                        {section.visualAnalysis && (
                          <div className="hidden group-hover/tooltip:block absolute z-30 bottom-full right-0 mb-2 w-64 p-2.5 rounded-xl bg-stone-900 text-stone-200 text-[11px] shadow-xl pointer-events-none border border-stone-700">
                            <span className="font-semibold text-violet-400 text-[10px] uppercase block mb-1">
                              Analyse Visuelle
                            </span>
                            <p className="leading-snug">{section.visualAnalysis}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-stone-700 leading-relaxed font-sans line-clamp-2">
                    « {section.justification} »
                  </p>
                </div>
              )}

              {/* Pied de carte : Dimensions et score de qualité */}
              <div className="pt-2 border-t border-sand-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
                <span className="truncate">
                  {section.coordinates.width} × {section.coordinates.height} px
                </span>

                <div className="flex items-center gap-3">
                  {typeof section.marketingScore === 'number' && (
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] uppercase font-semibold text-violet-700">Impact DA :</span>
                      <span className="font-bold text-violet-800">{section.marketingScore}%</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-semibold text-stone-400">Qualité :</span>
                    <span
                      className={`font-semibold ${
                        section.qualityScore >= 85
                          ? 'text-emerald-600'
                          : section.qualityScore >= 70
                          ? 'text-amber-600'
                          : 'text-stone-500'
                      }`}
                    >
                      {section.qualityScore}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre d'action finale en bas de page */}
      <div className="p-4 rounded-2xl bg-white border border-sand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="text-xs text-stone-600">
          <span className="font-semibold text-stone-900">{selectedIds.size}</span> section
          {selectedIds.size > 1 ? 's' : ''} sélectionnée{selectedIds.size > 1 ? 's' : ''} pour la capture.
        </div>

        <button
          type="button"
          onClick={handleLaunchCapture}
          disabled={selectedIds.size === 0 || isCapturing}
          className="flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Camera className="w-4 h-4" />
          <span>
            {isCapturing ? 'Capture en cours...' : 'Continuer vers le choix du mockup'}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
};
