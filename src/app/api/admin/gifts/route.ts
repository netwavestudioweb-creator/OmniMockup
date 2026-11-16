import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/** Offre de prospection : 1 mois de Solo offert aux 10 premières agences (une fois par compte) */
const GIFT_ACTION = 'gift_solo_month';
const GIFT_LIMIT = 10;

/** Mois de Solo déjà offerts, du plus récent au plus ancien */
export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from('admin_actions')
    .select('id, target_user, details, created_at')
    .eq('action', GIFT_ACTION)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: 'Liste illisible.' }, { status: 500 });
  return NextResponse.json(
    {
      limit: GIFT_LIMIT,
      gifts: (data || []).map((g) => {
        const d = (g.details || {}) as { email?: string; expires?: string };
        return { id: g.id, email: d.email || null, expires: d.expires || null, created_at: g.created_at };
      }),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * { email } : offre 1 mois de Solo au compte qui a cette adresse.
 * Même activation que les paiements Mobile Money (apply_one_time_plan) : forfait jusqu'à une date,
 * sans renouvellement ; ensuite le compte repasse en gratuit, et il peut payer Solo normalement.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const admin = createAdminClient();

  const body = await req.json().catch(() => ({}));
  const email = String(body?.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, message: 'Adresse e-mail invalide.' }, { status: 400 });
  }

  const { data: gifts } = await admin.from('admin_actions').select('target_user').eq('action', GIFT_ACTION);
  if ((gifts || []).length >= GIFT_LIMIT) {
    return NextResponse.json({ ok: false, message: `Les ${GIFT_LIMIT} mois offerts ont déjà été donnés.` }, { status: 409 });
  }

  const { data: profile } = await admin.from('profiles').select('id, email').ilike('email', email.replace(/[\\%_]/g, (c) => '\\' + c)).maybeSingle();
  if (!profile) {
    return NextResponse.json(
      { ok: false, message: 'Aucun compte avec cette adresse. L’agence doit d’abord créer son compte gratuit sur pitchmysite.com.' },
      { status: 404 }
    );
  }
  if ((gifts || []).some((g) => g.target_user === profile.id)) {
    return NextResponse.json({ ok: false, message: 'Ce compte a déjà reçu son mois offert.' }, { status: 409 });
  }

  const { data: applied, error } = await admin.rpc('apply_one_time_plan', {
    p_user_id: profile.id,
    p_plan: 'solo',
    p_cycle: 'monthly',
    p_external_ref: `gift:${crypto.randomUUID()}`,
    p_provider: 'gift',
  });
  if (error || applied !== 'applied') {
    return NextResponse.json({ ok: false, message: 'Activation impossible. Réessayez.' }, { status: 500 });
  }

  const { data: after } = await admin.from('profiles').select('plan_expires_at').eq('id', profile.id).maybeSingle();
  const expires = after?.plan_expires_at || null;
  await admin.from('admin_actions').insert({
    admin_id: auth.adminId,
    target_user: profile.id,
    action: GIFT_ACTION,
    details: { email: profile.email, plan: 'solo', expires },
  });

  return NextResponse.json({ ok: true, expires, remaining: GIFT_LIMIT - (gifts || []).length - 1 });
}
