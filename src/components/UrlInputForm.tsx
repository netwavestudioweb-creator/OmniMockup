'use client';

import React, { useState, useRef } from 'react';
import {
  Globe,
  ArrowRight,
  Loader2,
  X,
  Sparkles,
  AlertCircle,
  Upload,
  Image as ImageIcon,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Maximize2,
  Check,
  Smartphone,
  Monitor,
  MonitorCheck,
  Eye,
} from 'lucide-react';
import { CaptureSettings } from '@/types/analyzer';

interface UrlInputFormProps {
  onAnalyze: (url: string, settings?: CaptureSettings) => void;
  onUploadImage?: (base64Image: string, title: string) => void;
  isLoading: boolean;
  errorMessage?: string | null;
  initialUrl?: string;
}

const PRESET_URLS = [
  { label: 'Next.js', url: 'https://nextjs.org' },
  { label: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  { label: 'Apple', url: 'https://apple.com' },
  { label: 'Stripe', url: 'https://stripe.com' },
];

const VIEWPORT_PRESETS = [
  { id: 'desktop', label: 'Bureau (1440 × 900)', width: 1440, height: 900, icon: Monitor },
  { id: 'fhd', label: 'Grand Écran (1920 × 1080)', width: 1920, height: 1080, icon: MonitorCheck },
  { id: 'long', label: 'Long Scroll (1440 × 2400)', width: 1440, height: 2400, icon: Maximize2 },
  { id: 'mobile', label: 'Mobile (390 × 844)', width: 390, height: 844, icon: Smartphone },
  { id: 'custom', label: 'Personnalisé', width: 1440, height: 900, icon: SlidersHorizontal },
];

export const UrlInputForm: React.FC<UrlInputFormProps> = ({
  onAnalyze,
  onUploadImage,
  isLoading,
  errorMessage,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Panneau des Paramètres de Capture (Écran & Hauteur)
  const [showOptions, setShowOptions] = useState(false);
  const [fullPage, setFullPage] = useState(true);
  const [hideBanners, setHideBanners] = useState(true);
  const [delaySeconds, setDelaySeconds] = useState(0);
  const [darkMode, setDarkMode] = useState(false);
  const [selectedPresetId, setSelectedPresetId] = useState('desktop');
  const [customWidth, setCustomWidth] = useState(1440);
  const [customHeight, setCustomHeight] = useState(900);

  const getActiveSettings = (): CaptureSettings => {
    let width = 1440;
    let height = 900;

    if (selectedPresetId === 'custom') {
      width = customWidth;
      height = customHeight;
    } else {
      const preset = VIEWPORT_PRESETS.find((p) => p.id === selectedPresetId);
      if (preset) {
        width = preset.width;
        height = preset.height;
      }
    }

    return {
      fullPage,
      hideBanners,
      viewportWidth: width,
      viewportHeight: height,
      delaySeconds,
      darkMode,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onAnalyze(url.trim(), getActiveSettings());
  };

  const handleSelectPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    onAnalyze(presetUrl, getActiveSettings());
  };

  const handleFileChange = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (base64 && onUploadImage) {
        onUploadImage(base64, file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-2 sm:px-4">
      {/* Selector Onglets : URL vs Téléverser Image — Centré et épuré */}
      <div className="flex items-center justify-center p-1 bg-zinc-900/90 rounded-2xl max-w-xs sm:max-w-sm mx-auto mb-6 border border-zinc-700/80 shadow-lg">
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === 'url'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-650'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Globe className="w-4 h-4 text-violet-400" />
          <span>Capturer une URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-zinc-800 text-white shadow-md border border-zinc-650'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Upload className="w-4 h-4 text-violet-400" />
          <span>Déposer une image</span>
        </button>
      </div>

      {activeTab === 'url' ? (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="relative group w-full">
            {/* Grand champ d'entrée ergonomique et élégant sur PC et mobile */}
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2 p-2 sm:p-2.5 rounded-2xl sm:rounded-full bg-zinc-900/95 border-2 border-zinc-700/80 hover:border-zinc-600 focus-within:border-violet-500/80 focus-within:ring-4 focus-within:ring-violet-500/20 shadow-2xl shadow-black/50 transition-all duration-300">
              {/* Icône + Saisie URL */}
              <div className="flex items-center flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-0">
                <div className="w-9 h-9 rounded-full bg-violet-600/15 border border-violet-500/30 flex items-center justify-center shrink-0 mr-3">
                  <Globe className="w-4.5 h-4.5 text-violet-400" />
                </div>
                <input
                  type="text"
                  id="url-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://votre-site.com..."
                  disabled={isLoading}
                  className="w-full min-w-0 flex-1 bg-transparent border-none text-white placeholder-zinc-500 focus:outline-none text-base sm:text-lg font-medium tracking-normal"
                  autoComplete="off"
                />
                {url && !isLoading && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors ml-1 shrink-0"
                    title="Effacer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Boutons d'action responsive : Réglages + Soumission */}
              <div className="flex items-center gap-2 w-full sm:w-auto px-1 sm:px-0">
                <button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  className={`py-3 px-4 rounded-xl sm:rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 active:scale-95 border ${
                    showOptions
                      ? 'bg-violet-600/25 border-violet-500/50 text-violet-200'
                      : 'bg-zinc-800 hover:bg-zinc-750 border-zinc-700 text-zinc-300 hover:text-white'
                  }`}
                  title="Ajuster la résolution et les dimensions de capture"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-violet-400" />
                  <span>Réglages</span>
                  {showOptions ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="submit"
                  id="analyze-button"
                  disabled={!url.trim() || isLoading}
                  className="flex-1 sm:flex-initial px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl sm:rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-violet-600/35 hover:shadow-violet-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4.5 h-4.5 animate-spin" />
                      <span>Capture en cours...</span>
                    </>
                  ) : (
                    <>
                      <span>Créer mon Mockup</span>
                      <ArrowRight className="w-4.5 h-4.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* PANNEAU DE PARAMÈTRES DE CAPTURE RÉGLABLE (Thème sombre harmonieux) */}
          {showOptions && (
            <div className="p-5 sm:p-6 rounded-2xl bg-zinc-900 border border-zinc-700/80 shadow-2xl animate-fade-in space-y-5 text-left">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-violet-400" />
                  <h4 className="text-sm font-bold text-white">
                    Paramètres de Capture & Dimension d&apos;Écran
                  </h4>
                </div>
                <span className="text-[11px] text-zinc-400 font-mono">Moteur HD 3-Tiers</span>
              </div>

              {/* Mode Capture : Page Entière vs Vue Écran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-2">
                  <span className="text-xs font-bold text-zinc-200 block">Mode de Longueur</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFullPage(true)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        fullPage
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>Page Entière</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFullPage(false)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        !fullPage
                          ? 'bg-violet-600 text-white shadow-md'
                          : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Vue Écran Fixe</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-2">
                  <span className="text-xs font-bold text-zinc-200 block">Nettoyage Automatique</span>
                  <button
                    type="button"
                    onClick={() => setHideBanners(!hideBanners)}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                      hideBanners
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>Masquer Bannières &amp; Cookies</span>
                    {hideBanners && <Check className="w-4 h-4 text-violet-400 stroke-[3]" />}
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-2">
                  <span className="text-xs font-bold text-zinc-200 block">Délai avant la capture</span>
                  <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Délai avant la capture">
                    {[0, 2, 5].map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        role="radio"
                        aria-checked={delaySeconds === sec}
                        onClick={() => setDelaySeconds(sec)}
                        className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                          delaySeconds === sec
                            ? 'bg-violet-600 text-white shadow-md'
                            : 'bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white'
                        }`}
                      >
                        {sec === 0 ? 'Aucun' : `${sec} s`}
                      </button>
                    ))}
                  </div>
                  <span className="text-[11px] text-zinc-500 block">Utile si le site a des animations ou charge lentement.</span>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 space-y-2">
                  <span className="text-xs font-bold text-zinc-200 block">Apparence du site</span>
                  <button
                    type="button"
                    onClick={() => setDarkMode(!darkMode)}
                    aria-pressed={darkMode}
                    className={`w-full py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                      darkMode
                        ? 'bg-violet-600/20 text-violet-300 border border-violet-500/40 shadow-sm'
                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span>Version sombre (si le site en a une)</span>
                    {darkMode && <Check className="w-4 h-4 text-violet-400 stroke-[3]" />}
                  </button>
                </div>
              </div>

              {/* Résolution / Taille du Viewport */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-200 block">
                  Résolution de Capture (Largeur × Hauteur)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {VIEWPORT_PRESETS.map((vp) => {
                    const IconComp = vp.icon;
                    const isSelected = selectedPresetId === vp.id;
                    return (
                      <button
                        key={vp.id}
                        type="button"
                        onClick={() => setSelectedPresetId(vp.id)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all active:scale-95 ${
                          isSelected
                            ? 'bg-violet-600 text-white border-violet-500 shadow-md'
                            : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:bg-zinc-750 hover:text-white'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                        <span className="text-[11px] truncate w-full text-center">{vp.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Champs personnalisés si 'custom' est sélectionné */}
              {selectedPresetId === 'custom' && (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-violet-600/10 border border-violet-500/30 animate-fade-in">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">Largeur (px)</label>
                    <input
                      type="number"
                      min="320"
                      max="3840"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-700 text-xs font-mono bg-zinc-800 text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-300 block mb-1">Hauteur (px)</label>
                    <input
                      type="number"
                      min="400"
                      max="6000"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg border border-zinc-700 text-xs font-mono bg-zinc-800 text-white focus:outline-none focus:border-violet-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-3xl p-10 text-center cursor-pointer transition-all active:scale-[0.99] ${
            dragActive
              ? 'border-violet-500 bg-violet-500/15 scale-[1.01]'
              : 'border-zinc-700 bg-zinc-900/60 hover:border-violet-500/60 hover:bg-zinc-850'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />
          <div className="w-14 h-14 rounded-2xl bg-violet-600/20 text-violet-400 border border-violet-500/30 flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ImageIcon className="w-7 h-7" />
          </div>
          <p className="text-base font-bold text-white">
            Cliquez ou glissez une capture d&apos;écran ici
          </p>
          <p className="text-xs text-zinc-400 mt-1.5">PNG, JPG, WebP jusqu&apos;à 15MB</p>
        </div>
      )}

      {/* Raccourcis d'exemples rapides — Centrés pour éliminer tout trou de côté */}
      {activeTab === 'url' && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs w-full text-center">
          <span className="text-zinc-400 flex items-center gap-1.5 font-medium shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            Exemples rapides :
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {PRESET_URLS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => handleSelectPreset(preset.url)}
                disabled={isLoading}
                className="px-3 py-1 rounded-full bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700/60 hover:border-violet-500/50 transition-all active:scale-95 text-xs font-medium shrink-0 shadow-sm"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alerte d'erreur */}
      {errorMessage && (
        <div className="mt-5 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3 animate-fade-in text-left">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-200">Échec de la capture</p>
            <p className="mt-0.5 text-rose-400 text-xs leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

