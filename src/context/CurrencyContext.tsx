'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Currency } from '@/lib/pricing';

/** Devises affichées sur le site. Le FCFA n'est utilisé qu'au paiement SasPay (côté serveur). */
export type DisplayCurrency = 'EUR' | 'USD';

interface CurrencyContextType {
  currency: DisplayCurrency;
  setCurrency: (currency: Currency) => void;
  isReady: boolean;
  /** Visiteur d'Afrique de l'Ouest : Mobile Money proposé en premier */
  mobileMoneyRegion: boolean;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'EUR',
  setCurrency: () => {},
  isReady: false,
  mobileMoneyRegion: false,
});

const WEST_AFRICA_TZ = ['Porto-Novo', 'Abidjan', 'Dakar', 'Lome', 'Bamako', 'Ouagadougou', 'Niamey', 'Bissau'];

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

function timeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  } catch {
    return '';
  }
}

/** Afrique de l'Ouest et Europe : euros (le FCFA est arrimé à l'euro) ; ailleurs : dollars */
function detectClientCurrency(): DisplayCurrency {
  const tz = timeZone();
  if (tz.startsWith('Europe/') || WEST_AFRICA_TZ.some((c) => tz.includes(c))) return 'EUR';
  return 'USD';
}

/** Un ancien choix « FCFA » (avant le passage à € et $ seulement) est ramené à l'euro */
const toDisplay = (c: string | null): DisplayCurrency | null => (c === 'USD' ? 'USD' : c === 'EUR' || c === 'XOF' ? 'EUR' : null);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<DisplayCurrency>('EUR');
  const [isReady, setIsReady] = useState(false);
  const [mobileMoneyRegion, setMobileMoneyRegion] = useState(false);

  useEffect(() => {
    const country = (getCookie('omnimockup_country') || '').toUpperCase();
    setMobileMoneyRegion(
      ['BJ', 'CI', 'SN', 'TG', 'ML', 'BF', 'NE', 'GW'].includes(country) || WEST_AFRICA_TZ.some((c) => timeZone().includes(c))
    );

    const saved = toDisplay(getCookie('omnimockup_currency'));
    const value = saved || detectClientCurrency();
    setCurrencyState(value);
    if (getCookie('omnimockup_currency') !== value) setCookie('omnimockup_currency', value);
    setIsReady(true);
  }, []);

  const handleSetCurrency = useCallback((newCurrency: Currency) => {
    const value = toDisplay(newCurrency) || 'EUR';
    setCurrencyState(value);
    setCookie('omnimockup_currency', value);
  }, []);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency: handleSetCurrency, isReady, mobileMoneyRegion }}>
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
