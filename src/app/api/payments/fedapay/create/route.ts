import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createFedaPayCheckout, FEDAPAY_PLANS_FCFA } from '@/lib/fedapay';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Vous devez être connecté pour souscrire un abonnement via Mobile Money.',
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const plan = (body?.plan || 'pro') as string;
    const billingCycle = (body?.billingCycle || 'monthly') as 'monthly' | 'annual';
    const phoneNumber = (body?.phoneNumber || '').trim();

    const planConfig = FEDAPAY_PLANS_FCFA[plan];
    if (!planConfig) {
      return NextResponse.json(
        {
          success: false,
          error: `Le forfait "${plan}" n'est pas reconnu.`,
        },
        { status: 400 }
      );
    }

    // Calcul du montant selon le cycle
    const amount =
      billingCycle === 'annual'
        ? planConfig.annualTotal
        : planConfig.monthlyPrice;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const callbackUrl = `${siteUrl}/api/payments/fedapay/callback`;

    // Récupérer le nom de l'utilisateur ou utiliser les métadonnées auth
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'Développeur';
    const nameParts = fullName.trim().split(' ');
    const firstname = nameParts[0] || 'Client';
    const lastname = nameParts.slice(1).join(' ') || 'OmniMockup';

    const customerPayload: {
      firstname: string;
      lastname: string;
      email: string;
      phone_number?: { number: string; country: string };
    } = {
      firstname,
      lastname,
      email: user.email || 'client@omnimockup.com',
    };

    if (phoneNumber) {
      customerPayload.phone_number = {
        number: phoneNumber.replace(/\s+/g, ''),
        country: 'bj', // Bénin (MTN MoMo / Moov)
      };
    }

    const result = await createFedaPayCheckout({
      description: `OmniMockup Studio - Plan ${planConfig.name} (${billingCycle === 'annual' ? '1 an' : '1 mois'})`,
      amount,
      currency: 'XOF',
      callbackUrl,
      customer: customerPayload,
      customMetadata: {
        userId: user.id,
        userEmail: user.email || '',
        plan,
        billingCycle,
      },
    });

    if (!result.success || !result.checkoutUrl) {
      return NextResponse.json(
        {
          success: false,
          error:
            result.error ||
            "Échec de l'initialisation du paiement Mobile Money. Veuillez vérifier la clé FedaPay.",
        },
        { status: 500 }
      );
    }

    // Sauvegarder l'ID de transaction FedaPay en attente dans le profil
    try {
      const admin = createAdminClient();
      await admin
        .from('profiles')
        .update({
          fedapay_transaction_id: String(result.transactionId),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch (dbErr) {
      console.warn('Note: impossible de pré-enregistrer transactionId dans profiles:', dbErr);
    }

    return NextResponse.json({
      success: true,
      transactionId: result.transactionId,
      checkoutUrl: result.checkoutUrl,
      amount,
      currency: 'XOF',
      plan,
    });
  } catch (error: unknown) {
    console.error('Erreur route FedaPay Create:', error);
    const message = error instanceof Error ? error.message : 'Erreur interne du serveur lors de la création du paiement MoMo.';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
