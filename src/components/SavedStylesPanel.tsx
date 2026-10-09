'use client';

import React, { useEffect, useState } from 'react';
import { Bookmark, Plus, X } from 'lucide-react';

/** Style enregistré : réglages de mise en scène (sans le contenu : textes, logos, annotations). */
export interface SavedStyle {
  id: string;
  name: string;
  /** Aperçu du fond pour la vignette */
  preview: string;
  values: Record<string, unknown>;
}

interface SavedStylesPanelProps {
  /** Renvoie les réglages actuels à enregistrer */
  getCurrent: () => { preview: string; values: Record<string, unknown> };
  onApply: (values: Record<string, unknown>) => void;
}

const KEY = 'omnimockup_saved_styles';
const MAX_STYLES = 12;

function readStyles(): SavedStyle[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedStyle[]) : [];
  } catch {
    return [];
  }
}

/** « Mes styles » : réutiliser une mise en scène sur d'autres mockups (enregistrés dans ce navigateur). */
export const SavedStylesPanel: React.FC<SavedStylesPanelProps> = ({ getCurrent, onApply }) => {
  const [styles, setStyles] = useState<SavedStyle[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => setStyles(readStyles()), []);

  const persist = (next: SavedStyle[]) => {
    setStyles(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      // quota dépassé (fond image très lourd) : le style reste disponible jusqu'au rechargement
    }
  };

  const save = () => {
    const { preview, values } = getCurrent();
    const style: SavedStyle = { id: `style_${Date.now()}`, name: name.trim() || `Style ${styles.length + 1}`, preview, values };
    persist([style, ...styles].slice(0, MAX_STYLES));
    setName('');
    setNaming(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-violet-300" />
          Mes styles
        </label>
        {!naming && (
          <button
            type="button"
            onClick={() => setNaming(true)}
            className="px-2 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-semibold text-zinc-300 hover:text-white flex items-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Enregistrer ce style
          </button>
        )}
      </div>

      {naming && (
        <div className="flex gap-1.5">
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder="Nom du style (ex. Présentation client)"
            maxLength={40}
            aria-label="Nom du style"
            className="flex-1 min-w-0 px-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white"
          />
          <button type="button" onClick={save} className="px-3 rounded-lg bg-violet-600 text-white text-xs font-bold">
            OK
          </button>
        </div>
      )}

      {styles.length === 0 ? (
        <p className="text-[11px] text-zinc-500">Enregistrez votre mise en scène (appareil, angle, fond, format) pour la réutiliser en un clic.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {styles.map((st) => (
            <div key={st.id} className="relative group">
              <button
                type="button"
                onClick={() => onApply(st.values)}
                className="w-full h-14 rounded-xl border border-zinc-700 hover:border-violet-500 overflow-hidden relative"
                style={{ background: st.preview }}
                title={`Appliquer « ${st.name} »`}
              >
                <span className="absolute inset-x-0 bottom-0 px-1.5 py-0.5 bg-black/55 text-[10px] font-semibold text-white truncate">{st.name}</span>
              </button>
              <button
                type="button"
                onClick={() => persist(styles.filter((s) => s.id !== st.id))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-rose-400 flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                aria-label={`Supprimer le style ${st.name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
