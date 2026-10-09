import { NextRequest, NextResponse } from 'next/server';
import { applyFedaPayTransaction } from '@/lib/fedapay-apply';

export const dynamic = 'force-dynamic';

/**
 * Webhook FedaPay. Le contenu reçu sert uniquement à connaître l'ID de la
 * transaction : son état réel est relu auprès de l'API FedaPay avec la clé
 * secrète, puis appliqué une seule fois (voir applyFedaPayTransaction).
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Format JSON invalide' }, { status: 400 });
    }

    const entity = (body?.entity || body?.data || body) as Record<string, unknown> | undefined;
    const transactionId = entity?.id as string | number | undefined;

    if (!transactionId) {
      return NextResponse.json({ error: 'ID de transaction introuvable' }, { status: 400 });
    }

    const result = await applyFedaPayTransaction(transactionId);
    console.log(`[FedaPay Webhook] tx #${transactionId} →`, result);

    // Erreur côté serveur : on répond 500 pour que FedaPay renvoie le webhook plus tard
    if (result.status === 'failed' && result.reason === 'apply_failed') {
      return NextResponse.json({ received: false, ...result }, { status: 500 });
    }

    return NextResponse.json({ received: true, ...result });
  } catch (error: unknown) {
    console.error('[FedaPay Webhook] Exception interceptée:', error);
    return NextResponse.json({ error: 'Erreur interne du webhook FedaPay' }, { status: 500 });
  }
}
