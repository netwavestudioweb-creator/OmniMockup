'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Loader2, Mail, MailCheck } from 'lucide-react';

/** Mot de passe oublié : envoie un lien pour choisir un nouveau mot de passe. */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError('');
    try {
      const { error: err } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/nouveau-mot-de-passe')}`,
      });
      // Message identique que le compte existe ou non (on ne révèle pas qui est inscrit)
      if (err && /rate|too many|limit/i.test(err.message)) {
        setError('Trop de demandes en peu de temps. Patientez quelques minutes, puis réessayez.');
        return;
      }
      setSent(true);
    } catch {
      setError('La demande n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col">
      <Navbar showPricingLink={true} />
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-12 flex items-center">
        <div className="w-full bg-white rounded-3xl border border-sand-200 shadow-xl p-6 sm:p-8 space-y-5">
          {sent ? (
            <div className="space-y-4 text-center">
              <MailCheck className="w-10 h-10 text-violet-600 mx-auto" />
              <h1 className="text-xl font-extrabold">Vérifiez votre boîte mail</h1>
              <p className="text-sm text-stone-600 leading-relaxed">
                Si un compte existe avec <strong>{email.trim()}</strong>, vous allez recevoir un lien pour choisir un nouveau mot de passe.
                Ouvrez-le <strong>sur cet appareil</strong>, dans ce navigateur. Pensez à regarder dans les spams.
              </p>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-sm font-bold text-violet-600 hover:text-violet-700">
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <h1 className="text-xl sm:text-2xl font-extrabold">Mot de passe oublié</h1>
                <p className="text-sm text-stone-500">Entrez l’adresse e-mail de votre compte : nous vous envoyons un lien pour en choisir un nouveau.</p>
              </div>
              {error && (
                <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {error}
                </p>
              )}
              <form onSubmit={submit} className="space-y-4">
                <label className="block">
                  <span className="block text-xs font-semibold text-stone-700 mb-1.5">Adresse e-mail</span>
                  <span className="relative block">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="exemple@gmail.com"
                      className="block w-full pl-10 pr-3.5 py-2.5 text-sm bg-sand-50/50 border border-sand-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-600"
                    />
                  </span>
                </label>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Recevoir le lien'}
                </button>
              </form>
              <Link href="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-800">
                <ArrowLeft className="w-3.5 h-3.5" /> Retour à la connexion
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
