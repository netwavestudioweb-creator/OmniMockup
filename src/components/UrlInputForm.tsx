'use client';

import React, { useState, useRef } from 'react';
import { Globe, ArrowRight, Loader2, X, Sparkles, AlertCircle, Upload, Image as ImageIcon } from 'lucide-react';

interface UrlInputFormProps {
  onAnalyze: (url: string) => void;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onAnalyze(url.trim());
  };

  const handleSelectPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    onAnalyze(presetUrl);
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
    <div className="w-full max-w-3xl mx-auto px-1 sm:px-0">
      {/* Selector Onglets : URL vs Téléverser Image */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => setActiveTab('url')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'url'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Capturer une URL</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all ${
            activeTab === 'upload'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Déposer une Image</span>
        </button>
      </div>

      {activeTab === 'url' ? (
        <form onSubmit={handleSubmit} className="relative group w-full max-w-full">
          <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-white border border-sand-200 shadow-md shadow-stone-900/5 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100 transition-all duration-300 w-full max-w-full box-border">
            <div className="flex items-center w-full min-w-0 px-2.5 sm:px-3 py-2 sm:py-0">
              <Globe className="w-5 h-5 text-stone-400 mr-2.5 sm:mr-3 flex-shrink-0 group-focus-within:text-violet-600 transition-colors" />
              <input
                type="text"
                id="url-input"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Entrez l'URL d'un site web (ex: https://nextjs.org)..."
                disabled={isLoading}
                className="w-full min-w-0 flex-1 bg-transparent border-none text-stone-900 placeholder-stone-400 focus:outline-none text-xs sm:text-base font-sans tracking-normal"
                autoComplete="off"
              />
              {url && !isLoading && (
                <button
                  type="button"
                  onClick={() => setUrl('')}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-sand-100 transition-colors ml-1 flex-shrink-0"
                  title="Effacer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="submit"
              id="analyze-button"
              disabled={!url.trim() || isLoading}
              className="w-full sm:w-auto px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-shrink-0 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Capture du site...</span>
                </>
              ) : (
                <>
                  <span>Ouvrir dans le Studio</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all bg-white ${
            dragActive
              ? 'border-violet-600 bg-violet-50/50 scale-[1.01]'
              : 'border-stone-300 hover:border-violet-400 hover:bg-stone-50/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
          />
          <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-stone-800">
            Cliquez ou glissez une capture d&apos;écran ici
          </p>
          <p className="text-xs text-stone-500 mt-1">PNG, JPG, WebP jusqu&apos;à 15MB</p>
        </div>
      )}

      {/* Raccourcis d'exemples rapides */}
      {activeTab === 'url' && (
        <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs w-full max-w-full">
          <span className="text-stone-500 flex items-center gap-1 font-medium shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
            Exemples 1-clic :
          </span>
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2">
            {PRESET_URLS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                onClick={() => handleSelectPreset(preset.url)}
                disabled={isLoading}
                className="px-2.5 sm:px-3 py-1 rounded-lg bg-white hover:bg-sand-100 text-stone-700 hover:text-violet-700 border border-sand-200 transition-all text-xs font-medium shadow-2xs shrink-0 whitespace-nowrap"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Alerte d'erreur */}
      {errorMessage && (
        <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Échec de la capture</p>
            <p className="mt-0.5 text-rose-700 text-xs leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
