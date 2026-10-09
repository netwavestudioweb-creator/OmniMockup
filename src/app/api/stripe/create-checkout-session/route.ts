import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { PLANS, CREDIT_PACKS, ORDER_BUMP, STRIPE_LOOKUP_KEYS, Currency } from '@/lib/pricing';

/**
 * Résout un price_id Stripe soit par variable d'environnement, soit dynamiquement par lookup_key
 */
async function resolveStripePriceId(envKey: string, fallbackLookupKey: string): Promise<string | null> {
  // 1. Essai via process.env
  const fromEnv = process.env[envKey];
  if (fromEnv && fromEnv.startsWith('price_')) {
    return fromEnv;
  }

  // 2. Failsafe dynamique via lookup_key Stripe
  try {
    const list = await stripe.prices.list({ lookup_keys: [fallbackLookupKey], limit: 1 });
    if (list.data.length > 0) {
      return list.data[0].id;
    }
  } catch (err) {
    console.warn(`[resolveStripePriceId] Erreur lookup_key ${fallbackLookupKey}:`, err);
  }

  return null;
}

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
    const requestedCurrency: Currency = body?.currency === 'USD' ? 'USD' : 'EUR';

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

      const envKey = `STRIPE_${packId.toUpperCase()}_${requestedCurrency}_PRICE_ID`;
      const fallbackEnvKey = `STRIPE_${packId.toUpperCase()}_PRICE_ID`;
      const lookupKey = requestedCurrency === 'USD'
        ? STRIPE_LOOKUP_KEYS[`${packId}_usd` as keyof typeof STRIPE_LOOKUP_KEYS]
        : STRIPE_LOOKUP_KEYS[`${packId}_eur` as keyof typeof STRIPE_LOOKUP_KEYS];

      let priceId = await resolveStripePriceId(envKey, lookupKey);
      if (!priceId) {
        priceId = await resolveStripePriceId(fallbackEnvKey, lookupKey);
      }

      if (!priceId) {
        return NextResponse.json(
          { success: false, error: `Price Stripe non configuré pour ${packId} (${requestedCurrency}). Exécutez npm run setup-stripe.` },
          { status: 500 }
        );
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: { supabase_user_id: user.id, pack_id: packId, currency: requestedCurrency },
        success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}&success=true&type=credits`,
        cancel_url: `${origin}/pricing?canceled=true`,
      });

      // Tracking
      await admin.from('events').insert({
        user_id: user.id,
        event_name: 'checkout_start',
        properties: { pack_id: packId, type: 'credits', currency: requestedCurrency },
      }).maybeSingle();

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

    const envKey = `STRIPE_${planId.toUpperCase()}_${billing.toUpperCase()}_${requestedCurrency}_PRICE_ID`;
    const fallbackEnvKey = `STRIPE_${planId.toUpperCase()}_${billing.toUpperCase()}_PRICE_ID`;
    const lookupKey = requestedCurrency === 'USD'
      ? STRIPE_LOOKUP_KEYS[`${planId}_${billing}_usd` as keyof typeof STRIPE_LOOKUP_KEYS]
      : STRIPE_LOOKUP_KEYS[`${planId}_${billing}_eur` as keyof typeof STRIPE_LOOKUP_KEYS];

    let priceId = await resolveStripePriceId(envKey, lookupKey);
    if (!priceId) {
      priceId = await resolveStripePriceId(fallbackEnvKey, lookupKey);
    }

    if (!priceId) {
      return NextResponse.json(
        { success: false, error: `Price Stripe non configuré (${envKey}). Exécutez npm run setup-stripe.` },
        { status: 500 }
      );
    }

    // ── Construction des line_items (abonnement + bump optionnel) ─────────────
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
      { price: priceId, quantity: 1 },
    ];

    if (withBump) {
      const bumpEnvKey = `STRIPE_BUMP_PITCH_KIT_${requestedCurrency}_PRICE_ID`;
      const bumpFallbackEnvKey = 'STRIPE_BUMP_PITCH_KIT_PRICE_ID';
      const bumpLookupKey = requestedCurrency === 'USD'
        ? STRIPE_LOOKUP_KEYS.bump_pitch_kit_usd
        : STRIPE_LOOKUP_KEYS.bump_pitch_kit_eur;

      let bumpPriceId = await resolveStripePriceId(bumpEnvKey, bumpLookupKey);
      if (!bumpPriceId) {
        bumpPriceId = await resolveStripePriceId(bumpFallbackEnvKey, bumpLookupKey);
      }

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
        currency: requestedCurrency,
        bump_accepted: withBump ? 'true' : 'false',
      },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan: planId, billing, currency: requestedCurrency },
      },
      success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    // Tracking
    await admin.from('events').insert({
      user_id: user.id,
      event_name: 'checkout_start',
      properties: { plan: planId, billing, currency: requestedCurrency, bump_accepted: withBump },
    }).maybeSingle();

    return NextResponse.json({ success: true, url: session.url });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[Checkout Session Error]:', e?.message || err);
    return NextResponse.json({ success: false, error: e?.message || 'Erreur Stripe.' }, { status: 500 });
  }
}
