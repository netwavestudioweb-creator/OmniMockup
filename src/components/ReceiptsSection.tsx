'use client';

import React, { useEffect, useState } from 'react';
import { Receipt } from 'lucide-react';
import type { SaspayReceipt } from '@/app/api/payments/saspay/receipts/route';

const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;
const dateFr = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

function ReceiptCard({ r, latest, planEnd }: { r: SaspayReceipt; latest: boolean; planEnd?: string | null }) {
  const rows: [string, string][] = [
    ['Achat', r.label],
    ['Montant débité', r.debitedXof !== null ? fcfa(r.debitedXof) : fcfa(r.amountXof)],
    ...(r.feeXof !== null ? ([['Dont frais de l’opérateur', fcfa(r.feeXof)]] as [string, string][]) : []),
    ['Date', dateFr(r.paidAt)],
    ...(r.operator ? ([['Payé avec', r.operator]] as [string, string][]) : []),
    ['Référence SasPay', r.reference || '—'],
    ['Ce qui est activé', r.activated + (latest && planEnd && !/crédits/.test(r.activated) ? `, jusqu’au ${new Date(planEnd).toLocaleDateString('fr-FR', { dateStyle: 'long' })}` : '')],
  ];
  return (
    <div className={`p-5 rounded-2xl bg-white border ${latest ? 'border-pms-accent ring-1 ring-pms-accent' : 'border-pms-line'}`}>
      <p className="flex items-center gap-2 text-[15px] font-semibold text-pms-ink">
        <Receipt className="w-4 h-4 text-pms-accent" aria-hidden />
        Reçu de paiement PitchMySite
      </p>
      <dl className="mt-3 grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)] gap-x-4 gap-y-2 text-[14px]">
        {rows.map(([k, v]) => (
          <React.Fragment key={k}>
            <dt className="text-pms-muted">{k}</dt>
            <dd className="text-pms-ink break-words">{v}</dd>
          </React.Fragment>
        ))}
      </dl>
    </div>
  );
}

/** Reçus des paiements Mobile Money confirmés côté serveur ; le plus récent en avant juste après un paiement */
export function ReceiptsSection({ justPaid, planEnd }: { justPaid: boolean; planEnd?: string | null }) {
  const [receipts, setReceipts] = useState<SaspayReceipt[] | null>(null);

  useEffect(() => {
    fetch('/api/payments/saspay/receipts', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { receipts: [] }))
      .then((d) => setReceipts(d.receipts || []))
      .catch(() => setReceipts([]));
  }, []);

  if (!receipts || receipts.length === 0) return null;
  const [latest, ...older] = receipts;

  return (
    <section className="space-y-3" aria-labelledby="mes-recus">
      <h2 id="mes-recus" className="text-lg font-semibold text-pms-ink">
        {justPaid ? 'Votre reçu' : 'Mes reçus'}
      </h2>
      <p className="text-[14px] text-pms-muted">Vous pouvez en faire une capture d’écran. Ils restent ici, dans votre compte.</p>
      <ReceiptCard r={latest} latest={justPaid} planEnd={planEnd} />
      {older.length > 0 && (
        <details className="text-[14px]">
          <summary className="cursor-pointer min-h-[44px] inline-flex items-center font-semibold text-pms-accent">
            Reçus précédents ({older.length})
          </summary>
          <div className="mt-3 space-y-3">
            {older.map((r) => (
              <ReceiptCard key={r.id} r={r} latest={false} />
            ))}
          </div>
        </details>
      )}
    </section>
  );
}
