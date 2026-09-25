import { NextRequest, NextResponse } from 'next/server';
import { captureWebPage } from '@/lib/browser';
import { CaptureItemResult, CaptureResponse, SectionCoordinates } from '@/types/analyzer';
import { checkRateLimit, createRateLimitResponse, validateSafeUrl } from '@/lib/security';

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
  const rateLimit = checkRateLimit(req, { maxRequests: 10, windowMs: 60 * 1000 });
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
      return NextResponse.json(
        {
          success: false,
          error: `URL cible non autorisée (${target.url}) : ${validation.error || 'Accès restreint par mesure de sécurité'}.`,
        },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    target.url = validation.parsedUrl.href;
  }

  const results: CaptureItemResult[] = [];

  for (const target of targetsToProcess) {
    const itemStartTime = Date.now();
    try {
      const captureRes = await captureWebPage(target.url);
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
