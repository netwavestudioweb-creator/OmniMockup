import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';
import { getEffectivePlan } from '@/lib/plan';

export const dynamic = 'force-dynamic';

/** Fiche d'un client : paiements, tentatives, exports, crédits, activité et actions d'administration. */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const userId = String(params?.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return NextResponse.json({ error: 'Compte inconnu.' }, { status: 400 });
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, plan, plan_expires_at, billing_cycle, credit_balance, stripe_subscription_id, subscription_status, created_at')
    .eq('id', userId)
    .maybeSingle();
  if (!profile) return NextResponse.json({ error: 'Compte inconnu.' }, { status: 404 });

  const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const [payments, checkouts, exportsAll, exports30, exportsLast, credits, actions, lastEvent, pitch, shares, authUser] = await Promise.all([
    admin.from('payments').select('id, provider, kind, item, amount, currency, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(200),
    admin.from('saspay_checkouts').select('id, item_id, billing_cycle, amount_xof, status, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(100),
    admin.from('export_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('export_events').select('kind, quality').eq('user_id', userId).gte('created_at', since30).limit(5000),
    admin.from('export_events').select('created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    admin.from('credit_transactions').select('id, delta, reason, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
    admin.from('admin_actions').select('id, action, details, created_at').eq('target_user', userId).order('created_at', { ascending: false }).limit(50),
    admin.from('events').select('event_name, created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(1),
    admin.from('pitch_events').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    admin.from('shared_mockups').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('revoked_at', null),
    admin.auth.admin.getUserById(userId).catch(() => null),
  ]);

  const byKind: Record<string, number> = {};
  for (const e of exports30.data || []) byKind[e.kind || 'image'] = (byKind[e.kind || 'image'] || 0) + 1;

  // Dernière activité connue : la plus récente entre connexion, export et événement d'usage
  const lastSignIn = authUser && 'data' in authUser ? authUser.data.user?.last_sign_in_at || null : null;
  const candidates = [lastSignIn, exportsLast.data?.[0]?.created_at, lastEvent.data?.[0]?.created_at].filter(Boolean) as string[];
  const lastActivity = candidates.sort().pop() || null;

  return NextResponse.json(
    {
      id: profile.id,
      email: profile.email,
      plan: getEffectivePlan(profile),
      rawPlan: profile.plan,
      planExpiresAt: profile.plan_expires_at,
      cycle: profile.billing_cycle,
      credits: profile.credit_balance || 0,
      stripeSubscription:
        !!profile.stripe_subscription_id && ['active', 'trialing', 'past_due'].includes(profile.subscription_status || ''),
      createdAt: profile.created_at,
      lastSignIn,
      lastActivity,
      signInProvider: authUser && 'data' in authUser ? authUser.data.user?.app_metadata?.provider || null : null,
      exportsTotal: exportsAll.count || 0,
      exports30dByKind: byKind,
      pitchTotal: pitch.count || 0,
      activeShares: shares.count || 0,
      payments: payments.data || [],
      checkouts: checkouts.data || [],
      creditHistory: credits.data || [],
      actions: actions.data || [],
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
