import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Accès au tableau de bord : seuls les comptes listés dans la table app_admins (le compte de Dodo).
 * La vérification se fait toujours côté serveur, à chaque appel.
 * Renvoie l'identifiant de l'administrateur, ou une réponse 401 / 403 à renvoyer telle quelle.
 */
export async function requireAdmin(): Promise<{ adminId: string } | { response: NextResponse }> {
  try {
    const { data } = await createClient().auth.getUser();
    if (!data.user) {
      return { response: NextResponse.json({ error: 'Connectez-vous.' }, { status: 401 }) };
    }
    const { data: row } = await createAdminClient()
      .from('app_admins')
      .select('user_id')
      .eq('user_id', data.user.id)
      .maybeSingle();
    if (!row) return { response: NextResponse.json({ error: 'Accès réservé.' }, { status: 403 }) };
    return { adminId: data.user.id };
  } catch {
    return { response: NextResponse.json({ error: 'Service indisponible.' }, { status: 503 }) };
  }
}

/** Enregistre un paiement encaissé (une seule fois grâce à provider + external_id). Ne bloque jamais l'appelant. */
export async function recordPayment(p: {
  provider: 'stripe' | 'saspay';
  externalId: string;
  userId: string | null;
  kind: 'plan' | 'credits';
  item: string | null;
  amount: number;
  currency: string;
}) {
  try {
    await createAdminClient()
      .from('payments')
      .upsert(
        {
          provider: p.provider,
          external_id: p.externalId,
          user_id: p.userId,
          kind: p.kind,
          item: p.item,
          amount: p.amount,
          currency: p.currency.toUpperCase(),
        },
        { onConflict: 'provider,external_id', ignoreDuplicates: true }
      );
  } catch (err) {
    console.error('[admin] Paiement non enregistré dans les statistiques :', err);
  }
}

/** Événement d'usage enregistré par le serveur (captures, IA…). Ne bloque jamais l'appelant. */
export async function logServerEvent(eventName: string, properties: Record<string, unknown>, userId: string | null = null) {
  try {
    await createAdminClient().from('events').insert({ event_name: eventName, properties, user_id: userId });
  } catch {
    // statistique perdue : sans conséquence pour le client
  }
}
