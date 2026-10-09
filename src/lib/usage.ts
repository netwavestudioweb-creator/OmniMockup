import { createAdminClient } from '@/lib/supabase/admin';
import { PlanId } from '@/lib/pricing';
import { PLANS } from '@/lib/pricing';

export interface QuotaCheckResult {
  allowedFullAnalysis: boolean;
  quotaExceeded: boolean;
  currentUsage: number;
  limit: number;
  plan: PlanId;
}

export interface PngExportQuotaResult {
  allowed: boolean;
  quotaExceeded: boolean;
  currentUsage: number;
  limit: number | null; // null = illimité
  plan: PlanId;
}

export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/** Vérifie le quota d'analyses IA */
export async function checkUsageQuota(
  userId: string | null,
  clientIp: string,
  userPlan: PlanId = 'free'
): Promise<QuotaCheckResult> {
  const month = getCurrentMonth();
  const admin = createAdminClient();

  // Pro et Agence : illimité
  if (userPlan === 'pro' || userPlan === 'agence') {
    return { allowedFullAnalysis: true, quotaExceeded: false, currentUsage: 0, limit: 999999, plan: userPlan };
  }

  // Free et Solo : 3 analyses IA par mois
  const planDef = PLANS.find((p) => p.id === userPlan);
  const limit = planDef?.quotas.aiAnalysesPerMonth ?? (userId ? 3 : 1);

  try {
    let query = admin.from('usage').select('analyses_ia_count').eq('month', month);
    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('client_ip', clientIp).is('user_id', null);
    }

    const { data, error } = await query.maybeSingle();
    if (error) {
      console.warn('[Usage] Erreur quota (fallback tolérant) :', error.message);
      return { allowedFullAnalysis: true, quotaExceeded: false, currentUsage: 0, limit, plan: userPlan };
    }

    const currentUsage = data?.analyses_ia_count ?? 0;
    const quotaExceeded = currentUsage >= limit;
    return { allowedFullAnalysis: !quotaExceeded, quotaExceeded, currentUsage, limit, plan: userPlan };
  } catch (err) {
    console.error('[Usage] Erreur imprévue quota :', err);
    return { allowedFullAnalysis: true, quotaExceeded: false, currentUsage: 0, limit, plan: userPlan };
  }
}

/** Vérifie le quota d'exports PNG pour le plan Solo (20/mois) */
export async function checkPngExportQuota(
  userId: string,
  userPlan: PlanId
): Promise<PngExportQuotaResult> {
  const month = getCurrentMonth();
  const admin = createAdminClient();

  // Pro et Agence : illimité
  if (userPlan === 'pro' || userPlan === 'agence') {
    return { allowed: true, quotaExceeded: false, currentUsage: 0, limit: null, plan: userPlan };
  }

  // Free : 3/jour (gérée séparément côté client)
  if (userPlan === 'free') {
    return { allowed: true, quotaExceeded: false, currentUsage: 0, limit: 3, plan: userPlan };
  }

  // Solo : 20/mois
  const limit = 20;
  try {
    const { data } = await admin
      .from('usage')
      .select('png_exports_count')
      .eq('user_id', userId)
      .eq('month', month)
      .maybeSingle();

    const currentUsage = data?.png_exports_count ?? 0;
    const quotaExceeded = currentUsage >= limit;
    return { allowed: !quotaExceeded, quotaExceeded, currentUsage, limit, plan: userPlan };
  } catch (err) {
    console.error('[Usage] Erreur quota PNG Solo :', err);
    return { allowed: true, quotaExceeded: false, currentUsage: 0, limit, plan: userPlan };
  }
}

/** Incrémente le compteur d'analyses IA */
export async function incrementUsageCount(userId: string | null, clientIp: string): Promise<void> {
  const month = getCurrentMonth();
  const admin = createAdminClient();

  try {
    if (userId) {
      const { data: existing } = await admin
        .from('usage').select('id, analyses_ia_count').eq('user_id', userId).eq('month', month).maybeSingle();

      if (existing) {
        await admin.from('usage')
          .update({ analyses_ia_count: (existing.analyses_ia_count || 0) + 1, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await admin.from('usage').insert({ user_id: userId, month, analyses_ia_count: 1, exports_count: 0, png_exports_count: 0 });
      }
    } else {
      const { data: existing } = await admin
        .from('usage').select('id, analyses_ia_count').is('user_id', null).eq('client_ip', clientIp).eq('month', month).maybeSingle();

      if (existing) {
        await admin.from('usage')
          .update({ analyses_ia_count: (existing.analyses_ia_count || 0) + 1, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await admin.from('usage').insert({ client_ip: clientIp, month, analyses_ia_count: 1, exports_count: 0, png_exports_count: 0 });
      }
    }
  } catch (err) {
    console.error('[Usage] Erreur incrémentation quota :', err);
  }
}

/** Incrémente le compteur d'exports PNG pour le plan Solo */
export async function incrementPngExportCount(userId: string): Promise<void> {
  const month = getCurrentMonth();
  const admin = createAdminClient();

  try {
    const { data: existing } = await admin
      .from('usage').select('id, png_exports_count').eq('user_id', userId).eq('month', month).maybeSingle();

    if (existing) {
      await admin.from('usage')
        .update({ png_exports_count: (existing.png_exports_count || 0) + 1, updated_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      await admin.from('usage').insert({ user_id: userId, month, analyses_ia_count: 0, exports_count: 0, png_exports_count: 1 });
    }
  } catch (err) {
    console.error('[Usage] Erreur incrémentation exports PNG :', err);
  }
}
