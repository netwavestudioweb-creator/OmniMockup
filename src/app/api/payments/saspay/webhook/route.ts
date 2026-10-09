import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSaspayCheckout, isValidSaspayWebhook } from '@/lib/saspay';
import { applySaspayCheckout } from '@/lib/saspay-apply';

export const dynamic = 'force-dynamic';

const PENDING_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

/**
 * Webhook SasPay (événement transaction.success).
 * 1. La signature HMAC et l'horodatage sont vérifiés sur le corps brut.
 * 2. Le webhook ne contient pas la session de checkout : on retrouve notre
 *    tentative en attente dont la session SasPay porte cette transaction.
 * 3. Le paiement est relu auprès de l'API SasPay puis appliqué une seule fois.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const valid = isValidSaspayWebhook(
    rawBody,
    req.headers.get('x-webhook-signature'),
    req.headers.get('x-webhook-timestamp')
  );
  if (!valid) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 403 });
  }

  let event: { event?: string; data?: { id?: string; amount?: string; currency?: string } } = {};
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Corps invalide' }, { status: 400 });
  }

  if (event.event !== 'transaction.success' || !event.data?.id) {
    return NextResponse.json({ received: true, ignored: event.event || 'unknown' });
  }

  const transactionId = String(event.data.id);
  const amount = Math.round(Number(event.data.amount));

  try {
    const admin = createAdminClient();
    let query = admin
      .from('saspay_checkouts')
      .select('id, session_id')
      .eq('status', 'pending')
      .not('session_id', 'is', null)
      .gte('created_at', new Date(Date.now() - PENDING_WINDOW_MS).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);
    if (Number.isFinite(amount) && amount > 0) query = query.eq('amount_xof', amount);

    const { data: candidates, error } = await query;
    if (error) throw error;

    for (const row of candidates || []) {
      const session = await getSaspayCheckout(row.session_id as string);
      if (session.transaction !== transactionId) continue;

      const result = await applySaspayCheckout(row.id);
      console.log(`[SasPay Webhook] transaction ${transactionId} →`, result);
      // Erreur côté serveur : 500 pour que SasPay renvoie le webhook plus tard
      if (result.status === 'failed' && result.reason === 'apply_failed') {
        return NextResponse.json({ received: false }, { status: 500 });
      }
      return NextResponse.json({ received: true, ...result });
    }

    // Déjà appliqué par le retour navigateur, ou paiement étranger à OmniMockup
    return NextResponse.json({ received: true, matched: false });
  } catch (err) {
    console.error('[SasPay Webhook] Erreur :', err);
    return NextResponse.json({ error: 'Erreur interne du webhook SasPay' }, { status: 500 });
  }
}
