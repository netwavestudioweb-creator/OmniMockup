import React from 'react';
import { ShoppingBag } from 'lucide-react';
import type { PendingCheckout } from '@/lib/pendingCheckout';

/** Rappel de l'achat choisi, sur les pages d'inscription et de connexion */
export function CheckoutReminder({ checkout, className = '' }: { checkout: PendingCheckout; className?: string }) {
  return (
    <div className={`p-4 rounded-2xl bg-pms-accent-tint border border-pms-accent/30 text-pms-ink flex items-start gap-3 ${className}`}>
      <ShoppingBag className="w-5 h-5 text-pms-accent shrink-0 mt-0.5" aria-hidden />
      <div className="text-[14px] leading-snug">
        <p className="font-semibold">Votre choix : {checkout.label}</p>
        <p className="mt-1 text-pms-muted">Une fois votre compte prêt, vous passez directement au paiement par Mobile Money.</p>
      </div>
    </div>
  );
}
