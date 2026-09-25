'use client';

import React from 'react';
import { MockupType } from '@/types/analyzer';
import { Monitor, Laptop, Smartphone, Tablet, Layers, Watch, Tv, Check, X, Sparkles } from 'lucide-react';

interface MockupOption {
  type: MockupType;
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
}

const MOCKUP_OPTIONS: MockupOption[] = [
  {
    type: 'browser',
    title: 'Navigateur Web',
    subtitle: 'Barre d’adresse macOS claire ou sombre',
    badge: 'Desktop',
    icon: Monitor,
  },
  {
    type: 'macbook',
    title: 'MacBook Pro',
    subtitle: 'Châssis aluminium Apple M3 & dalle fine',
    badge: 'Laptop',
    icon: Laptop,
  },
  {
    type: 'imac',
    title: 'iMac 24"',
    subtitle: 'Écran de bureau tout-en-un avec pied',
    badge: 'Studio',
    icon: Tv,
  },
  {
    type: 'ipad',
    title: 'iPad Pro',
    subtitle: 'Tablette tactile 4:3 à bordures fines',
    badge: 'Tablette',
    icon: Tablet,
  },
  {
    type: 'iphone',
    title: 'iPhone Moderne',
    subtitle: 'Smartphone vertical avec Dynamic Island',
    badge: 'Mobile',
    icon: Smartphone,
  },
  {
    type: 'watch',
    title: 'Apple Watch',
    subtitle: 'Montre connectée avec couronne numérique',
    badge: 'Wearable',
    icon: Watch,
  },
  {
    type: 'flat',
    title: 'Flat Épuré',
    subtitle: 'Sans châssis, focus UI pur avec coins souples',
    badge: 'Minimaliste',
    icon: Layers,
  },
];

interface MockupSelectorProps {
  selectedType: MockupType;
  onSelect: (type: MockupType) => void;
  onClose?: () => void;
  targetUrl?: string;
}

export const MockupSelector: React.FC<MockupSelectorProps> = ({
  selectedType,
  onSelect,
  onClose,
  targetUrl,
}) => {
  return (
    <div className="p-6 sm:p-8 rounded-3xl bg-white border border-sand-200 shadow-lg animate-fade-in max-w-4xl w-full">
      {/* En-tête du sélecteur */}
      <div className="flex items-start justify-between pb-5 border-b border-sand-200">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-800 text-[11px] font-semibold border border-violet-200">
            <Sparkles className="w-3 h-3 text-violet-600" />
            <span>Habillage Haute Fidélité</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900">
            Choisissez le format de cadre pour votre capture
          </h3>
          {targetUrl && (
            <p className="text-xs text-stone-500 font-mono truncate max-w-md">
              Pour : {targetUrl}
            </p>
          )}
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-sand-100 transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Les 5 options de mockup : Grille responsive 2 colonnes / 3 colonnes / 5 colonnes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mt-6">
        {MOCKUP_OPTIONS.map((opt) => {
          const isSelected = selectedType === opt.type;
          const Icon = opt.icon;

          return (
            <div
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              className={`group relative flex flex-col justify-between p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 border w-full ${
                isSelected
                  ? 'bg-violet-50/40 border-violet-500 shadow-md ring-2 ring-violet-200'
                  : 'bg-white hover:bg-sand-50/60 border-sand-200 hover:border-sand-300 hover:shadow-sm'
              }`}
            >
              {/* Miniature de cadre vide en pur CSS/SVG */}
              <div className="h-28 rounded-xl bg-sand-100 border border-sand-200 p-2 flex items-center justify-center overflow-hidden mb-3 relative group-hover:border-violet-300 transition-colors">
                {/* 1. Miniature Browser */}
                {opt.type === 'browser' && (
                  <div className="w-full h-full rounded-lg bg-white border border-sand-200 shadow-xs flex flex-col p-1.5 space-y-1">
                    <div className="flex items-center gap-1 pb-1 border-b border-sand-100">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <div className="w-12 h-1.5 rounded bg-sand-100 ml-1" />
                    </div>
                    <div className="flex-1 rounded bg-sand-50 border border-sand-100 flex items-center justify-center">
                      <div className="w-10 h-1.5 bg-sand-200 rounded" />
                    </div>
                  </div>
                )}

                {/* 2. Miniature MacBook */}
                {opt.type === 'macbook' && (
                  <div className="w-[90%] flex flex-col items-center">
                    <div className="w-full h-16 rounded-t-lg bg-stone-900 border border-stone-800 flex flex-col items-center justify-start p-1 relative shadow-xs">
                      <div className="w-1 h-1 rounded-full bg-stone-700 mb-0.5" />
                      <div className="w-full flex-1 rounded bg-stone-950 flex items-center justify-center">
                        <div className="w-8 h-1 bg-stone-800 rounded" />
                      </div>
                    </div>
                    <div className="w-[108%] h-2 bg-stone-400 rounded-b flex items-start justify-center shadow-xs">
                      <div className="w-5 h-0.5 bg-stone-600 rounded-b" />
                    </div>
                  </div>
                )}

                {/* 3. Miniature iMac */}
                {opt.type === 'imac' && (
                  <div className="w-[90%] flex flex-col items-center">
                    <div className="w-full h-16 rounded-t-lg bg-stone-900 border border-stone-800 flex flex-col items-center justify-between p-1 relative shadow-xs">
                      <div className="w-full flex-1 rounded bg-stone-950 flex items-center justify-center">
                        <Tv className="w-3 h-3 text-stone-600" />
                      </div>
                      <div className="w-full h-2 bg-stone-300 rounded-b-sm border-t border-stone-400 mt-0.5" />
                    </div>
                    <div className="w-6 h-3 bg-stone-300 rounded-b flex items-center justify-center border-t border-stone-400 shadow-xs" />
                  </div>
                )}

                {/* 4. Miniature iPad */}
                {opt.type === 'ipad' && (
                  <div className="w-20 h-22 rounded-xl bg-stone-900 p-1 border border-stone-700 flex flex-col items-center justify-between relative shadow-xs">
                    <div className="w-1 h-1 rounded-full bg-stone-700 mt-0.5" />
                    <div className="w-full flex-1 my-0.5 rounded-lg bg-stone-950 flex items-center justify-center">
                      <Tablet className="w-3 h-3 text-stone-600" />
                    </div>
                    <div className="w-6 h-0.5 bg-white/40 rounded-full mb-0.5" />
                  </div>
                )}

                {/* 5. Miniature iPhone */}
                {opt.type === 'iphone' && (
                  <div className="w-14 h-22 rounded-2xl bg-stone-900 p-1 border border-stone-700 flex flex-col items-center justify-between relative shadow-xs">
                    <div className="w-6 h-1.5 bg-black rounded-full mt-0.5" />
                    <div className="w-full flex-1 my-0.5 rounded-xl bg-stone-950 flex items-center justify-center">
                      <Smartphone className="w-3 h-3 text-stone-600" />
                    </div>
                    <div className="w-6 h-0.5 bg-white/40 rounded-full mb-0.5" />
                  </div>
                )}

                {/* 6. Miniature Apple Watch */}
                {opt.type === 'watch' && (
                  <div className="w-14 h-22 flex flex-col items-center justify-center relative">
                    <div className="w-8 h-2 bg-stone-700 rounded-t-sm" />
                    <div className="w-12 h-16 rounded-[14px] bg-stone-900 border border-stone-700 p-1 flex flex-col items-center justify-center relative shadow-xs">
                      <div className="absolute -right-1 top-4 w-1 h-3 bg-stone-500 rounded-r-xs" />
                      <div className="w-full h-full rounded-[10px] bg-stone-950 flex items-center justify-center">
                        <Watch className="w-3 h-3 text-stone-600" />
                      </div>
                    </div>
                    <div className="w-8 h-2 bg-stone-700 rounded-b-sm" />
                  </div>
                )}

                {/* 5. Miniature Flat */}
                {opt.type === 'flat' && (
                  <div className="w-full h-20 rounded-lg bg-white border border-stone-300 shadow-xs flex items-center justify-center p-2">
                    <div className="w-full h-full rounded bg-violet-100/60 border border-dashed border-violet-300 flex items-center justify-center">
                      <Layers className="w-4 h-4 text-violet-600" />
                    </div>
                  </div>
                )}

                {/* Badge Actif / Check */}
                {isSelected && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-white shadow-sm">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Titre et détails */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? 'text-violet-600' : 'text-stone-500'
                      }`}
                    />
                    <span className="text-sm font-bold text-stone-900">
                      {opt.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-stone-500 bg-sand-100 px-2 py-0.5 rounded-md">
                    {opt.badge}
                  </span>
                </div>
                <p className="text-xs text-stone-500 leading-snug">
                  {opt.subtitle}
                </p>
              </div>

              {/* Bouton de sélection */}
              <div className="mt-4 pt-3 border-t border-sand-100">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(opt.type);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-sand-100 hover:bg-sand-200 text-stone-700 hover:text-stone-900 border border-sand-200'
                  }`}
                >
                  {isSelected ? 'Cadre Actif' : 'Sélectionner'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
