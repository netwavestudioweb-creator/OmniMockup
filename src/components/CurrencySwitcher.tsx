'use client';

import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { Currency } from '@/lib/pricing';
import { Globe } from 'lucide-react';

interface CurrencySwitcherProps {
  className?: string;
  variant?: 'default' | 'compact' | 'footer';
}

const OPTIONS: { code: Currency; symbol: string; label: string }[] = [
  { code: 'EUR', symbol: '€', label: 'EUR (€)' },
  { code: 'USD', symbol: '$', label: 'USD ($)' },
  { code: 'XOF', symbol: 'FCFA', label: 'FCFA' },
];

export const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({
  className = '',
  variant = 'default',
}) => {
  const { currency, setCurrency } = useCurrency();

  if (variant === 'footer') {
    return (
      <div className={`inline-flex items-center gap-1.5 p-1 rounded-xl bg-stone-100 border border-sand-300 text-xs ${className}`}>
        <span className="text-[10px] font-semibold text-stone-400 pl-1.5 flex items-center gap-1">
          <Globe className="w-3 h-3 text-stone-400" />
          <span className="hidden sm:inline">Devise :</span>
        </span>
        <div className="flex items-center gap-0.5">
          {OPTIONS.map((opt) => {
            const isActive = currency === opt.code;
            return (
              <button
                key={opt.code}
                type="button"
                onClick={() => setCurrency(opt.code)}
                aria-pressed={isActive}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
                }`}
              >
                {opt.symbol}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // default ou compact (pour /pricing)
  return (
    <div
      className={`inline-flex items-center gap-1 p-1 bg-sand-100 rounded-2xl border border-sand-200 ${className}`}
      role="group"
      aria-label="Sélecteur de devise"
    >
      <div className="px-2 text-stone-400 flex items-center gap-1 text-xs">
        <Globe className="w-3.5 h-3.5 text-stone-500" />
        <span className="hidden sm:inline text-[11px] font-bold text-stone-600">Devise :</span>
      </div>
      {OPTIONS.map((opt) => {
        const isActive = currency === opt.code;
        return (
          <button
            key={opt.code}
            type="button"
            onClick={() => setCurrency(opt.code)}
            aria-pressed={isActive}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isActive
                ? 'bg-white text-stone-900 shadow-xs border border-sand-300 font-extrabold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-sand-200/50'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
