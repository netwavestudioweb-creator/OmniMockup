'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Clock, CreditCard, Mail, RefreshCw, Smartphone, XCircle } from 'lucide-react';
import { SUPPORT_EMAIL } from '@/lib/contact';

export type PaymentResult = 'success' | 'pending' | 'canceled' | 'failed' | 'expired' | 'verification';

interface PaymentResultPanelProps {
  result: PaymentResult;
  paymentMethod: 'stripe' | 'saspay';
  onRetry: () => void;
  onSwitchMethod: () => void;
  onClose: () => void;
}

const CONTENT: Record<PaymentResult, { title: string; text: string; tone: 'ok' | 'wait' | 'warn' | 'error' }> = {
  success: {
    title: 'Paiement validé',
    text: 'Votre compte a été mis à niveau. Vous pouvez exporter dès maintenant.',
    tone: 'ok',
  },
  pending: {
    title: 'Paiement en cours de confirmation',
    text: "L'opérateur n'a pas encore confirmé votre paiement. Votre compte sera mis à jour automatiquement dès sa validation, en général en quelques minutes.",
    tone: 'wait',
  },
  canceled: {
    title: 'Paiement annulé',
    text: "Aucun montant n'a été débité. Vous pouvez réessayer quand vous voulez, avec le même moyen de paiement ou un autre.",
    tone: 'warn',
  },
  failed: {
    title: 'Paiement refusé',
    text: "L'opérateur ou la banque a refusé le paiement, et aucun montant n'a été débité. Vérifiez votre solde ou vos plafonds, ou essayez un autre moyen de paiement.",
    tone: 'error',
  },
  expired: {
    title: 'Délai de paiement dépassé',
    text: "La page de paiement a expiré avant la validation. Aucun montant n'a été débité : relancez simplement le paiement.",
    tone: 'warn',
  },
  verification: {
    title: 'Paiement à vérifier',
    text: "Nous n'avons pas pu confirmer ce paiement automatiquement. Si vous avez été débité, écrivez-nous : votre accès sera activé à la main, sans rien repayer.",
    tone: 'error',
  },
};

const TONE = {
  ok: { box: 'bg-emerald-50 border-emerald-200', icon: 'bg-emerald-100 text-emerald-600', Icon: CheckCircle2 },
  wait: { box: 'bg-sky-50 border-sky-200', icon: 'bg-sky-100 text-sky-600', Icon: Clock },
  warn: { box: 'bg-amber-50 border-amber-200', icon: 'bg-amber-100 text-amber-600', Icon: AlertTriangle },
  error: { box: 'bg-rose-50 border-rose-200', icon: 'bg-rose-100 text-rose-600', Icon: XCircle },
};

/** Résultat d'un paiement (retour de Stripe ou de SasPay) : message clair et actions utiles. */
export const PaymentResultPanel: React.FC<PaymentResultPanelProps> = ({ result, paymentMethod, onRetry, onSwitchMethod, onClose }) => {
  const c = CONTENT[result];
  const t = TONE[c.tone];
  const retryable = result === 'canceled' || result === 'failed' || result === 'expired';
  return (
    <div role="status" className={`max-w-3xl mx-auto mb-8 p-5 sm:p-6 rounded-3xl border ${t.box} shadow-sm animate-fade-in`}>
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
        <div className={`w-12 h-12 rounded-2xl ${t.icon} flex items-center justify-center shrink-0`}>
          <t.Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 space-y-3">
          <div className="space-y-1">
            <h2 className="text-lg font-extrabold text-stone-900">{c.title}</h2>
            <p className="text-sm text-stone-700 leading-relaxed">{c.text}</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            {result === 'success' && (
              <Link href="/" className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm">
                Ouvrir le studio
              </Link>
            )}
            {retryable && (
              <>
                <button type="button" onClick={onRetry} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm">
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </button>
                <button type="button" onClick={onSwitchMethod} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm">
                  {paymentMethod === 'saspay' ? <CreditCard className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                  Payer {paymentMethod === 'saspay' ? 'par carte' : 'par Mobile Money'}
                </button>
              </>
            )}
            {(result === 'verification' || result === 'pending' || result === 'failed') && (
              <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Paiement OmniMockup')}`} className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 font-bold text-sm">
                <Mail className="w-4 h-4" />
                Nous écrire
              </a>
            )}
            <button type="button" onClick={onClose} className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-stone-600 hover:text-stone-900 font-semibold text-sm">
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
