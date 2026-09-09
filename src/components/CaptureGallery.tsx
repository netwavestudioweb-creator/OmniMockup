'use client';

import React, { useState } from 'react';
import { CaptureItemResult, MockupType } from '@/types/analyzer';
import { MockupFrame } from './MockupFrame';
import { MockupSelector } from './MockupSelector';
import {
  Camera,
  Download,
  Maximize2,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Monitor,
  Laptop,
  Smartphone,
  Sparkles,
  LayoutTemplate,
} from 'lucide-react';

interface CaptureGalleryProps {
  captures: CaptureItemResult[];
  onOpenSceneEditor?: (item: CaptureItemResult, mockup: MockupType) => void;
  activeSceneItemUrl?: string;
}

export const CaptureGallery: React.FC<CaptureGalleryProps> = ({
  captures,
  onOpenSceneEditor,
  activeSceneItemUrl,
}) => {
  const [activeModalItem, setActiveModalItem] = useState<CaptureItemResult | null>(null);
  const [selectorModalItem, setSelectorModalItem] = useState<CaptureItemResult | null>(null);
  const [mockups, setMockups] = useState<Record<string, MockupType>>({});

  if (!captures || captures.length === 0) return null;

  const successfulCaptures = captures.filter((c) => c.success && c.screenshotBase64);
  const failedCaptures = captures.filter((c) => !c.success);

  const getMockupForUrl = (url: string): MockupType => {
    return mockups[url] || 'browser';
  };

  const setMockupForUrl = (url: string, type: MockupType) => {
    setMockups((prev) => ({ ...prev, [url]: type }));
  };

  const downloadImage = (base64Data: string, filename: string) => {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadAll = () => {
    successfulCaptures.forEach((item, index) => {
      setTimeout(() => {
        const cleanName = item.url
          .replace(/^https?:\/\//, '')
          .replace(/[^a-zA-Z0-9]/g, '_')
          .slice(0, 40);
        downloadImage(item.screenshotBase64!, `capture_${cleanName}.png`);
      }, index * 200);
    });
  };

  return (
    <section className="space-y-6 pt-10 border-t border-white/[0.08] animate-fade-in" id="capture-gallery">
      {/* En-tête de la galerie */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-600 to-accent-cyan text-white shadow-lg shadow-brand-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Captures Réelles & Mockups CSS
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20 font-mono">
                  3 Formats Haute Fidélité
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Habillez chaque page en <strong>Browser</strong>, <strong>MacBook</strong> ou <strong>iPhone</strong> avec rendu CSS/SVG pur.
              </p>
            </div>
          </div>
        </div>

        {/* Statistiques et téléchargement groupé */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-obsidian-850 border border-white/[0.06] text-xs font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">{successfulCaptures.length}</span>
            <span className="text-slate-500">/</span>
            <span className="text-slate-400">{captures.length} capturées</span>
          </div>

          {failedCaptures.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono text-rose-300">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              <span>{failedCaptures.length} en échec</span>
            </div>
          )}

          {successfulCaptures.length > 0 && (
            <button
              type="button"
              onClick={handleDownloadAll}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-brand-600/20 transition-all glow-btn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger tout ({successfulCaptures.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Grille des cartes avec Mockups personnalisés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {captures.map((item, index) => {
          const currentMockup = getMockupForUrl(item.url);
          const cleanFileName = `capture_${currentMockup}_${item.url
            .replace(/^https?:\/\//, '')
            .replace(/[^a-zA-Z0-9]/g, '_')
            .slice(0, 35)}.png`;

          return (
            <div
              key={index}
              className="group rounded-3xl p-5 bg-obsidian-850/80 border border-white/[0.08] shadow-2xl transition-all duration-300 hover:border-brand-500/40 hover:shadow-brand-900/20 space-y-4 flex flex-col justify-between"
            >
              {/* En-tête de carte : Titre & Bouton "Choisir un mockup" */}
              <div className="flex items-start justify-between gap-3 border-b border-white/[0.06] pb-4">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-white truncate">
                    {item.title || item.url}
                  </h3>
                  <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                    {item.url}
                  </p>
                </div>

                {item.success && (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Sélecteur rapide segmented pills */}
                    <div className="hidden sm:flex items-center bg-obsidian-950 p-1 rounded-xl border border-white/[0.06] text-xs">
                      <button
                        type="button"
                        onClick={() => setMockupForUrl(item.url, 'browser')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          currentMockup === 'browser'
                            ? 'bg-brand-600 text-white font-medium shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Mockup Browser"
                      >
                        <Monitor className="w-3 h-3" />
                        <span>Browser</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMockupForUrl(item.url, 'macbook')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          currentMockup === 'macbook'
                            ? 'bg-brand-600 text-white font-medium shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Mockup MacBook"
                      >
                        <Laptop className="w-3 h-3" />
                        <span>MacBook</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMockupForUrl(item.url, 'iphone')}
                        className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                          currentMockup === 'iphone'
                            ? 'bg-brand-600 text-white font-medium shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Mockup iPhone"
                      >
                        <Smartphone className="w-3 h-3" />
                        <span>iPhone</span>
                      </button>
                    </div>

                    {/* Bouton dédié "Choisir un mockup" */}
                    <button
                      type="button"
                      onClick={() => setSelectorModalItem(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 hover:text-white border border-brand-500/30 text-xs font-medium transition-all"
                      title="Ouvrir le sélecteur de mockup"
                    >
                      <LayoutTemplate className="w-3.5 h-3.5 text-brand-400" />
                      <span>Choisir un mockup</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Rendu du Mockup Habillé (Browser, MacBook, ou iPhone) */}
              <div className="py-2 flex items-center justify-center min-h-[260px]">
                {item.success && item.screenshotBase64 ? (
                  <div className="w-full relative group">
                    <MockupFrame
                      type={currentMockup}
                      screenshotBase64={item.screenshotBase64}
                      url={item.url}
                      title={item.title}
                      onClickImage={() => setActiveModalItem(item)}
                    />

                    {/* Bouton d'agrandissement au survol */}
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-30">
                      <button
                        type="button"
                        onClick={() => setActiveModalItem(item)}
                        className="p-2 rounded-xl bg-obsidian-950/80 hover:bg-obsidian-900 text-white border border-white/10 shadow-lg backdrop-blur-md"
                        title="Agrandir le mockup"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[16/10] bg-obsidian-950 rounded-2xl border border-rose-500/20 flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-rose-300">Capture non disponible</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">
                        {item.error || "Délai d'attente ou ressource protégée."}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pied de carte : Détails et actions */}
              <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2 font-mono">
                  <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                    Cadre : {currentMockup}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{(item.durationMs / 1000).toFixed(1)}s</span>
                  </div>
                </div>

                {item.success && item.screenshotBase64 && (
                  <div className="flex items-center gap-2">
                    {onOpenSceneEditor && (
                      <button
                        type="button"
                        onClick={() => onOpenSceneEditor(item, currentMockup)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border shadow-md ${
                          activeSceneItemUrl === item.url
                            ? 'bg-brand-600 text-white border-brand-400 ring-2 ring-brand-500/30'
                            : 'bg-brand-500/10 hover:bg-brand-500/20 text-brand-300 border-brand-500/30 hover:text-white'
                        }`}
                        title="Ouvrir dans l'Éditeur de Scène (shots.so)"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                        <span>Éditer la scène</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => downloadImage(item.screenshotBase64!, cleanFileName)}
                      className="px-3 py-1.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-xs text-slate-200 hover:text-white border border-white/[0.06] transition-all flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-brand-400" />
                      <span>PNG</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Dédié : MockupSelector */}
      {selectorModalItem && (
        <div
          className="fixed inset-0 z-50 bg-obsidian-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectorModalItem(null)}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <MockupSelector
              selectedType={getMockupForUrl(selectorModalItem.url)}
              targetUrl={selectorModalItem.url}
              onSelect={(type) => {
                setMockupForUrl(selectorModalItem.url, type);
                setSelectorModalItem(null);
              }}
              onClose={() => setSelectorModalItem(null)}
            />
          </div>
        </div>
      )}

      {/* Modal Zoom Plein Écran avec Mockup Habillé */}
      {activeModalItem && activeModalItem.screenshotBase64 && (
        <div
          className="fixed inset-0 z-50 bg-obsidian-950/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[92vh] bg-obsidian-900 border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/[0.08] flex items-center justify-between bg-obsidian-950/80">
              <div className="flex items-center gap-3 min-w-0">
                <Sparkles className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-semibold text-white truncate">
                    {activeModalItem.title || activeModalItem.url}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono truncate">
                    Cadre {getMockupForUrl(activeModalItem.url).toUpperCase()} • Rendu 1440 × 900
                  </p>
                </div>
              </div>

              {/* Sélecteur de mockup directement dans le modal */}
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-obsidian-950 p-1 rounded-xl border border-white/[0.06] text-xs mr-2">
                  <button
                    type="button"
                    onClick={() => setMockupForUrl(activeModalItem.url, 'browser')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      getMockupForUrl(activeModalItem.url) === 'browser'
                        ? 'bg-brand-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Browser
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockupForUrl(activeModalItem.url, 'macbook')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      getMockupForUrl(activeModalItem.url) === 'macbook'
                        ? 'bg-brand-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    MacBook
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockupForUrl(activeModalItem.url, 'iphone')}
                    className={`px-2 py-1 rounded-lg transition-all ${
                      getMockupForUrl(activeModalItem.url) === 'iphone'
                        ? 'bg-brand-600 text-white font-medium'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    iPhone
                  </button>
                </div>

                {onOpenSceneEditor && (
                  <button
                    type="button"
                    onClick={() => {
                      const item = activeModalItem;
                      const mockup = getMockupForUrl(item.url);
                      setActiveModalItem(null);
                      onOpenSceneEditor(item, mockup);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-accent-cyan hover:from-brand-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                    <span>Ouvrir dans le Studio (shots.so)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    downloadImage(
                      activeModalItem.screenshotBase64!,
                      `mockup_${getMockupForUrl(activeModalItem.url)}_${activeModalItem.url
                        .replace(/^https?:\/\//, '')
                        .replace(/[^a-zA-Z0-9]/g, '_')}.png`
                    )
                  }
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 border border-white/10 text-white text-xs font-medium transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-brand-400" />
                  <span>PNG</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModalItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Mockup Preview */}
            <div className="flex-1 overflow-auto p-6 sm:p-10 bg-obsidian-950/70 flex items-center justify-center">
              <div className="w-full max-w-4xl">
                <MockupFrame
                  type={getMockupForUrl(activeModalItem.url)}
                  screenshotBase64={activeModalItem.screenshotBase64}
                  url={activeModalItem.url}
                  title={activeModalItem.title}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
