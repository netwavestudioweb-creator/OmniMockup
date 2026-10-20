'use client';

import React, { useState, useRef } from 'react';
import { Globe, ArrowRight, Loader2, X, Sparkles, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';
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
  { label: 'Stripe', url: 'https://stripe.com' },
  { label: 'Vidéo YouTube', url: 'https://www.youtube.com/watch?v=M576WGiDBdQ' },
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

  // Réglages de capture fixes sur l'accueil (page entière, bannières masquées, écran d'ordinateur 1440 × 900) :
  // les réglages fins (appareil, format, pages du site) se font ensuite dans le studio.
  const getActiveSettings = (): CaptureSettings => ({
    fullPage: true,
    hideBanners: true,
    viewportWidth: 1440,
    viewportHeight: 900,
    delaySeconds: 0,
    darkMode: false,
  });

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
      <div className="flex items-center justify-center p-1 bg-pms-card rounded-2xl w-full max-w-sm mx-auto mb-6 border border-pms-line">
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[13px] sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
            activeTab === 'url'
              ? 'bg-pms-ink text-white'
              : 'text-pms-muted hover:text-pms-ink'
          }`}
        >
          <Globe className="w-4 h-4 text-pms-accent" />
          <span>Coller un lien</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] py-2 sm:py-2.5 px-2 sm:px-3 rounded-xl text-[13px] sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-pms-ink text-white'
              : 'text-pms-muted hover:text-pms-ink'
          }`}
        >
          <Upload className="w-4 h-4 text-pms-accent" />
          <span>Déposer une image</span>
        </button>
      </div>

      {activeTab === 'url' ? (
        <div className="space-y-4">
          <form onSubmit={handleSubmit} className="relative group w-full">
            {/* Grand champ d'entrée ergonomique et élégant sur PC et mobile */}
            <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2 p-2 sm:p-2.5 rounded-lg bg-pms-card border-2 border-pms-line hover:border-pms-muted focus-within:border-pms-accent focus-within:ring-4 focus-within:ring-pms-accent/15 transition-all duration-300">
              {/* Icône + Saisie URL */}
              <div className="flex items-center flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-0">
                <div className="w-9 h-9 rounded-full bg-pms-surface flex items-center justify-center shrink-0 mr-3">
                  <Globe className="w-4.5 h-4.5 text-pms-accent" />
                </div>
                <input
                  type="text"
                  id="url-input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://votre-site.com ou lien YouTube..."
                  disabled={isLoading}
                  className="w-full min-w-0 flex-1 bg-transparent border-none text-pms-ink placeholder-pms-muted focus:outline-none text-base sm:text-lg font-medium tracking-normal"
                  autoComplete="off"
                />
                {url && !isLoading && (
                  <button
                    type="button"
                    onClick={() => setUrl('')}
                    className="p-1.5 rounded-full text-pms-muted hover:text-pms-ink hover:bg-pms-surface transition-colors ml-1 shrink-0"
                    title="Effacer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Bouton de capture (les réglages fins se font dans le studio) */}
              <div className="flex items-center gap-2 w-full sm:w-auto px-1 sm:px-0">

                <button
                  type="submit"
                  id="analyze-button"
                  disabled={!url.trim() || isLoading}
                  className="flex-1 sm:flex-initial px-6 sm:px-8 py-3 sm:py-3.5 rounded-md bg-pms-accent hover:bg-pms-accent-hover text-white font-bold text-sm sm:text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0 active:scale-[0.98]"
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
              ? 'border-pms-accent bg-pms-surface'
              : 'border-pms-line bg-pms-card hover:border-pms-accent hover:bg-pms-surface'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />
          <div className="w-14 h-14 rounded-2xl bg-pms-surface text-pms-accent flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-7 h-7" />
          </div>
          <p className="text-base font-bold text-pms-ink">
            Cliquez ou glissez une capture d&apos;écran ici
          </p>
          <p className="text-[13px] text-pms-muted mt-1.5">PNG, JPG, WebP jusqu&apos;à 15MB</p>
        </div>
      )}

      {/* Raccourcis d'exemples rapides — Centrés pour éliminer tout trou de côté */}
      {activeTab === 'url' && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-[13px] w-full text-center">
          <span className="text-pms-muted flex items-center gap-1.5 font-medium shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-pms-accent shrink-0" />
            Exemples rapides :
          </span>
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
            {PRESET_URLS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => handleSelectPreset(preset.url)}
                disabled={isLoading}
                className="min-h-[44px] px-4 py-1 rounded-full bg-pms-card hover:bg-pms-surface text-pms-ink border border-pms-line hover:border-pms-accent transition-all active:scale-95 text-[13px] font-medium shrink-0"
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
            <p className="mt-0.5 text-rose-400 text-[13px] leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};

