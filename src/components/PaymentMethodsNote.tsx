import React from 'react';
import { Smartphone } from 'lucide-react';
import { MOBILE_MONEY_COUNTRIES, MOBILE_MONEY_SHORT } from '@/lib/paymentMethods';
import { cardPaymentsEnabled } from '@/lib/paymentConfig';

/** Sous le bouton d'un forfait payant : comment on paie aujourd'hui */
export function PaymentMethodsNote({ className = '' }: { className?: string }) {
  return (
    <div className={`text-[13px] leading-snug text-pms-muted ${className}`}>
      <p className="flex items-center gap-1.5 font-semibold text-pms-ink">
        <Smartphone className="w-4 h-4 shrink-0" aria-hidden />
        Paiement par Mobile Money, en FCFA
      </p>
      <p className="mt-1">{MOBILE_MONEY_SHORT}</p>
      {!cardPaymentsEnabled && <p className="mt-1 text-[12px]">Carte bancaire : bientôt.</p>}
    </div>
  );
}

/** Liste dépliable des pays et opérateurs acceptés (toujours dans la page, lisible sans JavaScript) */
export function PaymentCountriesList({ className = '' }: { className?: string }) {
  return (
    <details className={`text-[15px] ${className}`}>
      <summary className="cursor-pointer min-h-[44px] inline-flex items-center font-semibold text-pms-accent underline underline-offset-4">
        Pays et opérateurs Mobile Money acceptés
      </summary>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 text-pms-muted">
        {MOBILE_MONEY_COUNTRIES.map((c) => (
          <li key={c.country}>
            <strong className="font-semibold text-pms-ink">{c.country}</strong> : {c.operators.join(', ')}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-[13px] text-pms-muted">
        Le paiement se fait sur la page sécurisée de SasPay, notre prestataire de paiement. Vous validez avec votre code
        secret Mobile Money, puis vous revenez sur PitchMySite.
      </p>
    </details>
  );
}
