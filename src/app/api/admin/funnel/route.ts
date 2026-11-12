import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const WEEKS = 8;

/** Lundi (UTC) de la semaine d'une date, au format AAAA-MM-JJ */
function weekOf(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

/**
 * Tableau des abandons : le nombre à chaque étape du parcours, par semaine, à partir des données déjà
 * enregistrées (événements du site, exports, comptes, paiements SasPay). Plus la durée médiane de capture.
 */
export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const admin = createAdminClient();
  const since = new Date(Date.now() - WEEKS * 7 * 24 * 3600 * 1000).toISOString();

  const [events, exportsRes, profiles, checkouts] = await Promise.all([
    admin
      .from('events')
      .select('event_name, properties, created_at')
      .in('event_name', ['home_view', 'hero_capture', 'capture_result', 'plan_click'])
      .gte('created_at', since)
      .limit(50000),
    admin.from('export_events').select('created_at').gte('created_at', since).limit(50000),
    admin.from('profiles').select('created_at').gte('created_at', since).limit(50000),
    admin.from('saspay_checkouts').select('status, created_at').gte('created_at', since).limit(5000),
  ]);
  if (events.error || exportsRes.error || profiles.error || checkouts.error) {
    return NextResponse.json({ error: 'Données illisibles' }, { status: 500 });
  }

  const STEPS = ['visite', 'capture_lancee', 'capture_reussie', 'export', 'inscription', 'clic_forfait', 'paiement_commence', 'paiement_reussi'] as const;
  type Step = (typeof STEPS)[number];
  const table: Record<string, Record<Step, number> & { durees: number[] }> = {};
  const row = (iso: string) => {
    const w = weekOf(iso);
    if (!table[w]) table[w] = { ...(Object.fromEntries(STEPS.map((s) => [s, 0])) as Record<Step, number>), durees: [] };
    return table[w];
  };

  for (const e of events.data || []) {
    const r = row(e.created_at as string);
    const p = (e.properties || {}) as { ok?: boolean; mobile?: boolean; ms?: number };
    if (e.event_name === 'home_view') r.visite++;
    else if (e.event_name === 'hero_capture') r.capture_lancee++;
    else if (e.event_name === 'plan_click') r.clic_forfait++;
    else if (e.event_name === 'capture_result' && p.ok && p.mobile !== true) {
      // Capture de la page d'ordinateur (celle lancée depuis l'accueil) ; la vue téléphone est une capture en plus
      r.capture_reussie++;
      if (typeof p.ms === 'number') r.durees.push(p.ms);
    }
  }
  for (const x of exportsRes.data || []) row(x.created_at as string).export++;
  for (const x of profiles.data || []) row(x.created_at as string).inscription++;
  for (const x of checkouts.data || []) {
    const r = row(x.created_at as string);
    r.paiement_commence++;
    if (x.status === 'applied') r.paiement_reussi++;
  }

  const median = (a: number[]) => {
    if (!a.length) return null;
    const s = [...a].sort((x, y) => x - y);
    const m = Math.floor(s.length / 2);
    return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
  };

  const weeks = Object.keys(table)
    .sort()
    .reverse()
    .map((w) => {
      const { durees, ...counts } = table[w];
      return { week: w, counts, captureMedianMs: median(durees) };
    });

  return NextResponse.json({ steps: STEPS, weeks }, { headers: { 'Cache-Control': 'no-store' } });
}
