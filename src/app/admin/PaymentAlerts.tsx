'use client';

import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';

type State = 'reussi' | 'echoue' | 'paye_non_active' | 'abandonne' | 'en_cours';
type Row = { id: string; state: State; item: string; billing: string | null; amount: number; email: string | null; created_at: string };
type Data = { list: Row[]; counts: Record<State, number> };

const LABEL: Record<State, string> = {
  reussi: 'Réussi',
  echoue: 'Échoué',
  paye_non_active: 'Payé, forfait PAS activé',
  abandonne: 'Abandonné',
  en_cours: 'En cours',
};
const COLOR: Record<State, string> = {
  reussi: 'text-emerald-300',
  echoue: 'text-rose-300',
  paye_non_active: 'text-rose-200 font-bold',
  abandonne: 'text-zinc-400',
  en_cours: 'text-amber-300',
};

/** Bandeau en haut de /admin : chaque paiement des 7 derniers jours, réussi ou non */
export function PaymentAlerts() {
  const [data, setData] = useState<Data | null>(null);
  useEffect(() => {
    fetch('/api/admin/payment-alerts', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, []);
  if (!data) return null;

  const { counts, list } = data;
  const urgent = counts.paye_non_active > 0;
  const shown = list.filter((p) => p.state !== 'abandonne').slice(0, 8);

  return (
    <section
      aria-label="Paiements des 7 derniers jours"
      className={`rounded-2xl border p-4 space-y-3 ${urgent ? 'bg-rose-950/60 border-rose-500' : 'bg-zinc-900 border-zinc-800'}`}
    >
      <p className="flex items-start gap-2 text-sm font-semibold">
        {urgent ? <AlertTriangle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />}
        {urgent
          ? `${counts.paye_non_active} client${counts.paye_non_active > 1 ? 's ont' : ' a'} payé sans que le forfait s'active : à régler aujourd'hui (onglet Ventes).`
          : 'Paiements des 7 derniers jours'}
      </p>
      <p className="text-xs text-zinc-400">
        {counts.reussi} réussi{counts.reussi > 1 ? 's' : ''} · {counts.echoue} échoué{counts.echoue > 1 ? 's' : ''} · {counts.en_cours} en cours ·{' '}
        {counts.abandonne} abandonné{counts.abandonne > 1 ? 's' : ''} (page SasPay ouverte sans payer)
      </p>
      {shown.length > 0 && (
        <ul className="divide-y divide-zinc-800 text-xs">
          {shown.map((p) => (
            <li key={p.id} className="py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className={COLOR[p.state]}>{LABEL[p.state]}</span>
              <span className="text-zinc-300">
                {p.item}
                {p.billing ? ` (${p.billing === 'annual' ? 'an' : 'mois'})` : ''} · {new Intl.NumberFormat('fr-FR').format(p.amount)} FCFA
              </span>
              <span className="text-zinc-500">{p.email || 'compte inconnu'}</span>
              <span className="text-zinc-500">{new Date(p.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
