'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, Send } from 'lucide-react';

const inputClass =
  'w-full rounded-xl bg-zinc-900 border border-zinc-700 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20';

export function FounderApplicationForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());

    try {
      const res = await fetch('/api/founders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) throw new Error(json.error || 'Envoi impossible.');
      setStatus('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Envoi impossible.');
      setStatus('error');
    }
  }

  if (status === 'done') {
    return (
      <div className="flex flex-col items-center text-center gap-3 p-8 rounded-2xl bg-emerald-950/40 border border-emerald-500/30">
        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        <h3 className="text-lg font-bold text-white">Candidature reçue, merci !</h3>
        <p className="text-sm text-zinc-300 max-w-md">
          Nous vous recontactons par email pour activer votre mois Pro offert.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 sm:p-8 rounded-2xl bg-zinc-900/80 border border-zinc-800">
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
        Votre nom *
        <input name="fullName" required maxLength={120} autoComplete="name" className={inputClass} placeholder="Awa Diallo" />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
        Nom de l&apos;agence *
        <input name="agencyName" required maxLength={160} autoComplete="organization" className={inputClass} placeholder="Studio Pixel" />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
        Site de l&apos;agence
        <input name="agencyWebsite" maxLength={300} inputMode="url" className={inputClass} placeholder="studiopixel.com" />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300">
        Email professionnel *
        <input name="email" type="email" required maxLength={200} autoComplete="email" className={inputClass} placeholder="awa@studiopixel.com" />
      </label>
      <label className="flex flex-col gap-1.5 text-xs font-semibold text-zinc-300 sm:col-span-2">
        Sites livrés par mois
        <select name="sitesPerMonth" defaultValue="" className={inputClass}>
          <option value="" disabled>Choisir…</option>
          <option value="1-2">1 à 2</option>
          <option value="3-5">3 à 5</option>
          <option value="6+">6 ou plus</option>
        </select>
      </label>
      {/* Champ piège pour les robots (invisible pour les humains) */}
      <input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {error && <p className="sm:col-span-2 text-sm text-rose-400">{error}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="sm:col-span-2 inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-bold text-sm transition-colors"
      >
        {status === 'sending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        Devenir agence fondatrice
      </button>
      <p className="sm:col-span-2 text-[11px] text-zinc-500 text-center">
        Vos informations servent uniquement à vous recontacter au sujet du programme.
      </p>
    </form>
  );
}
