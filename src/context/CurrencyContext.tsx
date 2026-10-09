'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Currency, detectCurrencyFromCountry } from '@/lib/pricing';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  isReady: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  isReady: false,
});

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

/**
 * Détection heuristique côté client de secours si le cookie n'est pas encore posé par le serveur
 */
function detectClientCurrency(): Currency {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz) {
      if (
        tz.includes('Porto-Novo') ||
        tz.includes('Abidjan') ||
        tz.includes('Dakar') ||
        tz.includes('Lome') ||
        tz.includes('Bamako') ||
        tz.includes('Ouagadougou') ||
        tz.includes('Niamey') ||
        tz.includes('Bissau')
      ) {
        return 'XOF';
      }
      if (tz.startsWith('Europe/')) {
        return 'EUR';
      }
    }
  } catch {
    // Ignore
  }
  return 'USD';
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Lire le cookie omnimockup_currency en priorité
    const saved = getCookie('omnimockup_currency');
    if (saved === 'EUR' || saved === 'USD' || saved === 'XOF') {
      setCurrencyState(saved);
      setIsReady(true);
      return;
    }

    // 2. Détection de secours client
    const fallback = detectClientCurrency();
    setCurrencyState(fallback);
    setCookie('omnimockup_currency', fallback);
    setIsReady(true);
  }, []);

  const handleSetCurrency = useCallback((newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    setCookie('omnimockup_currency', newCurrency);
  }, []);

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        isReady,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextType {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
