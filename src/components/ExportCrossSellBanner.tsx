'use client';

import React from 'react';
import Link from 'next/link';
import { Video, Layers, Sparkles, X, ArrowRight } from 'lucide-react';

interface ExportCrossSellBannerProps {
  onClose: () => void;
  onOpenVideoExport?: () => void;
  onOpenOmniExport?: () => void;
}

export const ExportCrossSellBanner: React.FC<ExportCrossSellBannerProps> = ({
  onClose,
  onOpenVideoExport,
  onOpenOmniExport,
}) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full bg-stone-900/95 backdrop-blur-md text-white p-5 rounded-2xl border border-violet-500/30 shadow-2xl animate-slide-up">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Export PNG réussi !
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-xs text-stone-300 mb-4 leading-relaxed">
        Donnez encore plus d&apos;impact à votre présentation avec nos formats avancés :
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Option 1 : Vidéo MP4 */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-violet-400 mb-1.5">
              <Video className="w-4 h-4" />
              <span className="text-xs font-bold text-white">Vidéo MP4 60fps</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-tight">
              Animation 3D fluide prête pour Twitter/X & LinkedIn.
            </p>
          </div>
          <button
            onClick={onOpenVideoExport}
            className="mt-3 w-full py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
          >
            <span>Créer la vidéo</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Option 2 : Pack 5 Ratios */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 hover:border-violet-500/50 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-400 mb-1.5">
              <Layers className="w-4 h-4" />
              <span className="text-xs font-bold text-white">Pack 5 Ratios</span>
            </div>
            <p className="text-[11px] text-stone-400 leading-tight">
              16:9, 1:1, 9:16, 4:5 et 3:2 générés en 1 clic.
            </p>
          </div>
          <button
            onClick={onOpenOmniExport}
            className="mt-3 w-full py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-colors flex items-center justify-center gap-1"
          >
            <span>OmniExport</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px]">
        <span className="text-stone-400">Inclus dans le plan Pro (9 €) ou via crédits</span>
        <Link
          href="/pricing"
          className="text-violet-400 hover:text-violet-300 font-bold underline"
        >
          Voir les offres →
        </Link>
      </div>
    </div>
  );
};
