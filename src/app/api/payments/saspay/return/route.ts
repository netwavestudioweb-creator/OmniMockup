import { NextRequest, NextResponse } from 'next/server';
import { applySaspayCheckout } from '@/lib/saspay-apply';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retour du navigateur après un paiement SasPay réussi.
 * Le paiement est revérifié auprès de SasPay et appliqué une seule fois
 * (le webhook peut aussi l'appliquer : le premier arrivé gagne).
 */
export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin;
  const ref = req.nextUrl.searchParams.get('ref') || '';
  if (!UUID_RE.test(ref)) {
    return NextResponse.redirect(`${siteUrl}/pricing?error=verification_failed`);
  }

  try {
    const result = await applySaspayCheckout(ref);
    switch (result.status) {
      case 'applied':
        return NextResponse.redirect(
          result.kind === 'credits'
            ? `${siteUrl}/account?success=true&type=credits&provider=saspay`
            : `${siteUrl}/account?success=true&provider=saspay&plan=${result.plan}`
        );
      case 'already_applied':
        return NextResponse.redirect(`${siteUrl}/account?success=true&provider=saspay`);
      case 'pending':
        return NextResponse.redirect(`${siteUrl}/pricing?pending=true`);
      default:
        return NextResponse.redirect(`${siteUrl}/pricing?error=verification_failed`);
    }
  } catch (err) {
    console.error('[SasPay] Retour de paiement :', err);
    return NextResponse.redirect(`${siteUrl}/pricing?error=verification_failed`);
  }
}
