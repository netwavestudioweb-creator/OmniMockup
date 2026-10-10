import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createRateLimitResponse, validateSafeUrl } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const MAX_HTML_BYTES = 1_500_000;
const MAX_REDIRECTS = 3;
const MAX_LINKS = 12;
// Fichiers et liens qui ne sont pas des pages à mettre en scène
const SKIP_EXT = /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|rar|mp4|mp3|webm|css|js|json|xml|txt|docx?|xlsx?)$/i;
const SKIP_PATH = /(^|\/)(wp-admin|wp-login|login|logout|signin|sign-in|signup|sign-up|register|connexion|inscription|cart|panier|checkout|account|compte|feed|cdn-cgi)(\/|$)/i;

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function labelFromPath(pathname: string): string {
  const last = pathname.split('/').filter(Boolean).pop() || '';
  const words = decodeURIComponent(last).replace(/[-_]+/g, ' ').trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : pathname;
}

/** Télécharge la page d'accueil en revalidant chaque redirection (pas d'accès au réseau interne). */
async function fetchHtml(startUrl: string): Promise<{ html: string; finalUrl: URL }> {
  let current = startUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const check = await validateSafeUrl(current);
    if (!check.valid || !check.parsedUrl) throw new Error(check.error || 'Adresse non autorisée.');
    const res = await fetch(check.parsedUrl.href, {
      redirect: 'manual',
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OmniMockupBot/1.0)', Accept: 'text/html' },
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) break;
      current = new URL(loc, check.parsedUrl).href;
      continue;
    }
    if (!res.ok) throw new Error(`Le site a répondu ${res.status}.`);
    if (!(res.headers.get('content-type') || '').includes('html')) throw new Error("Ce n'est pas une page web.");
    const reader = res.body?.getReader();
    if (!reader) throw new Error('Page vide.');
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (size < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      chunks.push(value);
      size += value.length;
    }
    reader.cancel().catch(() => {});
    return { html: Buffer.concat(chunks).toString('utf8'), finalUrl: check.parsedUrl };
  }
  throw new Error('Trop de redirections.');
}

/**
 * Liste les pages internes d'un site (liens du menu en priorité) pour les capturer d'un coup.
 * POST { url } → { success, pages: [{ url, label }] }
 */
export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) return createRateLimitResponse(rateLimit.retryAfterSeconds);

  let url = '';
  try {
    url = String(((await req.json()) as { url?: unknown })?.url || '').trim();
  } catch {
    return NextResponse.json({ success: false, error: 'Requête invalide.' }, { status: 400 });
  }
  if (!url) return NextResponse.json({ success: false, error: 'Adresse manquante.' }, { status: 400 });
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const { html, finalUrl } = await fetchHtml(url);
    // Les liens du menu et de l'en-tête passent en premier
    const navHtml = (html.match(/<(nav|header)[\s\S]*?<\/\1>/gi) || []).join(' ');
    const seen = new Set<string>([finalUrl.pathname.replace(/\/$/, '') || '/']);
    const pages: { url: string; label: string }[] = [];

    for (const source of [navHtml, html]) {
      const re = /<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
      let m: RegExpExecArray | null;
      while ((m = re.exec(source)) && pages.length < MAX_LINKS) {
        let link: URL;
        try {
          link = new URL(decodeEntities(m[1]), finalUrl);
        } catch {
          continue;
        }
        if (!/^https?:$/.test(link.protocol)) continue;
        if (link.hostname.replace(/^www\./, '') !== finalUrl.hostname.replace(/^www\./, '')) continue;
        const path = link.pathname.replace(/\/$/, '') || '/';
        if (seen.has(path) || SKIP_EXT.test(path) || SKIP_PATH.test(path)) continue;
        seen.add(path);
        const text = decodeEntities(m[2].replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
        pages.push({
          url: `${link.origin}${link.pathname}`,
          label: (text && text.length <= 40 ? text : labelFromPath(link.pathname)).slice(0, 40),
        });
      }
    }

    return NextResponse.json({ success: true, pages });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: (err as Error).message || 'Impossible de lire les liens du site.' },
      { status: 200 }
    );
  }
}
