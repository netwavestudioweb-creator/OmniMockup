import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLoyaltySteps } from '@/lib/loyalty';

export const dynamic = 'force-dynamic';

/**
 * Baisses de fidélité du prochain mois payé, par formule, pour le client connecté.
 * Sert seulement à l'affichage : le prix réellement payé est recalculé à la création du paiement.
 */
export async function GET() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ steps: null });

  return NextResponse.json({ steps: await getLoyaltySteps(user.id) });
}
