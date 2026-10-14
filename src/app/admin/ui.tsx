'use client';

import React from 'react';

/* ───────────── Formats et libellés communs du tableau de bord ───────────── */
export const fmt = (n: number | null | undefined) => new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));
export const money = (n: number, cur: string) =>
  cur === 'XOF' ? `${fmt(n)} FCFA` : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(Number(n) || 0);
export const date = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
export const dateTime = (s: string) =>
  new Date(s).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const PLAN_LABEL: Record<string, string> = { free: 'Gratuit', solo: 'Solo', pro: 'Pro', agence: 'Agence' };

/** Taux fixe euro → FCFA (le franc CFA est arrimé à l'euro) */
export const EUR_TO_XOF = 655.957;

/** Montant converti en FCFA (euros au taux fixe) ; null pour les dollars, comptés à part */
export function toXof(amount: number, currency: string): number | null {
  if (currency === 'XOF') return amount;
  if (currency === 'EUR') return amount * EUR_TO_XOF;
  return null;
}

/* ───────────── Petits composants ───────────── */
export const Card: React.FC<{ title: string; children: React.ReactNode; hint?: string; className?: string; action?: React.ReactNode }> = ({
  title,
  hint,
  children,
  className = '',
  action,
}) => (
  <section className={`rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 min-w-0 ${className}`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div className="min-w-0">
        <h2 className="text-sm font-bold text-zinc-100">{title}</h2>
        {hint && <p className="text-[11px] text-zinc-400 mt-0.5">{hint}</p>}
      </div>
      {action}
    </div>
    <div className="mt-3">{children}</div>
  </section>
);

export const Kpi: React.FC<{ label: string; value: string; sub?: string; accent?: boolean }> = ({ label, value, sub, accent }) => (
  <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 min-w-0">
    <p className="text-xs text-zinc-400">{label}</p>
    <p className={`mt-1 text-2xl sm:text-3xl font-black tracking-tight break-words ${accent ? 'text-lime-300' : 'text-white'}`}>{value}</p>
    {sub && <p className="text-[11px] text-lime-300/90 mt-1">{sub}</p>}
  </div>
);

export const Pill: React.FC<{ children: React.ReactNode; tone?: 'violet' | 'lime' | 'amber' | 'rose' | 'zinc' | 'sky' }> = ({ children, tone = 'zinc' }) => {
  const tones = {
    violet: 'bg-violet-500/15 text-violet-200 border-violet-500/30',
    lime: 'bg-lime-300/15 text-lime-200 border-lime-300/30',
    amber: 'bg-amber-400/15 text-amber-200 border-amber-400/30',
    rose: 'bg-rose-500/15 text-rose-200 border-rose-500/30',
    sky: 'bg-sky-400/15 text-sky-200 border-sky-400/30',
    zinc: 'bg-zinc-800 text-zinc-300 border-zinc-700',
  };
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold whitespace-nowrap ${tones[tone]}`}>{children}</span>;
};

/** Boutons de choix (filtres) */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            value === o.id ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** Colonnes simples (SVG, sans bibliothèque) pour une suite de périodes */
export const ColumnChart: React.FC<{ points: { label: string; value: number }[]; color: string; unit?: string }> = ({ points, color, unit = '' }) => {
  const max = Math.max(1, ...points.map((p) => p.value));
  const w = 10;
  if (!points.length) return <p className="text-xs text-zinc-500">Pas encore de données.</p>;
  return (
    <div>
      <svg viewBox={`0 0 ${points.length * w} 60`} className="w-full h-28" preserveAspectRatio="none" role="img" aria-label="Évolution">
        {points.map((p, i) => {
          const h = (p.value / max) * 56;
          return (
            <rect key={p.label + i} x={i * w + 1} y={60 - h} width={w - 2} height={Math.max(h, 0.5)} rx={1.5} fill={color}>
              <title>{`${p.label} : ${fmt(p.value)}${unit}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
        <span>{points[0]?.label}</span>
        <span>{points[points.length - 1]?.label}</span>
      </div>
    </div>
  );
};
