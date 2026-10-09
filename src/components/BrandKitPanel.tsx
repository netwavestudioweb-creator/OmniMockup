'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, Check, Pencil, Trash2, Upload, Wand2 } from 'lucide-react';
import { BrandKit, BRAND_LOGO_MAX_BYTES, deleteBrandKit, loadBrandKit, saveBrandKit } from '@/lib/brandKit';
import { STUDIO_FONTS, studioFontFamily } from '@/lib/studioFonts';

interface BrandKitPanelProps {
  userId: string | null | undefined;
  onApply: (kit: BrandKit) => void;
}

const EMPTY_KIT: BrandKit = { name: '', logo: null, colors: ['#7c3aed', '#111827'], font: 'poppins', signature: '' };

/**
 * Kit de marque de l'agence : logo, couleurs, police et signature.
 * Enregistré dans le compte (ou ce navigateur sans compte) et appliqué en un clic.
 */
export const BrandKitPanel: React.FC<BrandKitPanelProps> = ({ userId, onApply }) => {
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [draft, setDraft] = useState<BrandKit>(EMPTY_KIT);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let alive = true;
    loadBrandKit(userId).then((k) => {
      if (!alive) return;
      setKit(k);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [userId]);

  const startEdit = () => {
    setDraft(kit ? { ...kit, colors: [...kit.colors] } : EMPTY_KIT);
    setMessage(null);
    setEditing(true);
  };

  const onLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > BRAND_LOGO_MAX_BYTES) {
      setMessage('Logo trop lourd (400 Ko maximum). Exportez-le en PNG plus petit.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((d) => ({ ...d, logo: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setSaving(true);
    const clean: BrandKit = {
      name: draft.name.trim() || 'Mon agence',
      logo: draft.logo,
      colors: draft.colors.filter(Boolean).slice(0, 3),
      font: draft.font,
      signature: draft.signature?.trim() || null,
    };
    const where = await saveBrandKit(userId, clean);
    setKit(clean);
    setSaving(false);
    setEditing(false);
    setMessage(where === 'account' ? 'Kit enregistré dans votre compte.' : 'Kit enregistré dans ce navigateur.');
  };

  const remove = async () => {
    await deleteBrandKit(userId);
    setKit(null);
    setEditing(false);
    setMessage(null);
  };

  if (loading) {
    return <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-500">Chargement du kit de marque…</div>;
  }

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-950/40 to-zinc-900 border border-violet-500/25 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-white uppercase font-mono flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-violet-300" />
          Kit de marque
        </span>
        {kit && !editing && (
          <div className="flex items-center gap-1">
            <button type="button" onClick={startEdit} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800" title="Modifier le kit" aria-label="Modifier le kit">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button type="button" onClick={remove} className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800" title="Supprimer le kit" aria-label="Supprimer le kit">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {!editing && !kit && (
        <>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Enregistrez une fois le logo, les couleurs, la police et la signature de votre agence, puis appliquez-les en un clic sur chaque mockup.
          </p>
          <button type="button" onClick={startEdit} className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold">
            Créer mon kit de marque
          </button>
        </>
      )}

      {!editing && kit && (
        <>
          <div className="flex items-center gap-3">
            {kit.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={kit.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/90 p-1" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-zinc-800" />
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-white truncate" style={{ fontFamily: studioFontFamily(kit.font || undefined) }}>
                {kit.name}
              </div>
              <div className="flex items-center gap-1 mt-1">
                {kit.colors.map((c) => (
                  <span key={c} className="w-4 h-4 rounded-full border border-white/20" style={{ background: c }} />
                ))}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onApply(kit);
              setApplied(true);
              setTimeout(() => setApplied(false), 2000);
            }}
            className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
          >
            {applied ? <Check className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
            {applied ? 'Appliqué' : 'Appliquer à ce mockup'}
          </button>
        </>
      )}

      {editing && (
        <div className="space-y-2.5">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="Nom de l'agence"
            maxLength={80}
            aria-label="Nom de l'agence"
            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white"
          />
          <div className="flex items-center gap-2">
            {draft.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.logo} alt="Logo" className="w-10 h-10 rounded-lg object-contain bg-white/90 p-1" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-zinc-800" />
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex-1 py-2 rounded-lg border border-zinc-750 text-zinc-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              {draft.logo ? 'Changer le logo' : 'Ajouter le logo (PNG, 400 Ko max)'}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" aria-label="Logo de l'agence" onChange={onLogo} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase text-zinc-400 w-16">Couleurs</span>
            {[0, 1, 2].map((i) => (
              <input
                key={i}
                type="color"
                value={draft.colors[i] || '#ffffff'}
                onChange={(e) =>
                  setDraft((d) => {
                    const colors = [...d.colors];
                    colors[i] = e.target.value;
                    return { ...d, colors };
                  })
                }
                aria-label={`Couleur ${i + 1}`}
                className="w-8 h-8 rounded-lg border border-zinc-750 bg-transparent cursor-pointer"
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {STUDIO_FONTS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDraft((d) => ({ ...d, font: f.id }))}
                aria-pressed={draft.font === f.id}
                className={`px-2 py-1 rounded-lg border text-[11px] ${
                  draft.font === f.id ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                }`}
                style={{ fontFamily: f.family }}
              >
                {f.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={draft.signature || ''}
            onChange={(e) => setDraft((d) => ({ ...d, signature: e.target.value }))}
            placeholder="Signature (ex. Réalisé par Studio Pixel)"
            maxLength={80}
            aria-label="Signature"
            className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white"
          />
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={saving} className="flex-1 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold disabled:opacity-60">
              {saving ? 'Enregistrement…' : 'Enregistrer le kit'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold">
              Annuler
            </button>
          </div>
        </div>
      )}

      {message && <p className="text-[10px] text-zinc-400" role="status">{message}</p>}
    </div>
  );
};
