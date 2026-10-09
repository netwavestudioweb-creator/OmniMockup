'use client';

import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';

interface TourStep {
  /** Sélecteur de l'élément mis en avant */
  target: string;
  title: string;
  text: string;
}

const STEPS: TourStep[] = [
  {
    target: '[data-tour="panel"]',
    title: '1. Réglez votre mockup',
    text: "Choisissez l'appareil, l'angle, le fond et vos textes. Le mode Expert affiche tous les réglages avancés.",
  },
  {
    target: '[data-tour="formats"]',
    title: '2. Choisissez le format',
    text: 'Paysage, carré, portrait ou Story : « Plus… » donne les tailles exactes de chaque réseau social.',
  },
  {
    target: '[data-tour="export"]',
    title: '3. Exportez',
    text: "Téléchargez l'image, le pack réseaux sociaux, la vidéo ou le statut WhatsApp. Raccourci : touche E.",
  },
];

const STORAGE_KEY = 'omnimockup_tour_done';

/** Visite guidée en 3 étapes au premier lancement du studio (ignorable, mémorisée). */
export const StudioTour: React.FC = () => {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') return;
    } catch {
      return; // stockage indisponible : pas de visite (elle reviendrait à chaque fois)
    }
    const t = setTimeout(() => setStep(0), 800);
    return () => clearTimeout(t);
  }, []);

  const measure = useCallback(() => {
    if (step === null) return;
    const el = document.querySelector(STEPS[step].target);
    setRect(el ? el.getBoundingClientRect() : null);
  }, [step]);

  useLayoutEffect(() => {
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [measure]);

  const finish = () => {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignorer
    }
    setStep(null);
  };

  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step]);

  if (step === null) return null;
  const current = STEPS[step];
  const last = step === STEPS.length - 1;

  // Bulle sous l'élément s'il y a la place, sinon au-dessus ; toujours dans l'écran
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 768;
  const cardW = Math.min(300, vw - 24);
  const below = rect ? rect.bottom + 180 < vh : true;
  const top = rect ? (below ? rect.bottom + 12 : Math.max(12, rect.top - 172)) : vh / 2 - 80;
  const left = rect ? Math.min(Math.max(12, rect.left + rect.width / 2 - cardW / 2), vw - cardW - 12) : vw / 2 - cardW / 2;

  return (
    <div className="fixed inset-0 z-[150]" role="dialog" aria-modal="true" aria-labelledby="studio-tour-title">
      {/* Voile avec découpe autour de l'élément mis en avant */}
      {rect ? (
        <div
          className="absolute rounded-2xl ring-2 ring-violet-400 transition-all duration-300 pointer-events-none"
          style={{
            top: rect.top - 6,
            left: rect.left - 6,
            width: rect.width + 12,
            height: rect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-black/65" />
      )}

      <div
        className="absolute bg-[#0c0d14] border border-zinc-700 rounded-2xl p-4 shadow-2xl space-y-3 transition-all duration-300"
        style={{ top, left, width: cardW }}
      >
        <div className="flex items-center justify-between">
          <h3 id="studio-tour-title" className="text-sm font-bold text-white">{current.title}</h3>
          <span className="text-[10px] text-zinc-500 font-mono">
            {step + 1}/{STEPS.length}
          </span>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed">{current.text}</p>
        <div className="flex items-center justify-between pt-1">
          <button type="button" onClick={finish} className="text-xs font-semibold text-zinc-400 hover:text-white">
            Passer
          </button>
          <button
            type="button"
            autoFocus
            onClick={() => (last ? finish() : setStep(step + 1))}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold"
          >
            {last ? 'Commencer' : 'Suivant'}
          </button>
        </div>
      </div>
    </div>
  );
};
