import { NextRequest, NextResponse } from 'next/server';
import { captureWebPage, extractYouTubeVideoId, YOUTUBE_LINKS_ENABLED, YOUTUBE_SOON_MESSAGE } from '@/lib/browser';
import { captureKey, readStoredCapture, saveStoredCapture } from '@/lib/captureStore';
import { CaptureItemResult, CaptureResponse, SectionCoordinates } from '@/types/analyzer';
import { createRateLimitResponse, validateSafeUrl, checkRateLimitShared } from '@/lib/security';
import { logServerEvent } from '@/lib/admin';

/** Cause d'un échec de capture, pour le tableau de bord (santé du site) */
function failureReason(message: string): string {
  if (/introuvable/i.test(message)) return 'introuvable';
  if (/refusé|interdit|non autoris/i.test(message)) return 'adresse_bloquee';
  if (/timeout|délai|trop de temps|aborted/i.test(message)) return 'trop_lent';
  if (/Impossible de capturer/i.test(message)) return 'site_inaccessible';
  return 'autre';
}

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface NormalizedTarget {
  url: string;
  clip?: SectionCoordinates;
  label?: string;
}

export async function POST(req: NextRequest) {
  const overallStartTime = Date.now();

  // 1. Contrôle du débit (Rate Limiting par IP : 10 req/min)
  const rateLimit = await checkRateLimitShared(req, 'capture', { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  let body: Record<string, unknown> | null = null;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Format JSON invalide dans le corps de la requête.' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const rawList = (body?.targets || body?.urls || body?.items) as unknown[];
  if (!Array.isArray(rawList) || rawList.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Une liste d’URLs ou de cibles est requise.' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Normalisation des cibles (accepte string[] ou objets avec clip)
  const targetsToProcess: NormalizedTarget[] = rawList
    .slice(0, 12)
    .map((item: unknown) => {
      if (typeof item === 'string') {
        const u = item.replace('al-kareem-parfumerie.vercel.app', 'al-kareem-parfurmerie.vercel.app');
        return { url: u };
      }
      const obj = item as Record<string, unknown>;
      let u = (obj?.url as string) || '';
      if (u.includes('al-kareem-parfumerie.vercel.app')) {
        u = u.replace('al-kareem-parfumerie.vercel.app', 'al-kareem-parfurmerie.vercel.app');
      }
      return {
        url: u,
        clip: obj?.clip as SectionCoordinates | undefined,
        label: (obj?.label as string) || (obj?.title as string),
      };
    })
    .filter((t) => Boolean(t.url));

  if (targetsToProcess.length === 0) {
    return NextResponse.json(
      { success: false, error: 'Aucune URL valide trouvée.' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Validation stricte Anti-SSRF sur chaque URL cible
  for (const target of targetsToProcess) {
    const validation = await validateSafeUrl(target.url);
    if (!validation.valid || !validation.parsedUrl) {
      await logServerEvent('capture_result', { ok: false, reason: failureReason(validation.error || ''), mobile: body?.mobile === true });
      return NextResponse.json(
        {
          success: false,
          // Les messages de validation sont déjà complets et lisibles (adresse introuvable, adresse interne…)
          error: validation.error || 'Cette adresse ne peut pas être capturée.',
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    target.url = validation.parsedUrl.href;
  }

  const fullPage = typeof body?.fullPage === 'boolean' ? body.fullPage : true;
  const hideBanners = typeof body?.hideBanners === 'boolean' ? body.hideBanners : true;
  // Taille de fenêtre bornée : de 320 à 2 560 px de large (le studio propose 1 024 à 2 560)
  const rawViewport = body?.viewport as { width?: unknown; height?: unknown } | undefined;
  const clampSize = (v: unknown, min: number, max: number, fallback: number) =>
    typeof v === 'number' && Number.isFinite(v) ? Math.round(Math.max(min, Math.min(max, v))) : fallback;
  const viewport = rawViewport
    ? { width: clampSize(rawViewport.width, 320, 2560, 1440), height: clampSize(rawViewport.height, 320, 1600, 900) }
    : undefined;
  const mobile = body?.mobile === true;
  const delayMs = typeof body?.delayMs === 'number' ? Math.max(0, Math.min(8000, body.delayMs)) : 0;
  const colorScheme = body?.colorScheme === 'dark' ? 'dark' : 'light';
  // « fresh » : le client demande une capture neuve (site modifié depuis), sans passer par la mémoire
  const fresh = body?.fresh === true;

  const results: CaptureItemResult[] = [];

  for (const target of targetsToProcess) {
    const itemStartTime = Date.now();
    // Liens YouTube désactivés pour l'instant : message clair, sans capture ni mémoire
    if (!YOUTUBE_LINKS_ENABLED && extractYouTubeVideoId(target.url)) {
      results.push({
        url: target.url,
        title: target.label || target.url,
        success: false,
        error: YOUTUBE_SOON_MESSAGE,
        capturedAt: new Date().toISOString(),
        durationMs: 0,
      });
      continue;
    }
    try {
      const key = captureKey(target.url, { fullPage, hideBanners, viewport: viewport || null, mobile, delayMs, colorScheme });
      const stored = fresh ? null : await readStoredCapture(key);
      if (stored) {
        await logServerEvent('capture_result', { ok: true, engine: 'cache', ms: Date.now() - itemStartTime, mobile });
        results.push({
          url: target.url,
          title: target.label || stored.pageTitle || target.url,
          domainName: stored.domainName,
          faviconUrl: stored.faviconUrl,
          success: true,
          screenshotBase64: stored.screenshotBase64,
          capturedAt: stored.cachedAt,
          durationMs: Date.now() - itemStartTime,
          clip: target.clip,
        });
        continue;
      }
      const captureRes = await captureWebPage(target.url, { fullPage, hideBanners, viewport, mobile, delayMs, colorScheme });
      await logServerEvent('capture_result', { ok: true, engine: captureRes.source, ms: Date.now() - itemStartTime, mobile });
      await saveStoredCapture(key, {
        screenshotBase64: captureRes.screenshotBase64,
        pageTitle: captureRes.pageTitle,
        domainName: captureRes.domainName,
        faviconUrl: captureRes.faviconUrl,
      });
      results.push({
        url: target.url,
        title: target.label || captureRes.pageTitle || target.url,
        domainName: captureRes.domainName,
        faviconUrl: captureRes.faviconUrl,
        success: true,
        screenshotBase64: captureRes.screenshotBase64,
        capturedAt: new Date().toISOString(),
        durationMs: Date.now() - itemStartTime,
        clip: target.clip,
      });
    } catch (err: unknown) {
      const errorObj = err as { message?: string };
      await logServerEvent('capture_result', { ok: false, reason: failureReason(errorObj?.message || ''), ms: Date.now() - itemStartTime, mobile });
      results.push({
        url: target.url,
        title: target.label || target.url,
        success: false,
        error: errorObj?.message || 'Erreur lors de la capture de la page.',
        capturedAt: new Date().toISOString(),
        durationMs: Date.now() - itemStartTime,
      });
    }
  }

  const successfulCount = results.filter((r) => r.success).length;
  const failedCount = results.filter((r) => !r.success).length;

  const response: CaptureResponse = {
    success: true,
    total: results.length,
    successful: successfulCount,
    failed: failedCount,
    results,
    totalExecutionTimeMs: Date.now() - overallStartTime,
  };

  return NextResponse.json(response, {
    headers: { 'Content-Type': 'application/json' },
  });
}
