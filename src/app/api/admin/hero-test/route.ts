import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const STEPS = ['home_view', 'hero_capture', 'signup_done'] as const;

/** Résultats du test de l'accroche : visites, captures lancées et inscriptions par version. */
export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const { data, error } = await createAdminClient()
    .from('events')
    .select('event_name, properties, created_at')
    .in('event_name', STEPS as unknown as string[])
    .not('properties->>hero', 'is', null)
    .gte('created_at', new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString())
    .order('created_at', { ascending: true })
    .limit(50000);
  if (error) return NextResponse.json({ error: 'Résultats indisponibles.' }, { status: 500 });

  const counts: Record<string, Record<string, number>> = { court: {}, long: {} };
  for (const e of data || []) {
    const v = (e.properties as { hero?: string })?.hero === 'court' ? 'court' : 'long';
    counts[v][e.event_name] = (counts[v][e.event_name] || 0) + 1;
  }

  return NextResponse.json(
    { since: data?.[0]?.created_at || null, counts },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
