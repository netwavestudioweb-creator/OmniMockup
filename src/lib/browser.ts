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
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

/**
 * Moteur universel de capture web 3-Tiers :
 * Tier 1 : Playwright (Local / Docker)
 * Tier 2 : Puppeteer + @sparticuz/chromium (Linux Serverless avec dépendances C++)
 * Tier 3 : Microlink Cloud API + HTML Parser (Fallback ultime garanti pour Vercel Serverless)
 */
export async function captureWebPage(targetUrl: string): Promise<WebPageCaptureResult> {
  const domainName = extractDomainName(targetUrl);
  const faviconUrl = getFaviconUrl(targetUrl);

  // -------------------------------------------------------------
  // TIER 1 : Playwright (Local / Docker)
  // -------------------------------------------------------------
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    });

    try {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();
      page.setDefaultTimeout(15000);

      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(500);

      const pageTitle = (await page.title()) || domainName;
      const screenshotBuffer = await page.screenshot({ type: 'jpeg', quality: 65, fullPage: true });
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
    const puppeteer = await import('puppeteer-core');
    const sparticuz = await import('@sparticuz/chromium');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = sparticuz.default || sparticuz;

    const executablePath = await mod.executablePath();
    const browser = await puppeteer.default.launch({
      args: mod.args || ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath,
      headless: mod.headless === 'new' ? true : Boolean(mod.headless),
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await new Promise((r) => setTimeout(r, 500));

      const pageTitle = (await page.title()) || domainName;
      const screenshotBuffer = (await page.screenshot({
        type: 'jpeg',
        quality: 65,
        fullPage: true,
      })) as Buffer;
      const screenshotBase64 = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;

      const { candidates, pageSize } = await extractDomSectionsPuppeteer(page);

      await browser.close();
      return { screenshotBase64, pageSize, candidates, pageTitle, domainName, faviconUrl, source: 'puppeteer' };
    } catch (err) {
      await browser.close().catch(() => {});
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
  return await captureWebPageCloudFallback(targetUrl);
}

/**
 * Tier 3 : Capture Cloud via l'API publique Microlink + parsing HTML direct
 */
async function captureWebPageCloudFallback(targetUrl: string): Promise<WebPageCaptureResult> {
  console.log('[Capture Engine] Exécution du secours Cloud API pour :', targetUrl);

  const domainName = extractDomainName(targetUrl);
  const faviconUrl = getFaviconUrl(targetUrl);

  let screenshotBase64 = '';
  let pageTitle = domainName;

  try {
    const microlinkUrl = `https://api.microlink.io/?url=${encodeURIComponent(
      targetUrl
    )}&screenshot=true&meta=true&viewport.width=1440&viewport.height=900&viewport.deviceScaleFactor=1`;

    const response = await fetch(microlinkUrl, {
      headers: { Accept: 'application/json' },
    });

    if (response.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await response.json();
      pageTitle = data?.data?.title || domainName;
      const screenshotUrl = data?.data?.screenshot?.url;

      if (screenshotUrl) {
        const imgRes = await fetch(screenshotUrl);
        if (imgRes.ok) {
          const arrayBuffer = await imgRes.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          screenshotBase64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
        }
      }
    }
  } catch (err) {
    console.warn('[Capture Engine Cloud] Erreur Microlink API :', err);
  }

  // Image de secours de 1x1px si la capture distante échoue
  if (!screenshotBase64) {
    screenshotBase64 =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  // Fetch du HTML direct pour isoler les en-têtes et créer les candidats de section
  let candidates: ExtractedSectionCandidate[] = [];
  try {
    const htmlRes = await fetch(targetUrl, {
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
