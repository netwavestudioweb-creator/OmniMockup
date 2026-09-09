'use client';

import React from 'react';
import { DiscoveredPage } from '@/types/analyzer';
import { ExternalLink, Check, FileText, Compass, Network } from 'lucide-react';

interface PageCardProps {
  page: DiscoveredPage;
  isSelected: boolean;
  onToggle: (id: string) => void;
}

export const PageCard: React.FC<PageCardProps> = ({
  page,
  isSelected,
  onToggle,
}) => {
  return (
    <div
      onClick={() => onToggle(page.id)}
      className={`group relative flex flex-col justify-between p-5 rounded-2xl cursor-pointer transition-all duration-200 border ${
        isSelected
          ? 'bg-violet-50/50 border-violet-500 shadow-md ring-2 ring-violet-200'
          : 'bg-white hover:bg-sand-50/50 border-sand-200 hover:border-sand-300 hover:shadow-sm'
      }`}
    >
      {/* En-tête de carte avec checkbox et badge de source */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Checkbox stylisée violet */}
          <div
            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all flex-shrink-0 border ${
              isSelected
                ? 'bg-violet-600 border-violet-600 text-white shadow-xs'
                : 'bg-white border-sand-300 group-hover:border-stone-400 text-transparent'
            }`}
          >
            <Check className={`w-3.5 h-3.5 stroke-[3] ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
          </div>

          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${
              page.source === 'sitemap'
                ? 'bg-violet-50 text-violet-800 border-violet-200'
                : 'bg-sand-100 text-stone-700 border-sand-200'
            }`}
          >
            {page.source === 'sitemap' ? (
              <Compass className="w-3 h-3 text-violet-600" />
            ) : (
              <Network className="w-3 h-3 text-stone-500" />
            )}
            {page.badge || (page.source === 'sitemap' ? 'Sitemap XML' : 'HTML Crawl')}
          </span>
        </div>

        {/* Lien externe */}
        <a
          href={page.url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-sand-100 transition-colors"
          title="Ouvrir la page dans un nouvel onglet"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Contenu : Titre et chemin */}
      <div className="mt-4 space-y-2">
        <div className="flex items-start gap-2">
          <FileText className="w-4 h-4 text-stone-400 mt-0.5 flex-shrink-0" />
          <h3
            className={`text-sm sm:text-base font-semibold tracking-tight line-clamp-2 transition-colors ${
              isSelected ? 'text-stone-900' : 'text-stone-800 group-hover:text-stone-900'
            }`}
          >
            {page.title}
          </h3>
        </div>

        <div className="font-mono text-xs text-stone-600 truncate bg-sand-50 px-2.5 py-1.5 rounded-lg border border-sand-200">
          <span>{page.path}</span>
        </div>
      </div>

      {/* Pied de carte : URL nettoyée et niveau */}
      <div className="mt-4 pt-3 border-t border-sand-100 flex items-center justify-between text-[11px] text-stone-500 font-mono">
        <span className="truncate max-w-[200px]">{page.url.replace(/^https?:\/\//, '')}</span>
        {typeof page.depth === 'number' && (
          <span className="px-2 py-0.5 rounded bg-sand-100 text-stone-600 border border-sand-200 flex-shrink-0">
            Niveau {page.depth}
          </span>
        )}
      </div>
    </div>
  );
};
