import fs from 'fs';
import path from 'path';
import Stripe from 'stripe';

async function main() {
  const envLocalPath = path.resolve(process.cwd(), '.env.local');
  let envContent = '';
  if (fs.existsSync(envLocalPath)) {
    envContent = fs.readFileSync(envLocalPath, 'utf8');
  }

  // Extraction de STRIPE_SECRET_KEY depuis .env.local si non présent dans process.env
  let stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey && envContent) {
    const match = envContent.match(/^STRIPE_SECRET_KEY=(.*)$/m);
    if (match) {
      stripeKey = match[1].trim();
    }
  }

  if (!stripeKey || stripeKey.startsWith('your_') || !stripeKey.startsWith('sk_')) {
    console.error('❌ ERREUR : STRIPE_SECRET_KEY n\'est pas configurée dans .env.local.');
    console.error('Veuillez ajouter votre clé secrète Stripe de test (ex: STRIPE_SECRET_KEY=sk_test_...) dans .env.local avant d\'exécuter ce script.');
    process.exit(1);
  }

  console.log('⚡ Initialisation de la création des produits Stripe...');
  const stripe = new Stripe(stripeKey, {
    apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
  });

  try {
    // 1. Produit Pro (19€/mois)
    console.log('Création du produit Pro (19€/mois)...');
    const proProduct = await stripe.products.create({
      name: 'OmniMockup Pro',
      description: 'Accès illimité aux analyses visuelles IA, justifications du Directeur Artistique et exports HD sans filigrane.',
      metadata: {
        plan_id: 'pro',
      },
    });

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 1900, // 19.00 EUR
      currency: 'eur',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_id: 'pro',
      },
    });

    console.log(`✅ Produit Pro créé avec succès :`);
    console.log(`   Product ID : ${proProduct.id}`);
    console.log(`   Price ID   : ${proPrice.id}`);

    // 2. Produit Agence (49€/mois)
    console.log('\nCréation du produit Agence (49€/mois)...');
    const agencyProduct = await stripe.products.create({
      name: 'OmniMockup Agence',
      description: 'Pour les studios et agences : analyses illimitées, exports 4K studio, marque blanche totale et gestion multi-projets.',
      metadata: {
        plan_id: 'agence',
      },
    });

    const agencyPrice = await stripe.prices.create({
      product: agencyProduct.id,
      unit_amount: 4900, // 49.00 EUR
      currency: 'eur',
      recurring: {
        interval: 'month',
      },
      metadata: {
        plan_id: 'agence',
      },
    });

    console.log(`✅ Produit Agence créé avec succès :`);
    console.log(`   Product ID : ${agencyProduct.id}`);
    console.log(`   Price ID   : ${agencyPrice.id}`);

    console.log('\n=============================================');
    console.log('RÉSUMÉ DES PRICE IDS GÉNÉRÉS :');
    console.log(`STRIPE_PRO_PRICE_ID=${proPrice.id}`);
    console.log(`STRIPE_AGENCE_PRICE_ID=${agencyPrice.id}`);
    console.log('=============================================\n');

    // Mise à jour automatique de .env.local avec les Price IDs
    let updatedEnv = envContent;
    if (updatedEnv.includes('STRIPE_PRO_PRICE_ID=')) {
      updatedEnv = updatedEnv.replace(/^STRIPE_PRO_PRICE_ID=.*$/m, `STRIPE_PRO_PRICE_ID=${proPrice.id}`);
    } else {
      updatedEnv += `\nSTRIPE_PRO_PRICE_ID=${proPrice.id}`;
    }

    if (updatedEnv.includes('STRIPE_AGENCE_PRICE_ID=')) {
      updatedEnv = updatedEnv.replace(/^STRIPE_AGENCE_PRICE_ID=.*$/m, `STRIPE_AGENCE_PRICE_ID=${agencyPrice.id}`);
    } else {
      updatedEnv += `\nSTRIPE_AGENCE_PRICE_ID=${agencyPrice.id}`;
    }

    fs.writeFileSync(envLocalPath, updatedEnv.trim() + '\n', 'utf8');
    console.log('💾 Les Price IDs ont été automatiquement enregistrés dans .env.local !');
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error('❌ Erreur lors de l\'appel API Stripe :', error?.message || err);
    process.exit(1);
  }
}

main();
