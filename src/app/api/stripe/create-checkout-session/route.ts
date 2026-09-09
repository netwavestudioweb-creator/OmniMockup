import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Vous devez être connecté pour souscrire un abonnement.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const plan = body?.plan as 'pro' | 'agence';

    if (plan !== 'pro' && plan !== 'agence') {
      return NextResponse.json(
        { success: false, error: 'Formule d’abonnement invalide (choisir "pro" ou "agence").' },
        { status: 400 }
      );
    }

    const priceId =
      plan === 'pro'
        ? process.env.STRIPE_PRO_PRICE_ID
        : process.env.STRIPE_AGENCE_PRICE_ID;

    if (!priceId) {
      return NextResponse.json(
        {
          success: false,
          error: `Identifiant de tarif Stripe manquant pour le plan "${plan}". Veuillez exécuter setup-stripe-products.ts.`,
        },
        { status: 500 }
      );
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, plan')
      .eq('id', user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    // Si le client Stripe n'existe pas encore pour cet utilisateur, on le crée
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      await admin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    // Création de la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan,
        },
      },
      success_url: `${origin}/account?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/pricing?canceled=true`,
      allow_promotion_codes: true,
    });

    return NextResponse.json({ success: true, url: session.url });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('[Stripe Checkout Session Error]:', error?.message || err);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erreur lors de la création de la session Stripe.' },
      { status: 500 }
    );
  }
}
