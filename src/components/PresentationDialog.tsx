'use client';

import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, FileText, Loader2, Trash2, X } from 'lucide-react';
import { loadBrandKit } from '@/lib/brandKit';
import type { PresentationMeta, PresentationSlide } from '@/lib/presentationPdf';

export type PresentationOutput = 'pdf' | 'linkedin' | 'instagram';

const OUTPUTS: { id: PresentationOutput; label: string; hint: string }[] = [
  { id: 'pdf', label: 'PDF client', hint: 'A4 paysage, à joindre à un devis' },
  { id: 'linkedin', label: 'Carrousel LinkedIn', hint: 'Un PDF 4:5 à publier comme document' },
  { id: 'instagram', label: 'Carrousel Instagram', hint: 'Images JPG 1080 × 1350, une par page' },
];

interface PresentationDialogProps {
  slides: PresentationSlide[];
  defaultTitle: string;
  userId?: string | null;
  generating: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onCaption: (id: string, caption: string) => void;
  onGenerate: (meta: PresentationMeta, output: PresentationOutput) => void;
}

export const MAX_PRESENTATION_SLIDES = 12;

/** Fenêtre « Présentation client » : ordonner les mockups, ajouter les textes, télécharger le PDF. */
export const PresentationDialog: React.FC<PresentationDialogProps> = ({
  slides,
  defaultTitle,
  userId,
  generating,
  onClose,
  onRemove,
  onMove,
  onCaption,
  onGenerate,
}) => {
  const [title, setTitle] = useState(defaultTitle);
  const [client, setClient] = useState('');
  const [intro, setIntro] = useState('');
  const [author, setAuthor] = useState('');
  const [accent, setAccent] = useState('#7c3aed');
  const [logo, setLogo] = useState<string | null>(null);
  const [output, setOutput] = useState<PresentationOutput>('pdf');
  const outputInfo = OUTPUTS.find((o) => o.id === output) || OUTPUTS[0];

  // Le kit de marque pré-remplit l'auteur, la couleur et le logo
  useEffect(() => {
    let alive = true;
    loadBrandKit(userId)
      .then((kit) => {
        if (!alive || !kit) return;
        if (kit.name) setAuthor((a) => a || kit.name);
        if (kit.colors?.[0]) setAccent(kit.colors[0]);
        if (kit.logo) setLogo(kit.logo);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [userId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !generating && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [generating, onClose]);

  const field = 'w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-violet-500';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Présentation client"
    >
      <div className="bg-[#0c0d14] border border-zinc-800 w-full sm:max-w-2xl max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <FileText className="w-4 h-4 text-violet-400" />
            Présentation client et carrousel
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={generating}
            aria-label="Fermer"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Titre</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={90} className={field} />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Préparé pour (client)</span>
              <input value={client} onChange={(e) => setClient(e.target.value)} maxLength={60} placeholder="Ex. Hôtel du Lac" className={field} />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Présenté par</span>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} maxLength={60} placeholder="Votre nom ou votre agence" className={field} />
            </label>
            <label className="space-y-1 sm:col-span-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Texte d&apos;introduction (facultatif)</span>
              <textarea
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                maxLength={700}
                rows={3}
                placeholder="Ex. Voici la nouvelle version de votre site, sur ordinateur et sur mobile."
                className={`${field} resize-none`}
              />
            </label>
            <label className="flex items-center gap-2 text-[11px] text-zinc-400">
              <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="w-7 h-7 rounded bg-transparent border border-zinc-700" />
              Couleur de la présentation
            </label>
            {logo && (
              <div className="flex items-center gap-2 text-[11px] text-zinc-400">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logo} alt="" className="h-7 max-w-[80px] object-contain rounded bg-white/90 p-0.5" />
                Logo du kit de marque
                <button type="button" onClick={() => setLogo(null)} className="text-zinc-500 hover:text-white underline">
                  retirer
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Pages ({slides.length} / {MAX_PRESENTATION_SLIDES})
            </span>
            {slides.length === 0 && (
              <p className="text-[11px] text-zinc-400 leading-relaxed p-3 rounded-xl border border-dashed border-zinc-700">
                Aucune page pour l&apos;instant. Préparez une scène puis choisissez « Ajouter à la présentation » dans le menu Exporter.
                Recommencez pour chaque visuel (ordinateur, mobile, autre page…).
              </p>
            )}
            {slides.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3 p-2 rounded-xl bg-zinc-900/70 border border-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={s.image} alt={`Page ${i + 1}`} className="w-20 sm:w-24 aspect-video object-cover rounded-lg border border-zinc-800 shrink-0" />
                <div className="flex-1 min-w-0 space-y-1">
                  <span className="text-[10px] text-zinc-500 font-mono">Page {i + 1}</span>
                  <input
                    value={s.caption}
                    onChange={(e) => onCaption(s.id, e.target.value)}
                    maxLength={140}
                    placeholder="Légende (facultatif)"
                    aria-label={`Légende de la page ${i + 1}`}
                    className={field}
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-0.5 shrink-0">
                  <button type="button" onClick={() => onMove(s.id, -1)} disabled={i === 0} aria-label="Monter" className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30">
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => onMove(s.id, 1)} disabled={i === slides.length - 1} aria-label="Descendre" className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button type="button" onClick={() => onRemove(s.id)} aria-label={`Retirer la page ${i + 1}`} className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-5 py-4 border-t border-zinc-800 space-y-2">
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800" role="radiogroup" aria-label="Type de document">
            {OUTPUTS.map((o) => (
              <button
                key={o.id}
                type="button"
                role="radio"
                aria-checked={output === o.id}
                onClick={() => setOutput(o.id)}
                className={`py-1.5 px-1 rounded-lg text-[11px] font-bold leading-tight transition-all ${
                  output === o.id ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onGenerate({ title, client, intro, author, accent, logo }, output)}
            disabled={generating || slides.length === 0}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            {output === 'instagram' ? 'Télécharger les images' : 'Télécharger le PDF'} ({slides.length + 1} page{slides.length ? 's' : ''} avec la couverture)
          </button>
          <p className="text-[10px] text-zinc-500 text-center">
            {outputInfo.hint}. Compte comme un export « pack ». Les pages restent ici tant que le studio est ouvert.
          </p>
        </div>
      </div>
    </div>
  );
};
