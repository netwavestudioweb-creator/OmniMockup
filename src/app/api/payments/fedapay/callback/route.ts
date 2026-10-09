import { NextRequest, NextResponse } from 'next/server';
import { applyFedaPayTransaction } from '@/lib/fedapay-apply';

export const dynamic = 'force-dynamic';

/**
 * Retour du navigateur après le paiement FedaPay.
 * Le paiement est vérifié auprès de l'API FedaPay et appliqué une seule fois
 * (le webhook peut aussi l'appliquer : le premier arrivé gagne).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get('id') || searchParams.get('transaction_id');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!transactionId) {
    return NextResponse.redirect(`${siteUrl}/pricing?canceled=true`);
  }

  try {
    const result = await applyFedaPayTransaction(transactionId);

    switch (result.status) {
      case 'applied':
        return NextResponse.redirect(
          result.kind === 'credits'
            ? `${siteUrl}/account?success=true&type=credits&provider=fedapay`
            : `${siteUrl}/account?success=true&provider=fedapay&plan=${result.plan}`
        );
      case 'already_applied':
        return NextResponse.redirect(`${siteUrl}/account?success=true&provider=fedapay`);
      case 'pending':
        return NextResponse.redirect(`${siteUrl}/pricing?pending=true&tx=${encodeURIComponent(transactionId)}`);
      default:
        if (result.reason.startsWith('status_')) {
          return NextResponse.redirect(`${siteUrl}/pricing?canceled=true`);
        }
        return NextResponse.redirect(`${siteUrl}/pricing?error=verification_failed`);
    }
  } catch (error) {
    console.error('Erreur Callback FedaPay:', error);
    return NextResponse.redirect(`${siteUrl}/pricing?error=verification_failed`);
  }
}
