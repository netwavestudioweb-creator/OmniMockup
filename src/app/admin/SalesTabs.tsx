'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, Loader2, Mail, RefreshCw, X } from 'lucide-react';
import { CREDIT_PACKS } from '@/lib/pricing';
import { Card, ColumnChart, Kpi, PLAN_LABEL, Pill, Segmented, date, dateTime, fmt, money, toXof } from './ui';

/* ───────────── Données ───────────── */
type Sale = {
  id: string;
  provider: string;
  userId: string | null;
  email: string | null;
  kind: 'plan' | 'credits';
  item: string | null;
  cycle: 'monthly' | 'annual' | null;
  amount: number;
  currency: string;
  createdAt: string;
};
type Checkout = {
  id: string;
  userId: string;
  email: string | null;
  item: string;
  kind: 'plan' | 'credits';
  cycle: 'monthly' | 'annual' | null;
  amount: number;
  status: 'pending' | 'applied' | 'failed';
  createdAt: string;
  appliedAt: string | null;
};
type Customer = {
  id: string;
  email: string | null;
  plan: string;
  planExpiresAt: string | null;
  cycle: 'monthly' | 'annual' | null;
  credits: number;
  stripeSubscription: boolean;
  createdAt: string;
};
type SalesData = {
  generatedAt: string;
  truncated: boolean;
  prices: Record<string, { monthly: number; annual: number }>;
  payments: Sale[];
  checkouts: Checkout[];
  customers: Customer[];
};

const DAY = 24 * 3600 * 1000;
const PACK_LABEL = Object.fromEntries(CREDIT_PACKS.map((p) => [p.id, `${p.name} (${p.credits} crédits)`]));
const CYCLE_LABEL: Record<string, string> = { monthly: '1 mois', annual: '1 an' };

/** Libellé d'un achat : « Pro · 1 an » ou « Petit Pack (10 crédits) » */
export function itemLabel(kind: string, item: string | null, cycle?: string | null) {
  if (kind === 'credits') return PACK_LABEL[item || ''] || `Crédits ${item || ''}`;
  const plan = PLAN_LABEL[item || ''] || item || 'Formule';
  return cycle ? `${plan} · ${CYCLE_LABEL[cycle] || cycle}` : plan;
}
const providerLabel = (p: string) => (p === 'saspay' ? 'Mobile Money (SasPay)' : p === 'stripe' ? 'Carte (Stripe)' : p);

/** Lecture des préférences locales (dernière visite, frais) : jamais bloquant */
function readLocal(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}
function writeLocal(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // navigation privée : sans importance
  }
}

function useSalesData() {
  const [data, setData] = useState<SalesData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch('/api/admin/sales', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, reload: load };
}

const RefreshButton: React.FC<{ loading: boolean; onClick: () => void }> = ({ loading, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white"
  >
    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Actualiser
  </button>
);

function Loading({ error, onRetry }: { error: boolean; onRetry: () => void }) {
  if (error)
    return (
      <p className="text-sm text-rose-300">
        Les données n’ont pas pu être chargées.{' '}
        <button type="button" onClick={onRetry} className="underline">Réessayer</button>
      </p>
    );
  return (
    <p className="text-sm text-zinc-400 flex items-center gap-2">
      <Loader2 className="w-4 h-4 animate-spin" /> Chargement…
    </p>
  );
}

/** Lien e-mail prérempli pour relancer un client (ouvre la messagerie de l'ordinateur ou du téléphone) */
function mailto(email: string, subject: string, body: string) {
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
const MailButton: React.FC<{ href: string; label?: string }> = ({ href, label = 'Écrire' }) => (
  <a href={href} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-xs font-bold text-white">
    <Mail className="w-3.5 h-3.5" /> {label}
  </a>
);

const EmailButton: React.FC<{ email: string | null; userId: string | null; onOpen: (id: string) => void }> = ({ email, userId, onOpen }) =>
  userId ? (
    <button type="button" onClick={() => onOpen(userId)} className="font-semibold break-all text-left hover:text-violet-300 hover:underline underline-offset-2">
      {email || 'Compte sans e-mail'}
    </button>
  ) : (
    <span className="font-semibold text-zinc-400">Compte supprimé</span>
  );

/* ───────────── Onglet Ventes ───────────── */
type Period = 'today' | '7d' | '30d' | 'month' | 'all';
const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Aujourd’hui' },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
  { id: 'month', label: 'Ce mois' },
  { id: 'all', label: 'Tout' },
];
const periodStart = (p: Period): number => {
  const now = new Date();
  if (p === 'today') return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  if (p === '7d') return Date.now() - 7 * DAY;
  if (p === '30d') return Date.now() - 30 * DAY;
  if (p === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  return 0;
};

/** Totaux d'une liste de ventes : FCFA (euros convertis) et dollars à part */
function totals(list: Sale[]) {
  let xof = 0;
  let usd = 0;
  for (const s of list) {
    const v = toXof(s.amount, s.currency);
    if (v === null) usd += s.amount;
    else xof += v;
  }
  return { xof, usd, count: list.length };
}
const totalText = (t: { xof: number; usd: number }) => `${fmt(t.xof)} FCFA${t.usd ? ` + ${money(t.usd, 'USD')}` : ''}`;

const LAST_VISIT_KEY = 'pms_admin_sales_seen_at';
const FEE_KEY = 'pms_admin_saspay_fee_pct';

export function SalesTab({ onOpenCustomer }: { onOpenCustomer: (id: string) => void }) {
  const { data, error, loading, reload } = useSalesData();
  const [period, setPeriod] = useState<Period>('30d');
  const [what, setWhat] = useState<'all' | 'solo' | 'pro' | 'agence' | 'credits'>('all');
  const [provider, setProvider] = useState<'all' | 'saspay' | 'stripe'>('all');
  const [shown, setShown] = useState(50);
  const [feePct, setFeePct] = useState('3');
  const [lastVisit, setLastVisit] = useState<number | null>(null);

  // Dernière visite (pour le badge « nouvelles ventes ») et frais SasPay, gardés sur cet appareil
  useEffect(() => {
    const seen = Number(readLocal(LAST_VISIT_KEY)) || null;
    setLastVisit(seen);
    const fee = readLocal(FEE_KEY);
    if (fee) setFeePct(fee);
  }, []);
  const markSeen = () => {
    const now = Date.now();
    writeLocal(LAST_VISIT_KEY, String(now));
    setLastVisit(now);
  };

  const sales = data?.payments || [];
  const newSales = lastVisit ? sales.filter((s) => new Date(s.createdAt).getTime() > lastVisit) : [];
  const fee = Math.min(30, Math.max(0, Number(feePct.replace(',', '.')) || 0)) / 100;

  const filtered = useMemo(() => {
    const from = periodStart(period);
    return sales.filter((s) => {
      if (new Date(s.createdAt).getTime() < from) return false;
      if (provider !== 'all' && s.provider !== provider) return false;
      if (what === 'credits') return s.kind === 'credits';
      if (what !== 'all') return s.kind === 'plan' && s.item === what;
      return true;
    });
  }, [sales, period, what, provider]);

  // Chiffres clés : toujours sur toutes les ventes (les filtres ne touchent que la liste)
  const kpis = useMemo(() => {
    const at = (p: Period) => totals(sales.filter((s) => new Date(s.createdAt).getTime() >= periodStart(p)));
    return { today: at('today'), d7: at('7d'), month: at('month'), all: at('all') };
  }, [sales]);
  const ft = totals(filtered);
  // Frais : seulement sur les paiements SasPay
  const feesXof = filtered.filter((s) => s.provider === 'saspay').reduce((sum, s) => sum + (toXof(s.amount, s.currency) || 0) * fee, 0);

  const exportCsv = () => {
    const head = ['Date', 'E-mail', 'Achat', 'Type', 'Formule ou pack', 'Durée', 'Montant', 'Devise', 'Montant FCFA', 'Moyen de paiement'];
    const rows = filtered.map((s) => [
      new Date(s.createdAt).toLocaleString('fr-FR'),
      s.email || '',
      itemLabel(s.kind, s.item, s.cycle),
      s.kind === 'plan' ? 'Formule' : 'Crédits',
      s.item || '',
      s.cycle ? CYCLE_LABEL[s.cycle] : '',
      String(s.amount).replace('.', ','),
      s.currency,
      toXof(s.amount, s.currency) === null ? '' : String(Math.round(toXof(s.amount, s.currency) as number)),
      providerLabel(s.provider),
    ]);
    const csv = [head, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes-pitchmysite-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  if (!data) return <Loading error={error} onRetry={reload} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {newSales.length > 0 ? (
          <p className="inline-flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl bg-lime-300/10 border border-lime-300/30 text-sm text-lime-200">
            <strong>{fmt(newSales.length)} nouvelle{newSales.length > 1 ? 's' : ''} vente{newSales.length > 1 ? 's' : ''}</strong> depuis ta dernière visite ({totalText(totals(newSales))})
            <button type="button" onClick={markSeen} className="underline text-xs">Marquer comme vues</button>
          </p>
        ) : (
          <p className="text-xs text-zinc-500">
            {lastVisit ? `Aucune nouvelle vente depuis ta dernière visite (${dateTime(new Date(lastVisit).toISOString())}).` : (
              <button type="button" onClick={markSeen} className="underline">Retenir cette visite (badge des nouvelles ventes)</button>
            )}
          </p>
        )}
        <RefreshButton loading={loading} onClick={reload} />
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="Aujourd’hui" value={`${fmt(kpis.today.xof)} FCFA`} sub={`${fmt(kpis.today.count)} vente(s)${kpis.today.usd ? ` · + ${money(kpis.today.usd, 'USD')}` : ''}`} accent />
        <Kpi label="7 derniers jours" value={`${fmt(kpis.d7.xof)} FCFA`} sub={`${fmt(kpis.d7.count)} vente(s)${kpis.d7.usd ? ` · + ${money(kpis.d7.usd, 'USD')}` : ''}`} />
        <Kpi label="Ce mois-ci" value={`${fmt(kpis.month.xof)} FCFA`} sub={`${fmt(kpis.month.count)} vente(s)${kpis.month.usd ? ` · + ${money(kpis.month.usd, 'USD')}` : ''}`} />
        <Kpi
          label="Depuis le début"
          value={`${fmt(kpis.all.xof)} FCFA`}
          sub={`${fmt(kpis.all.count)} vente(s) · achat moyen ${fmt(kpis.all.count ? kpis.all.xof / kpis.all.count : 0)} FCFA`}
        />
      </div>

      {/* Liste des ventes */}
      <Card
        title="Toutes les ventes"
        hint="Clique sur un client pour ouvrir sa fiche. Les euros sont convertis en FCFA au taux fixe ; les dollars sont comptés à part."
        action={
          <button
            type="button"
            onClick={exportCsv}
            disabled={!filtered.length}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export tableur (CSV)
          </button>
        }
      >
        <div className="flex flex-wrap gap-2 mb-3">
          <Segmented label="Période" value={period} options={PERIODS} onChange={(v) => { setPeriod(v); setShown(50); }} />
          <Segmented
            label="Achat"
            value={what}
            options={[
              { id: 'all', label: 'Tout' },
              { id: 'solo', label: 'Solo' },
              { id: 'pro', label: 'Pro' },
              { id: 'agence', label: 'Agence' },
              { id: 'credits', label: 'Crédits' },
            ]}
            onChange={(v) => { setWhat(v); setShown(50); }}
          />
          <Segmented
            label="Moyen de paiement"
            value={provider}
            options={[
              { id: 'all', label: 'Tous moyens' },
              { id: 'saspay', label: 'Mobile Money' },
              { id: 'stripe', label: 'Carte' },
            ]}
            onChange={(v) => { setProvider(v); setShown(50); }}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 text-sm">
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3">
            <p className="text-[11px] text-zinc-400">Encaissé (sélection)</p>
            <p className="font-black text-lg">{totalText(ft)}</p>
            <p className="text-[11px] text-zinc-500">{fmt(ft.count)} vente(s)</p>
          </div>
          <div className="rounded-xl bg-zinc-950 border border-zinc-800 p-3">
            <label className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              Frais SasPay
              <input
                value={feePct}
                onChange={(e) => {
                  const v = e.target.value.replace(/[^\d.,]/g, '').slice(0, 5);
                  setFeePct(v);
                  writeLocal(FEE_KEY, v);
                }}
                inputMode="decimal"
                aria-label="Frais SasPay en pourcentage"
                className="w-12 px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-700 text-white text-xs"
              />
              %
            </label>
            <p className="font-black text-lg text-amber-200">− {fmt(feesXof)} FCFA</p>
            <p className="text-[11px] text-zinc-500">Estimation, à corriger avec ton relevé SasPay</p>
          </div>
          <div className="rounded-xl bg-zinc-950 border border-lime-300/30 p-3">
            <p className="text-[11px] text-zinc-400">Revenu net estimé</p>
            <p className="font-black text-lg text-lime-300">{fmt(ft.xof - feesXof)} FCFA</p>
            {ft.usd > 0 && <p className="text-[11px] text-zinc-500">+ {money(ft.usd, 'USD')} (carte, frais non déduits)</p>}
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-zinc-500">
            {sales.length ? 'Aucune vente pour ces filtres.' : 'Les ventes apparaîtront ici dès le premier paiement.'}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-zinc-800">
              {filtered.slice(0, shown).map((s) => (
                <li key={s.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <EmailButton email={s.email} userId={s.userId} onOpen={onOpenCustomer} />
                    <p className="text-[11px] text-zinc-400 flex flex-wrap gap-x-1.5">
                      <span>{dateTime(s.createdAt)}</span>
                      <span>· {itemLabel(s.kind, s.item, s.cycle)}</span>
                      <span>· {providerLabel(s.provider)}</span>
                      {lastVisit && new Date(s.createdAt).getTime() > lastVisit && <Pill tone="lime">nouveau</Pill>}
                    </p>
                  </div>
                  <span className="font-black text-lime-300 tabular-nums">{money(s.amount, s.currency)}</span>
                </li>
              ))}
            </ul>
            {filtered.length > shown && (
              <button type="button" onClick={() => setShown(shown + 100)} className="mt-3 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold">
                Afficher plus ({fmt(filtered.length - shown)} restantes)
              </button>
            )}
          </>
        )}
        {data.truncated && <p className="mt-2 text-[11px] text-amber-300">Seules les 5 000 dernières ventes sont chargées.</p>}
      </Card>

      <MoneyDetails sales={sales} />
    </div>
  );
}

/* ───────────── Détails sur l'argent (revenu par formule, par durée, courbes) ───────────── */
function MoneyDetails({ sales }: { sales: Sale[] }) {
  const [scale, setScale] = useState<'week' | 'month'>('week');

  const byItem = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of sales) {
      const v = toXof(s.amount, s.currency);
      if (v === null) continue;
      const k = s.kind === 'credits' ? 'Packs de crédits' : PLAN_LABEL[s.item || ''] || s.item || '?';
      m[k] = (m[k] || 0) + v;
    }
    return m;
  }, [sales]);

  const byCycle = useMemo(() => {
    const m: Record<string, number> = {};
    for (const s of sales) {
      if (s.kind !== 'plan') continue;
      const v = toXof(s.amount, s.currency);
      if (v === null) continue;
      const k = s.cycle ? `Formules ${CYCLE_LABEL[s.cycle]}` : s.provider === 'stripe' ? 'Abonnements carte' : 'Durée inconnue';
      m[k] = (m[k] || 0) + v;
    }
    return m;
  }, [sales]);

  // Revenu par semaine (12 dernières) ou par mois (12 derniers), en FCFA
  const series = useMemo(() => {
    const now = new Date();
    const points: { label: string; start: number; end: number; value: number }[] = [];
    if (scale === 'week') {
      const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
      for (let i = 11; i >= 0; i--) {
        const start = new Date(monday.getTime() - i * 7 * DAY);
        points.push({ label: `sem. du ${start.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}`, start: start.getTime(), end: start.getTime() + 7 * DAY, value: 0 });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        points.push({ label: start.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }), start: start.getTime(), end: end.getTime(), value: 0 });
      }
    }
    for (const s of sales) {
      const v = toXof(s.amount, s.currency);
      if (v === null) continue;
      const t = new Date(s.createdAt).getTime();
      const p = points.find((x) => t >= x.start && t < x.end);
      if (p) p.value += v;
    }
    return points;
  }, [sales, scale]);

  const BarsList = ({ data }: { data: Record<string, number> }) => {
    const rows = Object.entries(data).sort((a, b) => b[1] - a[1]);
    const max = Math.max(1, ...rows.map((r) => r[1]));
    if (!rows.length) return <p className="text-xs text-zinc-500">Pas encore de ventes.</p>;
    return (
      <ul className="space-y-2">
        {rows.map(([k, v]) => (
          <li key={k} className="grid grid-cols-[minmax(0,8rem)_1fr_auto] items-center gap-2 text-xs">
            <span className="text-zinc-300 truncate">{k}</span>
            <span className="h-2.5 rounded-full bg-zinc-800 overflow-hidden">
              <span className="block h-full rounded-full bg-lime-300" style={{ width: `${(v / max) * 100}%` }} />
            </span>
            <span className="text-zinc-200 font-semibold tabular-nums">{fmt(v)} FCFA</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card title="Revenu par formule" hint="Depuis le début, en FCFA.">
        <BarsList data={byItem} />
      </Card>
      <Card title="Revenu par durée" hint="Formules payées pour 1 mois ou pour 1 an.">
        <BarsList data={byCycle} />
      </Card>
      <Card
        title={scale === 'week' ? 'Revenu par semaine (12 semaines)' : 'Revenu par mois (12 mois)'}
        className="xl:col-span-2"
        action={
          <Segmented
            label="Échelle"
            value={scale}
            options={[
              { id: 'week', label: 'Semaines' },
              { id: 'month', label: 'Mois' },
            ]}
            onChange={setScale}
          />
        }
      >
        <p className="text-xs text-zinc-400 mb-2">
          Total sur la période : <span className="text-white font-bold">{fmt(series.reduce((a, p) => a + p.value, 0))} FCFA</span>
        </p>
        <ColumnChart points={series} color="#bef264" unit=" FCFA" />
      </Card>
    </div>
  );
}

/* ───────────── Onglet Clients payants ───────────── */
export function CustomersTab({ onOpenCustomer }: { onOpenCustomer: (id: string) => void }) {
  const { data, error, loading, reload } = useSalesData();
  const [view, setView] = useState<'active' | 'remind' | 'all'>('active');

  const rows = useMemo(() => {
    if (!data) return [];
    const paid = new Map<string, { xof: number; usd: number; last: string | null; count: number }>();
    for (const s of data.payments) {
      if (!s.userId) continue;
      const m = paid.get(s.userId) || { xof: 0, usd: 0, last: null, count: 0 };
      const v = toXof(s.amount, s.currency);
      if (v === null) m.usd += s.amount;
      else m.xof += v;
      m.count += 1;
      if (!m.last || s.createdAt > m.last) m.last = s.createdAt;
      paid.set(s.userId, m);
    }
    const now = Date.now();
    return data.customers
      .map((c) => {
        const exp = c.planExpiresAt ? new Date(c.planExpiresAt).getTime() : null;
        const hasPlan = c.plan !== 'free';
        const active = hasPlan && (exp === null || exp > now);
        const daysLeft = active && exp ? Math.ceil((exp - now) / DAY) : null;
        const expired = hasPlan && exp !== null && exp <= now;
        const p = paid.get(c.id) || { xof: 0, usd: 0, last: null, count: 0 };
        return { ...c, active, daysLeft, expired, paid: p };
      })
      .sort((a, b) => (b.paid.last || b.createdAt).localeCompare(a.paid.last || a.createdAt));
  }, [data]);

  const active = rows.filter((r) => r.active);
  const expiringSoon = active.filter((r) => r.daysLeft !== null && r.daysLeft <= 7);
  const expiredRecent = rows.filter((r) => r.expired && r.planExpiresAt && Date.now() - new Date(r.planExpiresAt).getTime() < 90 * DAY);
  const remind = [...expiringSoon, ...expiredRecent];
  const list = view === 'active' ? active : view === 'remind' ? remind : rows;

  // Renouvellements des 30 prochains jours, au prix de la dernière durée achetée
  const upcoming = useMemo(() => {
    if (!data) return { xof: 0, count: 0 };
    let xof = 0;
    let count = 0;
    for (const r of active) {
      if (r.daysLeft === null || r.daysLeft > 30 || r.stripeSubscription) continue;
      const price = data.prices[r.plan];
      if (!price) continue;
      xof += r.cycle === 'annual' ? price.annual : price.monthly;
      count += 1;
    }
    return { xof, count };
  }, [active, data]);

  if (!data) return <Loading error={error} onRetry={reload} />;

  const reminderMail = (r: (typeof rows)[number]) =>
    mailto(
      r.email || '',
      r.expired ? 'Votre formule PitchMySite est terminée' : 'Votre formule PitchMySite se termine bientôt',
      r.expired
        ? `Bonjour,\n\nVotre formule ${PLAN_LABEL[r.plan] || r.plan} PitchMySite est terminée depuis le ${date(r.planExpiresAt as string)}. Vos projets vous attendent : vous pouvez la renouveler en quelques secondes par Mobile Money sur https://omni-mockup.vercel.app/pricing\n\nUne question ? Répondez simplement à ce message.\n\nDodo, PitchMySite`
        : `Bonjour,\n\nVotre formule ${PLAN_LABEL[r.plan] || r.plan} PitchMySite se termine le ${date(r.planExpiresAt as string)}. Pour continuer sans interruption, vous pouvez la renouveler par Mobile Money sur https://omni-mockup.vercel.app/pricing\n\nUne question ? Répondez simplement à ce message.\n\nDodo, PitchMySite`
    );

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <RefreshButton loading={loading} onClick={reload} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <Kpi label="Clients avec une formule active" value={fmt(active.length)} sub={`${fmt(active.filter((r) => r.paid.count === 0).length)} offerte(s) par toi`} />
        <Kpi label="Expirent dans 7 jours" value={fmt(expiringSoon.length)} sub="À relancer" />
        <Kpi label="Expirées, pas renouvelées (90 j)" value={fmt(expiredRecent.length)} sub="À relancer" />
        <Kpi label="Renouvellements attendus (30 j)" value={`${fmt(upcoming.xof)} FCFA`} sub={`Si les ${fmt(upcoming.count)} client(s) concerné(s) renouvellent`} accent />
      </div>

      <Card title="Clients" hint="Clique sur un client pour ouvrir sa fiche. Le bouton « Écrire » ouvre ta messagerie avec un message de relance prêt.">
        <div className="mb-3">
          <Segmented
            label="Vue"
            value={view}
            options={[
              { id: 'active', label: `Actifs (${active.length})` },
              { id: 'remind', label: `À relancer (${remind.length})` },
              { id: 'all', label: `Tous (${rows.length})` },
            ]}
            onChange={setView}
          />
        </div>
        {list.length === 0 ? (
          <p className="text-xs text-zinc-500">{view === 'remind' ? 'Personne à relancer pour le moment.' : 'Aucun client pour le moment.'}</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {list.map((r) => (
              <li key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                <div className="min-w-0 space-y-1">
                  <EmailButton email={r.email} userId={r.id} onOpen={onOpenCustomer} />
                  <div className="flex flex-wrap gap-1.5">
                    <Pill tone="violet">{PLAN_LABEL[r.plan] || r.plan}{r.cycle ? ` · ${CYCLE_LABEL[r.cycle]}` : ''}</Pill>
                    {r.active && r.daysLeft !== null && (
                      <Pill tone={r.daysLeft <= 7 ? 'amber' : 'zinc'}>
                        {r.daysLeft} jour{r.daysLeft > 1 ? 's' : ''} restant{r.daysLeft > 1 ? 's' : ''} · fin le {date(r.planExpiresAt as string)}
                      </Pill>
                    )}
                    {r.active && r.daysLeft === null && <Pill tone="sky">{r.stripeSubscription ? 'Abonnement carte' : 'Sans date de fin'}</Pill>}
                    {r.expired && <Pill tone="rose">Expirée le {date(r.planExpiresAt as string)}</Pill>}
                    {r.paid.count === 0 && r.plan !== 'free' && <Pill>Offerte</Pill>}
                    <Pill tone="lime">
                      Total payé : {fmt(r.paid.xof)} FCFA{r.paid.usd ? ` + ${money(r.paid.usd, 'USD')}` : ''}
                    </Pill>
                  </div>
                </div>
                {r.email && (r.expired || (r.daysLeft !== null && r.daysLeft <= 7)) && <MailButton href={reminderMail(r)} label="Relancer" />}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

/* ───────────── Onglet Tentatives de paiement ───────────── */
type AttemptState = 'paid' | 'failed' | 'abandoned' | 'running';
const STATE_LABEL: Record<AttemptState, string> = { paid: 'Payée', failed: 'Refusée ou annulée', abandoned: 'Abandonnée', running: 'En cours' };
const STATE_TONE: Record<AttemptState, 'lime' | 'rose' | 'amber' | 'sky'> = { paid: 'lime', failed: 'rose', abandoned: 'amber', running: 'sky' };
const attemptState = (c: Checkout): AttemptState =>
  c.status === 'applied' ? 'paid' : c.status === 'failed' ? 'failed' : Date.now() - new Date(c.createdAt).getTime() > 3600 * 1000 ? 'abandoned' : 'running';

export function AttemptsTab({ onOpenCustomer }: { onOpenCustomer: (id: string) => void }) {
  const { data, error, loading, reload } = useSalesData();
  const [period, setPeriod] = useState<Period>('30d');
  const [state, setState] = useState<'all' | AttemptState>('all');
  const [shown, setShown] = useState(50);

  const inPeriod = useMemo(
    () => (data?.checkouts || []).filter((c) => new Date(c.createdAt).getTime() >= periodStart(period)),
    [data, period]
  );
  const counts = useMemo(() => {
    const m: Record<AttemptState, number> = { paid: 0, failed: 0, abandoned: 0, running: 0 };
    for (const c of inPeriod) m[attemptState(c)] += 1;
    return m;
  }, [inPeriod]);
  const finished = counts.paid + counts.failed + counts.abandoned;
  const rate = finished ? Math.round((counts.paid / finished) * 100) : null;

  // Paniers abandonnés : une ligne par client qui n'a pas payé ensuite
  const carts = useMemo(() => {
    const all = data?.checkouts || [];
    const paidAfter = (c: Checkout) => all.some((x) => x.userId === c.userId && x.status === 'applied' && x.createdAt >= c.createdAt);
    const seen = new Set<string>();
    return inPeriod
      .filter((c) => ['abandoned', 'failed'].includes(attemptState(c)) && !paidAfter(c))
      .filter((c) => (seen.has(c.userId) ? false : (seen.add(c.userId), true)));
  }, [data, inPeriod]);

  const list = state === 'all' ? inPeriod : inPeriod.filter((c) => attemptState(c) === state);

  if (!data) return <Loading error={error} onRetry={reload} />;

  const cartMail = (c: Checkout) =>
    mailto(
      c.email || '',
      'Votre paiement PitchMySite n’est pas allé au bout',
      `Bonjour,\n\nVous avez commencé à prendre ${itemLabel(c.kind, c.item, c.cycle)} sur PitchMySite le ${date(c.createdAt)}, mais le paiement n’est pas allé au bout. Avez-vous rencontré un souci avec le Mobile Money ?\n\nVous pouvez réessayer ici : https://omni-mockup.vercel.app/pricing\nEt si besoin, répondez simplement à ce message, je vous aide.\n\nDodo, PitchMySite`
    );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented label="Période" value={period} options={PERIODS} onChange={(v) => { setPeriod(v); setShown(50); }} />
        <RefreshButton loading={loading} onClick={reload} />
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 sm:gap-4">
        <Kpi label="Taux de réussite" value={rate === null ? '—' : `${rate} %`} sub={`${fmt(counts.paid)} payée(s) sur ${fmt(finished)} terminée(s)`} accent />
        <Kpi label="Payées" value={fmt(counts.paid)} />
        <Kpi label="Abandonnées" value={fmt(counts.abandoned)} sub="Pas de retour après 1 h" />
        <Kpi label="Refusées ou annulées" value={fmt(counts.failed)} />
        <Kpi label="En cours" value={fmt(counts.running)} sub="Commencées il y a moins d’1 h" />
      </div>

      <Card
        title={`Paniers abandonnés à relancer (${carts.length})`}
        hint="Personnes qui ont commencé à payer sans aller au bout, et qui n’ont pas payé depuis. Une ligne par personne. Si l’une d’elles dit avoir payé, vérifie dans ton espace SasPay avant de l’activer depuis sa fiche."
      >
        {carts.length === 0 ? (
          <p className="text-xs text-lime-300">Personne à relancer sur cette période.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {carts.map((c) => (
              <li key={c.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <EmailButton email={c.email} userId={c.userId} onOpen={onOpenCustomer} />
                  <p className="text-[11px] text-zinc-400">
                    {dateTime(c.createdAt)} · {itemLabel(c.kind, c.item, c.cycle)} · {fmt(c.amount)} FCFA · {STATE_LABEL[attemptState(c)]}
                  </p>
                </div>
                {c.email && <MailButton href={cartMail(c)} label="Relancer" />}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Toutes les tentatives" hint="Chaque clic sur « Payer » crée une tentative, payée ou non.">
        <div className="mb-3">
          <Segmented
            label="État"
            value={state}
            options={[
              { id: 'all', label: 'Toutes' },
              { id: 'paid', label: 'Payées' },
              { id: 'abandoned', label: 'Abandonnées' },
              { id: 'failed', label: 'Refusées' },
              { id: 'running', label: 'En cours' },
            ]}
            onChange={(v) => { setState(v); setShown(50); }}
          />
        </div>
        {list.length === 0 ? (
          <p className="text-xs text-zinc-500">Aucune tentative sur cette période.</p>
        ) : (
          <>
            <ul className="divide-y divide-zinc-800">
              {list.slice(0, shown).map((c) => {
                const st = attemptState(c);
                return (
                  <li key={c.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <div className="min-w-0">
                      <EmailButton email={c.email} userId={c.userId} onOpen={onOpenCustomer} />
                      <p className="text-[11px] text-zinc-400">{dateTime(c.createdAt)} · {itemLabel(c.kind, c.item, c.cycle)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={STATE_TONE[st]}>{STATE_LABEL[st]}</Pill>
                      <span className="font-bold tabular-nums">{fmt(c.amount)} FCFA</span>
                    </div>
                  </li>
                );
              })}
            </ul>
            {list.length > shown && (
              <button type="button" onClick={() => setShown(shown + 100)} className="mt-3 px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold">
                Afficher plus ({fmt(list.length - shown)} restantes)
              </button>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

/* ───────────── Test de l'accroche de l'accueil ───────────── */
const HERO_TEXT: Record<'court' | 'long', string> = {
  court: '« Votre site. Prêt à signer. »',
  long: '« Collez le lien de votre site. Recevez des visuels qui donnent envie de signer. »',
};

export function HeroTestCard() {
  const [data, setData] = useState<{ since: string | null; counts: Record<'court' | 'long', Record<string, number>> } | null>(null);
  useEffect(() => {
    fetch('/api/admin/hero-test', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => null);
  }, []);
  if (!data) return null;

  const rows = (['court', 'long'] as const).map((v) => {
    const c = data.counts[v] || {};
    const views = c.home_view || 0;
    const captures = c.hero_capture || 0;
    const signups = c.signup_done || 0;
    const rate = (n: number) => (views ? `${Math.round((n / views) * 1000) / 10} %` : '—');
    return { v, views, captures, signups, captureRate: rate(captures), signupRate: rate(signups) };
  });
  const enough = rows.every((r) => r.views >= 100);
  const best = enough ? [...rows].sort((a, b) => b.signups / b.views - a.signups / a.views)[0] : null;

  return (
    <Card
      title="Test de l'accroche de l'accueil"
      hint={`Chaque visiteur voit une des deux phrases au hasard${data.since ? `, depuis le ${date(data.since)}` : ''}. On compare la part des visiteurs qui lancent une capture et qui s'inscrivent.`}
    >
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-xs sm:text-sm min-w-[30rem]">
          <thead>
            <tr className="text-left text-zinc-400">
              <th className="py-1.5 px-1 font-semibold">Accroche</th>
              <th className="py-1.5 px-1 font-semibold text-right">Visites</th>
              <th className="py-1.5 px-1 font-semibold text-right">Captures lancées</th>
              <th className="py-1.5 px-1 font-semibold text-right">Inscriptions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {rows.map((r) => (
              <tr key={r.v} className={best?.v === r.v ? 'text-lime-200' : ''}>
                <td className="py-2 px-1">{HERO_TEXT[r.v]}</td>
                <td className="py-2 px-1 text-right tabular-nums">{fmt(r.views)}</td>
                <td className="py-2 px-1 text-right tabular-nums">{fmt(r.captures)} <span className="text-zinc-500">({r.captureRate})</span></td>
                <td className="py-2 px-1 text-right tabular-nums">{fmt(r.signups)} <span className="text-zinc-500">({r.signupRate})</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-zinc-400">
        {enough
          ? `Pour l'instant, la meilleure est ${HERO_TEXT[best!.v]}. Garde-la quand l'écart reste net plusieurs semaines.`
          : 'Pas encore assez de visites pour conclure : attends au moins 100 visites par accroche.'}{' '}
        Les inscriptions par Google sont comptées au clic sur le bouton.
      </p>
    </Card>
  );
}

/* ───────────── Fiche client ───────────── */
type Sheet = {
  id: string;
  email: string | null;
  plan: string;
  rawPlan: string;
  planExpiresAt: string | null;
  cycle: string | null;
  credits: number;
  stripeSubscription: boolean;
  createdAt: string;
  lastSignIn: string | null;
  lastActivity: string | null;
  signInProvider: string | null;
  exportsTotal: number;
  exports30dByKind: Record<string, number>;
  pitchTotal: number;
  activeShares: number;
  payments: { id: string; provider: string; kind: string; item: string | null; amount: number; currency: string; created_at: string }[];
  checkouts: { id: string; item_id: string; billing_cycle: string | null; amount_xof: number; status: string; created_at: string }[];
  creditHistory: { id: string; delta: number; reason: string; created_at: string }[];
  actions: { id: number; action: string; details: Record<string, unknown>; created_at: string }[];
};

const CREDIT_REASON: Record<string, string> = {
  admin_ajout: 'Ajout par toi',
  pitch_ia: 'Pitch IA',
  remboursement_pitch_ia: 'Pitch IA remboursée (échec)',
};
const EXPORT_KIND: Record<string, string> = { image: 'image', pack: 'pack de formats', video: 'vidéo' };
function creditReason(r: string) {
  if (CREDIT_REASON[r]) return CREDIT_REASON[r];
  const exp = /^export_([a-z]+)_([a-z0-9]+)$/.exec(r);
  if (exp) return `Export ${EXPORT_KIND[exp[1]] || exp[1]} ${exp[2] === '4k' ? '4K' : exp[2].toUpperCase() === 'HD' ? 'HD' : exp[2]}`;
  const plan = /^(saspay|fedapay)_plan_([a-z]+)_([a-z]+)$/.exec(r);
  if (plan) return `Formule ${PLAN_LABEL[plan[2]] || plan[2]} · ${CYCLE_LABEL[plan[3]] || plan[3]}`;
  if (r.startsWith('saspay_')) return `Achat ${PACK_LABEL[r.slice(7)] || r.slice(7)}`;
  if (r.startsWith('stripe')) return 'Achat par carte';
  if (r.startsWith('ad_') || r.includes('reward')) return 'Pub récompensée';
  return r;
}

export function CustomerSheet({ userId, onClose }: { userId: string; onClose: () => void }) {
  const [s, setS] = useState<Sheet | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    setS(null);
    setError(false);
    fetch(`/api/admin/users/${userId}`, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setS)
      .catch(() => setError(true));
  }, [userId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const paid = s ? totals(s.payments.map((p) => ({ ...p, amount: Number(p.amount) }) as unknown as Sale)) : null;
  const exports30 = s ? Object.values(s.exports30dByKind).reduce((a, b) => a + b, 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60" onClick={onClose} role="dialog" aria-modal="true" aria-label="Fiche client">
      <div className="h-full w-full max-w-xl bg-zinc-950 border-l border-zinc-800 overflow-y-auto p-4 sm:p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold">Fiche client</p>
            <h2 className="text-lg font-black break-all">{s?.email || (error ? 'Fiche indisponible' : 'Chargement…')}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer la fiche" className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && <p className="text-sm text-rose-300">La fiche n’a pas pu être chargée.</p>}
        {!s && !error && (
          <p className="text-sm text-zinc-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</p>
        )}

        {s && paid && (
          <>
            <div className="flex flex-wrap gap-1.5">
              <Pill tone="violet">{PLAN_LABEL[s.plan] || s.plan}{s.cycle && s.plan !== 'free' ? ` · ${CYCLE_LABEL[s.cycle] || s.cycle}` : ''}</Pill>
              {s.planExpiresAt && (
                <Pill tone={new Date(s.planExpiresAt).getTime() > Date.now() ? 'zinc' : 'rose'}>
                  {new Date(s.planExpiresAt).getTime() > Date.now() ? 'fin le' : 'expirée le'} {date(s.planExpiresAt)}
                </Pill>
              )}
              {s.rawPlan !== 'free' && s.plan === 'free' && <Pill tone="rose">Ancienne formule : {PLAN_LABEL[s.rawPlan] || s.rawPlan}</Pill>}
              {s.stripeSubscription && <Pill tone="sky">Abonnement carte actif</Pill>}
              <Pill>{fmt(s.credits)} crédits</Pill>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Kpi label="Total payé" value={`${fmt(paid.xof)} FCFA`} sub={`${fmt(paid.count)} paiement(s)${paid.usd ? ` · + ${money(paid.usd, 'USD')}` : ''}`} accent />
              <Kpi label="Exports" value={fmt(s.exportsTotal)} sub={`${fmt(exports30)} sur 30 jours`} />
            </div>

            <Card title="Activité">
              <ul className="space-y-1.5 text-sm">
                <li className="flex justify-between gap-3"><span className="text-zinc-400">Inscrit le</span><span>{dateTime(s.createdAt)}</span></li>
                <li className="flex justify-between gap-3"><span className="text-zinc-400">Dernière connexion</span><span>{s.lastSignIn ? dateTime(s.lastSignIn) : '—'}</span></li>
                <li className="flex justify-between gap-3"><span className="text-zinc-400">Dernière activité</span><span>{s.lastActivity ? dateTime(s.lastActivity) : '—'}</span></li>
                <li className="flex justify-between gap-3"><span className="text-zinc-400">Connexion par</span><span>{s.signInProvider === 'google' ? 'Google' : s.signInProvider === 'email' ? 'E-mail' : s.signInProvider || '—'}</span></li>
                <li className="flex justify-between gap-3"><span className="text-zinc-400">Pitch IA lancées (avec crédits)</span><span>{fmt(s.pitchTotal)}</span></li>
                <li className="flex justify-between gap-3"><span className="text-zinc-400">Liens de partage actifs</span><span>{fmt(s.activeShares)}</span></li>
                {Object.keys(s.exports30dByKind).length > 0 && (
                  <li className="flex justify-between gap-3">
                    <span className="text-zinc-400">Exports sur 30 jours</span>
                    <span className="text-right">
                      {Object.entries(s.exports30dByKind).map(([k, v]) => `${v} ${k === 'video' ? 'vidéo(s)' : k === 'pack' ? 'pack(s)' : 'image(s)'}`).join(', ')}
                    </span>
                  </li>
                )}
              </ul>
            </Card>

            <Card title={`Paiements (${s.payments.length})`}>
              {s.payments.length === 0 ? (
                <p className="text-xs text-zinc-500">Aucun paiement.</p>
              ) : (
                <ul className="divide-y divide-zinc-800">
                  {s.payments.map((p) => (
                    <li key={p.id} className="py-2 flex flex-wrap justify-between gap-2 text-sm">
                      <span>{dateTime(p.created_at)} · {itemLabel(p.kind, p.item)} · {providerLabel(p.provider)}</span>
                      <span className="font-bold text-lime-300">{money(Number(p.amount), p.currency)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title={`Tentatives de paiement (${s.checkouts.length})`}>
              {s.checkouts.length === 0 ? (
                <p className="text-xs text-zinc-500">Aucune tentative.</p>
              ) : (
                <ul className="divide-y divide-zinc-800">
                  {s.checkouts.map((c) => {
                    const st = attemptState({ status: c.status, createdAt: c.created_at } as Checkout);
                    return (
                      <li key={c.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                        <span>{dateTime(c.created_at)} · {itemLabel(c.item_id.startsWith('credit') ? 'credits' : 'plan', c.item_id, c.billing_cycle)}</span>
                        <span className="flex items-center gap-2"><Pill tone={STATE_TONE[st]}>{STATE_LABEL[st]}</Pill><span className="font-semibold">{fmt(c.amount_xof)} FCFA</span></span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>

            <Card title="Historique des crédits" hint="Les 50 derniers mouvements.">
              {s.creditHistory.length === 0 ? (
                <p className="text-xs text-zinc-500">Aucun mouvement.</p>
              ) : (
                <ul className="divide-y divide-zinc-800">
                  {s.creditHistory.map((c) => (
                    <li key={c.id} className="py-2 flex justify-between gap-2 text-sm">
                      <span>{dateTime(c.created_at)} · {creditReason(c.reason)}</span>
                      <span className={`font-bold tabular-nums ${c.delta >= 0 ? 'text-lime-300' : 'text-zinc-300'}`}>{c.delta > 0 ? '+' : ''}{c.delta}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Tes actions sur ce compte">
              {s.actions.length === 0 ? (
                <p className="text-xs text-zinc-500">Aucune action.</p>
              ) : (
                <ul className="divide-y divide-zinc-800">
                  {s.actions.map((a) => (
                    <li key={a.id} className="py-2 text-sm">
                      <p className="font-semibold">
                        {a.action === 'set_plan'
                          ? `Formule changée en ${PLAN_LABEL[String(a.details?.to)] || a.details?.to}${a.details?.days ? ` pour ${a.details.days} jours` : ''}`
                          : a.action === 'add_credits'
                            ? `${a.details?.amount} crédits ajoutés`
                            : a.action}
                      </p>
                      <p className="text-[11px] text-zinc-400">{dateTime(a.created_at)}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            {s.email && (
              <MailButton href={mailto(s.email, 'PitchMySite', 'Bonjour,\n\n\n\nDodo, PitchMySite')} label="Écrire à ce client" />
            )}
            <p className="text-[11px] text-zinc-500">Pour offrir une formule ou ajouter des crédits : onglet « Utilisateurs ».</p>
          </>
        )}
      </div>
    </div>
  );
}
