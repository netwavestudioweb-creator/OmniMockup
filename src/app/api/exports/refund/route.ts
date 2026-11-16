import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createRateLimitResponse, getClientIp, checkRateLimitShared } from '@/lib/security';
import { readRefundToken } from '@/lib/exportRefund';
import { logServerEvent } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/** Annulations au plus, par jour et par personne (compte ou adresse IP) */
const MAX_REFUNDS_PER_DAY = 3;

/**
 * L'image n'a pas pu être créée dans le navigateur : l'export autorisé juste avant n'est plus compté
 * (et ses crédits sont rendus). Le jeton signé vient de /api/exports/authorize et vaut 10 minutes.
 */
export async function POST(req: NextRequest) {
  const limit = await checkRateLimitShared(req, 'exports-refund', { maxRequests: 10, windowMs: 60 * 1000 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds);

  const body = await req.json().catch(() => ({}));
  const claim = readRefundToken(body?.token);
  if (!claim) return NextResponse.json({ ok: false, reason: 'invalid_token' }, { status: 400 });

  // Le jeton ne sert qu'à la personne qui a fait l'export
  let userId: string | null = null;
  try {
    const { data } = await createClient().auth.getUser();
    userId = data.user?.id || null;
  } catch {
    userId = null;
  }
  const ip = getClientIp(req);
  if (claim.userId ? claim.userId !== userId : claim.ip !== ip) {
    return NextResponse.json({ ok: false, reason: 'not_owner' }, { status: 403 });
  }

  const admin = createAdminClient();
  const identity = claim.userId || `ip:${claim.ip}`;
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await admin
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('event_name', 'export_refund')
    .eq('properties->>identity', identity)
    .gte('created_at', since);
  if ((count || 0) >= MAX_REFUNDS_PER_DAY) {
    return NextResponse.json({ ok: false, reason: 'daily_limit' }, { status: 429 });
  }

  const { data: deleted } = await admin.from('export_events').delete().eq('id', claim.id).select('id');
  if (!deleted?.length) return NextResponse.json({ ok: false, reason: 'already_refunded' });

  if (claim.credits > 0 && claim.userId) {
    await admin.rpc('grant_credits_once', {
      p_user_id: claim.userId,
      p_delta: claim.credits,
      p_reason: 'export_echoue_rembourse',
      p_stripe_event: null,
      p_external_ref: `export-refund:${claim.id}`,
    });
  }
  await logServerEvent('export_refund', { identity, export_id: claim.id, credits: claim.credits }, claim.userId);
  return NextResponse.json({ ok: true, credits: claim.credits });
}
