'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bot, Loader2, Monitor, Smartphone, Share2, Wand2 } from 'lucide-react';
import type { DetectedSection, SmartAnalyzeResponse } from '@/types/analyzer';

interface AiDirectorPanelProps {
  url: string;
  /** Image prête à mettre en scène (la section choisie, cadrée comme un écran) */
  onUseSection: (imageDataUrl: string, label: string) => void;
}

const VIEWPORT_WIDTH = 1440; // largeur de capture des sections (pixels CSS)
const SCREEN_RATIO = 10 / 16; // cadre d'ordinateur : on garde au moins un écran de hauteur

const VERDICT_STYLE: Record<string, string> = {
  excellent: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  bon: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  moyen: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  faible: 'bg-zinc-700/40 text-zinc-400 border-zinc-600',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Découpe la section dans la capture complète, avec au moins une hauteur d'écran. */
async function cropSection(fullPage: string, section: DetectedSection, maxWidth = 1440): Promise<string> {
  const img = await loadImage(fullPage);
  const scale = img.naturalWidth / VIEWPORT_WIDTH;
  const y = Math.max(0, Math.round(section.coordinates.y * scale));
  const minH = Math.round(img.naturalWidth * SCREEN_RATIO);
  const h = Math.min(img.naturalHeight - y, Math.max(Math.round(section.coordinates.height * scale), minH));
  const outW = Math.min(maxWidth, img.naturalWidth);
  const outH = Math.round((h * outW) / img.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(img, 0, y, img.naturalWidth, h, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', 0.9);
}

const Thumb: React.FC<{ fullPage: string; section: DetectedSection }> = ({ fullPage, section }) => {
  const [src, setSrc] = useState<string>('');
  useEffect(() => {
    let alive = true;
    cropSection(fullPage, section, 360).then((s) => alive && setSrc(s)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [fullPage, section]);
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="" className="w-full h-20 object-cover object-top rounded-lg border border-zinc-800" />
  ) : (
    <div className="w-full h-20 rounded-lg bg-zinc-800 animate-pulse" />
  );
};

/**
 * Directeur artistique IA : Gemini analyse la page capturée, note chaque section
 * (verdict + justification) et recommande les meilleures par format.
 */
export const AiDirectorPanel: React.FC<AiDirectorPanelProps> = ({ url, onUseSection }) => {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<SmartAnalyzeResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [usingId, setUsingId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const analyze = async () => {
    setState('loading');
    setError('');
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    try {
      const res = await fetch('/api/smart-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = (await res.json()) as SmartAnalyzeResponse;
      if (!res.ok || !data.success) throw new Error(data.error || 'Analyse impossible.');
      setResult(data);
      setState('done');
    } catch (err) {
      setError((err as Error).message || 'Analyse impossible.');
      setState('error');
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const use = async (section: DetectedSection) => {
    if (!result) return;
    setUsingId(section.id);
    try {
      const img = await cropSection(result.fullPageScreenshot, section);
      onUseSection(img, section.label);
    } finally {
      setUsingId(null);
    }
  };

  const recos = result?.recommendations || { mobile: [], desktop: [], social: [] };
  const sections = (result?.sections || [])
    // La « page entière » n'est pas une section exploitable dans un cadre
    .filter((s) => s.coordinates.height < (result?.screenshotHeight || Infinity) * 0.8)
    .sort((a, b) => (b.marketingScore ?? b.qualityScore) - (a.marketingScore ?? a.qualityScore))
    // Écarte les doublons : une section qui se confond (60 % de recouvrement) avec une section mieux notée
    .filter((s, i, all) =>
      all.slice(0, i).every((o) => {
        const top = Math.max(s.coordinates.y, o.coordinates.y);
        const bottom = Math.min(s.coordinates.y + s.coordinates.height, o.coordinates.y + o.coordinates.height);
        const inter = Math.max(0, bottom - top);
        return inter < 0.6 * (s.coordinates.height + o.coordinates.height - inter);
      })
    )
    .slice(0, 8);

  return (
    <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/50 to-zinc-900 border border-indigo-500/25 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase font-mono">
        <Bot className="w-3.5 h-3.5 text-indigo-300" />
        Directeur artistique IA
      </div>

      {state === 'idle' && (
        <>
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            L&apos;IA analyse toute la page, note chaque section et vous dit laquelle mettre en avant, avec sa justification.
          </p>
          <button
            type="button"
            onClick={analyze}
            className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            Analyser la page avec l&apos;IA
          </button>
        </>
      )}

      {state === 'loading' && (
        <p className="text-[11px] text-indigo-200 flex items-center gap-2" role="status">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          Analyse en cours… ({elapsed} s, environ 30 à 60 s)
        </p>
      )}

      {state === 'error' && (
        <div className="space-y-2">
          <p className="text-[11px] text-rose-400" role="alert">{error}</p>
          <button type="button" onClick={analyze} className="text-[11px] font-semibold text-indigo-300">
            Réessayer
          </button>
        </div>
      )}

      {state === 'done' && result && (
        <div className="space-y-2.5">
          {result.isFallback && (
            <p className="text-[11px] text-amber-300 leading-relaxed">
              {result.fallbackMessage || 'Analyse IA indisponible : sections détectées automatiquement (sans verdict).'}
            </p>
          )}
          {!result.isFallback && typeof result.usageLimit === 'number' && result.usageLimit < 1000 && (
            <p className="text-[11px] text-zinc-500">
              Analyses IA restantes ce mois : {Math.max(0, result.usageLimit - (result.usageCount ?? 0))} / {result.usageLimit}
            </p>
          )}
          {sections.length === 0 && <p className="text-[11px] text-zinc-400">Aucune section exploitable détectée.</p>}
          {sections.map((s) => (
            <div key={s.id} className="p-2.5 rounded-xl bg-zinc-950/70 border border-zinc-800 space-y-2">
              <Thumb fullPage={result.fullPageScreenshot} section={s} />
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-white leading-snug">{s.label}</span>
                {s.verdict && (
                  <span className={`shrink-0 px-1.5 py-0.5 rounded-md border text-[10px] font-bold capitalize ${VERDICT_STYLE[s.verdict] || ''}`}>
                    {s.verdict}
                    {typeof s.marketingScore === 'number' ? ` · ${s.marketingScore}` : ''}
                  </span>
                )}
              </div>
              {s.justification && <p className="text-[11px] text-zinc-400 leading-relaxed">{s.justification}</p>}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                  {recos.desktop.includes(s.id) && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800" title="Recommandé pour ordinateur">
                      <Monitor className="w-3 h-3" />
                    </span>
                  )}
                  {recos.mobile.includes(s.id) && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800" title="Recommandé pour mobile">
                      <Smartphone className="w-3 h-3" />
                    </span>
                  )}
                  {recos.social.includes(s.id) && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800" title="Recommandé pour les réseaux sociaux">
                      <Share2 className="w-3 h-3" />
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => use(s)}
                  disabled={usingId === s.id}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold disabled:opacity-60"
                >
                  {usingId === s.id ? '…' : 'Mettre en scène'}
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={analyze} className="text-[11px] font-semibold text-indigo-300">
            Relancer l&apos;analyse
          </button>
        </div>
      )}
    </div>
  );
};
