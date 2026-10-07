'use client';

import React, { useState } from 'react';
import { TEMPLATES_CATALOG, StudioTemplate } from '@/lib/shotsPresets';
import {
  X,
  LayoutGrid,
  Image as ImageIcon,
  Video,
  Sparkles,
  ArrowRight,
  Monitor,
  Smartphone,
  Tablet,
} from 'lucide-react';

interface TemplatesModalProps {
  onSelectTemplate: (template: StudioTemplate) => void;
  onClose: () => void;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({
  onSelectTemplate,
  onClose,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'image' | 'animated'>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    promotion: true,
    desktop: true,
    shadow: true,
    showcase: true,
  });

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const categories = [
    { id: 'promotion', label: 'Product promotion' },
    { id: 'desktop', label: 'Realistic Desktop' },
    { id: 'shadow', label: 'Shadow Overlays' },
    { id: 'showcase', label: 'UI Showcase' },
  ];

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#141418] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between shrink-0 bg-zinc-900/60">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <span>Templates & Mises en scène</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Sélectionnez une mise en page prête à l&apos;emploi pour votre produit
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filtres : All / Image / Animated */}
        <div className="px-5 py-3 border-b border-zinc-850 flex items-center gap-2 shrink-0 bg-zinc-950/40">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'all'
                ? 'bg-zinc-100 text-stone-900 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tous</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('image')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'image'
                ? 'bg-zinc-100 text-stone-900 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Image</span>
          </button>

          <button
            type="button"
            onClick={() => setFilterType('animated')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterType === 'animated'
                ? 'bg-zinc-100 text-stone-900 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Animé</span>
          </button>
        </div>

        {/* Grille des templates par catégories */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-700">
          {categories.map((cat) => {
            const tmpls = TEMPLATES_CATALOG.filter((t) => t.category === cat.id);
            const isExpanded = expandedCategories[cat.id] ?? true;

            return (
              <div key={cat.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider font-mono">
                    {cat.label}
                  </h3>
                  <button
                    type="button"
                    onClick={() => toggleCategory(cat.id)}
                    className="text-xs text-zinc-400 hover:text-white font-medium"
                  >
                    {isExpanded ? 'Réduire' : `Voir tout (${tmpls.length})`}
                  </button>
                </div>

                {isExpanded && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    {tmpls.map((tmpl) => {
                      const DeviceIcon =
                        tmpl.mockupType === 'iphone'
                          ? Smartphone
                          : tmpl.mockupType === 'ipad'
                          ? Tablet
                          : Monitor;

                      return (
                        <div
                          key={tmpl.id}
                          onClick={() => {
                            onSelectTemplate(tmpl);
                            onClose();
                          }}
                          className="group relative rounded-2xl overflow-hidden border border-zinc-800 hover:border-violet-500 bg-zinc-900/60 hover:bg-zinc-850/80 cursor-pointer transition-all duration-300 p-4 flex flex-col justify-between shadow-sm hover:shadow-xl hover:shadow-violet-600/10"
                        >
                          {/* Mini scène de prévisualisation */}
                          <div
                            className="w-full h-36 rounded-xl relative overflow-hidden flex items-center justify-center border border-zinc-750/60 shadow-inner group-hover:scale-[1.01] transition-transform duration-300"
                            style={{
                              background: tmpl.bgValue,
                            }}
                          >
                            {/* Simule l'ombre portée de la scène */}
                            {tmpl.sceneOverlay === 'blinds' && (
                              <div
                                className="absolute inset-0 pointer-events-none opacity-40 filter blur-[4px]"
                                style={{
                                  backgroundImage:
                                    'repeating-linear-gradient(-35deg, rgba(0,0,0,0.8) 0px, rgba(0,0,0,0.8) 12px, transparent 12px, transparent 24px)',
                                }}
                              />
                            )}

                            {tmpl.sceneOverlay === 'leaves' && (
                              <div className="absolute -top-4 -left-4 w-24 h-24 bg-black/50 rounded-full blur-xl pointer-events-none" />
                            )}

                            {/* Mini mockup représentatif */}
                            <div
                              className="w-24 h-16 rounded-md bg-zinc-950/90 border border-white/20 shadow-2xl flex items-center justify-center transition-transform group-hover:scale-105"
                              style={{
                                transform: `rotate(${tmpl.mockupRotation}deg)`,
                              }}
                            >
                              <DeviceIcon className="w-6 h-6 text-violet-400/80" />
                            </div>

                            {tmpl.badge && (
                              <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-violet-600 text-white shadow-xs">
                                {tmpl.badge}
                              </span>
                            )}
                          </div>

                          {/* Infos du template */}
                          <div className="mt-3 flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                                {tmpl.title}
                              </h4>
                              <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                <DeviceIcon className="w-3 h-3 text-zinc-500" />
                                <span>{tmpl.deviceLabel}</span>
                                <span className="text-zinc-600">•</span>
                                <span className="font-mono text-[10px]">{tmpl.aspectRatio}</span>
                              </p>
                            </div>

                            <span className="p-2 rounded-xl bg-zinc-800 text-zinc-400 group-hover:bg-violet-600 group-hover:text-white transition-all">
                              <ArrowRight className="w-3.5 h-3.5" />
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
