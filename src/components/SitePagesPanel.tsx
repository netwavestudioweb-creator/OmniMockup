'use client';

import React, { useState } from 'react';
import { FilePlus, Files, Loader2, Plus, Search, X } from 'lucide-react';

export interface SitePage {
  url: string;
  label: string;
  screenshot: string;
}

interface SitePagesPanelProps {
  siteUrl: string;
  homeScreenshot: string;
  activeScreenshot: string;
  pages: SitePage[];
  setPages: React.Dispatch<React.SetStateAction<SitePage[]>>;
  onShow: (screenshot: string) => void;
  onAddAllToPresentation: () => void;
  addingAll: boolean;
}

export const MAX_SITE_PAGES = 5;

/** Plusieurs pages d'un même site (accueil, tarifs, contact…) capturées d'un coup. */
export const SitePagesPanel: React.FC<SitePagesPanelProps> = ({
  siteUrl,
  homeScreenshot,
  activeScreenshot,
  pages,
  setPages,
  onShow,
  onAddAllToPresentation,
  addingAll,
}) => {
  const [found, setFound] = useState<{ url: string; label: string }[] | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState<'' | 'detect' | 'capture'>('');
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');

  const origin = (() => {
    try {
      return new URL(siteUrl).origin;
    } catch {
      return '';
    }
  })();
  const remaining = MAX_SITE_PAGES - pages.length;

  const detect = async () => {
    setBusy('detect');
    setError('');
    try {
      const res = await fetch('/api/site-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: siteUrl }),
      });
      const data = await res.json();
      if (!data?.success) throw new Error(data?.error || 'Impossible de lire les liens du site.');
      const list = (data.pages as { url: string; label: string }[]).filter((p) => !pages.some((x) => x.url === p.url));
      setFound(list);
      setSelected(list.slice(0, Math.min(3, remaining)).map((p) => p.url));
    } catch (err) {
      setFound([]);
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const toggle = (url: string) =>
    setSelected((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : prev.length >= remaining ? prev : [...prev, url]
    );

  const addManual = () => {
    const raw = manual.trim();
    if (!raw || !origin) return;
    let url: string;
    try {
      url = new URL(raw.startsWith('/') || !/^https?:\/\//i.test(raw) ? `/${raw.replace(/^\//, '')}` : raw, origin).href;
    } catch {
      setError('Adresse invalide.');
      return;
    }
    if (new URL(url).origin !== origin) {
      setError(`La page doit appartenir au même site (${origin}).`);
      return;
    }
    const label = new URL(url).pathname;
    setFound((prev) => [...(prev || []).filter((p) => p.url !== url), { url, label }]);
    setSelected((prev) => (prev.includes(url) || prev.length >= remaining ? prev : [...prev, url]));
    setManual('');
    setError('');
  };

  const capture = async () => {
    const targets = (found || []).filter((p) => selected.includes(p.url));
    if (!targets.length) return;
    setBusy('capture');
    setError('');
    const failures: string[] = [];
    for (let i = 0; i < targets.length; i++) {
      const t = targets[i];
      setProgress(`${i + 1}/${targets.length} : ${t.label}`);
      try {
        const res = await fetch('/api/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ targets: [t.url], fullPage: true }),
        });
        if (res.status === 429) throw new Error('trop de captures, réessayez dans une minute');
        const data = await res.json();
        const item = (data?.results || [])[0];
        if (!item?.success || !item.screenshotBase64) throw new Error(item?.error || 'capture impossible');
        setPages((prev) =>
          prev.length >= MAX_SITE_PAGES || prev.some((p) => p.url === t.url)
            ? prev
            : [...prev, { url: t.url, label: t.label, screenshot: item.screenshotBase64 }]
        );
      } catch (err) {
        failures.push(`${t.label} (${(err as Error).message})`);
      }
    }
    setFound((prev) => (prev || []).filter((p) => !selected.includes(p.url)));
    setSelected([]);
    setProgress('');
    setBusy('');
    if (failures.length) setError(`Non capturé : ${failures.join(', ')}`);
  };

  const chip = (active: boolean) =>
    `px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold max-w-full truncate transition-all ${
      active ? 'bg-violet-600 border-violet-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-600'
    }`;

  return (
    <div role="group" aria-label="Pages du site" className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold text-white uppercase font-mono">
        <Files className="w-3.5 h-3.5 text-violet-400" />
        Pages du site
      </div>

      {/* Pages capturées : un clic pour l'afficher dans le cadre */}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" onClick={() => onShow(homeScreenshot)} className={chip(activeScreenshot === homeScreenshot)}>
          Accueil
        </button>
        {pages.map((p) => (
          <span key={p.url} className="flex items-center max-w-full">
            <button type="button" onClick={() => onShow(p.screenshot)} className={chip(activeScreenshot === p.screenshot)} title={p.url}>
              {p.label}
            </button>
            <button
              type="button"
              onClick={() => setPages((prev) => prev.filter((x) => x.url !== p.url))}
              aria-label={`Retirer la page ${p.label}`}
              className="p-1 text-zinc-500 hover:text-rose-400"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>

      {pages.length > 0 && (
        <button
          type="button"
          onClick={onAddAllToPresentation}
          disabled={addingAll}
          className="w-full py-1.5 rounded-xl border border-violet-500/40 text-violet-200 hover:bg-violet-600/15 text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {addingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FilePlus className="w-3.5 h-3.5" />}
          Ajouter les {pages.length + 1} pages à la présentation PDF
        </button>
      )}

      {remaining > 0 && found === null && (
        <button
          type="button"
          onClick={detect}
          disabled={busy !== ''}
          className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {busy === 'detect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          Trouver les autres pages
        </button>
      )}

      {remaining > 0 && found !== null && (
        <div className="space-y-2">
          {found.length > 0 ? (
            <>
              <p className="text-[11px] text-zinc-400">
                Choisissez jusqu&apos;à {remaining} page{remaining > 1 ? 's' : ''} :
              </p>
              <div className="flex flex-wrap gap-1.5">
                {found.map((p) => (
                  <button
                    key={p.url}
                    type="button"
                    onClick={() => toggle(p.url)}
                    aria-pressed={selected.includes(p.url)}
                    title={p.url}
                    className={chip(selected.includes(p.url))}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            !error && <p className="text-[11px] text-zinc-400">Aucun lien trouvé automatiquement. Ajoutez les pages à la main :</p>
          )}
          <div className="flex gap-1.5">
            <input
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addManual()}
              placeholder="/tarifs ou /contact"
              aria-label="Ajouter une page du site"
              className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-xs focus:outline-none focus:border-violet-500"
            />
            <button type="button" onClick={addManual} aria-label="Ajouter cette page" className="px-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            type="button"
            onClick={capture}
            disabled={busy !== '' || selected.length === 0}
            className="w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {busy === 'capture' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Files className="w-3.5 h-3.5" />}
            {busy === 'capture' ? `Capture ${progress}` : selected.length ? `Capturer ${selected.length} page${selected.length > 1 ? 's' : ''}` : 'Cochez les pages à capturer'}
          </button>
        </div>
      )}

      {error && (
        <p className="text-[11px] text-rose-400 leading-relaxed" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
