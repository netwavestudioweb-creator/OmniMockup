import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PLANS, CREDIT_PACKS, ORDER_BUMP } from '@/lib/pricing';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Vous devez être connecté pour souscrire un abonnement.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const planId = body?.plan as string | undefined;
    const packId = body?.pack as string | undefined;
    const billing: 'monthly' | 'annual' = body?.billing === 'annual' ? 'annual' : 'monthly';
    const withBump: boolean = body?.withBump === true;

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const admin = createAdminClient();

    // ── Récupération ou création du customer Stripe ──────────────────────────
    const { data: profile } = await admin.from('profiles').select('stripe_customer_id').eq('id', user.id).maybeSingle();
    let customerId = profile?.stripe_customer_id as string | undefined;

    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } });
      customerId = customer.id;
      await admin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id);
    }

    // ── CAS 1 : Achat d'un pack de crédits (paiement unique) ────────────────
    if (packId) {
      const pack = CREDIT_PACKS.find((p) => p.id === packId);
      if (!pack) {
        return NextResponse.json({ success: false, error: `Pack crédits inconnu : ${packId}` }, { status: 400 });
      }

      const envKey = `STRIPE_${packId.toUpperCase()}_PRICE_ID`;
      const priceId = process.env[envKey];
      if (!priceId) {
        return NextResponse.json(
          { success: false, error: `Price Stripe non configuré pour ${packId}. Exécutez npm run setup-stripe.` },
          { status: 500 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { supabase_user_id: user.id, pack_id: packId },
        success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}&success=true&type=credits`,
        cancel_url: `${origin}/pricing?canceled=true`,
      });

      // Tracking
      await admin.from('events').insert({ user_id: user.id, event_name: 'checkout_start', properties: { pack_id: packId, type: 'credits' } }).maybeSingle();

      return NextResponse.json({ success: true, url: session.url });
    }

    // ── CAS 2 : Abonnement ───────────────────────────────────────────────────
    if (!planId || planId === 'free') {
      return NextResponse.json({ success: false, error: 'Identifiant de plan invalide.' }, { status: 400 });
    }

    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) {
      return NextResponse.json({ success: false, error: `Plan inconnu : ${planId}` }, { status: 400 });
    }

    const priceEnvKey = billing === 'annual'
      ? `STRIPE_${planId.toUpperCase()}_ANNUAL_PRICE_ID`
      : `STRIPE_${planId.toUpperCase()}_MONTHLY_PRICE_ID`;

    const priceId = process.env[priceEnvKey];
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: `Price Stripe non configuré (${priceEnvKey}). Exécutez npm run setup-stripe.` },
        { status: 500 }
      );
    }

    // ── Construction des line_items (abonnement + bump optionnel) ─────────────
    // Note : en mode subscription, les line_items avec prix one-time sont ajoutés
    // à la première facture par Stripe Checkout. Doc : https://stripe.com/docs/billing/subscriptions/checkout
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    if (withBump) {
      const bumpPriceId = process.env.STRIPE_BUMP_PITCH_KIT_PRICE_ID;
      if (bumpPriceId) {
        lineItems.push({ price: bumpPriceId, quantity: 1 });
      }
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: lineItems,
      metadata: {
        supabase_user_id: user.id,
        plan: planId,
        billing,
        bump_accepted: withBump ? 'true' : 'false',
      },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan: planId, billing },
      },
      success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    // Tracking
    await admin.from('events').insert({
      user_id: user.id,
      event_name: 'checkout_start',
      properties: { plan: planId, billing, bump_accepted: withBump },
    }).maybeSingle();

    return NextResponse.json({ success: true, url: session.url });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[Checkout Session Error]:', e?.message || err);
    return NextResponse.json({ success: false, error: e?.message || 'Erreur Stripe.' }, { status: 500 });
  }
}
