'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Video, Layers, X, Check } from 'lucide-react';

interface ExportCrossSellBannerProps {
  onClose: () => void;
  onOpenVideoExport?: () => void;
  onOpenOmniExport?: () => void;
  /** Affiche le lien vers les offres (plan gratuit uniquement) */
  showUpgrade?: boolean;
}

const AUTO_CLOSE_MS = 10000;

/**
 * Message discret après un export : confirme le téléchargement et propose
 * les deux autres exports. Placé en bas à gauche pour ne jamais recouvrir les réglages.
 */
export const ExportCrossSellBanner: React.FC<ExportCrossSellBannerProps> = ({
  onClose,
  onOpenVideoExport,
  onOpenOmniExport,
  showUpgrade = false,
}) => {
  useEffect(() => {
    const t = setTimeout(onClose, AUTO_CLOSE_MS);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      role="status"
      className="fixed bottom-24 left-4 z-50 w-[min(19rem,calc(100vw-2rem))] bg-zinc-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl border border-zinc-700 shadow-2xl animate-slide-up"
    >
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          Image téléchargée
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Fermer"
          aria-label="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onOpenOmniExport}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 text-left transition-all"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Pack réseaux
          </span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">5 formats d&apos;un coup</span>
        </button>
        <button
          type="button"
          onClick={onOpenVideoExport}
          className="p-2 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/50 text-left transition-all"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <Video className="w-3.5 h-3.5 text-amber-400" />
            Vidéo 3 s
          </span>
          <span className="block text-[10px] text-zinc-400 mt-0.5">Zoom animé (WebM)</span>
        </button>
      </div>

      {showUpgrade && (
        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
          <span className="text-zinc-400">Sans filigrane et en HD dès le plan Solo</span>
          <Link href="/pricing" className="text-violet-400 hover:text-violet-300 font-bold">
            Voir les offres
          </Link>
        </div>
      )}
    </div>
  );
};
