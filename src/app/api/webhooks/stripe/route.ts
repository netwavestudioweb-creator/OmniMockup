import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { CREDIT_PACKS } from '@/lib/pricing';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: Stripe.Event;

  try {
    if (!webhookSecret || !signature) {
      console.error('[Webhook] Secret ou signature manquant.');
      return NextResponse.json({ error: 'Configuration webhook invalide.' }, { status: 400 });
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error(`[Webhook] Signature invalide : ${e?.message}`);
    return NextResponse.json({ error: `Webhook Error: ${e?.message}` }, { status: 400 });
  }

  const admin = createAdminClient();

  try {
    switch (event.type) {

      // ──────────────────────────────────────────────────────────────────────
      // 1. PAIEMENT RÉUSSI — abonnement ou pack de crédits
      // ──────────────────────────────────────────────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string | null;
        const mode = session.mode;

        // Idempotence : vérifier si cet event a déjà été traité
        if (event.id) {
          const { data: existing } = await admin
            .from('credit_transactions')
            .select('id')
            .eq('stripe_event_id', event.id)
            .maybeSingle();
          if (existing) {
            console.log(`[Webhook] Événement ${event.id} déjà traité — ignoré.`);
            return NextResponse.json({ received: true });
          }
        }

        // ── Abonnement ─────────────────────────────────────────────────────
        if (mode === 'subscription' && subscriptionId) {
          const plan = (session.metadata?.plan as 'solo' | 'pro' | 'agence') || 'pro';
          const billing = (session.metadata?.billing as 'monthly' | 'annual') || 'monthly';

          const updateData = {
            plan,
            plan_expires_at: null, // abonnement Stripe : pas de date de fin fixe
            billing_cycle: billing,
            subscription_status: 'active',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            updated_at: new Date().toISOString(),
          };

          if (userId) {
            await admin.from('profiles').update(updateData).eq('id', userId);
          } else if (customerId) {
            await admin.from('profiles').update(updateData).eq('stripe_customer_id', customerId);
          }

          // Order bump : si pitch_kit acheté, créditer 10 crédits
          const bumpAccepted = session.metadata?.bump_accepted === 'true';
          if (bumpAccepted && userId) {
            await creditUser(admin, userId, 10, 'order_bump_pitch_kit', event.id);
          }
        }

        // ── Paiement unique (pack de crédits) ──────────────────────────────
        if (mode === 'payment' && userId) {
          const packId = session.metadata?.pack_id;
          const pack = CREDIT_PACKS.find((p) => p.id === packId);
          if (pack) {
            await creditUser(admin, userId, pack.credits, `credit_pack_${packId}`, event.id);
          }
        }

        break;
      }

      // ──────────────────────────────────────────────────────────────────────
      // 2. ABONNEMENT MIS À JOUR
      // ──────────────────────────────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;
        const plan = (subscription.metadata?.plan as 'solo' | 'pro' | 'agence') || 'pro';

        const newPlan = (status === 'active' || status === 'trialing') ? plan : 'free';
        await admin.from('profiles').update({
          plan: newPlan,
          plan_expires_at: null,
          subscription_status: status,
          stripe_subscription_id: subscription.id,
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId).eq('stripe_subscription_id', subscription.id);
        break;
      }

      // ──────────────────────────────────────────────────────────────────────
      // 3. ABONNEMENT RÉSILIÉ
      // ──────────────────────────────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await admin.from('profiles').update({
          plan: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId).eq('stripe_subscription_id', subscription.id);
        break;
      }

      // ──────────────────────────────────────────────────────────────────────
      // 4. PAIEMENT ÉCHOUÉ — bandeau affiché dans /account
      // ──────────────────────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        await admin.from('profiles').update({
          subscription_status: 'past_due',
          updated_at: new Date().toISOString(),
        }).eq('stripe_customer_id', customerId);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: unknown) {
    const e = err as { message?: string };
    console.error('[Webhook DB Error]:', e?.message || err);
    return NextResponse.json({ error: 'Erreur mise à jour BDD' }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER — Crédit idempotent
// ─────────────────────────────────────────────────────────────────────────────
async function creditUser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  delta: number,
  reason: string,
  stripeEventId?: string
): Promise<void> {
  // Verrou (UNIQUE sur stripe_event_id) + ajout des crédits dans UNE transaction SQL
  const { data, error } = await admin.rpc('grant_credits_once', {
    p_user_id: userId,
    p_delta: delta,
    p_reason: reason,
    p_stripe_event: stripeEventId ?? null,
    p_external_ref: stripeEventId ? null : `stripe:${reason}:${userId}:${Date.now()}`,
  });
  if (error) throw error; // Stripe renverra le webhook
  if (data === 'already_applied') {
    console.log(`[Webhook] Crédit déjà appliqué pour event ${stripeEventId} — ignoré.`);
    return;
  }

  console.log(`[Webhook] +${delta} crédits → user ${userId} (raison: ${reason})`);
}
