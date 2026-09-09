'use client';

import React, { useState } from 'react';
import { Globe, ArrowRight, Loader2, X, Sparkles, AlertCircle } from 'lucide-react';

interface UrlInputFormProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  errorMessage?: string | null;
  initialUrl?: string;
}

const PRESET_URLS = [
  { label: 'Next.js', url: 'https://nextjs.org' },
  { label: 'Tailwind CSS', url: 'https://tailwindcss.com' },
  { label: 'Hacker News', url: 'https://news.ycombinator.com' },
];

export const UrlInputForm: React.FC<UrlInputFormProps> = ({
  onAnalyze,
  isLoading,
  errorMessage,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState(initialUrl);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || isLoading) return;
    onAnalyze(url.trim());
  };

  const handleSelectPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    onAnalyze(presetUrl);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-1 sm:px-0">
      <form onSubmit={handleSubmit} className="relative group w-full max-w-full">
        <div className="relative flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-white border border-sand-200 shadow-md shadow-stone-900/5 focus-within:border-violet-500 focus-within:ring-4 focus-within:ring-violet-100 transition-all duration-300 w-full max-w-full box-border">
          <div className="flex items-center w-full min-w-0 px-2.5 sm:px-3 py-2 sm:py-0">
            <Globe className="w-5 h-5 text-stone-400 mr-2.5 sm:mr-3 flex-shrink-0 group-focus-within:text-violet-600 transition-colors" />
            <input
              type="text"
              id="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Collez l'URL d'un site web (ex: https://exemple.com)..."
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
                <span>Analyse en cours...</span>
              </>
            ) : (
              <>
                <span>Analyser</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Raccourcis d'exemples rapides avec flex-wrap garanti */}
      <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs w-full max-w-full">
        <span className="text-stone-500 flex items-center gap-1 font-medium shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-violet-600 shrink-0" />
          Exemples populaires :
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

      {/* Alerte d'erreur claire et explicite */}
      {errorMessage && (
        <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-rose-900">Échec de l&apos;analyse de l&apos;URL</p>
            <p className="mt-0.5 text-rose-700 text-xs leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
};
