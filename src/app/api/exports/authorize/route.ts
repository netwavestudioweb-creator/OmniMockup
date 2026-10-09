import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectivePlan } from '@/lib/plan';
import { checkRateLimit, createRateLimitResponse, getClientIp } from '@/lib/security';

export const dynamic = 'force-dynamic';

type Kind = 'image' | 'pack' | 'video';
type Quality = 'standard' | 'hd' | '4k';

const KINDS: Kind[] = ['image', 'pack', 'video'];
const QUALITIES: Quality[] = ['standard', 'hd', '4k'];
const DEV_PLANS = ['free', 'solo', 'pro', 'agence'];

/**
 * Autorise un export avant le rendu dans le navigateur.
 * Le forfait est lu dans la base (jamais envoyé par le navigateur), le quota est
 * vérifié et l'export enregistré en une seule opération SQL (authorize_export).
 * Hors forfait, l'export peut être payé en crédits si l'utilisateur l'accepte (useCredits).
 * Réponse : { allowed, quality, watermark, reason, used, limit, cost, balance, credits_used }
 */
export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, { maxRequests: 60, windowMs: 60 * 1000 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds);

  const body = await req.json().catch(() => ({}));
  const kind: Kind = KINDS.includes(body?.kind) ? body.kind : 'image';
  const quality: Quality = QUALITIES.includes(body?.quality) ? body.quality : 'standard';
  const useCredits = body?.useCredits === true;

  // Identité et forfait réels
  let userId: string | null = null;
  let plan = 'free';
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getUser();
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
    // session illisible : traité comme visiteur gratuit
  }

  // Développement local uniquement : la session de démo (simulée dans le navigateur) choisit son forfait
  if (process.env.NODE_ENV === 'development' && !userId && DEV_PLANS.includes(body?.demoPlan)) {
    plan = body.demoPlan;
  }

  try {
    const { data, error } = await createAdminClient().rpc('authorize_export', {
      p_user_id: userId,
      p_client_ip: userId ? null : getClientIp(req),
      p_plan: plan,
      p_kind: kind,
      p_quality: quality,
      p_use_credits: useCredits,
    });
    if (error) throw error;
    return NextResponse.json({ ...(data as Record<string, unknown>), plan });
  } catch (err) {
    // Base indisponible (ou migration pas encore appliquée) : on n'empêche pas l'export,
    // mais la qualité reste plafonnée selon le forfait connu.
    console.error('[exports/authorize] Contrôle impossible, export autorisé par défaut :', err);
    const capped: Quality =
      plan === 'pro' || plan === 'agence' ? quality : plan === 'solo' ? (quality === 'standard' ? 'standard' : 'hd') : 'standard';
    const videoBlocked = kind === 'video' && (plan === 'free' || plan === 'solo');
    return NextResponse.json({
      allowed: !videoBlocked,
      quality: capped,
      reason: videoBlocked ? 'video_not_included' : null,
      used: null,
      limit: null,
      plan,
      watermark: plan === 'free' || plan === 'solo',
      cost: 0,
      credits_used: 0,
      degraded: true,
    });
  }
}
