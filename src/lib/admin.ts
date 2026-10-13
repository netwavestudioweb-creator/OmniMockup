import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { ADMIN_COOKIE, adminConfigured, verifyAdminSession } from '@/lib/adminAuth';

/**
 * Accès au tableau de bord : uniquement la session administrateur (mot de passe + code à 6 chiffres),
 * indépendante des comptes clients. Être connecté à un compte client, même celui de Dodo, ne suffit pas.
 * Renvoie une réponse 401 / 503 à renvoyer telle quelle si l'accès est refusé.
 */
export async function requireAdmin(): Promise<{ adminId: null } | { response: NextResponse }> {
  if (!adminConfigured()) {
    return { response: NextResponse.json({ error: 'Accès administrateur non configuré.', setup: true }, { status: 503 }) };
  }
  if (!verifyAdminSession(cookies().get(ADMIN_COOKIE)?.value)) {
    return { response: NextResponse.json({ error: 'Connexion administrateur requise.' }, { status: 401 }) };
  }
  return { adminId: null };
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
