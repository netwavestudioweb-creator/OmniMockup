import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';
import { getEffectivePlan } from '@/lib/plan';

export const dynamic = 'force-dynamic';

const PLANS = ['free', 'solo', 'pro', 'agence'] as const;
const PAGE_SIZE = 50;

/** Liste des comptes (recherche par e-mail), avec formule réelle, crédits, exports du mois et total payé. */
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const q = (req.nextUrl.searchParams.get('q') || '').trim().slice(0, 100);
  const page = Math.max(0, Number(req.nextUrl.searchParams.get('page')) || 0);
  const admin = createAdminClient();

  let query = admin
    .from('profiles')
    .select('id, email, plan, plan_expires_at, credit_balance, subscription_status, stripe_subscription_id, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
  // Les caractères spéciaux de recherche sont neutralisés
  if (q) query = query.ilike('email', `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`);

  const { data: users, count, error } = await query;
  if (error) return NextResponse.json({ error: 'Liste indisponible.' }, { status: 500 });

  const ids = (users || []).map((u) => u.id);
  const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
  const [{ data: exports }, { data: pays }] = await Promise.all([
    ids.length
      ? admin.from('export_events').select('user_id').in('user_id', ids).gte('created_at', since)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
    ids.length
      ? admin.from('payments').select('user_id, amount, currency').in('user_id', ids)
      : Promise.resolve({ data: [] as { user_id: string; amount: number; currency: string }[] }),
  ]);

  const exportCount = new Map<string, number>();
  for (const e of exports || []) exportCount.set(e.user_id, (exportCount.get(e.user_id) || 0) + 1);
  const paid = new Map<string, Record<string, number>>();
  for (const p of pays || []) {
    const m = paid.get(p.user_id) || {};
    m[p.currency] = (m[p.currency] || 0) + Number(p.amount);
    paid.set(p.user_id, m);
  }

  return NextResponse.json(
    {
      total: count || 0,
      page,
      pageSize: PAGE_SIZE,
      users: (users || []).map((u) => ({
        id: u.id,
        email: u.email,
        plan: getEffectivePlan(u),
        planExpiresAt: u.plan_expires_at,
        credits: u.credit_balance || 0,
        stripeSubscription: !!u.stripe_subscription_id && ['active', 'trialing', 'past_due'].includes(u.subscription_status || ''),
        createdAt: u.created_at,
        exports30d: exportCount.get(u.id) || 0,
        paid: paid.get(u.id) || {},
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}

/**
 * Actions de support, toutes enregistrées dans le journal admin_actions :
 * { userId, action: 'set_plan', plan, days? }   formule offerte ou corrigée (days = durée, sinon sans fin)
 * { userId, action: 'add_credits', amount }     crédits ajoutés (1 à 500)
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;

  const body = await req.json().catch(() => ({}));
  const userId = String(body?.userId || '');
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return NextResponse.json({ error: 'Compte inconnu.' }, { status: 400 });
  const admin = createAdminClient();

  const { data: target } = await admin.from('profiles').select('id, plan, plan_expires_at, credit_balance').eq('id', userId).maybeSingle();
  if (!target) return NextResponse.json({ error: 'Compte inconnu.' }, { status: 404 });

  if (body?.action === 'set_plan') {
    const plan = String(body.plan);
    if (!PLANS.includes(plan as (typeof PLANS)[number])) return NextResponse.json({ error: 'Formule inconnue.' }, { status: 400 });
    const days = Number(body.days) || 0;
    if (days < 0 || days > 400) return NextResponse.json({ error: 'Durée invalide (0 à 400 jours).' }, { status: 400 });
    const expires = plan !== 'free' && days > 0 ? new Date(Date.now() + days * 24 * 3600 * 1000).toISOString() : null;
    const { error } = await admin
      .from('profiles')
      .update({ plan, plan_expires_at: expires, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) return NextResponse.json({ error: 'Modification impossible.' }, { status: 500 });
    await admin.from('admin_actions').insert({
      admin_id: auth.adminId,
      target_user: userId,
      action: 'set_plan',
      details: { from: getEffectivePlan(target), to: plan, days: days || null, expires },
    });
    return NextResponse.json({ ok: true });
  }

  if (body?.action === 'add_credits') {
    const amount = Math.round(Number(body.amount));
    if (!(amount >= 1 && amount <= 500)) return NextResponse.json({ error: 'Nombre de crédits invalide (1 à 500).' }, { status: 400 });
    const { error } = await admin.rpc('grant_credits_once', {
      p_user_id: userId,
      p_delta: amount,
      p_reason: 'admin_ajout',
      p_stripe_event: null,
      p_external_ref: `admin:${crypto.randomUUID()}`,
    });
    if (error) return NextResponse.json({ error: 'Ajout impossible.' }, { status: 500 });
    await admin.from('admin_actions').insert({
      admin_id: auth.adminId,
      target_user: userId,
      action: 'add_credits',
      details: { amount, before: target.credit_balance || 0 },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });
}
