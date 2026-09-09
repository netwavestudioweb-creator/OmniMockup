import { NextRequest, NextResponse } from 'next/server';
import { DiscoveredPage, AnalyzeResponse } from '@/types/analyzer';
import { checkRateLimit, createRateLimitResponse, validateSafeUrl } from '@/lib/security';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const STATIC_EXTENSIONS_REGEX =
  /\.(png|jpe?g|gif|svg|webp|ico|pdf|zip|tar|gz|css|js|woff2?|ttf|eot|mp4|webm|avi|mov|xml|txt|json)$/i;

function cleanHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function deriveTitleFromPath(path: string): string {
  if (!path || path === '/' || path === '') return 'Accueil';
  const cleanPath = path.split('?')[0].replace(/\/+$/, '');
  const segments = cleanPath.split('/').filter(Boolean);
  if (segments.length === 0) return 'Accueil';
  const lastSegment = decodeURIComponent(segments[segments.length - 1]);
  return lastSegment
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}


/**
 * Traduit les erreurs réseau bas niveau (Node fetch / DNS / Socket)
 * en explications claires et compréhensibles par l'utilisateur.
 */
function parseFetchError(error: unknown, targetUrl: URL): string {
  if (!error) return "Une erreur inconnue est survenue lors de l'accès au site.";

  const err = error as {
    name?: string;
    message?: string;
    code?: string;
    cause?: { code?: string; message?: string; name?: string };
  };

  const causeCode = err?.cause?.code || err?.code || '';
  const message = (err?.message || '').toLowerCase();
  const host = targetUrl.hostname;

  if (err?.name === 'AbortError' || causeCode === 'ETIMEDOUT' || message.includes('timeout')) {
    return `Le site « ${host} » a mis trop de temps à répondre (délai d'attente dépassé). Le serveur est peut-être surchargé.`;
  }

  if (causeCode === 'ENOTFOUND' || causeCode === 'EAI_AGAIN' || message.includes('enotfound')) {
    return `Le nom de domaine « ${host} » est introuvable. Vérifiez l'orthographe de l'adresse web.`;
  }

  if (causeCode === 'ECONNREFUSED' || message.includes('econnrefused')) {
    return `Connexion refusée par « ${host} ». Le serveur distant est inaccessible ou n'accepte pas les requêtes.`;
  }

  if (causeCode === 'ECONNRESET' || message.includes('econnreset')) {
    return `La connexion a été fermée ou réinitialisée brusquement par « ${host} ».`;
  }

  if (
    causeCode.includes('CERT') ||
    causeCode.includes('SSL') ||
    causeCode.includes('TLS') ||
    message.includes('certificate')
  ) {
    return `Erreur de certificat de sécurité SSL sur « ${host} ». Le site ne dispose pas d'un certificat HTTPS valide.`;
  }

  return `Impossible de joindre « ${host} ». Vérifiez que l'URL est correcte et accessible publiquement.`;
}

// Extraction sitemap XML
async function tryFetchSitemap(baseUrl: URL): Promise<DiscoveredPage[] | null> {
  const sitemapUrl = `${baseUrl.origin}/sitemap.xml`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(sitemapUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'application/xml, text/xml, text/html, */*',
      },
    });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const xmlText = await res.text();
    if (!xmlText.includes('<urlset') && !xmlText.includes('<sitemapindex')) {
      return null;
    }

    const locRegex = /<loc>(.*?)<\/loc>/gi;
    const urlsFound: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = locRegex.exec(xmlText)) !== null) {
      const loc = match[1].trim();
      if (loc && !urlsFound.includes(loc)) {
        urlsFound.push(loc);
      }
    }

    if (xmlText.includes('<sitemapindex') && urlsFound.length > 0) {
      const firstSubSitemap = urlsFound[0];
      try {
        const subController = new AbortController();
        const subTimeout = setTimeout(() => subController.abort(), 4000);
        const subRes = await fetch(firstSubSitemap, {
          signal: subController.signal,
          headers: { 'User-Agent': USER_AGENT },
        });
        clearTimeout(subTimeout);

        if (subRes.ok) {
          const subXml = await subRes.text();
          let subMatch: RegExpExecArray | null;
          const subUrls: string[] = [];
          while ((subMatch = locRegex.exec(subXml)) !== null) {
            const loc = subMatch[1].trim();
            if (loc && !subUrls.includes(loc)) {
              subUrls.push(loc);
            }
          }
          if (subUrls.length > 0) {
            urlsFound.splice(0, urlsFound.length, ...subUrls);
          }
        }
      } catch {
        // Poursuivre avec les URLs déjà trouvées
      }
    }

    const host = baseUrl.hostname.toLowerCase();
    const validPages: DiscoveredPage[] = [];
    const seen = new Set<string>();

    for (const urlStr of urlsFound) {
      try {
        const parsed = new URL(urlStr);
        if (
          parsed.hostname.toLowerCase() === host ||
          parsed.hostname.toLowerCase().endsWith('.' + host)
        ) {
          const normalized = parsed.origin + parsed.pathname;
          if (!seen.has(normalized) && !STATIC_EXTENSIONS_REGEX.test(parsed.pathname)) {
            seen.add(normalized);
            const path = parsed.pathname + (parsed.search || '');
            validPages.push({
              id: `page-${validPages.length + 1}`,
              url: normalized,
              path: path || '/',
              title: deriveTitleFromPath(parsed.pathname),
              source: 'sitemap',
              depth: parsed.pathname.split('/').filter(Boolean).length,
              badge: 'Sitemap XML',
            });
          }
        }
      } catch {
        // URL non valide, ignorer
      }

      if (validPages.length >= 60) break;
    }

    return validPages.length > 0 ? validPages : null;
  } catch {
    return null;
  }
}

// Fallback : Crawl HTML de la page d'accueil
async function crawlHomePage(targetUrl: URL): Promise<DiscoveredPage[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  let res: Response;
  try {
    res = await fetch(targetUrl.href, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr,en-US;q=0.9,en;q=0.8',
      },
    });
  } catch (err) {
    throw new Error(parseFetchError(err, targetUrl));
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    if (res.status === 403) {
      throw new Error(`Accès refusé (HTTP 403). Le site bloque les requêtes automatisées.`);
    }
    if (res.status === 404) {
      throw new Error(`Page introuvable (HTTP 404). L'URL indiquée n'existe pas.`);
    }
    if (res.status >= 500) {
      throw new Error(`Erreur serveur distant (HTTP ${res.status}). Le site cible rencontre un problème interne.`);
    }
    throw new Error(`Le site a répondu avec une erreur HTTP ${res.status} (${res.statusText}).`);
  }

  let html: string;
  try {
    html = await res.text();
  } catch {
    throw new Error("Impossible de lire le contenu HTML renvoyé par la page d'accueil.");
  }

  // Extraction du titre
  let homeTitle = 'Page d’accueil';
  const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (titleMatch && titleMatch[1]) {
    homeTitle = cleanHtmlEntities(titleMatch[1]);
  }

  const host = targetUrl.hostname.toLowerCase();
  const pages: DiscoveredPage[] = [];
  const seen = new Set<string>();

  const homeNormalized = targetUrl.origin + (targetUrl.pathname === '' ? '/' : targetUrl.pathname);
  seen.add(homeNormalized);
  pages.push({
    id: 'page-1',
    url: homeNormalized,
    path: targetUrl.pathname || '/',
    title: homeTitle || 'Accueil',
    source: 'html_crawl',
    depth: 0,
    badge: 'Index Source',
  });

  const anchorRegex = /<a\s+[^>]*?href=["']([^"']+)["'][^>]*?>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const rawHref = match[1].trim();
    const anchorInnerHtml = match[2];

    if (
      !rawHref ||
      rawHref.startsWith('#') ||
      rawHref.startsWith('javascript:') ||
      rawHref.startsWith('mailto:') ||
      rawHref.startsWith('tel:')
    ) {
      continue;
    }

    try {
      const resolved = new URL(rawHref, targetUrl.href);
      const linkHost = resolved.hostname.toLowerCase();

      if (linkHost === host || linkHost.endsWith('.' + host)) {
        const cleanUrl = resolved.origin + resolved.pathname;

        if (!STATIC_EXTENSIONS_REGEX.test(resolved.pathname) && !seen.has(cleanUrl)) {
          seen.add(cleanUrl);

          const cleanAnchorText = cleanHtmlEntities(anchorInnerHtml.replace(/<[^>]*>/g, ' '));
          const finalTitle =
            cleanAnchorText.length >= 3 && cleanAnchorText.length <= 100
              ? cleanAnchorText
              : deriveTitleFromPath(resolved.pathname);

          pages.push({
            id: `page-${pages.length + 1}`,
            url: cleanUrl,
            path: resolved.pathname || '/',
            title: finalTitle,
            source: 'html_crawl',
            depth: resolved.pathname.split('/').filter(Boolean).length,
            badge: 'HTML Interne',
          });
        }
      }
    } catch {
      // Ignorer liens non parseables
    }

    if (pages.length >= 60) break;
  }

  return pages;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // 1. Contrôle du débit (Rate Limiting par IP : 10 req/min)
  const rateLimit = checkRateLimit(req, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  try {
    let body: { url?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Format JSON invalide dans le corps de la requête.' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let rawUrl = body?.url?.trim();
    if (!rawUrl || typeof rawUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Veuillez saisir une URL de site web.' },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (rawUrl.includes('al-kareem-parfumerie.vercel.app')) {
      rawUrl = rawUrl.replace('al-kareem-parfumerie.vercel.app', 'al-kareem-parfurmerie.vercel.app');
    }

    // 2. Validation stricte Anti-SSRF (protocole, loopback, IP privées, DNS rebinding)
    const validation = await validateSafeUrl(rawUrl);
    if (!validation.valid || !validation.parsedUrl) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error || "L'URL fournie n'est pas autorisée ou n'est pas valide.",
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const targetUrl = validation.parsedUrl;

    // 1. Tenter la détection par sitemap XML
    const sitemapPages = await tryFetchSitemap(targetUrl);
    if (sitemapPages && sitemapPages.length > 0) {
      const response: AnalyzeResponse = {
        success: true,
        targetUrl: targetUrl.href,
        domain: targetUrl.hostname,
        source: 'sitemap',
        total: sitemapPages.length,
        pages: sitemapPages,
        executionTimeMs: Date.now() - startTime,
      };
      return NextResponse.json(response, {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Repli : exploration HTML interne
    const crawledPages = await crawlHomePage(targetUrl);

    const response: AnalyzeResponse = {
      success: true,
      targetUrl: targetUrl.href,
      domain: targetUrl.hostname,
      source: 'html_crawl',
      total: crawledPages.length,
      pages: crawledPages,
      executionTimeMs: Date.now() - startTime,
    };

    return NextResponse.json(response, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    const errorMessage =
      err?.message || "Une erreur est survenue lors de l'analyse. Vérifiez que l'URL est accessible.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        executionTimeMs: Date.now() - startTime,
      },
      {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
