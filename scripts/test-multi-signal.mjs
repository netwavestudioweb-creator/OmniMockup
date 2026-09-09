import { chromium } from 'playwright';

const testSites = [
  { name: '1. WordPress / HTML classique', url: 'https://wordpress.org' },
  { name: '2. React / Next.js avec Tailwind', url: 'https://nextjs.org' },
  { name: '3. Webflow', url: 'https://webflow.com' },
];

async function testSite(browser, { name, url }) {
  console.log(`\n========================================`);
  console.log(`TEST: ${name}`);
  console.log(`URL: ${url}`);
  console.log(`========================================`);

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  });

  try {
    const startTime = Date.now();
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1000);

    const { candidates, debugStats } = await page.evaluate(() => {
      const scrollX = window.scrollX || window.pageXOffset || 0;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const docWidth = Math.max(
        document.documentElement.clientWidth,
        window.innerWidth,
        1440
      );
      const minWidth = docWidth * 0.8;
      const minHeight = 200;

      const allElements = Array.from(document.body.querySelectorAll('*'));

      const rawCandidates = [];

      function getDepth(el) {
        let d = 0;
        let curr = el;
        while (curr && curr !== document.body) {
          d++;
          curr = curr.parentElement;
        }
        return d;
      }

      function getEffectiveBgColor(el) {
        let curr = el;
        while (curr && curr !== document.body) {
          const style = window.getComputedStyle(curr);
          const bg = style.backgroundColor;
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
            return bg;
          }
          curr = curr.parentElement;
        }
        return 'rgba(255, 255, 255, 1)';
      }

      for (const el of allElements) {
        if (!(el instanceof HTMLElement)) continue;

        const style = window.getComputedStyle(el);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          parseFloat(style.opacity || '1') < 0.1
        ) {
          continue;
        }

        const rect = el.getBoundingClientRect();
        if (rect.width < minWidth || rect.height < minHeight) {
          continue;
        }

        const visibleText = (el.innerText || '').replace(/\s+/g, ' ').trim();
        const hasImages =
          el.querySelectorAll('img, svg, video, canvas, picture').length > 0 ||
          (style.backgroundImage && style.backgroundImage !== 'none');
        const hasInteractives =
          el.querySelectorAll('button, a[href], input, select, textarea, form').length > 0;

        if (visibleText.length < 25 && !hasImages && !hasInteractives) {
          continue;
        }

        let contentScore = 0;
        if (visibleText.length >= 25) contentScore += 1;
        if (visibleText.length >= 80) contentScore += 1;
        if (hasImages) contentScore += 2;
        if (hasInteractives) contentScore += 1;

        rawCandidates.push({
          element: el,
          rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height },
          tag: el.tagName.toLowerCase(),
          text: visibleText,
          hasImages: Boolean(hasImages),
          hasInteractives,
          bgColor: getEffectiveBgColor(el),
          contentScore,
          depth: getDepth(el),
        });
      }

      const rawCount = rawCandidates.length;

      // Élimine les doublons par imbrication (>= 90%)
      const toRemove = new Set();

      for (let i = 0; i < rawCandidates.length; i++) {
        for (let j = 0; j < rawCandidates.length; j++) {
          if (i === j) continue;
          const parent = rawCandidates[i];
          const child = rawCandidates[j];

          if (parent.element.contains(child.element)) {
            const parentArea = parent.rect.width * parent.rect.height;
            const childArea = child.rect.width * child.rect.height;
            const heightRatio = child.rect.height / (parent.rect.height || 1);
            const areaRatio = parentArea > 0 ? childArea / parentArea : 0;

            if (heightRatio >= 0.9 || areaRatio >= 0.88) {
              toRemove.add(parent.element);
            }
          }
        }
      }

      // Élimine les conteneurs racines globaux (> 75% hauteur totale avec multiples enfants candidats)
      const docTotalHeight = Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        900
      );
      for (const cand of rawCandidates) {
        if (cand.rect.height >= 0.75 * docTotalHeight) {
          const containedChildren = rawCandidates.filter(
            (other) => other !== cand && cand.element.contains(other.element)
          );
          if (containedChildren.length >= 2) {
            toRemove.add(cand.element);
          }
        }
      }

      let filtered = rawCandidates.filter((c) => !toRemove.has(c.element));

      filtered.sort(
        (a, b) => a.rect.top + scrollY - (b.rect.top + scrollY) || b.depth - a.depth
      );

      const deduplicated = [];
      for (const c of filtered) {
        const y = Math.round(c.rect.top + scrollY);
        const h = Math.round(c.rect.height);

        const isOverlapping = deduplicated.some((existing) => {
          const ey = Math.round(existing.rect.top + scrollY);
          const eh = Math.round(existing.rect.height);
          const yDiff = Math.abs(y - ey);
          const hDiff = Math.abs(h - eh);
          return (
            yDiff < 35 &&
            (hDiff < 60 ||
              existing.element.contains(c.element) ||
              c.element.contains(existing.element))
          );
        });

        if (!isOverlapping) {
          deduplicated.push(c);
        }
      }

      let candidatesResult = deduplicated.map((c, idx) => {
        const x = Math.max(0, Math.round(c.rect.left + scrollX));
        const y = Math.max(0, Math.round(c.rect.top + scrollY));
        const width = Math.min(docWidth, Math.round(c.rect.width));
        const height = Math.round(c.rect.height);

        const headingEl = c.element.querySelector('h1, h2, h3, h4');
        const headingText = headingEl ? headingEl.textContent.trim().slice(0, 80) : undefined;
        const textSnippet = c.text.slice(0, 100);

        return {
          id: `sec-${idx + 1}`,
          tag: c.tag,
          coordinates: { x, y, width, height },
          headingText,
          textSnippet,
          contentScore: c.contentScore,
          bgColor: c.bgColor,
        };
      });

      if (candidatesResult.length > 12) {
        candidatesResult.sort(
          (a, b) =>
            b.contentScore - a.contentScore || b.coordinates.height - a.coordinates.height
        );
        candidatesResult = candidatesResult.slice(0, 12);
        candidatesResult.sort((a, b) => a.coordinates.y - b.coordinates.y);
        candidatesResult = candidatesResult.map((sec, i) => ({
          ...sec,
          id: `sec-${i + 1}`,
        }));
      }

      if (candidatesResult.length < 5) {
        const expanded = [];
        let count = 1;
        for (const sec of candidatesResult) {
          if (sec.coordinates.height > 1200 && candidatesResult.length + expanded.length < 10) {
            const halfH = Math.round(sec.coordinates.height / 2);
            expanded.push({
              ...sec,
              id: `sec-${count++}`,
              coordinates: { ...sec.coordinates, height: halfH },
              headingText: sec.headingText ? `${sec.headingText} (Partie 1)` : undefined,
            });
            expanded.push({
              ...sec,
              id: `sec-${count++}`,
              coordinates: {
                ...sec.coordinates,
                y: sec.coordinates.y + halfH,
                height: sec.coordinates.height - halfH,
              },
              headingText: sec.headingText ? `${sec.headingText} (Partie 2)` : undefined,
            });
          } else {
            expanded.push({ ...sec, id: `sec-${count++}` });
          }
        }
        if (expanded.length >= 5) {
          candidatesResult = expanded.slice(0, 12);
        }
      }

      return {
        candidates: candidatesResult,
        debugStats: {
          rawCandidatesCount: rawCount,
          deduplicatedCount: deduplicated.length,
          finalCount: candidatesResult.length,
        },
      };
    });

    const elapsed = Date.now() - startTime;
    console.log(`[Succes] ${name} (${elapsed}ms)`);
    console.log(`- Candidats bruts detectes : ${debugStats.rawCandidatesCount}`);
    console.log(`- Candidats apres deduplication : ${debugStats.deduplicatedCount}`);
    console.log(`- Sections finales retenues : ${debugStats.finalCount} (Objectif 5-12 atteint : ${debugStats.finalCount >= 5 && debugStats.finalCount <= 12 ? 'OUI' : 'NON'})`);
    console.log(`- Details des sections :`);
    candidates.forEach((s) => {
      console.log(`  * [${s.id}] <${s.tag}> H=${s.coordinates.height}px, Y=${s.coordinates.y}px | Titre: "${s.headingText || 'N/A'}" | Fond: ${s.bgColor}`);
    });
  } catch (err) {
    console.error(`[Erreur] ${name}:`, err.message);
  } finally {
    await page.close();
  }
}

async function run() {
  console.log('Lancement du test multi-signaux sur 3 typologies de sites...');
  const browser = await chromium.launch({ headless: true });
  try {
    for (const site of testSites) {
      await testSite(browser, site);
    }
  } finally {
    await browser.close();
    console.log('\nTests termines.');
  }
}

run();
