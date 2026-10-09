// scripts/setup-stripe-products.ts
// Script idempotent : utilise des lookup_keys stables — aucun doublon à chaque exécution.
// Support multi-devises complet : EUR (€) et USD ($).
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

// Cache local de produits pour éviter de dupliquer les produits entre EUR et USD
const productCache: Record<string, string> = {};

// ─────────────────────────────────────────────────────────────────────────────
// HELPER : upsert idempotent d'un prix Stripe via lookup_key
// ─────────────────────────────────────────────────────────────────────────────
async function upsertPrice(params: {
  productKey: string;
  productName: string;
  productDescription: string;
  productMetadata: Record<string, string>;
  lookupKey: string;
  unitAmountCents: number;
  currency: 'eur' | 'usd';
  recurring?: { interval: 'month' | 'year' };
}): Promise<{ productId: string; priceId: string }> {
  // 1. Cherche un prix existant via lookup_key
  const existing = await stripe.prices.list({ lookup_keys: [params.lookupKey], expand: ['data.product'] });

  if (existing.data.length > 0) {
    const price = existing.data[0];
    const product = price.product as Stripe.Product;
    productCache[params.productKey] = product.id;
    console.log(`  ↩️  Existant [${params.lookupKey}] (${params.currency.toUpperCase()}) → price ${price.id}`);
    return { productId: product.id, priceId: price.id };
  }

  // 2. Réutilise le produit existant dans le cache ou crée un nouveau produit
  let productId = productCache[params.productKey];
  if (!productId) {
    const product = await stripe.products.create({
      name: params.productName,
      description: params.productDescription,
      metadata: params.productMetadata,
    });
    productId = product.id;
    productCache[params.productKey] = productId;
  }

  // 3. Crée le prix avec lookup_key
  const price = await stripe.prices.create({
    product: productId,
    unit_amount: params.unitAmountCents,
    currency: params.currency,
    ...(params.recurring ? { recurring: params.recurring } : {}),
    lookup_key: params.lookupKey,
    transfer_lookup_key: true,
    metadata: params.productMetadata,
  });

  console.log(`  ✅ Créé [${params.lookupKey}] (${params.currency.toUpperCase()}) → price ${price.id}`);
  return { productId, priceId: price.id };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n⚡ OmniMockup Studio — Setup Stripe Multi-Devises (EUR & USD idempotent)\n');

  const newEnvVars: Record<string, string> = {};

  // ── ABONNEMENTS ──────────────────────────────────────────────────────────────
  const subscriptionPlans = PLANS.filter((p) => p.id !== 'free') as (typeof PLANS[number] & { id: 'solo' | 'pro' | 'agence' })[];

  for (const plan of subscriptionPlans) {
    console.log(`\n📦 Plan ${plan.name.toUpperCase()}`);

    // Mensuel EUR
    const monthlyEur = await upsertPrice({
      productKey: `${plan.id}_monthly`,
      productName: `OmniMockup ${plan.name}`,
      productDescription: plan.description,
      productMetadata: { plan_id: plan.id, billing: 'monthly' },
      lookupKey: STRIPE_LOOKUP_KEYS[`${plan.id}_monthly_eur` as keyof typeof STRIPE_LOOKUP_KEYS],
      unitAmountCents: Math.round(plan.monthlyEur * 100),
      currency: 'eur',
      recurring: { interval: 'month' },
    });
    newEnvVars[`STRIPE_${plan.id.toUpperCase()}_MONTHLY_EUR_PRICE_ID`] = monthlyEur.priceId;
    newEnvVars[`STRIPE_${plan.id.toUpperCase()}_MONTHLY_PRICE_ID`] = monthlyEur.priceId;

    // Mensuel USD
    const monthlyUsd = await upsertPrice({
      productKey: `${plan.id}_monthly`,
      productName: `OmniMockup ${plan.name}`,
      productDescription: plan.description,
      productMetadata: { plan_id: plan.id, billing: 'monthly' },
      lookupKey: STRIPE_LOOKUP_KEYS[`${plan.id}_monthly_usd` as keyof typeof STRIPE_LOOKUP_KEYS],
      unitAmountCents: Math.round(plan.monthlyUsd * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
    });
    newEnvVars[`STRIPE_${plan.id.toUpperCase()}_MONTHLY_USD_PRICE_ID`] = monthlyUsd.priceId;

    // Annuel EUR
    const annualEur = await upsertPrice({
      productKey: `${plan.id}_annual`,
      productName: `OmniMockup ${plan.name} (Annuel)`,
      productDescription: `${plan.description} — 2 mois offerts, facturé annuellement.`,
      productMetadata: { plan_id: plan.id, billing: 'annual' },
      lookupKey: STRIPE_LOOKUP_KEYS[`${plan.id}_annual_eur` as keyof typeof STRIPE_LOOKUP_KEYS],
      unitAmountCents: Math.round(plan.annualEur * 100),
      currency: 'eur',
      recurring: { interval: 'year' },
    });
    newEnvVars[`STRIPE_${plan.id.toUpperCase()}_ANNUAL_EUR_PRICE_ID`] = annualEur.priceId;
    newEnvVars[`STRIPE_${plan.id.toUpperCase()}_ANNUAL_PRICE_ID`] = annualEur.priceId;

    // Annuel USD
    const annualUsd = await upsertPrice({
      productKey: `${plan.id}_annual`,
      productName: `OmniMockup ${plan.name} (Annuel)`,
      productDescription: `${plan.description} — 2 mois offerts, facturé annuellement.`,
      productMetadata: { plan_id: plan.id, billing: 'annual' },
      lookupKey: STRIPE_LOOKUP_KEYS[`${plan.id}_annual_usd` as keyof typeof STRIPE_LOOKUP_KEYS],
      unitAmountCents: Math.round(plan.annualUsd * 100),
      currency: 'usd',
      recurring: { interval: 'year' },
    });
    newEnvVars[`STRIPE_${plan.id.toUpperCase()}_ANNUAL_USD_PRICE_ID`] = annualUsd.priceId;
  }

  // ── PACKS DE CRÉDITS (paiement unique) ───────────────────────────────────────
  console.log('\n🪙 Packs de crédits');

  for (const pack of CREDIT_PACKS) {
    // Pack EUR
    const packEur = await upsertPrice({
      productKey: `credit_pack_${pack.id}`,
      productName: `OmniMockup — ${pack.name}`,
      productDescription: `${pack.credits} crédits à vie (aucune expiration). ${pack.badge ?? ''}`,
      productMetadata: { pack_id: pack.id, credits: String(pack.credits) },
      lookupKey: STRIPE_LOOKUP_KEYS[`${pack.id}_eur` as keyof typeof STRIPE_LOOKUP_KEYS],
      unitAmountCents: Math.round(pack.priceEur * 100),
      currency: 'eur',
    });
    newEnvVars[`STRIPE_${pack.id.toUpperCase()}_EUR_PRICE_ID`] = packEur.priceId;
    newEnvVars[`STRIPE_${pack.id.toUpperCase()}_PRICE_ID`] = packEur.priceId;

    // Pack USD
    const packUsd = await upsertPrice({
      productKey: `credit_pack_${pack.id}`,
      productName: `OmniMockup — ${pack.name}`,
      productDescription: `${pack.credits} crédits à vie (aucune expiration). ${pack.badge ?? ''}`,
      productMetadata: { pack_id: pack.id, credits: String(pack.credits) },
      lookupKey: STRIPE_LOOKUP_KEYS[`${pack.id}_usd` as keyof typeof STRIPE_LOOKUP_KEYS],
      unitAmountCents: Math.round(pack.priceUsd * 100),
      currency: 'usd',
    });
    newEnvVars[`STRIPE_${pack.id.toUpperCase()}_USD_PRICE_ID`] = packUsd.priceId;
  }

  // ── ORDER BUMP ────────────────────────────────────────────────────────────────
  console.log('\n🎁 Order Bump');

  // Bump EUR
  const bumpEur = await upsertPrice({
    productKey: 'bump_pitch_kit',
    productName: `OmniMockup — ${ORDER_BUMP.name}`,
    productDescription: ORDER_BUMP.description,
    productMetadata: { bump_id: ORDER_BUMP.id },
    lookupKey: STRIPE_LOOKUP_KEYS.bump_pitch_kit_eur,
    unitAmountCents: Math.round(ORDER_BUMP.priceEur * 100),
    currency: 'eur',
  });
  newEnvVars['STRIPE_BUMP_PITCH_KIT_EUR_PRICE_ID'] = bumpEur.priceId;
  newEnvVars['STRIPE_BUMP_PITCH_KIT_PRICE_ID'] = bumpEur.priceId;

  // Bump USD
  const bumpUsd = await upsertPrice({
    productKey: 'bump_pitch_kit',
    productName: `OmniMockup — ${ORDER_BUMP.name}`,
    productDescription: ORDER_BUMP.description,
    productMetadata: { bump_id: ORDER_BUMP.id },
    lookupKey: STRIPE_LOOKUP_KEYS.bump_pitch_kit_usd,
    unitAmountCents: Math.round(ORDER_BUMP.priceUsd * 100),
    currency: 'usd',
  });
  newEnvVars['STRIPE_BUMP_PITCH_KIT_USD_PRICE_ID'] = bumpUsd.priceId;

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
  console.log('💡 Configuration Stripe multi-devises terminée avec succès.');
}

main().catch((err) => {
  console.error('❌', err?.message || err);
  process.exit(1);
});
