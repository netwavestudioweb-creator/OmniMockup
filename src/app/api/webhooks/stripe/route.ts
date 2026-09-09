import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret || !signature) {
      console.error('[Stripe Webhook Error]: Signature ou STRIPE_WEBHOOK_SECRET manquant.');
      return NextResponse.json(
        { error: 'Signature Stripe manquante ou secret de webhook non configuré.' },
        { status: 400 }
      );
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error(`[Stripe Webhook Error]: Signature invalide : ${error?.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error?.message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {
      // 1. Session de paiement terminée avec succès
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = (session.metadata?.plan as 'pro' | 'agence') || 'pro';
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        console.log(`[Stripe Webhook] checkout.session.completed pour user ${userId}, plan ${plan}`);

        if (userId) {
          await admin
            .from('profiles')
            .update({
              plan,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        } else if (customerId) {
          await admin
            .from('profiles')
            .update({
              plan,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      // 2. Abonnement modifié ou statut renouvelé
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const plan = (subscription.metadata?.plan as 'pro' | 'agence') || 'pro';

        console.log(`[Stripe Webhook] customer.subscription.updated : client ${customerId}, statut: ${status}`);

        const newPlan = (status === 'active' || status === 'trialing') ? plan : 'free';

        await admin
          .from('profiles')
          .update({
            plan: newPlan,
            stripe_subscription_id: subscription.id,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      // 3. Abonnement résilié ou expiré
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log(`[Stripe Webhook] customer.subscription.deleted : résiliation pour client ${customerId}`);

        await admin
          .from('profiles')
          .update({
            plan: 'free',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      default:
        // Événement non traité
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('[Stripe Webhook Database Update Error]:', error?.message || err);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la base de données' },
      { status: 500 }
    );
  }
}
