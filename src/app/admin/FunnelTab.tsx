'use client';

import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type Week = { week: string; counts: Record<string, number>; captureMedianMs: number | null };
type Data = { steps: string[]; weeks: Week[] };

const LABEL: Record<string, string> = {
  visite: 'Visites de l’accueil',
  capture_lancee: 'Captures lancées',
  capture_reussie: 'Captures réussies',
  export: 'Exports',
  inscription: 'Inscriptions',
  clic_forfait: 'Clics sur un forfait ou un pack',
  paiement_commence: 'Paiements commencés',
  paiement_reussi: 'Paiements réussis',
};

/** Tableau des abandons : combien arrivent à chaque étape, et quelle part passe à la suivante */
export function FunnelTab() {
  const [data, setData] = useState<Data | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    fetch('/api/admin/funnel', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  if (failed) return <p className="text-sm text-rose-300">Le tableau n’a pas pu être chargé.</p>;
  if (!data) return <p className="text-sm text-zinc-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</p>;
  if (!data.weeks.length) return <p className="text-sm text-zinc-400">Aucune donnée sur les 8 dernières semaines.</p>;

  const pct = (a: number, b: number) => (b > 0 ? `${Math.round((a / b) * 100)} %` : '—');

  return (
    <div className="space-y-6">
      <p className="text-xs text-zinc-400 leading-relaxed max-w-prose">
        Semaine du lundi. Le pourcentage est la part qui passe à l’étape suivante. Les exports et les captures comptent des
        actions, pas des personnes (une personne peut exporter plusieurs fois). Les tests faits sur le site comptent aussi.
      </p>
      {data.weeks.map((w) => (
        <section key={w.week} className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4">
          <h2 className="text-sm font-bold">
            Semaine du {new Date(w.week).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
            {w.captureMedianMs !== null && (
              <span className="ml-2 font-normal text-zinc-400">· capture en {(w.captureMedianMs / 1000).toFixed(1)} s (médiane)</span>
            )}
          </h2>
          <table className="mt-3 w-full text-xs">
            <tbody>
              {data.steps.map((s, i) => {
                const n = w.counts[s] || 0;
                const next = data.steps[i + 1];
                return (
                  <tr key={s} className="border-t border-zinc-800">
                    <td className="py-1.5 pr-3 text-zinc-300">{LABEL[s] || s}</td>
                    <td className="py-1.5 pr-3 text-right font-bold tabular-nums">{n}</td>
                    <td className="py-1.5 text-right text-zinc-400 tabular-nums">{next ? `→ ${pct(w.counts[next] || 0, n)}` : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
