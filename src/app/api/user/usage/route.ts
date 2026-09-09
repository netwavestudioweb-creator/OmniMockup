import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentMonth } from '@/lib/usage';

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
      .select('plan, stripe_customer_id, stripe_subscription_id, created_at')
      .eq('id', user.id)
      .maybeSingle();

    const plan = profile?.plan || 'free';
    const limit = (plan === 'pro' || plan === 'agence') ? 999999 : 3;

    // 2. Récupération de la consommation du mois
    const { data: usageData } = await admin
      .from('usage')
      .select('analyses_ia_count, exports_count')
      .eq('user_id', user.id)
      .eq('month', month)
      .maybeSingle();

    const currentUsage = usageData?.analyses_ia_count || 0;
    const exportsCount = usageData?.exports_count || 0;

    return NextResponse.json({
      success: true,
      email: user.email,
      plan,
      month,
      analyses_ia_count: currentUsage,
      limit,
      exports_count: exportsCount,
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
