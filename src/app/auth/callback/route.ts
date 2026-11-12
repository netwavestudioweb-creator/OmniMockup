import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/lib/safeRedirect';

/**
 * Retour du lien de confirmation (e-mail) ou de la connexion Google.
 * Si la session ne peut pas être ouverte ici (lien ouvert dans un autre navigateur que celui de
 * l'inscription, lien de connexion transmis après le « # » de l'adresse), on n'affiche pas d'erreur sèche :
 * la page de connexion garde la suite du parcours (forfait choisi) et finit le travail.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = safeRedirectPath(searchParams.get('next'));
  const keepNext = next !== '/' ? `&redirect=${encodeURIComponent(next)}` : '';

  // Lien expiré ou déjà utilisé : Supabase le signale dans l'adresse
  if (searchParams.get('error') || searchParams.get('error_code')) {
    return NextResponse.redirect(`${origin}/login?error=link_invalid${keepNext}`);
  }

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Adresse confirmée par Supabase avant ce retour : il reste à se connecter (ou la page le fait seule)
  return NextResponse.redirect(`${origin}/login?confirmed=1${keepNext}`);
}
