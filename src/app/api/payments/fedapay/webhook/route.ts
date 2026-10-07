import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFedaPayTransaction } from '@/lib/fedapay';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Format JSON invalide' }, { status: 400 });
    }

    const eventName = (typeof body?.name === 'string' ? body.name : typeof body?.event === 'string' ? body.event : '') as string;
    const entity = (body?.entity || body?.data || body) as Record<string, unknown> | undefined;
    const transactionId = entity?.id as string | number | undefined;

    console.log(`[FedaPay Webhook] Événement reçu: "${eventName}" pour transaction #${transactionId}`);

    if (!transactionId) {
      return NextResponse.json({ error: 'ID de transaction introuvable' }, { status: 400 });
    }

    // Sécurité maximale : Interroger directement l'API officielle FedaPay avec la clé secrète
    // pour attester l'authenticité et l'état 'approved' de la transaction
    const officialTx = await getFedaPayTransaction(transactionId);
    if (!officialTx) {
      console.error(`[FedaPay Webhook] Transaction #${transactionId} introuvable sur l'API FedaPay.`);
      return NextResponse.json({ error: 'Transaction invalide' }, { status: 404 });
    }

    if (officialTx.status === 'approved' || officialTx.status === 'transferred') {
      const metadata = officialTx.custom_metadata || {};
      const userId = metadata.userId || metadata.user_id;
      const plan = (metadata.plan || 'pro') as string;

      if (!userId) {
        console.error(`[FedaPay Webhook] Aucun userId dans custom_metadata pour tx #${transactionId}`);
        return NextResponse.json(
          { error: 'userId manquant dans les métadonnées de transaction' },
          { status: 400 }
        );
      }

      console.log(`[FedaPay Webhook] Validation paiement MoMo pour l'utilisateur ${userId} -> Plan: ${plan}`);

      // Mise à jour de la table profiles dans Supabase
      const admin = createAdminClient();
      const { error: updateError } = await admin
        .from('profiles')
        .update({
          plan: plan,
          payment_provider: 'fedapay',
          fedapay_transaction_id: String(transactionId),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[FedaPay Webhook] Erreur mise à jour profil Supabase:', updateError);
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour Supabase' },
          { status: 500 }
        );
      }

      console.log(`[FedaPay Webhook] Profil Supabase mis à jour avec succès avec le plan ${plan} !`);
    } else {
      console.log(`[FedaPay Webhook] Transaction #${transactionId} avec statut "${officialTx.status}" - Aucune activation requise.`);
    }

    return NextResponse.json({ received: true, status: officialTx?.status });
  } catch (error: unknown) {
    console.error('[FedaPay Webhook] Exception interceptée:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du webhook FedaPay';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
