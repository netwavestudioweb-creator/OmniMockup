'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { MockupFrame } from '@/components/MockupFrame';

/**
 * Attente pendant la capture : les étapes avancent avec le temps, un exemple montre ce qui arrive,
 * et après 25 secondes on propose de déposer une capture d'écran à la place.
 */
const STEPS = [
  { until: 4, label: 'Ouverture du site' },
  { until: 12, label: 'Photo de la page' },
  { until: Infinity, label: 'Préparation du studio' },
];

export function CaptureWait({ seconds, onCancel, onUpload }: { seconds: number; onCancel: () => void; onUpload: () => void }) {
  const current = STEPS.findIndex((s) => seconds < s.until);
  return (
    <div className="fixed inset-0 bg-pms-ink/60 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-pms-paper rounded-xl p-6 sm:p-8 max-w-md w-full max-h-[calc(100dvh-2rem)] overflow-y-auto" role="status">
        <h3 className="text-[22px] font-semibold">Capture de votre site</h3>

        <ol className="mt-5 space-y-3" aria-live="polite">
          {STEPS.map((s, i) => {
            const done = i < current;
            const active = i === current;
            return (
              <li key={s.label} className={`flex items-center gap-3 text-[16px] ${done || active ? 'text-pms-ink' : 'text-pms-muted'}`}>
                <span
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    done ? 'bg-pms-accent text-white' : active ? 'ring-2 ring-pms-accent text-pms-accent' : 'ring-1 ring-pms-line'
                  }`}
                >
                  {done ? <Check className="w-4 h-4" aria-hidden /> : active ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <span className="text-[13px]">{i + 1}</span>}
                </span>
                <span className={active ? 'font-semibold' : ''}>{s.label}</span>
              </li>
            );
          })}
        </ol>

        <p className="mt-4 text-[14px] text-pms-muted tabular-nums">
          {seconds} s{seconds >= 12 ? ' · les pages longues ou chargées d’images prennent un peu plus de temps' : ''}
        </p>

        <div className="mt-5 rounded-lg bg-pms-surface p-4">
          <p className="text-[14px] font-semibold">Ce que vous allez obtenir</p>
          <div className="mt-3 mx-auto w-[85%] aspect-[16/10]">
            <MockupFrame type="macbook" fill screenshotBase64="/images/demo/wave-desktop.jpg" url="https://www.wave.com" domainName="wave.com" />
          </div>
          <p className="mt-3 text-[12px] text-pms-muted">
            Exemple réalisé à partir de la page publique de Wave, sans lien avec la marque. Votre site prendra sa place.
          </p>
        </div>

        {seconds >= 25 && (
          <div className="mt-5 p-4 rounded-lg ring-1 ring-pms-line">
            <p className="text-[15px]">Ce site est lent à répondre. Vous pouvez attendre, ou déposer une capture d&apos;écran du site : le résultat est le même.</p>
            <button
              type="button"
              onClick={onUpload}
              className="mt-3 min-h-[44px] px-4 rounded-md bg-pms-ink hover:bg-pms-accent text-white text-[15px] font-semibold transition-colors"
            >
              Déposer une capture d&apos;écran
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="mt-5 w-full min-h-[44px] px-5 rounded-md bg-pms-surface hover:bg-pms-line text-[15px] font-semibold transition-colors"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}
