import Stripe from 'stripe';

const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder_for_build';

export const stripe = new Stripe(apiKey, {
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
  typescript: true,
});
