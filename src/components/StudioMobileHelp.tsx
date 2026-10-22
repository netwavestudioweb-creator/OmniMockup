'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Monitor, X } from 'lucide-react';

/**
 * Aides du studio sur téléphone et tablette (masquées sur ordinateur) :
 * 1. un conseil, affiché une seule fois : le studio est plus confortable sur ordinateur ;
 * 2. un repère « Autres réglages plus bas » tant qu'on n'a pas fait défiler l'onglet ouvert,
 *    car beaucoup de réglages sont sous l'aperçu et on ne le devine pas.
 */
const TIP_KEY = 'pms_conseil_ordinateur_vu';

export function StudioMobileHelp({ tabKey, tabLabel }: { tabKey: string; tabLabel: string }) {
  const [showTip, setShowTip] = useState(false);
  const [showCue, setShowCue] = useState(false);
  const baseline = useRef(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(TIP_KEY)) setShowTip(true);
    } catch {
      /* stockage indisponible : on n'affiche pas le conseil */
    }
  }, []);

  // Le repère réapparaît à chaque changement d'onglet, et disparaît dès qu'on fait défiler
  useEffect(() => {
    const el = document.getElementById('studio-scroll');
    if (!el) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const remaining = el.scrollHeight - el.clientHeight - el.scrollTop;
      setShowCue(remaining > 240 && el.scrollTop - baseline.current < 120);
    };
    const t = window.setTimeout(() => {
      baseline.current = el.scrollTop;
      update();
    }, 450); // après le retour en haut des réglages déclenché par le changement d'onglet
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.clearTimeout(t);
      el.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [tabKey]);

  const closeTip = () => {
    setShowTip(false);
    try {
      localStorage.setItem(TIP_KEY, '1');
    } catch {
      /* rien */
    }
  };

  return (
    <>
      {showTip && (
        <div className="lg:hidden mb-4 p-4 rounded-2xl bg-pms-accent/15 border border-pms-accent/30 flex items-start gap-3" role="note">
          <Monitor className="w-5 h-5 mt-0.5 shrink-0 text-pms-accent-soft" aria-hidden />
          <p className="flex-1 text-[14px] leading-relaxed text-zinc-200">
            Le studio est plus confortable sur ordinateur. Sur téléphone, tout marche aussi : faites défiler sous l&apos;aperçu pour voir
            tous les réglages de chaque onglet.
          </p>
          <button
            type="button"
            onClick={closeTip}
            aria-label="Fermer le conseil"
            className="shrink-0 w-11 h-11 -m-2 flex items-center justify-center rounded-full text-zinc-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Hors du panneau (qui est animé) : sinon « fixed » se cale sur le panneau et non sur l'écran */}
      {showCue &&
        createPortal(
        <div className="lg:hidden fixed inset-x-0 bottom-4 z-[60] flex justify-center pointer-events-none">
          <button
            type="button"
            onClick={() => document.getElementById('studio-scroll')?.scrollBy({ top: 420, behavior: 'smooth' })}
            className="pointer-events-auto min-h-[44px] px-4 rounded-full bg-white text-zinc-950 text-[14px] font-semibold shadow-[0_10px_30px_-8px_rgba(0,0,0,0.6)] flex items-center gap-2 animate-bounce [animation-iteration-count:2]"
          >
            Autres réglages « {tabLabel} » plus bas
            <ChevronDown className="w-4 h-4" aria-hidden />
          </button>
        </div>,
          document.body
        )}
    </>
  );
}
