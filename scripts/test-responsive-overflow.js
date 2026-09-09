const { chromium } = require('playwright');

async function checkViewport(page, width, height, url) {
  await page.setViewportSize({ width, height });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const overflowInfo = await page.evaluate(() => {
    const docWidth = document.documentElement.scrollWidth;
    const bodyWidth = document.body.scrollWidth;
    const innerWidth = window.innerWidth;
    const hasHorizontalScroll = docWidth > innerWidth || bodyWidth > innerWidth;

    // Chercher tous les éléments qui dépassent horizontalement
    const overflowingElements = [];
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.width > innerWidth + 1 || rect.right > innerWidth + 1) {
        if (['SCRIPT', 'STYLE', 'HEAD', 'HTML', 'BODY'].includes(el.tagName)) continue;
        overflowingElements.push({
          tag: el.tagName,
          id: el.id,
          className: el.className ? String(el.className).slice(0, 80) : '',
          width: Math.round(rect.width),
          right: Math.round(rect.right),
          text: el.innerText ? el.innerText.slice(0, 30).trim() : ''
        });
      }
    }

    // Spécifiquement vérifier les boutons populaires
    const presetButtons = Array.from(document.querySelectorAll('button')).filter(b => 
      b.innerText && (b.innerText.includes('Tailwind') || b.innerText.includes('Next.js') || b.innerText.includes('Hacker News'))
    ).map(b => {
      const r = b.getBoundingClientRect();
      return {
        text: b.innerText.trim(),
        right: Math.round(r.right),
        left: Math.round(r.left),
        width: Math.round(r.width),
        fitsInside: r.right <= innerWidth
      };
    });

    return {
      innerWidth,
      docWidth,
      bodyWidth,
      hasHorizontalScroll,
      overflowingElementsCount: overflowingElements.length,
      overflowingElements: overflowingElements.slice(0, 5),
      presetButtons
    };
  });

  return overflowInfo;
}

async function run() {
  console.log('--- DÉBUT DU TEST DE RESPONSIVE & DÉBORDEMENT HORIZONTAL ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const viewports = [
    { name: 'iPhone SE (375px)', width: 375, height: 812 },
    { name: 'iPhone 16 Pro Max (440px)', width: 440, height: 956 },
    { name: 'iPad Portrait (768px)', width: 768, height: 1024 }
  ];

  for (const vp of viewports) {
    console.log(`\n========================================`);
    console.log(`Test sur ${vp.name} [Largeur: ${vp.width}px]`);
    console.log(`========================================`);

    // Test sur la page principale (Wizard Étape 1)
    const resHome = await checkViewport(page, vp.width, vp.height, 'http://localhost:3000');
    console.log(`Page d'accueil / Étape 1 :`);
    console.log(`- innerWidth: ${resHome.innerWidth}px, docWidth: ${resHome.docWidth}px, bodyWidth: ${resHome.bodyWidth}px`);
    console.log(`- Scroll horizontal détecté ? : ${resHome.hasHorizontalScroll ? 'OUI (BUG)' : 'NON (PARFAIT)'}`);
    console.log(`- Éléments débordants : ${resHome.overflowingElementsCount}`);
    if (resHome.overflowingElementsCount > 0) {
      console.log('  Détail des débordements :', JSON.stringify(resHome.overflowingElements, null, 2));
    }
    console.log(`- Boutons Presets :`);
    for (const pb of resHome.presetButtons) {
      console.log(`  * "${pb.text}": right=${pb.right}px <= ${vp.width}px -> ${pb.fitsInside ? 'OK (rentre dans l\'écran)' : 'DÉBORDE !'}`);
    }

    // Test sur la page Pricing
    const resPricing = await checkViewport(page, vp.width, vp.height, 'http://localhost:3000/pricing');
    console.log(`\nPage /pricing :`);
    console.log(`- Scroll horizontal détecté ? : ${resPricing.hasHorizontalScroll ? 'OUI (BUG)' : 'NON (PARFAIT)'}`);
    console.log(`- Éléments débordants : ${resPricing.overflowingElementsCount}`);
  }

  await browser.close();
  console.log('\n--- FIN DES TESTS ---');
}

run().catch(err => {
  console.error('Erreur lors du test :', err);
  process.exit(1);
});
