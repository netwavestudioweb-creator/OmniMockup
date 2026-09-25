import React from 'react';
import Link from 'next/link';
import { Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-sand-200 bg-white text-stone-600 text-xs py-10 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3 text-left">
          <div className="h-8 w-8 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-stone-900 text-sm">
                Omni<span className="text-violet-600">Mockup</span> Studio
              </span>
              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                v1.0
              </span>
            </div>
            <p className="text-[11px] text-stone-500 font-sans mt-0.5">
              Analyse Web multi-signaux, Vision IA & Mockups Haute Fidélité.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-stone-600 font-medium">
          <Link href="/pricing" className="hover:text-violet-700 transition-colors">
            Tarifs
          </Link>
          <Link href="/terms" className="hover:text-violet-700 transition-colors">
            Conditions (CGU/CGV)
          </Link>
          <Link href="/privacy" className="hover:text-violet-700 transition-colors">
            Confidentialité (RGPD)
          </Link>
          <a href="mailto:support@omnimockup.com" className="hover:text-violet-700 transition-colors">
            Contact Support
          </a>
        </div>

        <div className="text-[11px] text-stone-400 font-mono text-center md:text-right">
          © {new Date().getFullYear()} OmniMockup Studio. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
};
