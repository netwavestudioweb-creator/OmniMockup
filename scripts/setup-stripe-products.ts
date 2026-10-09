// scripts/setup-stripe-products.ts
// Script idempotent : utilise des lookup_keys stables — aucun doublon à chaque exécution.
// Usage : npx ts-node --project tsconfig.json scripts/setup-stripe-products.ts

import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';
import { PLANS, CREDIT_PACKS, ORDER_BUMP, STRIPE_LOOKUP_KEYS } from '../src/lib/pricing';

// ─────────────────────────────────────────────────────────────────────────────
// LECTURE DE LA CLÉ STRIPE
// ─────────────────────────────────────────────────────────────────────────────
const envLocalPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
}

function readEnvVar(name: string): string {
  const match = envContent.match(new RegExp(`^${name}=(.*)$`, 'm'));
  return (match?.[1] ?? process.env[name] ?? '').trim();
}

const stripeKey = readEnvVar('STRIPE_SECRET_KEY');
if (!stripeKey || !stripeKey.startsWith('sk_')) {
  console.error('❌ STRIPE_SECRET_KEY manquante ou invalide dans .env.local');
  process.exit(1);
}

const stripe = new Stripe(stripeKey, {
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : upsert idempotent d'un prix Stripe via lookup_key
// ─────────────────────────────────────────────────────────────────────────────
async function upsertPrice(params: {
  productName: string;
  productDescription: string;
  productMetadata: Record<string, string>;
  lookupKey: string;
  unitAmountCents: number;
  currency: 'eur';
  recurring?: { interval: 'month' | 'year' };
}): Promise<{ productId: string; priceId: string }> {
  // 1. Cherche un prix existant via lookup_key
  const existing = await stripe.prices.list({ lookup_keys: [params.lookupKey], expand: ['data.product'] });

  if (existing.data.length > 0) {
    const price = existing.data[0];
    const product = price.product as Stripe.Product;
    console.log(`  ↩️  Existant [${params.lookupKey}] → price ${price.id}`);
    return { productId: product.id, priceId: price.id };
  }

  // 2. Crée le produit (ou réutilise via name+metadata)
  const product = await stripe.products.create({
    name: params.productName,
    description: params.productDescription,
    metadata: params.productMetadata,
  });

  // 3. Crée le prix avec lookup_key
  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: params.unitAmountCents,
    currency: params.currency,
    ...(params.recurring ? { recurring: params.recurring } : {}),
    lookup_key: params.lookupKey,
    transfer_lookup_key: true,
    metadata: params.productMetadata,
  });

  console.log(`  ✅ Créé [${params.lookupKey}] → price ${price.id}`);
  return { productId: product.id, priceId: price.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n⚡ OmniMockup Studio — Setup Stripe (idempotent)\n');

  const newEnvVars: Record<string, string> = {};

  // ── ABONNEMENTS ──────────────────────────────────────────────────────────────
  const subscriptionPlans = PLANS.filter((p) => p.id !== 'free') as (typeof PLANS[number] & { id: 'solo' | 'pro' | 'agence' })[];

  for (const plan of subscriptionPlans) {
    console.log(`\n📦 Plan ${plan.name.toUpperCase()}`);

    // Mensuel
    const monthly = await upsertPrice({
      productName: `OmniMockup ${plan.name}`,
      productDescription: plan.description,
      productMetadata: { plan_id: plan.id, billing: 'monthly' },
      lookupKey: STRIPE_LOOKUP_KEYS[`${plan.id}_monthly` as keyof typeof STRIPE_LOOKUP_KEYS],
      unitAmountCents: Math.round(plan.monthlyEur * 100),
      currency: 'eur',
      recurring: { interval: 'month' },
    });
    newEnvVars[`STRIPE_${plan.id.toUpperCase()}_MONTHLY_PRICE_ID`] = monthly.priceId;

    // Annuel (facturé en 1 fois = 10 mois)
    const annual = await upsertPrice({
      productName: `OmniMockup ${plan.name} (Annuel)`,
      productDescription: `${plan.description} — 2 mois offerts, facturé annuellement.`,
      productMetadata: { plan_id: plan.id, billing: 'annual' },
      lookupKey: STRIPE_LOOKUP_KEYS[`${plan.id}_annual` as keyof typeof STRIPE_LOOKUP_KEYS],
      unitAmountCents: Math.round(plan.annualEur * 100),
      currency: 'eur',
      recurring: { interval: 'year' },
    });
    newEnvVars[`STRIPE_${plan.id.toUpperCase()}_ANNUAL_PRICE_ID`] = annual.priceId;
  }

  // ── PACKS DE CRÉDITS (paiement unique) ───────────────────────────────────────
  console.log('\n🪙 Packs de crédits');

  for (const pack of CREDIT_PACKS) {
    const result = await upsertPrice({
      productName: `OmniMockup — ${pack.name}`,
      productDescription: `${pack.credits} crédits à vie (aucune expiration). ${pack.badge ?? ''}`,
      productMetadata: { pack_id: pack.id, credits: String(pack.credits) },
      lookupKey: STRIPE_LOOKUP_KEYS[pack.id as keyof typeof STRIPE_LOOKUP_KEYS],
      unitAmountCents: Math.round(pack.priceEur * 100),
      currency: 'eur',
    });
    newEnvVars[`STRIPE_${pack.id.toUpperCase()}_PRICE_ID`] = result.priceId;
  }

  // ── ORDER BUMP ────────────────────────────────────────────────────────────────
  console.log('\n🎁 Order Bump');
  const bump = await upsertPrice({
    productName: `OmniMockup — ${ORDER_BUMP.name}`,
    productDescription: ORDER_BUMP.description,
    productMetadata: { bump_id: ORDER_BUMP.id },
    lookupKey: STRIPE_LOOKUP_KEYS.bump_pitch_kit,
    unitAmountCents: Math.round(ORDER_BUMP.priceEur * 100),
    currency: 'eur',
  });
  newEnvVars['STRIPE_BUMP_PITCH_KIT_PRICE_ID'] = bump.priceId;

  // ── MISE À JOUR .env.local ────────────────────────────────────────────────────
  let updatedEnv = envContent;
  for (const [key, value] of Object.entries(newEnvVars)) {
    if (updatedEnv.includes(`${key}=`)) {
      updatedEnv = updatedEnv.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${value}`);
    } else {
      updatedEnv += `\n${key}=${value}`;
    }
  }
  fs.writeFileSync(envLocalPath, updatedEnv.trimEnd() + '\n', 'utf8');

  console.log('\n══════════════════════════════════════════════════════');
  console.log('✅ RÉSUMÉ DES PRICE IDs (écrits dans .env.local) :');
  for (const [key, value] of Object.entries(newEnvVars)) {
    console.log(`  ${key}=${value}`);
  }
  console.log('══════════════════════════════════════════════════════\n');
  console.log('💡 Redémarrez le serveur Next.js pour charger les nouvelles variables.');
}

main().catch((err) => {
  console.error('❌', err?.message || err);
  process.exit(1);
});
