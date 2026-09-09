import { NextRequest, NextResponse } from 'next/server';
import { chromium, Browser } from 'playwright';
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
  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    });

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });

    for (const target of targetsToProcess) {
      const itemStartTime = Date.now();
      let page = null;

      try {
        page = await context.newPage();
        page.setDefaultTimeout(15000); // 15s max par page
        page.setDefaultNavigationTimeout(15000);

        // Navigation avec timeout strict de 15s
        await page.goto(target.url, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });

        // Légère pause pour le rendu des polices et images (500ms)
        await page.waitForTimeout(500);

        let pageTitle = '';
        try {
          pageTitle = await page.title();
        } catch {
          pageTitle = target.url;
        }

        // Configuration de la capture : découpe par clip si fournie, sinon viewport standard
        let buffer: Buffer;

        if (target.clip && target.clip.width > 10 && target.clip.height > 10) {
          // Règle générale pour les mockups de site web : pleine largeur 1440px
          // pour conserver l'arrière-plan complet et éviter tout texte ou colonne coupé sur les bords
          const clipX = 0;
          const clipWidth = 1440;
          const clipY = Math.max(0, Math.round(target.clip.y));
          const clipHeight = Math.max(50, Math.round(target.clip.height));

          // 1. Adapter la hauteur du viewport pour englober la totalité de la section
          await page.setViewportSize({ width: 1440, height: Math.max(900, clipHeight + 100) });

          // 2. Défilement précis jusqu'au point de départ Y de la section
          await page.evaluate((targetY) => window.scrollTo(0, targetY), clipY);
          await page.waitForTimeout(300); // Laisser le temps au rendu des sticky/lazy elements

          // 3. Prise de vue du clip depuis le haut du viewport scrollé (y: 0)
          buffer = await page.screenshot({
            type: 'png',
            timeout: 8000,
            clip: {
              x: clipX,
              y: 0,
              width: clipWidth,
              height: clipHeight,
            },
          });
        } else {
          buffer = await page.screenshot({
            type: 'png',
            timeout: 8000,
            fullPage: false,
          });
        }
        const base64 = `data:image/png;base64,${buffer.toString('base64')}`;

        results.push({
          url: target.url,
          title: target.label || pageTitle || target.url,
          success: true,
          screenshotBase64: base64,
          capturedAt: new Date().toISOString(),
          durationMs: Date.now() - itemStartTime,
          clip: target.clip,
        });
      } catch (err: unknown) {
        const errorObj = err as { message?: string; name?: string };
        const errorMessage =
          errorObj?.name === 'TimeoutError'
            ? 'Délai d’attente dépassé (timeout 15s) pour cette page.'
            : errorObj?.message || 'Erreur lors de la capture de la page.';

        results.push({
          url: target.url,
          title: target.label || target.url,
          success: false,
          error: errorMessage,
          capturedAt: new Date().toISOString(),
          durationMs: Date.now() - itemStartTime,
        });
      } finally {
        if (page) {
          try {
            await page.close();
          } catch {
            // Ignorer
          }
        }
      }
    }
  } catch (browserErr: unknown) {
    const bErr = browserErr as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: `Impossible d’initialiser Chromium pour la capture : ${bErr?.message || 'Erreur interne'}`,
      },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignorer
      }
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
