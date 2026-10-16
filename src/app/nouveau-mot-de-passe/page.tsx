'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';

/** Choix d'un nouveau mot de passe, après le lien reçu par e-mail (la session vient de /auth/callback). */
export default function NewPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState<'checking' | 'ok' | 'expired'>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await createClient().auth.getUser();
        setReady(data.user ? 'ok' : 'expired');
      } catch {
        setReady('expired');
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.');
    if (password !== confirm) return setError('Les deux mots de passe ne sont pas identiques.');
    setBusy(true);
    try {
      const { error: err } = await createClient().auth.updateUser({ password });
      if (err) {
        setError(
          /same|different/i.test(err.message)
            ? 'Choisissez un mot de passe différent de l’ancien.'
            : 'Le mot de passe n’a pas pu être changé. Redemandez un lien et réessayez.'
        );
        return;
      }
      router.push('/account?password=updated');
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const input =
    'block w-full pl-10 pr-10 py-2.5 text-sm bg-sand-50/50 border border-sand-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600';

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col">
      <Navbar showPricingLink={true} />
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-12 flex items-center">
        <div className="w-full bg-white rounded-3xl border border-sand-200 shadow-xl p-6 sm:p-8 space-y-5">
          {ready === 'checking' && (
            <p className="text-sm text-stone-500 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Vérification du lien…
            </p>
          )}
          {ready === 'expired' && (
            <div className="space-y-3">
              <h1 className="text-xl font-extrabold">Lien expiré ou déjà utilisé</h1>
              <p className="text-sm text-stone-600 leading-relaxed">
                Ce lien ne fonctionne plus, ou il a été ouvert sur un autre appareil que celui de la demande. Redemandez-en un nouveau.
              </p>
              <Link href="/mot-de-passe-oublie" className="inline-flex px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold">
                Redemander un lien
              </Link>
            </div>
          )}
          {ready === 'ok' && (
            <>
              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-extrabold">Nouveau mot de passe</h1>
                <p className="text-sm text-stone-500">8 caractères au moins.</p>
              </div>
              {error && (
                <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {error}
                </p>
              )}
              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="block text-xs font-semibold text-stone-700 mb-1.5">Nouveau mot de passe</span>
                  <span className="relative block">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type={show ? 'text' : 'password'} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className={input} />
                    <button
                      type="button"
                      onClick={() => setShow(!show)}
                      aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    >
                      {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </span>
                </label>
                <label className="block">
                  <span className="block text-xs font-semibold text-stone-700 mb-1.5">Confirmez le mot de passe</span>
                  <span className="relative block">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input type={show ? 'text' : 'password'} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={input} />
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enregistrer le nouveau mot de passe'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
