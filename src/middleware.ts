import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { detectCurrencyFromCountry, type Currency } from '@/lib/pricing';

export async function middleware(request: NextRequest) {
  // 1. Détection de la région et de la devise
  const cookieCurrency = request.cookies.get('omnimockup_currency')?.value as Currency | undefined;
  const country =
    request.headers.get('x-vercel-ip-country') ||
    request.headers.get('cf-ipcountry') ||
    (request as unknown as { geo?: { country?: string } }).geo?.country ||
    null;

  // Le site n'affiche que des euros ou des dollars (un ancien choix « FCFA » devient l'euro)
  let activeCurrency: Currency = 'USD';
  if (cookieCurrency === 'EUR' || cookieCurrency === 'USD') {
    activeCurrency = cookieCurrency;
  } else if (cookieCurrency === 'XOF') {
    activeCurrency = 'EUR';
  } else {
    activeCurrency = detectCurrencyFromCountry(country);
  }

  // Injecter dans les en-têtes de requête transmis aux pages
  request.headers.set('x-user-currency', activeCurrency);
  if (country) {
    request.headers.set('x-user-country', country);
  }

  // 2. Gestion de la session Supabase
  const response = await updateSession(request);

  // 3. Injecter les en-têtes dans la réponse
  response.headers.set('x-user-currency', activeCurrency);
  if (country) {
    response.headers.set('x-user-country', country);
  }

  // 4. Pays du visiteur (lu par la page Tarifs pour proposer Mobile Money en premier)
  if (country && request.cookies.get('omnimockup_country')?.value !== country) {
    response.cookies.set({ name: 'omnimockup_country', value: country, path: '/', maxAge: 60 * 60 * 24 * 30, sameSite: 'lax' });
  }

  // 5. Poser le cookie de devise si absent (ou ancien « FCFA »)
  // Pays inconnu : le navigateur choisit lui-même d'après son fuseau horaire
  if ((!cookieCurrency && country) || cookieCurrency === 'XOF') {
    response.cookies.set({
      name: 'omnimockup_currency',
      value: activeCurrency,
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, icons, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
