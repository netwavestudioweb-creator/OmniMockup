import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Home, AlertCircle } from 'lucide-react';

export const metadata = {
  title: "Page introuvable • PitchMySite",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-pms-surface text-stone-900 flex flex-col selection:bg-pms-accent-tint selection:text-pms-accent">
      <Navbar showPricingLink={true} />

      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white rounded-3xl border border-pms-line p-8 sm:p-10 shadow-sm space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-pms-accent-tint border border-pms-accent-tint text-pms-accent mx-auto flex items-center justify-center shadow-2xs">
            <AlertCircle className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-semibold text-pms-accent">
              Erreur 404
            </span>
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">
              Page Introuvable
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Désolé, la page que vous recherchez n&apos;existe pas ou a été déplacée.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="py-3 px-5 rounded-xl font-semibold text-xs bg-stone-900 hover:bg-stone-800 text-white transition-all shadow-xs flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" />
              <span>Retour à l&apos;accueil</span>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
