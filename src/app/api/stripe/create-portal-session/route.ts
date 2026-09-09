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
        { success: false, error: 'Vous devez être connecté.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { success: false, error: 'Aucun identifiant client Stripe associé à ce compte.' },
        { status: 400 }
      );
    }

    const origin =
      req.headers.get('origin') ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      'http://localhost:3000';

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/account`,
    });

    return NextResponse.json({ success: true, url: portalSession.url });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('[Stripe Portal Session Error]:', error?.message || err);
    return NextResponse.json(
      { success: false, error: error?.message || 'Erreur lors de l’accès au portail Stripe.' },
      { status: 500 }
    );
  }
}
