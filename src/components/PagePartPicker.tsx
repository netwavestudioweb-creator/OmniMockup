'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * « Partie du site montrée » : la page capturée en entier, avec un cadre bleu qui représente l'écran.
 * On fait glisser le cadre (ou on touche la page) pour choisir la section, et on règle sa taille :
 * plus petit = une partie agrandie. Pour montrer plusieurs sections d'un coup, on refait la capture
 * avec une fenêtre plus large (la page devient plus « basse », elle tient davantage dans l'écran).
 */
interface PagePartPickerProps {
  screenshot: string;
  offsetY: number; // 0 à 100
  zoom: number; // 1 à 3
  onChange: (next: { offsetY?: number; zoom?: number }) => void;
  /** Proportion de l'écran de l'appareil (largeur / hauteur), 1,6 pour un ordinateur */
  screenRatio?: number;
  /** Largeur de la dernière capture, et nouvelle capture à cette largeur (absent pour une image déposée) */
  captureWidth?: number;
  onRecapture?: (width: number) => void;
  recapturing?: boolean;
}

const WIDTHS = [1024, 1280, 1440, 1600, 1920, 2240, 2560];

export function PagePartPicker({
  screenshot,
  offsetY,
  zoom,
  onChange,
  screenRatio = 1.6,
  captureWidth,
  onRecapture,
  recapturing = false,
}: PagePartPickerProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [imgRatio, setImgRatio] = useState(0); // hauteur / largeur de la page capturée
  const [boxW, setBoxW] = useState(0);
  const dragging = useRef(false);
  const [width, setWidth] = useState(captureWidth || 1440);

  useEffect(() => setWidth(captureWidth || 1440), [captureWidth]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    setBoxW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const pageH = boxW * imgRatio; // hauteur de la page dans la miniature
  const rectW = boxW / zoom;
  const rectH = Math.min(pageH, boxW / (zoom * screenRatio));
  const travel = Math.max(0, pageH - rectH);
  const rectTop = (offsetY / 100) * travel;
  const rectLeft = (boxW - rectW) / 2;
  const fitsEntirely = pageH > 0 && pageH <= boxW / screenRatio + 1;

  // Garde le cadre visible dans la miniature (boutons Haut / Milieu / Bas, flèches du clavier)
  useEffect(() => {
    const el = boxRef.current;
    if (!el || dragging.current) return;
    const target = rectTop - (el.clientHeight - rectH) / 2;
    el.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
  }, [rectTop, rectH]);

  const setFromPointer = (clientY: number) => {
    const el = boxRef.current;
    if (!el || travel <= 0) return;
    const r = el.getBoundingClientRect();
    const y = clientY - r.top + el.scrollTop - rectH / 2;
    onChange({ offsetY: Math.round(Math.max(0, Math.min(1, y / travel)) * 100) });
  };

  const sections = [
    { label: 'Haut', y: 0 },
    { label: 'Milieu', y: 50 },
    { label: 'Bas', y: 100 },
  ];

  return (
    <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
      <div>
        <p className="text-[15px] font-semibold text-white">Partie du site montrée</p>
        <p className="mt-1 text-[13px] text-zinc-400 leading-relaxed">
          La page est capturée en entier. Faites glisser le cadre bleu sur la section à montrer.
        </p>
      </div>

      <div
        ref={boxRef}
        className="relative max-h-[300px] overflow-y-auto rounded-lg bg-zinc-950 border border-zinc-800 cursor-pointer touch-none select-none"
        onPointerDown={(e) => {
          dragging.current = true;
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          setFromPointer(e.clientY);
        }}
        onPointerMove={(e) => dragging.current && setFromPointer(e.clientY)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
        role="slider"
        aria-label="Partie du site montrée"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={offsetY}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') onChange({ offsetY: Math.min(100, offsetY + 5) });
          if (e.key === 'ArrowUp') onChange({ offsetY: Math.max(0, offsetY - 5) });
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={screenshot}
          alt=""
          draggable={false}
          className="block w-full h-auto opacity-60"
          onLoad={(e) => {
            const i = e.currentTarget;
            if (i.naturalWidth) setImgRatio(i.naturalHeight / i.naturalWidth);
          }}
        />
        {pageH > 0 && (
          <div
            className="absolute rounded-md border-2 border-pms-accent bg-pms-accent/10 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)] pointer-events-none"
            style={{ top: rectTop, left: rectLeft, width: rectW, height: rectH }}
          />
        )}
      </div>

      <div className="flex gap-2">
        {sections.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onChange({ offsetY: s.y })}
            className={`flex-1 min-h-[44px] lg:min-h-[36px] rounded-lg text-[13px] font-semibold transition-colors ${
              Math.abs(offsetY - s.y) < 3 ? 'bg-pms-accent text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-[13px]">
          <label htmlFor="zone-zoom" className="font-semibold text-zinc-300">Taille de la zone</label>
          <span className="text-zinc-400 tabular-nums">{zoom <= 1.01 ? 'Toute la largeur' : `Agrandie ${zoom.toFixed(1).replace('.', ',')} fois`}</span>
        </div>
        <input
          id="zone-zoom"
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={zoom}
          onChange={(e) => onChange({ zoom: Number(e.target.value) })}
          className="w-full accent-pms-accent cursor-pointer h-2 bg-zinc-800 rounded-lg"
        />
        <p className="text-[12px] text-zinc-500">Réduisez la zone pour montrer un détail : un bloc de prix, un formulaire, un avis client.</p>
      </div>

      {onRecapture && (
        <div className="space-y-2 pt-3 border-t border-zinc-800">
          <div className="flex items-center justify-between text-[13px]">
            <label htmlFor="capture-width" className="font-semibold text-zinc-300">Largeur de la capture</label>
            <span className="text-zinc-400 tabular-nums">{width} px</span>
          </div>
          <input
            id="capture-width"
            type="range"
            min={0}
            max={WIDTHS.length - 1}
            step={1}
            value={Math.max(0, WIDTHS.indexOf(WIDTHS.reduce((a, b) => (Math.abs(b - width) < Math.abs(a - width) ? b : a))))}
            onChange={(e) => setWidth(WIDTHS[Number(e.target.value)])}
            className="w-full accent-pms-accent cursor-pointer h-2 bg-zinc-800 rounded-lg"
          />
          <p className="text-[12px] text-zinc-500">
            Plus large = plus de contenu dans l&apos;écran (une section entière, ou deux). Plus étroit = le site comme sur un petit
            ordinateur.
          </p>
          <button
            type="button"
            disabled={recapturing || width === captureWidth}
            onClick={() => onRecapture(width)}
            className="w-full min-h-[44px] rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {recapturing && <Loader2 className="w-4 h-4 animate-spin" />}
            {recapturing ? 'Nouvelle capture en cours…' : width === captureWidth ? 'Capture à cette largeur' : `Refaire la capture à ${width} px`}
          </button>
        </div>
      )}

      {fitsEntirely && <p className="text-[12px] text-zinc-500">La page tient entièrement dans l&apos;écran.</p>}
    </div>
  );
}
