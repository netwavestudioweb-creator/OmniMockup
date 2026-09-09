import { createAdminClient } from '@/lib/supabase/admin';
import { UserPlan } from '@/types/database';

export interface QuotaCheckResult {
  allowedFullAnalysis: boolean;
  quotaExceeded: boolean;
  currentUsage: number;
  limit: number;
  plan: UserPlan;
}

// Récupère le mois actuel au format YYYY-MM
export function getCurrentMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Vérifie les quotas de l'utilisateur ou de l'IP anonyme
export async function checkUsageQuota(
  userId: string | null,
  clientIp: string,
  userPlan: UserPlan = 'free'
): Promise<QuotaCheckResult> {
  const month = getCurrentMonth();
  const admin = createAdminClient();

  // Si l'utilisateur est Pro ou Agence : accès illimité
  if (userPlan === 'pro' || userPlan === 'agence') {
    return {
      allowedFullAnalysis: true,
      quotaExceeded: false,
      currentUsage: 0,
      limit: 999999,
      plan: userPlan,
    };
  }

  // Limite : 3 analyses/mois pour Free connecté, 1 pour visiteur non connecté
  const limit = userId ? 3 : 1;

  try {
    let query = admin
      .from('usage')
      .select('analyses_ia_count')
      .eq('month', month);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('client_ip', clientIp).is('user_id', null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) {
      console.warn('[Usage] Erreur lors de la lecture du quota (fallback tolérant) :', error.message);
      return {
        allowedFullAnalysis: true,
        quotaExceeded: false,
        currentUsage: 0,
        limit,
        plan: userPlan,
      };
    }

    const currentUsage = data?.analyses_ia_count ?? 0;
    const quotaExceeded = currentUsage >= limit;

    return {
      allowedFullAnalysis: !quotaExceeded,
      quotaExceeded,
      currentUsage,
      limit,
      plan: userPlan,
    };
  } catch (err) {
    console.error('[Usage] Erreur imprévue quota :', err);
    return {
      allowedFullAnalysis: true,
      quotaExceeded: false,
      currentUsage: 0,
      limit,
      plan: userPlan,
    };
  }
}

// Incrémente le compteur d'analyses IA après une analyse réussie
export async function incrementUsageCount(
  userId: string | null,
  clientIp: string
): Promise<void> {
  const month = getCurrentMonth();
  const admin = createAdminClient();

  try {
    if (userId) {
      // Pour utilisateur connecté
      const { data: existing } = await admin
        .from('usage')
        .select('id, analyses_ia_count')
        .eq('user_id', userId)
        .eq('month', month)
        .maybeSingle();

      if (existing) {
        await admin
          .from('usage')
          .update({
            analyses_ia_count: (existing.analyses_ia_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await admin
          .from('usage')
          .insert({
            user_id: userId,
            month,
            analyses_ia_count: 1,
            exports_count: 0,
          });
      }
    } else {
      // Pour visiteur non connecté (par IP)
      const { data: existing } = await admin
        .from('usage')
        .select('id, analyses_ia_count')
        .is('user_id', null)
        .eq('client_ip', clientIp)
        .eq('month', month)
        .maybeSingle();

      if (existing) {
        await admin
          .from('usage')
          .update({
            analyses_ia_count: (existing.analyses_ia_count || 0) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await admin
          .from('usage')
          .insert({
            client_ip: clientIp,
            month,
            analyses_ia_count: 1,
            exports_count: 0,
          });
      }
    }
  } catch (err) {
    console.error('[Usage] Erreur lors de l’incrémentation du quota :', err);
  }
}
