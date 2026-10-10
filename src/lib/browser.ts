import type { SectionCoordinates } from '@/types/analyzer';

export interface ExtractedSectionCandidate {
  id: string;
  tag: string;
  coordinates: SectionCoordinates;
  headingText?: string;
  textSnippet?: string;
  contentScore?: number;
  bgColor?: string;
}

export interface WebPageCaptureResult {
  screenshotBase64: string;
  pageSize: { width: number; height: number };
  candidates: ExtractedSectionCandidate[];
  pageTitle: string;
  domainName: string;
  faviconUrl: string;
  source: 'playwright' | 'puppeteer' | 'cloud-fallback';
}

export function extractDomainName(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return urlStr;
  }
}

export function getFaviconUrl(urlStr: string): string {
  const domain = extractDomainName(urlStr);
  // Servie depuis notre domaine (/api/favicon) pour que l'export d'image fonctionne
  return `/api/favicon?domain=${encodeURIComponent(domain)}`;
}

export interface CaptureOptions {
  fullPage?: boolean;
  viewport?: { width: number; height: number };
  hideBanners?: boolean;
  /** Capture la version téléphone du site (390 px, mode mobile, écran Retina) */
  mobile?: boolean;
  /** Attente supplémentaire avant la capture (animations, chargements lents), 8 s au plus */
  delayMs?: number;
  /** Version claire ou sombre du site (préférence système simulée) */
  colorScheme?: 'light' | 'dark';
}

const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const MOBILE_VIEWPORT = { width: 390, height: 844 };
// Hauteur maximale d'une capture mobile pleine page (6 écrans) : évite des images de 40 000 px
const MOBILE_MAX_HEIGHT = MOBILE_VIEWPORT.height * 6;

/**
 * Moteur universel de capture web 3-Tiers Haute Performance :
 * Tier 1 : Playwright (Local / Docker)
 * Tier 2 : Puppeteer + @sparticuz/chromium (Linux Serverless)
 * Tier 3 : Microlink Cloud API + HTML Parser (Fallback rapide Vercel Serverless)
 */
export async function captureWebPage(
  targetUrl: string,
  options: CaptureOptions = {}
): Promise<WebPageCaptureResult> {
  const domainName = extractDomainName(targetUrl);
  const faviconUrl = getFaviconUrl(targetUrl);

  const fullPage = options.fullPage ?? true;
  const mobile = options.mobile === true;
  const viewportWidth = mobile ? MOBILE_VIEWPORT.width : options.viewport?.width || 1440;
  const viewportHeight = mobile ? MOBILE_VIEWPORT.height : options.viewport?.height || 900;
  const hideBanners = options.hideBanners ?? true;
  const delayMs = Math.max(0, Math.min(8000, Math.round(options.delayMs || 0)));
  const colorScheme = options.colorScheme === 'dark' ? 'dark' : 'light';

  // Sur Vercel, le service de capture en ligne est le plus rapide (7 s contre 15 à 20 s pour notre
  // navigateur sur le serveur) : on l'essaie d'abord, et notre moteur prend le relais s'il échoue
  let cloudTried = false;
  if (process.env.VERCEL && false) {
    cloudTried = true;
    try {
      return await captureWebPageCloudFallback(targetUrl, options, 25000);
    } catch (cloudErr) {
      console.warn('[Capture Engine] Service en ligne indisponible, bascule sur notre moteur :', (cloudErr as Error)?.message || cloudErr);
    }
  }

  const cookieBannerCSS = `
    [id*="cookie" i], [class*="cookie" i], [id*="consent" i], [class*="consent" i],
    [id*="gdpr" i], [class*="gdpr" i], [id*="banner" i], #onetrust-banner-sdk,
    .cookie-banner, .cookie-notice, .modal-backdrop, .overlay { display: none !important; opacity: 0 !important; visibility: hidden !important; pointer-events: none !important; }
  `;

  // -------------------------------------------------------------
  // TIER 1 : Playwright (Ultra-rapide avec arguments optimisés)
  // -------------------------------------------------------------
  try {
    // Sur Vercel, le navigateur Playwright n'est pas installé : on passe directement au Tier 2
    if (process.env.VERCEL) throw new Error('Tier 1 ignoré sur Vercel (navigateur non installé)');
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--use-gl=swiftshader',
        '--disable-gpu-sandbox',
        '--disable-background-networking',
        '--disable-default-apps',
        '--disable-extensions',
        '--disable-sync',
        '--disable-translate',
        '--metrics-recording-only',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
      ],
    });

    try {
      const context = await browser.newContext({
        viewport: { width: viewportWidth, height: viewportHeight },
        userAgent: mobile ? MOBILE_UA : DESKTOP_UA,
        deviceScaleFactor: mobile ? 2 : 1,
        isMobile: mobile,
        hasTouch: mobile,
        colorScheme,
      });
      const page = await context.newPage();
      page.setDefaultTimeout(30000);

      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(500 + delayMs);

      if (hideBanners) {
        await page.addStyleTag({ content: cookieBannerCSS }).catch(() => {});
      }

      const pageTitle = (await page.title()) || domainName;
      const mobileClipHeight =
        mobile && fullPage
          ? Math.min(MOBILE_MAX_HEIGHT, await page.evaluate(() => document.documentElement.scrollHeight))
          : 0;
      const screenshotBuffer = await page.screenshot({
        // JPG haute qualité : 5 à 8 fois plus léger que le PNG (chargement rapide sur connexion mobile)
        type: 'jpeg',
        quality: 85,
        fullPage,
        timeout: 30000,
        animations: 'disabled',
        ...(mobileClipHeight ? { clip: { x: 0, y: 0, width: viewportWidth, height: mobileClipHeight } } : {}),
      });
      const screenshotBase64 = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;

      const { candidates, pageSize } = await extractDomSectionsPlaywright(page);

      await browser.close();
      return { screenshotBase64, pageSize, candidates, pageTitle, domainName, faviconUrl, source: 'playwright' };
    } catch (err) {
      await browser.close().catch(() => {});
      throw err;
    }
  } catch (tier1Err) {
    console.warn(
      '[Capture Engine] Tier 1 (Playwright) indisponible, bascule sur Tier 2 (Puppeteer) :',
      (tier1Err as Error)?.message || tier1Err
    );
  }

  // -------------------------------------------------------------
  // TIER 2 : Puppeteer-core + @sparticuz/chromium
  // -------------------------------------------------------------
  try {
    if (process.platform === 'win32') {
      // @sparticuz/chromium ne contient que les binaires ELF Linux pour AWS Lambda/Vercel
      throw new Error('Tier 2 Sparticuz ignoré sous Windows (réservé Linux Serverless)');
    }

    const puppeteer = await import('puppeteer-core');
    const sparticuz = await import('@sparticuz/chromium');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = sparticuz.default || sparticuz;

    const t0 = Date.now();
    const executablePath = await mod.executablePath();
    const browser = await puppeteer.default.launch({
      args: await puppeteer.default.defaultArgs({ args: mod.args, headless: 'shell' }),
      executablePath,
      headless: 'shell',
    });

    try {
      const page = await browser.newPage();
      page.setDefaultTimeout(30000);
      await page.setViewport({
        width: viewportWidth,
        height: viewportHeight,
        deviceScaleFactor: mobile ? 2 : 1,
        isMobile: mobile,
        hasTouch: mobile,
      });
      await page.setUserAgent(mobile ? MOBILE_UA : DESKTOP_UA);
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: colorScheme }]);
      const tLaunch = Date.now();
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 25000 });
      const tGoto = Date.now();
      await new Promise((r) => setTimeout(r, 500 + delayMs));

      if (hideBanners) {
        await page.addStyleTag({ content: cookieBannerCSS }).catch(() => {});
      }

      const pageTitle = (await page.title()) || domainName;
      const mobileClipHeight =
        mobile && fullPage
          ? Math.min(MOBILE_MAX_HEIGHT, await page.evaluate(() => document.documentElement.scrollHeight))
          : 0;
      const screenshotBuffer = (await page.screenshot({
        // JPG haute qualité : 5 à 8 fois plus léger que le PNG (chargement rapide sur connexion mobile)
        type: 'jpeg',
        quality: 85,
        ...(mobileClipHeight
          ? { clip: { x: 0, y: 0, width: viewportWidth, height: mobileClipHeight }, captureBeyondViewport: true }
          : { fullPage }),
      })) as Buffer;
      const tShot = Date.now();
      const screenshotBase64 = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;

      const { candidates, pageSize } = await extractDomSectionsPuppeteer(page);
      console.log(
        `[Capture Engine] Tier 2 : lancement ${tLaunch - t0} ms, chargement ${tGoto - tLaunch} ms, capture ${tShot - tGoto} ms, hauteur ${pageSize.height}px, ${Math.round(screenshotBuffer.length / 1024)} Ko`
      );

      await closeQuickly(browser);
      return { screenshotBase64, pageSize, candidates, pageTitle, domainName, faviconUrl, source: 'puppeteer' };
    } catch (err) {
      await closeQuickly(browser);
      throw err;
    }
  } catch (tier2Err) {
    console.warn(
      '[Capture Engine] Tier 2 (Puppeteer) indisponible, bascule sur Tier 3 (Cloud Fallback API) :',
      (tier2Err as Error)?.message || tier2Err
    );
  }

  // -------------------------------------------------------------
  // TIER 3 : Microlink Cloud API Fallback (Pour Vercel Serverless sans libnss3.so)
  // -------------------------------------------------------------
  if (cloudTried) {
    throw new Error(
      `Impossible de capturer le site "${targetUrl}". Vérifiez que le site est accessible publiquement ou importez directement une capture d'écran.`
    );
  }
  return await captureWebPageCloudFallback(targetUrl, options);
}

/**
 * Ferme le navigateur sans attendre plus de 2 s : sur Vercel, la fermeture normale bloquait
 * parfois la réponse 40 s après une capture pourtant terminée.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function closeQuickly(browser: any) {
  await Promise.race([browser.close().catch(() => {}), new Promise((r) => setTimeout(r, 2000))]);
  try {
    browser.process?.()?.kill('SIGKILL');
  } catch {
    // déjà fermé
  }
}

/**
 * Tier 3 : Capture Cloud via l'API publique Microlink + parsing HTML direct
 */
async function captureWebPageCloudFallback(
  targetUrl: string,
  options: CaptureOptions = {},
  timeoutMs = 45000
): Promise<WebPageCaptureResult> {
  console.log('[Capture Engine] Exécution du secours Cloud API pour :', targetUrl);

  const domainName = extractDomainName(targetUrl);
  const faviconUrl = getFaviconUrl(targetUrl);
  const mobile = options.mobile === true;
  const width = mobile ? MOBILE_VIEWPORT.width : options.viewport?.width || 1440;
  const height = mobile ? MOBILE_VIEWPORT.height : options.viewport?.height || 900;
  const fullPage = options.fullPage ?? true;

  let screenshotBase64 = '';
  let pageTitle = domainName;

  try {
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(
      targetUrl
    )}&screenshot=true&meta=true&screenshot.type=jpeg&viewport.width=${width}&viewport.height=${height}${
      // JPEG à la taille réelle (pas en Retina ×2 sur ordinateur) : 10 à 15 fois plus léger que le PNG,
      // indispensable sur connexion mobile (une page entière passait de 8 Mo à environ 600 Ko)
      mobile ? '&viewport.isMobile=true&viewport.hasTouch=true&viewport.deviceScaleFactor=2' : '&viewport.deviceScaleFactor=1'
    }${
      fullPage && !mobile ? '&screenshot.fullPage=true' : ''
    }${options.colorScheme === 'dark' ? '&colorScheme=dark' : ''}${
      options.delayMs ? `&waitForTimeout=${Math.max(0, Math.min(8000, Math.round(options.delayMs)))}` : ''
    }${options.hideBanners === false ? '&adblock=false' : ''}`;

    const signal = AbortSignal.timeout(timeoutMs);
    const response = await fetch(microlinkUrl, {
      headers: { Accept: 'application/json' },
      signal,
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('image/')) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        screenshotBase64 = `data:${contentType.split(';')[0] || 'image/jpeg'};base64,${buffer.toString('base64')}`;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = await response.json();
        pageTitle = data?.data?.title || domainName;
        const screenshotUrl = data?.data?.screenshot?.url;

        if (screenshotUrl) {
          const imgRes = await fetch(screenshotUrl, { signal });
          if (imgRes.ok) {
            const arrayBuffer = await imgRes.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const imgType = (imgRes.headers.get('content-type') || 'image/jpeg').split(';')[0];
            screenshotBase64 = `data:${imgType};base64,${buffer.toString('base64')}`;
          }
        }
      }
    }
  } catch (err) {
    console.warn('[Capture Engine Cloud] Erreur Microlink API :', err);
  }

  // Si aucun moteur n'a réussi à capturer le site, on lève une erreur explicite plutôt qu'un pixel vert trompeur
  if (!screenshotBase64) {
    throw new Error(
      `Impossible de capturer le site "${targetUrl}". Vérifiez que le site est accessible publiquement ou importez directement une capture d'écran.`
    );
  }

  // Fetch du HTML direct pour isoler les en-têtes et créer les candidats de section
  let candidates: ExtractedSectionCandidate[] = [];
  try {
    const htmlRes = await fetch(targetUrl, {
      // Les titres de sections sont un bonus : on n'attend pas plus de 8 s
      signal: AbortSignal.timeout(8000),
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      },
    });

    if (htmlRes.ok) {
      const htmlText = await htmlRes.text();
      candidates = parseSectionsFromHtmlText(htmlText);
    }
  } catch (htmlErr) {
    console.warn('[Capture Engine Cloud] Erreur fetch HTML :', htmlErr);
  }

  if (candidates.length === 0) {
    candidates = generateDefaultSectionGrid();
  }

  return {
    screenshotBase64,
    pageSize: { width: 1440, height: Math.max(2400, candidates.length * 600) },
    candidates,
    pageTitle,
    domainName,
    faviconUrl,
    source: 'cloud-fallback',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractDomSectionsPlaywright(page: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return page.evaluate(() => {
    const scrollY = window.scrollY || 0;
    const docWidth = Math.max(document.documentElement.clientWidth, window.innerWidth, 1440);
    const elements = Array.from(document.body.querySelectorAll('header, section, footer, main, nav, article, [class*="hero"], [class*="section"], [id*="section"]')) as HTMLElement[];

    const candidates: ExtractedSectionCandidate[] = [];
    let idx = 1;

    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.width >= docWidth * 0.5 && rect.height >= 150) {
        const heading = el.querySelector('h1, h2, h3, h4')?.textContent?.trim();
        const text = el.textContent?.trim().slice(0, 160) || '';
        candidates.push({
          id: `sec-${idx++}`,
          tag: el.tagName.toLowerCase(),
          coordinates: {
            x: 0,
            y: Math.max(0, Math.round(rect.top + scrollY)),
            width: docWidth,
            height: Math.round(rect.height),
          },
          headingText: heading ? heading.slice(0, 80) : undefined,
          textSnippet: text,
          contentScore: 85,
        });
      }
      if (candidates.length >= 12) break;
    }

    if (candidates.length === 0) {
      const docHeight = Math.max(document.body.scrollHeight, 1800);
      const step = 600;
      let c = 1;
      for (let y = 0; y < docHeight; y += step) {
        candidates.push({
          id: `sec-${c++}`,
          tag: 'section',
          coordinates: { x: 0, y, width: 1440, height: Math.min(step, docHeight - y) },
          headingText: `Section ${c - 1}`,
          contentScore: 80,
        });
        if (candidates.length >= 8) break;
      }
    }

    return {
      candidates,
      pageSize: {
        width: docWidth,
        height: Math.max(document.body.scrollHeight, 900),
      },
    };
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractDomSectionsPuppeteer(page: any) {
  return extractDomSectionsPlaywright(page);
}

function parseSectionsFromHtmlText(htmlText: string): ExtractedSectionCandidate[] {
  const candidates: ExtractedSectionCandidate[] = [];
  const headingMatches = Array.from(htmlText.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi));

  let currentY = 0;
  let count = 1;

  if (headingMatches.length > 0) {
    for (const match of headingMatches.slice(0, 10)) {
      const cleanHeading = match[1].replace(/<[^>]+>/g, '').trim();
      if (cleanHeading.length > 2) {
        candidates.push({
          id: `sec-${count++}`,
          tag: 'section',
          coordinates: {
            x: 0,
            y: currentY,
            width: 1440,
            height: 600,
          },
          headingText: cleanHeading.slice(0, 80),
          contentScore: 85,
        });
        currentY += 600;
      }
    }
  }

  if (candidates.length === 0) {
    return generateDefaultSectionGrid();
  }

  return candidates;
}

function generateDefaultSectionGrid(): ExtractedSectionCandidate[] {
  const defaultLabels = [
    'Navigation & En-tête',
    'Hero & Proposition de Valeur',
    'Fonctionnalités Clés',
    'Avis Clients & Témoignages',
    'Tarifs & Offres',
    'Pied de Page (Footer)',
  ];

  return defaultLabels.map((label, idx) => ({
    id: `sec-${idx + 1}`,
    tag: idx === 0 ? 'header' : idx === defaultLabels.length - 1 ? 'footer' : 'section',
    coordinates: {
      x: 0,
      y: idx * 550,
      width: 1440,
      height: 550,
    },
    headingText: label,
    contentScore: 90 - idx * 2,
  }));
}
