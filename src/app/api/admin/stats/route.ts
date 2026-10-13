import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/** Tous les chiffres du tableau de bord (fonction SQL admin_stats). Réservé à l'administrateur. */
export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const { data, error } = await createAdminClient().rpc('admin_stats');
  if (error) {
    console.error('[admin/stats]', error);
    return NextResponse.json({ error: 'Statistiques indisponibles.' }, { status: 500 });
  }
  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
