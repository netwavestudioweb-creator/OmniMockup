'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Gift, Loader2 } from 'lucide-react';

type GiftRow = { id: string; email: string | null; expires: string | null; created_at: string };

const dateFr = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('fr-FR', { dateStyle: 'medium' }) : '—');

/** Offre de prospection : « Offrir 1 mois de Solo » à une agence, et la liste des mois déjà offerts */
export function GiftsPanel() {
  const [gifts, setGifts] = useState<GiftRow[] | null>(null);
  const [limit, setLimit] = useState(10);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/gifts', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setGifts(d.gifts || []);
        setLimit(d.limit || 10);
      })
      .catch(() => setGifts([]));
  }, []);
  useEffect(load, [load]);

  const offer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!window.confirm(`Offrir 1 mois de Solo au compte ${email.trim()} ?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/gifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await res.json().catch(() => null);
      if (d?.ok) {
        setMessage({ ok: true, text: `Solo offert jusqu’au ${dateFr(d.expires)}. Il en reste ${d.remaining} à donner.` });
        setEmail('');
        load();
      } else {
        setMessage({ ok: false, text: d?.message || 'Activation impossible.' });
      }
    } catch {
      setMessage({ ok: false, text: 'Le serveur ne répond pas.' });
    } finally {
      setBusy(false);
    }
  };

  const given = gifts?.length ?? 0;
  const full = given >= limit;

  return (
    <section aria-label="Mois de Solo offerts" className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Gift className="w-4 h-4 text-zinc-300" aria-hidden />
        Mois de Solo offerts aux agences : {given} sur {limit}
      </p>
      <p className="text-xs text-zinc-400">
        L’agence crée d’abord son compte gratuit, puis tu entres son adresse. Solo est actif 1 mois, sans renouvellement :
        ensuite elle repasse en gratuit et peut payer 5 500 FCFA par mois si elle continue.
      </p>
      <form onSubmit={offer} className="flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="adresse e-mail du compte de l’agence"
          disabled={full || busy}
          className="flex-1 min-w-[220px] px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-sm text-white placeholder:text-zinc-500"
        />
        <button
          type="submit"
          disabled={full || busy || !email.trim()}
          className="px-3 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold disabled:opacity-50 inline-flex items-center gap-1.5"
        >
          {busy && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />}
          Offrir 1 mois de Solo
        </button>
      </form>
      {full && <p className="text-xs text-amber-300">Les {limit} mois offerts ont tous été donnés.</p>}
      {message && <p className={`text-xs ${message.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{message.text}</p>}
      {gifts && gifts.length > 0 && (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-zinc-500 text-left">
              <th className="py-1.5 font-semibold">Offert le</th>
              <th className="py-1.5 font-semibold">Compte</th>
              <th className="py-1.5 font-semibold">Fin du mois offert</th>
            </tr>
          </thead>
          <tbody>
            {gifts.map((g) => (
              <tr key={g.id} className="border-t border-zinc-800">
                <td className="py-1.5 text-zinc-300">{dateFr(g.created_at)}</td>
                <td className="py-1.5 text-zinc-300 break-all">{g.email || '—'}</td>
                <td className="py-1.5 text-zinc-300">{dateFr(g.expires)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
