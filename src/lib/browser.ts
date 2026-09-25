import { chromium as playwrightChromium, Browser } from 'playwright-core';

/**
 * Utilitaire robuste pour obtenir une instance de navigateur Chromium.
 * Fonctionne à la fois en environnement local (Windows/macOS) et en serveur Linux / Serverless (Vercel, Docker, Sandboxes).
 */
export async function getBrowser(): Promise<Browser> {
  // 1. Tentative de lancement standard via Playwright (pour développement local)
  try {
    const { chromium: standardChromium } = await import('playwright');
    return await standardChromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
      ],
    });
  } catch (err: unknown) {
    const errorMsg = (err as { message?: string })?.message || '';
    console.warn(
      '[Browser Helper] Lancement standard Playwright indisponible. Bascule sur le mode de secours :',
      errorMsg
    );

    // 2. Repli automatique sur @sparticuz/chromium (environnement Linux Serverless / Sandbox)
    try {
      const sparticuz = await import('@sparticuz/chromium');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod: any = sparticuz.default || sparticuz;

      const executablePath = await mod.executablePath();

      return await playwrightChromium.launch({
        args: mod.args || [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
        executablePath,
        headless: mod.headless === 'new' ? true : Boolean(mod.headless),
      });
    } catch (sparticuzErr) {
      console.error('[Browser Helper] Échec du lancement avec le gestionnaire de secours :', sparticuzErr);
      throw new Error(
        `Impossible d'initialiser Chromium sur le serveur (${errorMsg}).`
      );
    }
  }
}
