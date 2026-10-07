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
      const plan = (metadata.plan || 'pro') as 'starter' | 'creator' | 'pro' | 'agence';

      if (userId) {
        const admin = createAdminClient();
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
