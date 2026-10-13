'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LineChart,
  RefreshCw,
  Search,
  ShieldAlert,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { TEMPLATES_CATALOG } from '@/lib/shotsPresets';

/* ───────────── Types des réponses ───────────── */
type Stats = {
  generated_at: string;
  overview: {
    users_total: number;
    users_new_7d: number;
    anon_exporters_7d: number;
    captures_7d: number;
    captures_ok_7d: number;
    exports_7d: number;
    exports_total: number;
    revenue_xof: number;
    revenue_usd: number;
    revenue_30d_xof: number;
    revenue_by_provider: Record<string, number>;
  };
  customers: {
    never_paid: number;
    paid_once: number;
    plans: Record<'free' | 'solo' | 'pro' | 'agence', number>;
    expiring_7d: number;
    credit_purchases: number;
    credit_revenue_xof: number;
    credit_revenue_usd: number;
  };
  features: {
    exports_by_kind: Record<string, number>;
    exports_by_quality: Record<string, number>;
    pitch_30d: number;
    pitch_failed_30d: number;
    shares_30d: number;
    ads_started_30d: number;
    ads_granted_30d: number;
    templates: Record<string, number>;
    layouts: Record<string, number>;
    usage: Record<string, number>;
  };
  funnel: Record<string, number>;
  health: {
    captures_30d: number;
    captures_failed_30d: number;
    capture_fail_reasons: Record<string, number>;
    capture_engines: Record<string, number>;
    capture_avg_ms: number | null;
    ai_failures_30d: number;
    saspay_pending: number;
  };
  series: { day: string; signups: number; exports: number; revenue_xof: number }[];
};

type AdminUser = {
  id: string;
  email: string | null;
  plan: string;
  planExpiresAt: string | null;
  credits: number;
  stripeSubscription: boolean;
  createdAt: string;
  exports30d: number;
  paid: Record<string, number>;
};

type PaymentsData = {
  payments: { id: string; provider: string; kind: string; item: string | null; amount: number; currency: string; created_at: string; email: string | null }[];
  saspayPending: { id: string; item_id: string; amount_xof: number; created_at: string; email: string | null }[];
  actions: { id: number; action: string; details: Record<string, unknown>; created_at: string; email: string | null }[];
};

/* ───────────── Libellés en français ───────────── */
const fmt = (n: number | null | undefined) => new Intl.NumberFormat('fr-FR').format(Math.round(Number(n) || 0));
const money = (n: number, cur: string) =>
  cur === 'XOF' ? `${fmt(n)} FCFA` : new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(Number(n) || 0);
const date = (s: string) => new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

const PLAN_LABEL: Record<string, string> = { free: 'Gratuit', solo: 'Solo', pro: 'Pro', agence: 'Agence' };
const LAYOUT_LABEL: Record<string, string> = { single: 'Solo (1 appareil)', 'dual-stacked': 'Duo', 'trio-ecosystem': 'Trio', 'before-after': 'Avant / Après' };
const KIND_LABEL: Record<string, string> = { image: 'Images', pack: 'Packs', video: 'Vidéos et GIF' };
const QUALITY_LABEL: Record<string, string> = { standard: 'Standard', hd: 'HD', '4k': '4K' };
const USAGE_LABEL: Record<string, string> = {
  whatsapp_status: 'Statuts WhatsApp',
  pdf_generated: 'PDF de proposition',
  carousel_generated: 'Carrousels',
  photo_scene_used: 'Scènes photo',
  art_director_run: 'Directeur artistique IA',
  video_exported: 'Vidéos et GIF lancés',
};
const REASON_LABEL: Record<string, string> = {
  introuvable: 'Adresse introuvable',
  adresse_bloquee: 'Adresse refusée (interne ou interdite)',
  trop_lent: 'Site trop lent',
  site_inaccessible: 'Site inaccessible',
  autre: 'Autre',
};
const ENGINE_LABEL: Record<string, string> = { playwright: 'Notre moteur (local)', puppeteer: 'Notre moteur', 'cloud-fallback': 'Service externe (Microlink)' };
const TEMPLATE_LABEL = Object.fromEntries(TEMPLATES_CATALOG.map((t) => [t.id, t.title]));

/* ───────────── Petits composants ───────────── */
const Card: React.FC<{ title: string; children: React.ReactNode; hint?: string; className?: string }> = ({ title, hint, children, className = '' }) => (
  <section className={`rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 ${className}`}>
    <h2 className="text-sm font-bold text-zinc-100">{title}</h2>
    {hint && <p className="text-[11px] text-zinc-400 mt-0.5">{hint}</p>}
    <div className="mt-3">{children}</div>
  </section>
);

const Kpi: React.FC<{ label: string; value: string; sub?: string; accent?: boolean }> = ({ label, value, sub, accent }) => (
  <div className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 sm:p-5 min-w-0">
    <p className="text-xs text-zinc-400">{label}</p>
    <p className={`mt-1 text-2xl sm:text-3xl font-black tracking-tight break-words ${accent ? 'text-lime-300' : 'text-white'}`}>{value}</p>
    {sub && <p className="text-[11px] text-lime-300/90 mt-1">{sub}</p>}
  </div>
);

const Bars: React.FC<{ data: Record<string, number>; labels?: Record<string, string>; color?: string; empty?: string }> = ({
  data,
  labels = {},
  color = 'bg-violet-500',
  empty = 'Pas encore de données.',
}) => {
  const rows = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  if (!rows.length) return <p className="text-xs text-zinc-500">{empty}</p>;
  return (
    <ul className="space-y-2">
      {rows.map(([k, v]) => (
        <li key={k} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] sm:grid-cols-[minmax(0,12rem)_1fr_auto] items-center gap-2 text-xs">
          <span className="text-zinc-300 truncate" title={labels[k] || k}>{labels[k] || k}</span>
          <span className="h-2.5 rounded-full bg-zinc-800 overflow-hidden">
            <span className={`block h-full rounded-full ${color}`} style={{ width: `${(v / max) * 100}%` }} />
          </span>
          <span className="text-zinc-200 font-semibold tabular-nums">{fmt(v)}</span>
        </li>
      ))}
    </ul>
  );
};

/** Courbe en colonnes sur 30 jours (SVG simple, sans bibliothèque) */
const DayChart: React.FC<{ series: Stats['series']; field: 'signups' | 'exports' | 'revenue_xof'; color: string; unit?: string }> = ({ series, field, color, unit = '' }) => {
  const max = Math.max(1, ...series.map((d) => Number(d[field]) || 0));
  const total = series.reduce((s, d) => s + (Number(d[field]) || 0), 0);
  return (
    <div>
      <p className="text-xs text-zinc-400 mb-2">Total sur 30 jours : <span className="text-white font-bold">{fmt(total)}{unit}</span></p>
      <svg viewBox={`0 0 ${series.length * 10} 60`} className="w-full h-28" preserveAspectRatio="none" role="img" aria-label="Évolution sur 30 jours">
        {series.map((d, i) => {
          const h = ((Number(d[field]) || 0) / max) * 56;
          return (
            <rect key={d.day} x={i * 10 + 1} y={60 - h} width={8} height={Math.max(h, 0.5)} rx={1.5} fill={color}>
              <title>{`${date(d.day)} : ${fmt(Number(d[field]))}${unit}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
        <span>{series[0] && date(series[0].day)}</span>
        <span>{series[series.length - 1] && date(series[series.length - 1].day)}</span>
      </div>
    </div>
  );
};

/* ───────────── Page ───────────── */
type Tab = 'dashboard' | 'users' | 'payments' | 'analytics';
const TABS: { id: Tab; label: string; short: string; Icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Tableau de bord', short: 'Résumé', Icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs', short: 'Comptes', Icon: Users },
  { id: 'payments', label: 'Paiements', short: 'Paiements', Icon: CreditCard },
  { id: 'analytics', label: 'Analytique', short: 'Courbes', Icon: LineChart },
];

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [status, setStatus] = useState<'loading' | 'ok' | 'login' | 'forbidden' | 'error'>('loading');

  const loadStats = useCallback(async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/admin/stats', { cache: 'no-store' });
      if (res.status === 401) return setStatus('login');
      if (res.status === 403) return setStatus('forbidden');
      if (!res.ok) return setStatus('error');
      setStats(await res.json());
      setStatus('ok');
    } catch {
      setStatus('error');
    }
  }, []);
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (status === 'login' || status === 'forbidden') {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-4">
        <div className="max-w-sm w-full rounded-2xl bg-zinc-900 border border-zinc-800 p-6 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
          <h1 className="text-lg font-bold">{status === 'login' ? 'Connexion requise' : 'Accès réservé'}</h1>
          <p className="text-sm text-zinc-400">
            {status === 'login' ? 'Connectez-vous avec le compte administrateur.' : 'Cette page est réservée à l’administrateur de PitchMySite.'}
          </p>
          {status === 'login' ? (
            <Link href="/login?redirect=/admin" className="inline-flex px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 font-bold text-sm">Se connecter</Link>
          ) : (
            <Link href="/" className="inline-flex px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-sm">Retour au site</Link>
          )}
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white lg:flex">
      {/* Menu : colonne à gauche sur ordinateur, onglets en haut sur téléphone */}
      <aside className="lg:w-60 lg:min-h-screen border-b lg:border-b-0 lg:border-r border-zinc-800 bg-zinc-950 lg:sticky lg:top-0 shrink-0">
        <div className="px-4 pt-4 pb-3 lg:p-5 flex items-center justify-between lg:block">
          <div>
            <p className="text-lg font-black">Pitch<span className="text-violet-400">MySite</span></p>
            <p className="text-[10px] tracking-[0.2em] text-zinc-500 font-bold uppercase">Administration</p>
          </div>
          <Link href="/" className="lg:mt-4 inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" /> Site
          </Link>
        </div>
        <nav className="grid grid-cols-4 lg:flex lg:flex-col gap-1 px-2 pb-2 lg:px-3" aria-label="Sections">
          {TABS.map(({ id, label, short, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-current={tab === id ? 'page' : undefined}
              className={`flex flex-col lg:flex-row items-center gap-1 lg:gap-2 px-1 lg:px-3 py-2 lg:py-2.5 rounded-xl text-[11px] lg:text-sm font-semibold transition-colors ${
                tab === id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="lg:hidden">{short}</span>
              <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-5">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl font-black">{TABS.find((t) => t.id === tab)?.label}</h1>
          {(tab === 'dashboard' || tab === 'analytics') && (
            <button type="button" onClick={loadStats} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white">
              <RefreshCw className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} /> Actualiser
            </button>
          )}
        </header>

        {status === 'error' && <p className="text-sm text-rose-300">Les statistiques n’ont pas pu être chargées. Réessayez avec « Actualiser ».</p>}
        {status === 'loading' && !stats && (
          <p className="text-sm text-zinc-400 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Chargement…</p>
        )}

        {tab === 'dashboard' && stats && <Dashboard s={stats} />}
        {tab === 'analytics' && stats && <Analytics s={stats} />}
        {tab === 'users' && <UsersTab />}
        {tab === 'payments' && <PaymentsTab />}
      </main>
    </div>
  );
}

/* ───────────── Tableau de bord ───────────── */
function Dashboard({ s }: { s: Stats }) {
  const o = s.overview;
  const c = s.customers;
  const f = s.features;
  const h = s.health;
  const failRate = h.captures_30d ? Math.round((h.captures_failed_30d / h.captures_30d) * 100) : 0;
  const totalPlans = Object.values(c.plans).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-5">
      {/* A. Vue d'ensemble */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        <Kpi label="Utilisateurs inscrits" value={fmt(o.users_total)} sub={`+${fmt(o.users_new_7d)} sur 7 jours`} />
        <Kpi label="Exports réalisés" value={fmt(o.exports_total)} sub={`+${fmt(o.exports_7d)} sur 7 jours`} />
        <Kpi
          label="Chiffre d’affaires total"
          value={`${fmt(o.revenue_xof)} FCFA`}
          sub={`${o.revenue_usd ? `+ ${money(o.revenue_usd, 'USD')} · ` : ''}${fmt(o.revenue_30d_xof)} FCFA sur 30 jours`}
          accent
        />
        <Kpi label="Captures de sites (7 jours)" value={fmt(o.captures_7d)} sub={`${fmt(o.captures_ok_7d)} réussies`} />
        <Kpi label="Visiteurs sans compte ayant exporté (7 jours)" value={fmt(o.anon_exporters_7d)} />
        <Kpi label="Formules qui expirent dans 7 jours" value={fmt(c.expiring_7d)} sub="À relancer (paiements SasPay)" />
      </div>

      {/* B. Utilisateurs et payants */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Utilisateurs et clients" hint="« Clients » = ont payé au moins une fois (formule ou pack de crédits). « Utilisateurs » = inscrits qui n’ont jamais payé.">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-zinc-400">Utilisateurs</p><p className="text-2xl font-black">{fmt(c.never_paid)}</p></div>
            <div><p className="text-xs text-zinc-400">Clients</p><p className="text-2xl font-black text-lime-300">{fmt(c.paid_once)}</p></div>
          </div>
        </Card>
        <Card title="Achats de crédits" hint="Packs achetés en plus des formules (déjà inclus dans le chiffre d’affaires).">
          <div className="grid grid-cols-2 gap-3">
            <div><p className="text-xs text-zinc-400">Nombre d’achats</p><p className="text-2xl font-black">{fmt(c.credit_purchases)}</p></div>
            <div>
              <p className="text-xs text-zinc-400">Revenu</p>
              <p className="text-2xl font-black text-lime-300">{fmt(c.credit_revenue_xof)} FCFA</p>
              {c.credit_revenue_usd > 0 && <p className="text-xs text-zinc-400">+ {money(c.credit_revenue_usd, 'USD')}</p>}
            </div>
          </div>
        </Card>
      </div>

      <Card title="Répartition des formules">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {(['free', 'solo', 'pro', 'agence'] as const).map((p) => (
            <div key={p}><p className="text-xs text-zinc-400">{PLAN_LABEL[p]}</p><p className="text-xl font-black">{fmt(c.plans[p])}</p></div>
          ))}
        </div>
        <ul className="space-y-2">
          {(['free', 'solo', 'pro', 'agence'] as const).map((p, i) => (
            <li key={p} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-2 text-xs">
              <span className="text-zinc-300">{PLAN_LABEL[p]}</span>
              <span className="h-3 rounded-full bg-zinc-800 overflow-hidden">
                <span className={`block h-full rounded-full ${['bg-zinc-500', 'bg-lime-300', 'bg-violet-500', 'bg-sky-400'][i]}`} style={{ width: `${(c.plans[p] / totalPlans) * 100}%` }} />
              </span>
              <span className="tabular-nums font-semibold">{fmt(c.plans[p])}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* C. Fonctionnalités */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Exports par type (30 jours)"><Bars data={f.exports_by_kind} labels={KIND_LABEL} /></Card>
        <Card title="Exports par qualité (30 jours)"><Bars data={f.exports_by_quality} labels={QUALITY_LABEL} color="bg-sky-400" /></Card>
        <Card title="Modèles les plus choisis (30 jours)"><Bars data={f.templates} labels={TEMPLATE_LABEL} color="bg-lime-300" /></Card>
        <Card title="Dispositions utilisées (30 jours)"><Bars data={f.layouts} labels={LAYOUT_LABEL} color="bg-amber-400" /></Card>
        <Card title="Autres fonctions (30 jours)"><Bars data={f.usage} labels={USAGE_LABEL} color="bg-fuchsia-400" /></Card>
        <Card title="IA, partage et pubs (30 jours)">
          <ul className="grid grid-cols-2 gap-3 text-sm">
            <li><p className="text-xs text-zinc-400">Pitch IA générés</p><p className="text-xl font-black">{fmt(f.pitch_30d)}</p></li>
            <li><p className="text-xs text-zinc-400">Pitch IA en échec</p><p className={`text-xl font-black ${f.pitch_failed_30d ? 'text-rose-300' : ''}`}>{fmt(f.pitch_failed_30d)}</p></li>
            <li><p className="text-xs text-zinc-400">Liens de partage créés</p><p className="text-xl font-black">{fmt(f.shares_30d)}</p></li>
            <li><p className="text-xs text-zinc-400">Pubs regardées / bonus</p><p className="text-xl font-black">{fmt(f.ads_started_30d)} / {fmt(f.ads_granted_30d)}</p></li>
          </ul>
        </Card>
      </div>

      {/* D. Parcours d'achat */}
      <Card title="Parcours d’achat (30 jours)" hint="Où les visiteurs s’arrêtent, de la visite au paiement.">
        <Bars
          data={{
            '1': s.funnel.home_views,
            '2': s.funnel.captures_ok,
            '3': s.funnel.exports,
            '4': s.funnel.quota_reached,
            '5': s.funnel.pricing_views,
            '6': s.funnel.checkout_starts,
            '7': s.funnel.payments,
          }}
          labels={{
            '1': '1. Visites de l’accueil',
            '2': '2. Captures réussies',
            '3': '3. Exports',
            '4': '4. Limite gratuite atteinte',
            '5': '5. Page Tarifs vue',
            '6': '6. Paiement commencé',
            '7': '7. Paiement réussi',
          }}
          color="bg-violet-500"
        />
      </Card>

      {/* E. Santé du site */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Santé des captures (30 jours)">
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div><p className="text-xs text-zinc-400">Captures</p><p className="text-xl font-black">{fmt(h.captures_30d)}</p></div>
            <div><p className="text-xs text-zinc-400">Échecs</p><p className={`text-xl font-black ${failRate >= 15 ? 'text-rose-300' : ''}`}>{failRate} %</p></div>
            <div><p className="text-xs text-zinc-400">Temps moyen</p><p className="text-xl font-black">{h.capture_avg_ms ? `${(h.capture_avg_ms / 1000).toFixed(1)} s` : '—'}</p></div>
          </div>
          <p className="text-xs text-zinc-400 mb-2">Causes des échecs</p>
          <Bars data={h.capture_fail_reasons} labels={REASON_LABEL} color="bg-rose-400" empty="Aucun échec." />
          <p className="text-xs text-zinc-400 mt-4 mb-2">Moteur utilisé</p>
          <Bars data={h.capture_engines} labels={ENGINE_LABEL} color="bg-sky-400" />
        </Card>
        <Card title="Alertes">
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span className="text-zinc-300">Échecs de l’IA (Pitch IA, directeur artistique)</span>
              <span className={`font-black ${h.ai_failures_30d ? 'text-rose-300' : 'text-lime-300'}`}>{fmt(h.ai_failures_30d)}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="text-zinc-300">Paiements SasPay en attente depuis plus d’1 h</span>
              <span className={`font-black ${h.saspay_pending ? 'text-amber-300' : 'text-lime-300'}`}>{fmt(h.saspay_pending)}</span>
            </li>
            <li className="text-xs text-zinc-500">Mis à jour le {new Date(s.generated_at).toLocaleString('fr-FR')}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

/* ───────────── Analytique ───────────── */
function Analytics({ s }: { s: Stats }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <Card title="Inscriptions par jour"><DayChart series={s.series} field="signups" color="#a78bfa" /></Card>
      <Card title="Exports par jour"><DayChart series={s.series} field="exports" color="#38bdf8" /></Card>
      <Card title="Chiffre d’affaires par jour" hint="En FCFA (les paiements en euros sont convertis au taux fixe de 655,957 ; les dollars sont comptés à part)." className="xl:col-span-2">
        <DayChart series={s.series} field="revenue_xof" color="#bef264" unit=" FCFA" />
      </Card>
    </div>
  );
}

/* ───────────── Utilisateurs ───────────── */
function UsersTab() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{ total: number; pageSize: number; users: AdminUser[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async (query: string, p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}&page=${p}`, { cache: 'no-store' });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    const t = setTimeout(() => load(q, page), 300);
    return () => clearTimeout(t);
  }, [q, page, load]);

  const act = async (user: AdminUser, payload: Record<string, unknown>, label: string) => {
    if (!window.confirm(`${label}\n\nCompte : ${user.email}\n\nConfirmer ?`)) return;
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, ...payload }),
    });
    const json = await res.json().catch(() => ({}));
    setNotice(res.ok ? `Fait : ${label} (${user.email}).` : `Échec : ${json.error || 'erreur inconnue'}`);
    load(q, page);
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="space-y-4">
      <div className="relative max-w-md">
        <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="Rechercher par e-mail…"
          aria-label="Rechercher un compte par e-mail"
          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm focus:outline-none focus:border-violet-500"
        />
      </div>
      {notice && <p role="status" className="text-sm text-lime-300">{notice}</p>}
      {loading && !data && <p className="text-sm text-zinc-400">Chargement…</p>}
      <p className="text-xs text-zinc-500">{data ? `${fmt(data.total)} compte(s)` : ''}</p>

      <ul className="space-y-3">
        {data?.users.map((u) => (
          <UserRow key={u.id} user={u} onAct={act} />
        ))}
      </ul>

      {pages > 1 && (
        <div className="flex items-center gap-2 text-sm">
          <button type="button" disabled={page === 0} onClick={() => setPage(page - 1)} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-40">Précédent</button>
          <span className="text-zinc-400">Page {page + 1} / {pages}</span>
          <button type="button" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 disabled:opacity-40">Suivant</button>
        </div>
      )}
    </div>
  );
}

function UserRow({ user, onAct }: { user: AdminUser; onAct: (u: AdminUser, p: Record<string, unknown>, label: string) => void }) {
  const [plan, setPlan] = useState(user.plan);
  const [days, setDays] = useState('30');
  const [credits, setCredits] = useState('10');
  const paid = Object.entries(user.paid).map(([cur, v]) => money(v, cur)).join(' + ');

  return (
    <li className="rounded-2xl bg-zinc-900 border border-zinc-800 p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm break-all">{user.email || '(sans e-mail)'}</p>
          <p className="text-[11px] text-zinc-400">Inscrit le {date(user.createdAt)} · {fmt(user.exports30d)} export(s) sur 30 jours</p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[11px]">
          <span className="px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-200 border border-violet-500/30 font-bold">{PLAN_LABEL[user.plan] || user.plan}</span>
          {user.planExpiresAt && <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">jusqu’au {date(user.planExpiresAt)}</span>}
          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">{fmt(user.credits)} crédits</span>
          {paid && <span className="px-2 py-0.5 rounded-full bg-lime-300/15 text-lime-200 border border-lime-300/30">payé : {paid}</span>}
        </div>
      </div>
      {user.stripeSubscription && (
        <p className="text-[11px] text-amber-300">Abonnement par carte actif : changer la formule ici ne modifie pas l’abonnement Stripe.</p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="text-[11px] text-zinc-400">
          Formule
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="mt-1 block px-2 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white">
            {Object.entries(PLAN_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="text-[11px] text-zinc-400">
          Durée (jours, 0 = sans fin)
          <input value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="mt-1 block w-28 px-2 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white" />
        </label>
        <button
          type="button"
          onClick={() => onAct(user, { action: 'set_plan', plan, days: Number(days) || 0 }, `Formule ${PLAN_LABEL[plan]}${plan !== 'free' && Number(days) ? ` pendant ${days} jours` : ''}`)}
          className="px-3 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-sm font-bold"
        >
          Appliquer
        </button>
        <span className="w-px h-8 bg-zinc-800 mx-1 hidden sm:block" />
        <label className="text-[11px] text-zinc-400">
          Crédits à ajouter
          <input value={credits} onChange={(e) => setCredits(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="mt-1 block w-24 px-2 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-sm text-white" />
        </label>
        <button
          type="button"
          onClick={() => onAct(user, { action: 'add_credits', amount: Number(credits) || 0 }, `Ajouter ${credits} crédits`)}
          className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-bold"
        >
          Ajouter
        </button>
      </div>
    </li>
  );
}

/* ───────────── Paiements ───────────── */
function PaymentsTab() {
  const [data, setData] = useState<PaymentsData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    fetch('/api/admin/payments', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError(true));
  }, []);

  const totals = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of data?.payments || []) m[p.currency] = (m[p.currency] || 0) + Number(p.amount);
    return Object.entries(m).map(([c, v]) => money(v, c)).join(' + ');
  }, [data]);

  if (error) return <p className="text-sm text-rose-300">Les paiements n’ont pas pu être chargés.</p>;
  if (!data) return <p className="text-sm text-zinc-400">Chargement…</p>;

  return (
    <div className="space-y-4">
      <Card title="Derniers paiements" hint={totals ? `Total affiché : ${totals}` : 'Aucun paiement pour le moment.'}>
        {data.payments.length === 0 ? (
          <p className="text-xs text-zinc-500">Les paiements apparaîtront ici dès le premier achat (Stripe ou SasPay).</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {data.payments.map((p) => (
              <li key={p.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="font-semibold break-all">{p.email || 'Compte supprimé'}</p>
                  <p className="text-[11px] text-zinc-400">
                    {date(p.created_at)} · {p.provider === 'saspay' ? 'SasPay (Mobile Money)' : 'Stripe (carte)'} · {p.kind === 'plan' ? `Formule ${PLAN_LABEL[p.item || ''] || p.item || ''}` : `Crédits ${p.item || ''}`}
                  </p>
                </div>
                <span className="font-black text-lime-300 tabular-nums">{money(p.amount, p.currency)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Paiements SasPay à vérifier" hint="Commencés il y a plus d’1 heure sans confirmation : le client a peut-être payé sans être activé.">
        {data.saspayPending.length === 0 ? (
          <p className="text-xs text-lime-300">Rien à vérifier.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {data.saspayPending.map((p) => (
              <li key={p.id} className="py-2.5 flex flex-wrap justify-between gap-2 text-sm">
                <span className="break-all">{p.email || '?'} · {p.item_id}</span>
                <span className="text-amber-300 font-bold">{fmt(p.amount_xof)} FCFA · {date(p.created_at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="Journal des actions d’administration" hint="Chaque formule offerte ou crédit ajouté depuis cette page.">
        {data.actions.length === 0 ? (
          <p className="text-xs text-zinc-500">Aucune action pour le moment.</p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {data.actions.map((a) => (
              <li key={a.id} className="py-2.5 text-sm">
                <p className="break-all">
                  <span className="font-semibold">{a.action === 'set_plan' ? 'Formule changée' : a.action === 'add_credits' ? 'Crédits ajoutés' : a.action}</span> · {a.email || '?'}
                </p>
                <p className="text-[11px] text-zinc-400">{new Date(a.created_at).toLocaleString('fr-FR')} · {JSON.stringify(a.details)}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
