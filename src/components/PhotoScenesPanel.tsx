'use client';

import React from 'react';
import { Camera, Loader2, Undo2 } from 'lucide-react';
import { PHOTO_SCENES, photoSceneUrl, type PhotoScene } from '@/lib/photoScenes';

interface PhotoScenesPanelProps {
  activeId: string | null;
  loadingId: string | null;
  error: string;
  onPick: (scene: PhotoScene) => void;
  onExit: () => void;
}

/** Scènes photo réalistes : ordinateur sur un bureau, téléphone en main. */
export const PhotoScenesPanel: React.FC<PhotoScenesPanelProps> = ({ activeId, loadingId, error, onPick, onExit }) => (
  <div className="space-y-2" role="group" aria-label="Scènes photo réalistes">
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
        <Camera className="w-3.5 h-3.5 text-emerald-400" />
        Scènes photo réalistes
      </label>
      {activeId && (
        <button
          type="button"
          onClick={onExit}
          className="text-[11px] font-semibold text-violet-300 hover:text-white flex items-center gap-1"
        >
          <Undo2 className="w-3 h-3" />
          Revenir à l&apos;appareil 3D
        </button>
      )}
    </div>
    {(['laptop', 'phone'] as const).map((kind) => (
      <div key={kind} className="space-y-1.5">
        <span className="text-[10px] text-zinc-500 font-semibold">{kind === 'laptop' ? 'Ordinateur' : 'Téléphone'}</span>
        <div className="grid grid-cols-3 gap-1.5">
          {PHOTO_SCENES.filter((s) => s.kind === kind).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onPick(s)}
              disabled={loadingId !== null}
              aria-pressed={activeId === s.id}
              aria-label={`Scène photo : ${s.label}`}
              title={s.label}
              className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all disabled:opacity-70 ${
                activeId === s.id ? 'border-violet-500' : 'border-zinc-800 hover:border-zinc-600'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoSceneUrl(s, 300)} alt="" loading="lazy" className="w-full h-full object-cover" />
              {loadingId === s.id && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    ))}
    {error && (
      <p className="text-[10px] text-rose-400" role="alert">
        {error}
      </p>
    )}
    <p className="text-[10px] text-zinc-500 leading-relaxed">
      La page s&apos;affiche en perspective dans l&apos;écran de la photo. Textes, logos et annotations restent disponibles.
      Photos Unsplash, libres de droits.
    </p>
  </div>
);
