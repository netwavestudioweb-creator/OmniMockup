import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFedaPayTransaction } from '@/lib/fedapay';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('id') || searchParams.get('transaction_id');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!transactionId) {
    return NextResponse.redirect(`${siteUrl}/pricing?canceled=true`);
  }

  try {
    const transaction = await getFedaPayTransaction(transactionId);
    if (!transaction) {
      return NextResponse.redirect(`${siteUrl}/pricing?error=transaction_not_found`);
    }

    if (transaction.status === 'approved' || transaction.status === 'transferred') {
      const metadata = transaction.custom_metadata || {};
      const userId = metadata.userId || metadata.user_id;
      const plan = (metadata.plan || 'pro') as 'solo' | 'pro' | 'agence';
      const isCreditPack = metadata.isCreditPack === true || String(metadata.isCreditPack) === 'true';
      const credits = Number(metadata.credits || 0);

      if (userId) {
        const admin = createAdminClient();
        if (isCreditPack && credits > 0) {
          // Créditer les crédits achetés
          const { data: prof } = await admin.from('profiles').select('credit_balance').eq('id', userId).maybeSingle();
          const currentBal = prof?.credit_balance ?? 0;
          await admin.from('profiles').update({
            credit_balance: currentBal + credits,
            payment_provider: 'fedapay',
            fedapay_transaction_id: String(transactionId),
            updated_at: new Date().toISOString(),
          }).eq('id', userId);
        } else {
          await admin
            .from('profiles')
            .update({
              plan,
              payment_provider: 'fedapay',
              fedapay_transaction_id: String(transactionId),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId);
        }
      }

      return NextResponse.redirect(
        `${siteUrl}/pricing?success=true&provider=fedapay&plan=${plan}`
      );
    } else if (transaction.status === 'canceled' || transaction.status === 'declined') {
      return NextResponse.redirect(`${siteUrl}/pricing?canceled=true`);
    }

    // Si encore en attente (pending)
    return NextResponse.redirect(
      `${siteUrl}/pricing?pending=true&tx=${transactionId}`
    );
  } catch (error) {
    console.error('Erreur Callback FedaPay:', error);
    return NextResponse.redirect(`${siteUrl}/pricing?error=verification_failed`);
  }
}
