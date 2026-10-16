import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectivePlan } from '@/lib/plan';
import { createRateLimitResponse, getClientIp, checkRateLimitShared } from '@/lib/security';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Pubs récompensées (formule gratuite) : 1 pub regardée jusqu'au bout = 1 export Standard de plus,
 * 3 par jour au plus. Toutes les règles sont dans la base (start_ad_reward / grant_ad_reward).
 * POST { action: 'start' }               → { allowed, reward_id, used, max }
 * POST { action: 'grant', rewardId }     → { granted, reason, used, max }
 */
export async function POST(req: NextRequest) {
  const limit = await checkRateLimitShared(req, 'ads', { maxRequests: 20, windowMs: 60 * 1000 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds);

  const body = await req.json().catch(() => ({}));
  const action = body?.action === 'grant' ? 'grant' : body?.action === 'start' ? 'start' : null;
  if (!action) return NextResponse.json({ error: 'Action inconnue.' }, { status: 400 });

  // Identité et forfait réels (jamais envoyés par le navigateur)
  let userId: string | null = null;
  let plan = 'free';
  try {
    const { data } = await createClient().auth.getUser();
    if (data.user) {
      userId = data.user.id;
      const { data: profile } = await createAdminClient()
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', userId)
        .maybeSingle();
      plan = getEffectivePlan(profile);
    }
  } catch {
    // session illisible : visiteur gratuit
  }
  const clientIp = userId ? null : getClientIp(req);

  try {
    const admin = createAdminClient();
    if (action === 'start') {
      const { data, error } = await admin.rpc('start_ad_reward', { p_user_id: userId, p_client_ip: clientIp, p_plan: plan });
      if (error) throw error;
      return NextResponse.json(data);
    }
    const rewardId = String(body?.rewardId || '');
    if (!UUID_RE.test(rewardId)) return NextResponse.json({ granted: false, reason: 'unknown_reward' }, { status: 400 });
    const { data, error } = await admin.rpc('grant_ad_reward', { p_reward_id: rewardId, p_user_id: userId, p_client_ip: clientIp });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error('[ads/reward] Erreur :', err);
    return NextResponse.json({ error: 'Service momentanément indisponible.' }, { status: 503 });
  }
}
