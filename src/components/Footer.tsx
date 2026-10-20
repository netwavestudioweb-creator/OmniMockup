import React from 'react';
import { SUPPORT_EMAIL } from '@/lib/contact';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { CurrencySwitcher } from './CurrencySwitcher';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white text-stone-600 text-[13px] py-10 w-full mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-3 text-left">
          <div className="h-8 w-8 rounded-xl bg-pms-accent text-white flex items-center justify-center shadow-sm shrink-0">
            <Layers className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold tracking-tight text-stone-900 text-sm">
                Pitch<span className="text-pms-accent">MySite</span> Studio
              </span>
            </div>
            <p className="text-[13px] text-stone-500 font-sans mt-0.5">
              Studio de mockups 3D, cadres Apple &amp; exports 4K instantanés.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-[13px] text-stone-600 font-medium">
          <Link href="/pricing" className="hover:text-pms-accent transition-colors">
            Tarifs
          </Link>
          <Link href="/terms" className="hover:text-pms-accent transition-colors">
            Conditions (CGU/CGV)
          </Link>
          <Link href="/privacy" className="hover:text-pms-accent transition-colors">
            Confidentialité (RGPD)
          </Link>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-pms-accent transition-colors">
            Contact Support
          </a>
        </div>

        <div className="flex items-center gap-4">
          <CurrencySwitcher variant="footer" />
          <div className="text-[13px] text-stone-500 text-center md:text-right">
            © {new Date().getFullYear()} PitchMySite. Tous droits réservés.
          </div>
        </div>
      </div>
    </footer>
  );
};
