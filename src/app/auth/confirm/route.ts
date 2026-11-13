import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { safeRedirectPath } from '@/lib/safeRedirect';

const TYPES: EmailOtpType[] = ['signup', 'email', 'recovery', 'invite', 'magiclink', 'email_change'];

/**
 * Lien des e-mails (confirmation d'inscription, mot de passe oublié) :
 *   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email&next={{ .RedirectTo }}
 * Le lien est vérifié ici, côté serveur : il marche même ouvert sur un autre appareil ou un autre
 * navigateur que celui de l'inscription (ce que le lien par défaut de Supabase ne permet pas).
 */
export async function GET(request: Request) {
  const { searchParams, origin, host } = new URL(request.url);
  const tokenHash = searchParams.get('token_hash');
  const rawType = searchParams.get('type') as EmailOtpType | null;
  const type: EmailOtpType = rawType && TYPES.includes(rawType) ? rawType : 'email';
  // Dans le modèle d'e-mail, {{ .RedirectTo }} est collé tel quel (non encodé) en dernier : on le relit brut,
  // sinon ses propres « & » (ex. &billing=annual) seraient pris pour d'autres paramètres
  const rawNext = request.url.match(/[?&]next=(.*)$/)?.[1] ?? null;
  const nextValue = rawNext && /^https?%3A/i.test(rawNext) ? decodeURIComponent(rawNext) : rawNext;
  const next = resolveNext(nextValue, host, type);
  const keepNext = next !== '/' ? `&redirect=${encodeURIComponent(next)}` : '';

  if (tokenHash) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  // Lien expiré ou déjà utilisé
  if (type === 'recovery') return NextResponse.redirect(`${origin}/mot-de-passe-oublie?error=link_invalid`);
  return NextResponse.redirect(`${origin}/login?error=link_invalid${keepNext}`);
}

/**
 * « next » vaut l'adresse de retour donnée à l'inscription (souvent https://pitchmysite.com/auth/callback?next=/pricing?…) :
 * on en garde le chemin final, sur notre site seulement.
 */
function resolveNext(raw: string | null, host: string, type: EmailOtpType): string {
  const fallback = type === 'recovery' ? '/nouveau-mot-de-passe' : '/';
  if (!raw) return fallback;
  try {
    const url = new URL(raw, `https://${host}`);
    const ownSite = url.host === host || /(^|\.)pitchmysite\.com$/.test(url.host) || url.host === 'omni-mockup.vercel.app';
    if (!ownSite) return fallback;
    if (url.pathname === '/auth/callback') return safeRedirectPath(url.searchParams.get('next'), fallback);
    const path = safeRedirectPath(`${url.pathname}${url.search}`, fallback);
    return path === '/' ? fallback : path;
  } catch {
    return fallback;
  }
}
