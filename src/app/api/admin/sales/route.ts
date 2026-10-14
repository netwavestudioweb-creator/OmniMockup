import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAdmin } from '@/lib/admin';
import { PLANS } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

const MAX_ROWS = 5000;

/**
 * Données des onglets Ventes, Clients et Tentatives : toutes les ventes, toutes les tentatives
 * de paiement SasPay et tous les comptes qui ont une formule ou qui ont déjà payé.
 * Les calculs (filtres, totaux, courbes) sont faits dans la page.
 */
export async function GET() {
  const auth = await requireAdmin();
  if ('response' in auth) return auth.response;
  const admin = createAdminClient();

  const [payments, checkouts, planHolders] = await Promise.all([
    admin
      .from('payments')
      .select('id, provider, external_id, user_id, kind, item, amount, currency, created_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS),
    admin
      .from('saspay_checkouts')
      .select('id, user_id, item_id, kind, billing_cycle, amount_xof, status, transaction_id, created_at, applied_at')
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS),
    admin
      .from('profiles')
      .select('id, email, plan, plan_expires_at, billing_cycle, credit_balance, stripe_subscription_id, subscription_status, created_at')
      .neq('plan', 'free')
      .limit(MAX_ROWS),
  ]);
  if (payments.error || checkouts.error || planHolders.error) {
    return NextResponse.json({ error: 'Données indisponibles.' }, { status: 500 });
  }

  // Durée achetée (1 mois / 1 an) : retrouvée par la tentative SasPay liée au paiement
  const cycleByTransaction = new Map<string, string | null>();
  for (const c of checkouts.data || []) if (c.transaction_id) cycleByTransaction.set(c.transaction_id, c.billing_cycle);

  // Comptes concernés : formule en cours ou expirée, ou au moins un paiement / une tentative
  const profiles = new Map((planHolders.data || []).map((p) => [p.id, p]));
  const missing = Array.from(
    new Set([...(payments.data || []), ...(checkouts.data || [])].map((r) => r.user_id).filter((id): id is string => !!id && !profiles.has(id)))
  );
  for (let i = 0; i < missing.length; i += 200) {
    const { data } = await admin
      .from('profiles')
      .select('id, email, plan, plan_expires_at, billing_cycle, credit_balance, stripe_subscription_id, subscription_status, created_at')
      .in('id', missing.slice(i, i + 200));
    for (const p of data || []) profiles.set(p.id, p);
  }
  const emailOf = (id: string | null) => (id ? profiles.get(id)?.email || null : null);

  // Prix de chaque formule, pour estimer les renouvellements
  const prices = Object.fromEntries(PLANS.filter((p) => p.id !== 'free').map((p) => [p.id, { monthly: p.monthlyFcfa, annual: p.annualFcfa }]));

  return NextResponse.json(
    {
      generatedAt: new Date().toISOString(),
      truncated: (payments.data || []).length >= MAX_ROWS || (checkouts.data || []).length >= MAX_ROWS,
      prices,
      payments: (payments.data || []).map((p) => ({
        id: p.id,
        provider: p.provider,
        userId: p.user_id,
        email: emailOf(p.user_id),
        kind: p.kind,
        item: p.item,
        cycle: p.provider === 'saspay' ? cycleByTransaction.get(p.external_id) ?? null : null,
        amount: Number(p.amount),
        currency: p.currency,
        createdAt: p.created_at,
      })),
      checkouts: (checkouts.data || []).map((c) => ({
        id: c.id,
        userId: c.user_id,
        email: emailOf(c.user_id),
        item: c.item_id,
        kind: c.kind,
        cycle: c.billing_cycle,
        amount: c.amount_xof,
        status: c.status,
        createdAt: c.created_at,
        appliedAt: c.applied_at,
      })),
      customers: Array.from(profiles.values()).map((p) => ({
        id: p.id,
        email: p.email,
        plan: p.plan,
        planExpiresAt: p.plan_expires_at,
        cycle: p.billing_cycle,
        credits: p.credit_balance || 0,
        stripeSubscription:
          !!p.stripe_subscription_id && ['active', 'trialing', 'past_due'].includes(p.subscription_status || ''),
        createdAt: p.created_at,
      })),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
