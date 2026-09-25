import { NextRequest, NextResponse } from 'next/server';
import type { Browser } from 'playwright-core';
import { getBrowser } from '@/lib/browser';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  DetectedSection,
  SectionCoordinates,
  SectionRecommendations,
  SmartAnalyzeResponse,
} from '@/types/analyzer';
import { checkRateLimit, createRateLimitResponse, validateSafeUrl } from '@/lib/security';
import { createClient } from '@/lib/supabase/server';
import { checkUsageQuota, incrementUsageCount } from '@/lib/usage';
import { UserPlan } from '@/types/database';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

interface CandidateDomSection {
  id: string;
  tag: string;
  coordinates: SectionCoordinates;
  headingText?: string;
  textSnippet?: string;
}

// Générateur de labels heuristiques pour le Fallback automatique
function generateFallbackLabel(candidate: CandidateDomSection, index: number): string {
  const tag = candidate.tag.toLowerCase();
  const heading = candidate.headingText?.trim();
  const text = (candidate.textSnippet || '').toLowerCase();

  if (tag === 'header' || tag === 'nav' || candidate.coordinates.y < 80) {
    return 'Navigation & En-tête';
  }
  if (candidate.coordinates.y < 500 || heading?.toLowerCase().includes('welcome') || heading?.toLowerCase().includes('bienvenue')) {
    return heading ? `Hero : ${heading.slice(0, 35)}` : 'Section Hero Principale';
  }
  if (tag === 'footer' || text.includes('copyright') || text.includes('tous droits réservés')) {
    return 'Pied de page (Footer)';
  }
  if (text.includes('tarif') || text.includes('prix') || text.includes('pricing') || text.includes('plan')) {
    return 'Grille Tarifaire & Offres';
  }
  if (text.includes('témoignage') || text.includes('avis') || text.includes('testimonial') || text.includes('client')) {
    return 'Témoignages & Avis Clients';
  }
  if (text.includes('faq') || text.includes('question')) {
    return 'Questions Fréquentes (FAQ)';
  }
  if (heading && heading.length > 2) {
    return heading.slice(0, 40);
  }
  return `Section ${index + 1}`;
}

export async function POST(req: NextRequest) {
  const overallStartTime = Date.now();

  // 1. Contrôle du débit (Rate Limiting par IP : 10 req/min)
  const rateLimit = checkRateLimit(req, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rateLimit.allowed) {
    return createRateLimitResponse(rateLimit.retryAfterSeconds);
  }

  let body: { url?: string; isPremiumUser?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Format JSON invalide dans le corps de la requête.' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Vérification de l'utilisateur connecté via Supabase Server Client
  const supabase = createClient();
  let userId: string | null = null;
  let userPlan: UserPlan = 'free';

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      userId = user.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', userId)
        .maybeSingle();

      if (profile?.plan) {
        userPlan = profile.plan as UserPlan;
      }
    }
  } catch (authErr) {
    console.warn('[smart-analyze] Vérification utilisateur ignorée ou indisponible :', authErr);
  }

  // Récupération de l'adresse IP du client
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1';

  // Contrôle des quotas mensuels (3 analyses pour Free connecté, 1 pour anonyme, illimité pour Pro/Agence)
  const quotaCheck = await checkUsageQuota(userId, clientIp, userPlan);
  const isAllowedFullAi = quotaCheck.allowedFullAnalysis;

  let rawUrl = body?.url?.trim();
  if (!rawUrl) {
    return NextResponse.json(
      { success: false, error: 'Une URL valide est requise pour l’analyse intelligente.' },
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Correction de la variante d'URL de déploiement Vercel
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

  const targetUrl = validation.parsedUrl.href;

  let browser: Browser | null = null;

  try {
    browser = await getBrowser();

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    });

    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(15000);

    // 1. Navigation vers la page cible avec stabilisation réseau, polices et images
    await page.goto(targetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });

    try {
      await page.waitForLoadState('networkidle', { timeout: 6000 });
    } catch {
      // Poursuivre si des flux résiduels restent actifs
    }

    // Stabilisation complète du layout : polices et images chargées
    await page.evaluate(async () => {
      if (document.fonts) {
        try {
          await document.fonts.ready;
        } catch {}
      }
      const imgs = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        imgs.filter((img) => !img.complete).map(
          (img) =>
            new Promise((res) => {
              img.onload = res;
              img.onerror = res;
              setTimeout(res, 2000);
            })
        )
      );
    });

    await page.waitForTimeout(800); // Laisser le temps aux animations CSS et recalculs flex/grid

    // 2. Extraction multi-signaux universelle des sections DOM
    const { candidates: candidateSections, debugStats } = await page.evaluate(() => {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const docWidth = Math.max(
        document.documentElement.clientWidth,
        window.innerWidth,
        1440
      );
      const minWidth = docWidth * 0.7;
      const minHeight = 180;

      // 1. FILTRAGE DE VISIBILITÉ RÉELLE STRICTE (élimine les versions mobiles masquées)
      function isElementTrulyVisible(el: HTMLElement): boolean {
        if (!(el instanceof HTMLElement)) return false;
        if (el.offsetWidth === 0 || el.offsetHeight === 0) return false;

        const style = window.getComputedStyle(el);
        if (
          style.display === 'none' ||
          style.visibility === 'hidden' ||
          parseFloat(style.opacity || '1') === 0
        ) {
          return false;
        }

        // Vérification de la chaîne d'ancêtres complète
        if (typeof (el as unknown as { checkVisibility?: (opt: object) => boolean }).checkVisibility === 'function') {
          if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) {
            return false;
          }
        } else {
          let curr: HTMLElement | null = el.parentElement;
          while (curr && curr !== document.body) {
            const pStyle = window.getComputedStyle(curr);
            if (
              pStyle.display === 'none' ||
              pStyle.visibility === 'hidden' ||
              parseFloat(pStyle.opacity || '1') === 0 ||
              curr.offsetWidth === 0 ||
              curr.offsetHeight === 0
            ) {
              return false;
            }
            curr = curr.parentElement;
          }
        }

        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return false;

        return true;
      }

      // 4. CONCATÉNATION DE TEXTE PROPRE AVEC ESPACES EXPLICITES ENTRE NŒUDS
      function extractCleanVisibleText(rootEl: HTMLElement): string {
        const textPieces: string[] = [];
        const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, {
          acceptNode: (node) => {
            const parent = node.parentElement;
            if (!parent) return NodeFilter.FILTER_REJECT;
            const style = window.getComputedStyle(parent);
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              parseFloat(style.opacity || '1') === 0 ||
              parent.offsetWidth === 0 ||
              parent.offsetHeight === 0 ||
              ['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(parent.tagName)
            ) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          },
        });

        let currentNode: Node | null = walker.nextNode();
        while (currentNode) {
          const val = currentNode.nodeValue?.trim();
          if (val && val.length > 0) {
            textPieces.push(val);
          }
          currentNode = walker.nextNode();
        }

        return textPieces.join(' ').replace(/\s+/g, ' ').trim();
      }

      const allElements = Array.from(document.body.querySelectorAll('*')) as HTMLElement[];

      interface RawCandidate {
        element: HTMLElement;
        rect: DOMRect;
        tag: string;
        text: string;
        hasImages: boolean;
        hasInteractives: boolean;
        bgColor: string;
        contentScore: number;
        depth: number;
        calculatedHeight: number;
      }

      const rawCandidates: RawCandidate[] = [];

      function getDepth(el: HTMLElement): number {
        let d = 0;
        let curr: HTMLElement | null = el;
        while (curr && curr !== document.body) {
          d++;
          curr = curr.parentElement;
        }
        return d;
      }

      function getEffectiveBgColor(el: HTMLElement): string {
        let curr: HTMLElement | null = el;
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
        // Filtrage de visibilité réelle stricte
        if (!isElementTrulyVisible(el)) {
          continue;
        }

        const rect = el.getBoundingClientRect();
        if (rect.width < minWidth || rect.height < minHeight) {
          continue;
        }

        // 3. RECALCUL DE LA HAUTEUR RÉELLE COMPLÈTE (englobe toutes les rangées de grilles/colonnes)
        let realBottom = rect.bottom;
        const descendants = el.querySelectorAll('*');
        for (let di = 0; di < descendants.length; di++) {
          const d = descendants[di];
          if (d instanceof HTMLElement && d.offsetWidth > 0 && d.offsetHeight > 0) {
            const dr = d.getBoundingClientRect();
            if (dr.bottom > realBottom) {
              realBottom = dr.bottom;
            }
          }
        }
        const calculatedHeight = Math.max(rect.height, realBottom - rect.top, el.scrollHeight);

        // 4. Extraction du texte propre avec espaces explicites
        const visibleText = extractCleanVisibleText(el);
        const hasImages =
          el.querySelectorAll('img, svg, video, canvas, picture').length > 0 ||
          (window.getComputedStyle(el).backgroundImage && window.getComputedStyle(el).backgroundImage !== 'none');
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
          rect,
          tag: el.tagName.toLowerCase(),
          text: visibleText,
          hasImages: Boolean(hasImages),
          hasInteractives,
          bgColor: getEffectiveBgColor(el),
          contentScore,
          depth: getDepth(el),
          calculatedHeight,
        });
      }

      const rawCount = rawCandidates.length;

      // Règle 3 : Élimine les doublons par imbrication (on garde la section parente complète)
      const toRemove = new Set<HTMLElement>();

      for (let i = 0; i < rawCandidates.length; i++) {
        for (let j = 0; j < rawCandidates.length; j++) {
          if (i === j) continue;
          const parent = rawCandidates[i];
          const child = rawCandidates[j];

          if (parent.element.contains(child.element)) {
            const heightRatio = child.rect.height / (parent.rect.height || 1);
            if (heightRatio >= 0.85) {
              toRemove.add(child.element);
            }
          }
        }
      }

      // Élimination des conteneurs racines englobant toute la page
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

      const filtered = rawCandidates.filter((c) => !toRemove.has(c.element));

      // Déduplication par coordonnées verticales
      filtered.sort(
        (a, b) => a.rect.top + scrollY - (b.rect.top + scrollY) || b.depth - a.depth
      );

      const deduplicated: RawCandidate[] = [];
      for (const c of filtered) {
        const y = Math.round(c.rect.top + scrollY);
        const h = Math.round(c.calculatedHeight);

        const isOverlapping = deduplicated.some((existing) => {
          const ey = Math.round(existing.rect.top + scrollY);
          const eh = Math.round(existing.calculatedHeight);
          const yDiff = Math.abs(y - ey);
          const hDiff = Math.abs(h - eh);
          return (
            (yDiff < 90 && hDiff < 100) ||
            existing.element.contains(c.element) ||
            c.element.contains(existing.element)
          );
        });

        if (!isOverlapping) {
          deduplicated.push(c);
        }
      }

      // Règle 5 : 2. GÉNÉRALISE LE CADRAGE PLEINE LARGEUR (x = 0, width = docWidth) À TOUTES LES SECTIONS
      let candidatesResult = deduplicated.map((c, idx) => {
        const x = 0;
        const width = docWidth;

        // Marge de sécurité verticale (Padding Y de 30px pour préserver les en-têtes et bas de grille)
        const paddingY = 30;
        const rawY = Math.round(c.rect.top + scrollY);
        const y = Math.max(0, rawY - paddingY);
        const height = Math.min(docTotalHeight - y, Math.round(c.calculatedHeight + paddingY * 2));

        const headingEl = c.element.querySelector('h1, h2, h3, h4');
        const headingText = headingEl ? extractCleanVisibleText(headingEl as HTMLElement).slice(0, 80) : undefined;
        const textSnippet = c.text.slice(0, 160);

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

      // Si plus de 12 sections : prioriser par score de contenu et hauteur
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

      // Si moins de 5 sections et présence de très grands blocs (> 1200px) : division raisonnée
      if (candidatesResult.length < 5) {
        const expanded: typeof candidatesResult = [];
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

      // Fallback si la page est atypique ou vide
      if (candidatesResult.length === 0) {
        const docHeight = Math.max(
          document.body.scrollHeight,
          document.documentElement.scrollHeight,
          900
        );
        const step = Math.min(800, Math.round(docHeight / 6));
        let c = 1;
        for (let currY = 0; currY < docHeight; currY += step) {
          candidatesResult.push({
            id: `sec-${c++}`,
            tag: 'section',
            coordinates: {
              x: 0,
              y: currY,
              width: 1440,
              height: Math.min(step, docHeight - currY),
            },
            headingText: `Volet ${c - 1}`,
            textSnippet: '',
            contentScore: 1,
            bgColor: '#ffffff',
          });
          if (candidatesResult.length >= 8) break;
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

    // Logging en développement du ratio de détection multi-signaux
    console.log(
      `[smart-analyze] Candidats bruts détectés : ${debugStats.rawCandidatesCount} | Dédupliqués : ${debugStats.deduplicatedCount} ➔ Sections finales retenues : ${debugStats.finalCount}`
    );

    // 3. Capture full page pour l'analyse visuelle et le recadrage client (JPEG 60% pour rapidité token)
    const screenshotBuffer = await page.screenshot({
      type: 'jpeg',
      quality: 60,
      fullPage: true,
      timeout: 10000,
    });

    const fullPageBase64 = `data:image/jpeg;base64,${screenshotBuffer.toString('base64')}`;

    // Dimensions réelles du document
    const pageSize = await page.evaluate(() => ({
      width: Math.max(document.body.scrollWidth, 1440),
      height: Math.max(document.body.scrollHeight, 900),
    }));

    await browser.close();
    browser = null;

    // 4. Analyse intelligente via Gemini Vision avec rôle de Directeur Artistique
    const apiKey = process.env.GEMINI_API_KEY;
    const isKeyConfigured = apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.trim().length > 10;

    let detectedSections: DetectedSection[] = [];
    let recommendations: SectionRecommendations = {
      mobile: [],
      desktop: [],
      social: [],
    };
    let isFallback = true;
    let fallbackMessage: string | undefined = 'Analyse IA indisponible, sections détectées automatiquement.';

    if (!isAllowedFullAi) {
      fallbackMessage = 'Quota d’analyses IA mensuel atteint. Sections détectées automatiquement.';
    }

    if (isKeyConfigured && isAllowedFullAi) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Utilisation du modèle actif gemini-3.6-flash (gemini-2.5-flash est déprécié par Google)
        const model = genAI.getGenerativeModel({
          model: 'gemini-3.6-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const imagePart = {
          inlineData: {
            data: screenshotBuffer.toString('base64'),
            mimeType: 'image/jpeg',
          },
        };

        const prompt = `Tu es un Directeur Artistique Senior et Expert en Conversion Marketing Web & Mockups Publicitaires de niveau mondial.
Voici la capture visuelle complète d'une page web ainsi que la liste des coordonnées DOM des sections détectées par analyse multi-signaux :
${JSON.stringify(candidateSections, null, 2)}

Effectue un RAISONNEMENT EN 2 TEMPS pour chaque section :
TEMPS 1 - ÉVALUATION VISUELLE & GRAPHIQUE :
- Observe la composition, le contraste, la typographie, la clarté de l'interface ou des éléments graphiques.
- Évalue si la section se démarque immédiatement dans un cadre d'ordinateur ou de smartphone (mockup).

TEMPS 2 - DÉCISION MARKETING & JUSTIFICATION CONCRÈTE :
- Attribue un verdict franc et justifié ("excellent" | "bon" | "moyen" | "faible").
- Rédige une JUSTIFICATION CONCRÈTE OBLIGATOIRE (pas de réponse vague ou générique) expliquant pourquoi cette section mérite ou non d'être mise en valeur dans un portfolio, une publicité ou une présentation client.

EXEMPLES FEW-SHOT :
Exemple 1 (Hero) :
- label: "Hero & Proposition de Valeur Principale"
- visualAnalysis: "Titre percutant en grand corps avec fort contraste, badge coloré et aperçu complet de l'interface logicielle."
- verdict: "excellent"
- justification: "Forte accroche visuelle avec le produit en vedette et un bouton d'action net, idéal pour capter l'attention dans un mockup vitrine."
- marketingScore: 96
- qualityScore: 94

Exemple 2 (Grille de fonctionnalités) :
- label: "Grille de Fonctionnalités Clés"
- visualAnalysis: "Mise en page modulaire en 3 colonnes avec icônes distinctes et captures de micro-interactions."
- verdict: "bon"
- justification: "Excellente lisibilité des bénéfices produit, composition équilibrée pour un mockup au format paysage."
- marketingScore: 82
- qualityScore: 86

Exemple 3 (Footer / Pied de page) :
- label: "Pied de page & Liens Légaux"
- visualAnalysis: "Colonnes de liens textuels compactes sur fond neutre sans élément graphique saillant."
- verdict: "faible"
- justification: "Contenu purement utilitaire et textuel, sans impact émotionnel ou commercial suffisant pour un mockup marketing."
- marketingScore: 35
- qualityScore: 68

RECOMMANDATIONS PAR FORMAT :
Sélectionne les meilleures sections pour :
- "mobile" (2 à 3 sections à fort impact vertical : ex Hero, Chiffres clés, Témoignage phare)
- "desktop" (2 à 4 sections larges : ex Hero, Grille de features, Tarifs)
- "social" (1 à 2 sections ultra-visuelles au format carré 1:1)

Réponds STRICTEMENT au format JSON avec ce schéma :
{
  "sections": [
    {
      "id": "sec-1",
      "label": "Hero & Proposition de Valeur Principale",
      "visualAnalysis": "...",
      "verdict": "excellent",
      "justification": "...",
      "marketingScore": 95,
      "qualityScore": 92
    }
  ],
  "recommendations": {
    "mobile": ["sec-1"],
    "desktop": ["sec-1", "sec-2"],
    "social": ["sec-1"]
  }
}`;

        // Génération avec tentative sur gemini-3.6-flash puis gemini-3.5-flash si nécessaire
        let responseText = '';
        try {
          const geminiPromise = model.generateContent([prompt, imagePart]);
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout Gemini (>25s)')), 25000)
          );
          const geminiResult = (await Promise.race([geminiPromise, timeoutPromise])) as {
            response: { text: () => string };
          };
          responseText = geminiResult.response.text();
          console.log('[Gemini Vision] Inférence réussie avec succès via gemini-3.6-flash');
        } catch (m1Err: unknown) {
          const m1Msg = (m1Err as { message?: string })?.message || '';
          console.warn('[Gemini Vision] Échec gemini-3.6-flash, tentative fallback gemini-3.5-flash :', m1Msg);
          const fallbackModel = genAI.getGenerativeModel({
            model: 'gemini-3.5-flash',
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });
          const fbPromise = fallbackModel.generateContent([prompt, imagePart]);
          const fbTimeout = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout Gemini Fallback (>20s)')), 20000)
          );
          const fbResult = (await Promise.race([fbPromise, fbTimeout])) as {
            response: { text: () => string };
          };
          responseText = fbResult.response.text();
          console.log('[Gemini Vision] Inférence réussie via le modèle de secours gemini-3.5-flash');
        }

        interface ParsedSectionItem {
          id?: string;
          label?: string;
          description?: string;
          visualAnalysis?: string;
          verdict?: 'excellent' | 'bon' | 'moyen' | 'faible';
          justification?: string;
          marketingScore?: number;
          qualityScore?: number;
        }

        interface ParsedGeminiResponse {
          sections?: ParsedSectionItem[];
          recommendations?: {
            mobile?: string[];
            desktop?: string[];
            social?: string[];
          };
        }

        const parsed = JSON.parse(responseText) as ParsedGeminiResponse;

        if (Array.isArray(parsed?.sections) && parsed.sections.length > 0) {
          // Fusion des labels IA avec les vraies coordonnées DOM Playwright
          detectedSections = candidateSections.map((candidate) => {
            const aiSec = parsed.sections?.find((s) => s.id === candidate.id);
            const mScore =
              typeof aiSec?.marketingScore === 'number'
                ? aiSec.marketingScore
                : typeof aiSec?.qualityScore === 'number'
                ? aiSec.qualityScore
                : 85;

            return {
              id: candidate.id,
              label: aiSec?.label || generateFallbackLabel(candidate, 0),
              description: aiSec?.description || candidate.headingText,
              visualAnalysis: isAllowedFullAi ? aiSec?.visualAnalysis : undefined,
              verdict:
                aiSec?.verdict ||
                (mScore >= 85 ? 'excellent' : mScore >= 70 ? 'bon' : mScore >= 50 ? 'moyen' : 'faible'),
              justification: isAllowedFullAi ? aiSec?.justification : undefined,
              marketingScore: mScore,
              coordinates: candidate.coordinates,
              qualityScore: typeof aiSec?.qualityScore === 'number' ? aiSec.qualityScore : 85,
            };
          });

          if (parsed.recommendations) {
            recommendations = {
              mobile: Array.isArray(parsed.recommendations.mobile) ? parsed.recommendations.mobile : [],
              desktop: Array.isArray(parsed.recommendations.desktop) ? parsed.recommendations.desktop : [],
              social: Array.isArray(parsed.recommendations.social) ? parsed.recommendations.social : [],
            };
          }

          isFallback = false;
          fallbackMessage = undefined;

          // 8. Incrémente le compteur de quota uniquement si l'analyse IA complète a réussi
          if (isAllowedFullAi) {
            await incrementUsageCount(userId, clientIp);
          }
        }
      } catch (geminiError: unknown) {
        const gErr = geminiError as { message?: string };
        console.error('[Gemini Vision Analysis Error]:', gErr?.message || geminiError);
        // En cas d'erreur ou timeout, on bascule proprement sur le fallback heuristique
        isFallback = true;
        fallbackMessage = `Analyse IA indisponible (${gErr?.message?.slice(0, 60) || 'Erreur service'}), sections détectées automatiquement.`;
      }
    }

    // Si on est en mode Fallback (clé absente, timeout ou erreur)
    if (isFallback) {
      detectedSections = candidateSections.map((candidate, idx) => ({
        id: candidate.id,
        label: generateFallbackLabel(candidate, idx),
        description: candidate.headingText || `Position Y: ${candidate.coordinates.y}px`,
        coordinates: candidate.coordinates,
        qualityScore: Math.max(70, 95 - idx * 3),
      }));

      // Recommandations par défaut
      const firstSecId = detectedSections[0]?.id;
      const secondSecId = detectedSections[1]?.id;
      const thirdSecId = detectedSections[2]?.id;

      recommendations = {
        mobile: [firstSecId, secondSecId].filter(Boolean) as string[],
        desktop: [firstSecId, secondSecId, thirdSecId].filter(Boolean) as string[],
        social: [firstSecId].filter(Boolean) as string[],
      };
    }

    const response: SmartAnalyzeResponse = {
      success: true,
      url: targetUrl,
      fullPageScreenshot: fullPageBase64,
      screenshotWidth: pageSize.width,
      screenshotHeight: pageSize.height,
      sections: detectedSections,
      recommendations,
      isFallback,
      fallbackMessage,
      quotaExceeded: quotaCheck.quotaExceeded,
      usageCount: quotaCheck.currentUsage + (isAllowedFullAi && !isFallback ? 1 : 0),
      usageLimit: quotaCheck.limit,
      executionTimeMs: Date.now() - overallStartTime,
    };

    return NextResponse.json(response, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Erreur lors de l’analyse intelligente de la page.',
      },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
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
}
