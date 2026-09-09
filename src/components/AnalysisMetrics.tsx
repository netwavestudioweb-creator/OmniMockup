'use client';

import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Search,
  Copy,
  Check,
  Download,
  Activity,
  Camera,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { DiscoveredPage } from '@/types/analyzer';

interface AnalysisMetricsProps {
  totalCount: number;
  selectedCount: number;
  source: 'sitemap' | 'html_crawl';
  domain: string;
  executionTimeMs: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  pages: DiscoveredPage[];
  selectedIds: Set<string>;
  onCaptureSelected?: () => void;
  isCapturing?: boolean;
  onSmartAnalyze?: () => void;
  isSmartAnalyzing?: boolean;
}

export const AnalysisMetrics: React.FC<AnalysisMetricsProps> = ({
  totalCount,
  selectedCount,
  source,
  domain,
  executionTimeMs,
  searchQuery,
  onSearchChange,
  onSelectAll,
  onDeselectAll,
  pages,
  selectedIds,
  onCaptureSelected,
  isCapturing = false,
  onSmartAnalyze,
  isSmartAnalyzing = false,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySelected = async () => {
    const selectedUrls = pages
      .filter((p) => selectedIds.has(p.id))
      .map((p) => p.url)
      .join('\n');

    if (!selectedUrls) return;

    try {
      await navigator.clipboard.writeText(selectedUrls);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleExportJson = () => {
    const selectedPages = pages.filter((p) => selectedIds.has(p.id));
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(selectedPages, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `pages-${domain}-${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Grille des KPI Statut */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-obsidian-850/80 border border-white/[0.06] backdrop-blur-md">
          <p className="text-xs text-slate-400 font-medium">Pages Découvertes</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {totalCount}
            </span>
            <span className="text-xs text-brand-400 font-mono">routes</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-obsidian-850/80 border border-white/[0.06] backdrop-blur-md">
          <p className="text-xs text-slate-400 font-medium">Sélectionnées</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-400">
              {selectedCount}
            </span>
            <span className="text-xs text-slate-400">/ {totalCount}</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-obsidian-850/80 border border-white/[0.06] backdrop-blur-md">
          <p className="text-xs text-slate-400 font-medium">Méthode Source</p>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                source === 'sitemap'
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'bg-accent-cyan/20 text-cyan-300 border border-accent-cyan/30'
              }`}
            >
              {source === 'sitemap' ? 'sitemap.xml' : 'crawl html'}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-obsidian-850/80 border border-white/[0.06] backdrop-blur-md">
          <p className="text-xs text-slate-400 font-medium">Temps d’Analyse</p>
          <div className="mt-2 flex items-baseline gap-1 text-emerald-400 font-mono">
            <Activity className="w-4 h-4 mr-1 inline" />
            <span className="text-2xl sm:text-3xl font-bold">
              {executionTimeMs}
            </span>
            <span className="text-xs text-emerald-500/80">ms</span>
          </div>
        </div>
      </div>

      {/* Barre d'outils et de filtres */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 rounded-2xl bg-obsidian-850/60 border border-white/[0.06]">
        {/* Recherche instantanée */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filtrer par titre ou chemin (/blog, /tarifs...)..."
            className="w-full pl-9 pr-3 py-2 bg-obsidian-950/60 border border-white/[0.06] rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500/50"
          />
        </div>

        {/* Boutons d'actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onSelectAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-xs font-medium text-slate-200 hover:text-white border border-white/[0.05] transition-all"
          >
            <CheckSquare className="w-3.5 h-3.5 text-brand-400" />
            <span>Tout cocher</span>
          </button>

          <button
            type="button"
            onClick={onDeselectAll}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-xs font-medium text-slate-400 hover:text-slate-200 border border-white/[0.05] transition-all"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Tout décocher</span>
          </button>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block mx-1" />

          <button
            type="button"
            onClick={handleCopySelected}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium text-slate-200 hover:text-white border border-white/[0.05] transition-all"
            title="Copier les URLs sélectionnées"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copier ({selectedCount})</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleExportJson}
            disabled={selectedCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-medium border border-white/[0.05] transition-all"
            title="Exporter les pages sélectionnées en JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          {/* Bouton Analyse Intelligente Gemini Vision */}
          {onSmartAnalyze && (
            <button
              type="button"
              id="smart-analyze-button"
              onClick={onSmartAnalyze}
              disabled={isSmartAnalyzing || isCapturing}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-750 text-brand-300 hover:text-brand-200 border border-brand-500/30 text-xs font-medium transition-all shadow-sm"
              title="Analyser visuellement la page via Gemini Vision pour découper ses sections"
            >
              {isSmartAnalyzing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                  <span>Analyse Gemini...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                  <span>Analyse IA (Gemini)</span>
                </>
              )}
            </button>
          )}

          {/* Bouton Proéminent de Capture Playwright Standard */}
          {onCaptureSelected && (
            <button
              type="button"
              id="capture-selected-button"
              onClick={onCaptureSelected}
              disabled={selectedCount === 0 || isCapturing}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-indigo-600 to-accent-cyan hover:from-brand-500 hover:to-indigo-500 text-white font-medium text-xs shadow-lg shadow-brand-600/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all glow-btn ml-1"
            >
              {isCapturing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Capture Playwright...</span>
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" />
                  <span>Capturer sélection ({selectedCount})</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
