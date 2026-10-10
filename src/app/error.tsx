'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Home, RefreshCw, WifiOff } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { SUPPORT_EMAIL } from '@/lib/contact';

/**
 * Page affichée si une partie du site plante pendant l'affichage.
 * Le visiteur peut réessayer sans recharger tout le site, ou revenir à l'accueil.
 */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[OmniMockup] Erreur d’affichage :', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col">
      <Navbar showPricingLink={true} />
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-sand-200 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center">
            <WifiOff className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Cette page n&apos;a pas pu s&apos;afficher</h1>
            <p className="text-sm text-stone-600 leading-relaxed">
              Souvent, c&apos;est la connexion qui a coupé un instant. Réessayez : votre travail dans le studio est enregistré sur
              votre appareil.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              type="button"
              onClick={reset}
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
            <Link
              href="/"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-sand-300 hover:bg-sand-50 text-stone-800 font-bold text-sm"
            >
              <Home className="w-4 h-4" />
              Accueil
            </Link>
          </div>
          <p className="text-xs text-stone-500">
            Le problème continue ?{' '}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-violet-700 underline">
              Écrivez-nous
            </a>
            {error.digest ? ` (référence : ${error.digest})` : ''}.
          </p>
        </div>
      </main>
    </div>
  );
}
