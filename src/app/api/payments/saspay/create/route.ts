import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createSaspayCheckout } from '@/lib/saspay';
import { getSaspayItem } from '@/lib/saspay-apply';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * Crée une page de paiement SasPay (Mobile Money ou carte, en FCFA).
 * Le prix vient de src/lib/pricing.ts ; le navigateur n'envoie que l'article choisi.
 */
export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, { maxRequests: 10, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Vous devez être connecté pour payer.' },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const item = getSaspayItem(String(body?.item || ''), body?.billingCycle);
  if (!item) {
    return NextResponse.json({ success: false, error: 'Article inconnu.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Un abonnement par carte (Stripe) est déjà actif : on refuse un second plan
  // payé via SasPay AVANT le paiement (les packs de crédits restent possibles).
  if (item.kind === 'plan') {
    const { data: current } = await admin
      .from('profiles')
      .select('stripe_subscription_id, subscription_status, plan')
      .eq('id', user.id)
      .maybeSingle();
    if (
      current?.stripe_subscription_id &&
      current.plan !== 'free' &&
      ['active', 'trialing', 'past_due'].includes(current.subscription_status || '')
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vous avez déjà un abonnement actif par carte. Gérez-le depuis votre espace membre avant de payer en FCFA.',
        },
        { status: 409 }
      );
    }
  }

  try {
    // 1. Enregistrer la tentative AVANT la redirection : c'est elle qui relie
    //    la session SasPay au compte et à l'article.
    const { data: row, error: insertError } = await admin
      .from('saspay_checkouts')
      .insert({
        user_id: user.id,
        item_id: item.itemId,
        kind: item.kind,
        billing_cycle: item.kind === 'plan' ? item.cycle : null,
        amount_xof: item.amount,
      })
      .select('id')
      .single();
    if (insertError || !row) throw insertError || new Error('insert_failed');

    // 2. Créer la page de paiement hébergée
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
    const email = user.email || '';
    const session = await createSaspayCheckout({
      amount: item.amount,
      description: `OmniMockup Studio - ${item.label}`,
      customerEmail: email,
      customerName: (user.user_metadata?.full_name as string) || email.split('@')[0] || 'Client OmniMockup',
      returnUrl: `${siteUrl}/api/payments/saspay/return?ref=${row.id}`,
      metadata: { checkout_ref: row.id, item: item.itemId },
    });

    await admin.from('saspay_checkouts').update({ session_id: session.id }).eq('id', row.id);

    return NextResponse.json({ success: true, checkoutUrl: session.checkout_url });
  } catch (err) {
    console.error('[SasPay] Création du paiement impossible :', err);
    return NextResponse.json(
      { success: false, error: 'Impossible de lancer le paiement pour le moment. Réessayez dans quelques minutes.' },
      { status: 502 }
    );
  }
}
