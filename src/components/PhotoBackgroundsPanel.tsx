'use client';

import React, { useState } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

/**
 * Fonds photo libres de droits (licence Unsplash : usage commercial gratuit, sans attribution obligatoire).
 * Les images sont servies par le CDN d'Unsplash puis intégrées à la scène : l'export n'en dépend plus.
 */
const PHOTOS: { id: string; label: string; category: 'Nature' | 'Intérieur' | 'Abstrait' }[] = [
  { id: '1506744038136-46273834b3fb', label: 'Vallée', category: 'Nature' },
  { id: '1519681393784-d120267933ba', label: 'Ciel étoilé', category: 'Nature' },
  { id: '1501785888041-af3ef285b470', label: 'Lac turquoise', category: 'Nature' },
  { id: '1441974231531-c6227db76b6e', label: 'Forêt', category: 'Nature' },
  { id: '1507525428034-b723cf961d3e', label: 'Plage', category: 'Nature' },
  { id: '1493246507139-91e8fad9978e', label: 'Montagnes', category: 'Nature' },
  { id: '1500530855697-b586d89ba3ee', label: 'Désert', category: 'Nature' },
  { id: '1497366216548-37526070297c', label: 'Bureau', category: 'Intérieur' },
  { id: '1497215728101-856f4ea42174', label: 'Espace de travail', category: 'Intérieur' },
  { id: '1586023492125-27b2c045efd7', label: 'Salon', category: 'Intérieur' },
  { id: '1494438639946-1ebd1d20bf85', label: 'Mur sauge', category: 'Intérieur' },
  { id: '1524758631624-e2822e304c36', label: 'Espace lumineux', category: 'Intérieur' },
  { id: '1579546929518-9e396f3cc809', label: 'Dégradé', category: 'Abstrait' },
  { id: '1553356084-58ef4a67b2a7', label: 'Peinture fluide', category: 'Abstrait' },
  { id: '1518531933037-91b2f5f229cc', label: 'Feuillage', category: 'Abstrait' },
];

const url = (id: string, w: number) => `https://images.unsplash.com/photo-${id}?w=${w}&q=80&auto=format&fit=crop`;

async function toDataUrl(src: string): Promise<string> {
  const res = await fetch(src);
  if (!res.ok) throw new Error(String(res.status));
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

interface PhotoBackgroundsPanelProps {
  /** Reçoit la valeur CSS du fond (image intégrée) */
  onApply: (cssBackground: string) => void;
}

export const PhotoBackgroundsPanel: React.FC<PhotoBackgroundsPanelProps> = ({ onApply }) => {
  const [category, setCategory] = useState<'Nature' | 'Intérieur' | 'Abstrait'>('Nature');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const apply = async (id: string) => {
    setLoadingId(id);
    setError('');
    try {
      const data = await toDataUrl(url(id, 1920));
      onApply(`url(${data}) center/cover no-repeat`);
    } catch {
      setError('Photo indisponible pour le moment. Vérifiez la connexion et réessayez.');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-2" role="group" aria-label="Fonds photo">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
          Fonds photo
        </span>
        <div className="flex gap-1">
          {(['Nature', 'Intérieur', 'Abstrait'] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                category === c ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {PHOTOS.filter((p) => p.category === category).map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => apply(p.id)}
            disabled={loadingId !== null}
            aria-label={`Fond photo : ${p.label}`}
            title={p.label}
            className="relative aspect-[4/3] rounded-lg overflow-hidden border border-zinc-800 hover:border-violet-500 disabled:opacity-70"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url(p.id, 240)} alt="" loading="lazy" className="w-full h-full object-cover" />
            {loadingId === p.id && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/50">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </span>
            )}
          </button>
        ))}
      </div>
      {error && (
        <p className="text-[10px] text-rose-400" role="alert">
          {error}
        </p>
      )}
      <p className="text-[10px] text-zinc-500">Photos Unsplash, libres de droits (usage commercial autorisé).</p>
    </div>
  );
};
