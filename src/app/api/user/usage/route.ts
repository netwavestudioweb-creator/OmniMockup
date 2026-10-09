import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentMonth } from '@/lib/usage';
import { PLANS } from '@/lib/pricing';
import { getEffectivePlan } from '@/lib/plan';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const month = getCurrentMonth();
    const admin = createAdminClient();

    // 1. Récupération du profil utilisateur
    const { data: profile } = await admin
      .from('profiles')
      .select('plan, plan_expires_at, credit_balance, subscription_status, billing_cycle, stripe_customer_id, stripe_subscription_id, created_at')
      .eq('id', user.id)
      .maybeSingle();

    const plan = getEffectivePlan(profile);
    const planDef = PLANS.find((p) => p.id === plan);
    const aiLimit = planDef?.quotas.aiAnalysesPerMonth ?? (plan === 'pro' || plan === 'agence' ? 999999 : 3);
    const pngLimit = planDef?.quotas.pngExportsPerMonth ?? (plan === 'pro' || plan === 'agence' ? 999999 : 20);

    // 2. Récupération de la consommation du mois
    const { data: usageData } = await admin
      .from('usage')
      .select('analyses_ia_count, exports_count, png_exports_count')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    const analysesIaCount = usageData?.analyses_ia_count || 0;
    const exportsCount = usageData?.exports_count || 0;
    const pngExportsCount = usageData?.png_exports_count || 0;

    return NextResponse.json({
      success: true,
      email: user.email,
      plan,
      plan_expires_at: profile?.plan_expires_at ?? null,
      credit_balance: profile?.credit_balance ?? 0,
      subscription_status: profile?.subscription_status || 'active',
      billing_cycle: profile?.billing_cycle || 'monthly',
      month,
      analyses_ia_count: analysesIaCount,
      limit: aiLimit,
      exports_count: exportsCount,
      png_exports_count: pngExportsCount,
      png_limit: pngLimit,
      hasStripeCustomer: Boolean(profile?.stripe_customer_id),
      createdAt: profile?.created_at || user.created_at,
    });
  } catch (err: unknown) {
    const error = err as { message?: string };
    return NextResponse.json(
      { success: false, error: error?.message || 'Erreur chargement usage' },
      { status: 500 }
    );
  }
}
