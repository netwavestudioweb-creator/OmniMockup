'use client';

import React from 'react';
import { DiscoveredPage } from '@/types/analyzer';
import { PageCard } from './PageCard';
import { Inbox } from 'lucide-react';

interface PageGridProps {
  pages: DiscoveredPage[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  isLoading: boolean;
}

export const PageGrid: React.FC<PageGridProps> = ({
  pages,
  selectedIds,
  onToggle,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl bg-white border border-sand-200 animate-pulse space-y-4 shadow-xs"
          >
            <div className="flex justify-between items-center">
              <div className="w-5 h-5 bg-sand-200 rounded-md" />
              <div className="w-20 h-5 bg-sand-200 rounded-full" />
            </div>
            <div className="space-y-2">
              <div className="w-3/4 h-5 bg-sand-200 rounded" />
              <div className="w-1/2 h-4 bg-sand-100 rounded" />
            </div>
            <div className="w-full h-8 bg-sand-100 rounded-lg" />
          </div>
        ))}
      </div>
    );
  }

  if (pages.length === 0) {
    return (
      <div className="py-16 text-center rounded-2xl bg-white border border-sand-200 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-sand-100 flex items-center justify-center mx-auto text-stone-400 mb-3 border border-sand-200">
          <Inbox className="w-6 h-6" />
        </div>
        <h4 className="text-base font-semibold text-stone-800">Aucune page ne correspond au filtre</h4>
        <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
          Modifiez votre mot-clé de recherche pour afficher toutes les routes répertoriées.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
      {pages.map((page) => (
        <PageCard
          key={page.id}
          page={page}
          isSelected={selectedIds.has(page.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};
