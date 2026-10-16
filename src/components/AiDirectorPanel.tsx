'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Bot, ExternalLink, KeyRound, Loader2, Monitor, Smartphone, Share2, Wand2 } from 'lucide-react';
import type { DetectedSection, SmartAnalyzeResponse } from '@/types/analyzer';
import {
  ByokError,
  PROVIDER_INFO,
  analyzeSectionsWithOwnKey,
  getSavedAi,
  looksLikeKey,
  saveAi,
  type AiProvider,
} from '@/lib/byokPitch';
import type { ArtDirectorReply } from '@/lib/artDirectorPrompt';
import { trackEvent } from '@/lib/tracking';

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

/**
 * Capture de la page prête pour l'IA du client : JPEG en base64 (sans préfixe), hauteur limitée
 * (les IA refusent les images de plus de 8 000 pixels), plus étroite pour Claude.
 */
async function pageImageForAi(fullPage: string, provider: AiProvider): Promise<string> {
  const img = await loadImage(fullPage);
  const maxW = provider === 'claude' ? 1000 : 1440;
  const scale = Math.min(1, maxW / img.naturalWidth, 7800 / img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.8).replace(/^data:image\/\w+;base64,/, '');
}

/** Les notes de l'IA sont ajoutées aux sections repérées par le serveur (mêmes identifiants) */
function mergeReply(result: SmartAnalyzeResponse, reply: ArtDirectorReply): SmartAnalyzeResponse {
  const sections = result.sections.map((section) => {
    const ai = reply.sections?.find((s) => s.id === section.id);
    if (!ai) return section;
    const score = typeof ai.marketingScore === 'number' ? ai.marketingScore : typeof ai.qualityScore === 'number' ? ai.qualityScore : 85;
    return {
      ...section,
      label: ai.label || section.label,
      description: ai.description || section.description,
      visualAnalysis: ai.visualAnalysis,
      verdict: ai.verdict || (score >= 85 ? 'excellent' : score >= 70 ? 'bon' : score >= 50 ? 'moyen' : 'faible'),
      justification: ai.justification,
      marketingScore: score,
      qualityScore: typeof ai.qualityScore === 'number' ? ai.qualityScore : section.qualityScore,
    } as DetectedSection;
  });
  const r = reply.recommendations;
  return {
    ...result,
    sections,
    recommendations: r
      ? { mobile: r.mobile || [], desktop: r.desktop || [], social: r.social || [] }
      : result.recommendations,
    isFallback: false,
    fallbackMessage: undefined,
  };
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
  // IA du client (même clé que la Pitch IA, gardée dans son navigateur)
  const [ai, setAi] = useState<{ provider: AiProvider; key: string } | null>(null);
  const [byok, setByok] = useState(false);
  const [setupProvider, setSetupProvider] = useState<AiProvider>('gemini');
  const [setupKey, setSetupKey] = useState('');
  const [setupError, setSetupError] = useState('');
  useEffect(() => {
    const saved = getSavedAi();
    setAi(saved);
    if (saved) setSetupProvider(saved.provider);
  }, []);

  useEffect(() => () => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  /** Notes de l'IA du client sur une capture déjà faite par le serveur */
  const scoreWithOwnAi = async (base: SmartAnalyzeResponse, own: { provider: AiProvider; key: string }) => {
    try {
      const image = await pageImageForAi(base.fullPageScreenshot, own.provider);
      const candidates = base.sections.map((s) => ({ id: s.id, coordinates: s.coordinates, headingText: s.description }));
      const reply = await analyzeSectionsWithOwnKey(own.provider, own.key, candidates, image);
      setResult(mergeReply(base, reply));
      setByok(true);
      trackEvent('pitch_byok', { provider: own.provider, ok: true, feature: 'art_director' });
    } catch (err) {
      const e = err instanceof ByokError ? err : new ByokError('L’IA n’a pas pu répondre. Réessayez dans un instant.', 'other');
      trackEvent('pitch_byok', { provider: own.provider, ok: false, kind: e.kind, feature: 'art_director' });
      // Les sections repérées restent affichées, sans notes
      setResult(base);
      setError(e.message);
    }
  };

  const analyze = async () => {
    setState('loading');
    setError('');
    setByok(false);
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
      // Sans IA du site, c'est l'IA du client qui note les sections (si sa clé est enregistrée)
      const own = getSavedAi();
      if (data.isFallback && own) await scoreWithOwnAi(data, own);
      else setResult(data);
      setState('done');
    } catch (err) {
      setError((err as Error).message || 'Analyse impossible.');
      setState('error');
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  /** Clé enregistrée après l'analyse : on note les sections déjà repérées, sans nouvelle capture */
  const saveKeyAndScore = async () => {
    if (!looksLikeKey(setupProvider, setupKey)) {
      setSetupError(
        setupProvider === 'claude'
          ? 'Cette clé ne ressemble pas à une clé Claude (elle commence par « sk-ant- »).'
          : 'Cette clé ne ressemble pas à une clé Gemini. Copiez-la en entier depuis Google AI Studio.'
      );
      return;
    }
    saveAi(setupProvider, setupKey);
    const own = { provider: setupProvider, key: setupKey.trim() };
    setAi(own);
    setSetupKey('');
    setSetupError('');
    if (!result) return;
    setState('loading');
    setError('');
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    await scoreWithOwnAi(result, own);
    if (timerRef.current) clearInterval(timerRef.current);
    setState('done');
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
          {ai && (
            <p className="text-[11px] text-emerald-300 flex items-center gap-1">
              <KeyRound className="w-3 h-3" /> Avec votre IA : {PROVIDER_INFO[ai.provider].label}
            </p>
          )}
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
          {error && <p className="text-[11px] text-rose-400" role="alert">{error}</p>}
          {result.isFallback && (
            <div className="p-3 rounded-xl bg-zinc-950/70 border border-indigo-500/30 space-y-2">
              <p className="text-[11px] text-amber-300 leading-relaxed">
                Sections repérées automatiquement, sans notes. Connectez votre IA (Gemini ou Claude) pour obtenir le verdict de chaque section.
                Votre clé reste dans votre navigateur.
              </p>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-zinc-900 border border-zinc-800" role="radiogroup" aria-label="Fournisseur d'IA">
                {(['gemini', 'claude'] as AiProvider[]).map((prov) => (
                  <button
                    key={prov}
                    type="button"
                    role="radio"
                    aria-checked={setupProvider === prov}
                    onClick={() => {
                      setSetupProvider(prov);
                      setSetupError('');
                    }}
                    className={`py-1.5 rounded-md text-[11px] font-bold ${setupProvider === prov ? 'bg-indigo-600 text-white' : 'text-zinc-400 hover:text-white'}`}
                  >
                    {PROVIDER_INFO[prov].label}
                  </button>
                ))}
              </div>
              <a
                href={PROVIDER_INFO[setupProvider].getKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-300 underline"
              >
                Obtenir ma clé {setupProvider === 'claude' ? 'Claude' : 'Gemini'} <ExternalLink className="w-3 h-3" />
              </a>
              <input
                type="password"
                autoComplete="off"
                value={setupKey}
                onChange={(e) => setSetupKey(e.target.value)}
                placeholder={setupProvider === 'claude' ? 'sk-ant-…' : 'Collez votre clé Gemini'}
                aria-label={`Clé ${PROVIDER_INFO[setupProvider].label}`}
                className="w-full px-2.5 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              {setupError && <p className="text-[11px] text-rose-400" role="alert">{setupError}</p>}
              <button
                type="button"
                onClick={saveKeyAndScore}
                disabled={!setupKey.trim()}
                className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-50"
              >
                Noter les sections avec mon IA
              </button>
            </div>
          )}
          {byok && ai && <p className="text-[11px] text-emerald-300">Notes rédigées par votre IA ({PROVIDER_INFO[ai.provider].label}).</p>}
          {!result.isFallback && !byok && typeof result.usageLimit === 'number' && result.usageLimit < 1000 && (
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
