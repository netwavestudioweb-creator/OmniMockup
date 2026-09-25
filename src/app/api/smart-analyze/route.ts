import { NextRequest, NextResponse } from 'next/server';
import { captureWebPage } from '@/lib/browser';
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

  try {
    let fullPageBase64 = '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let candidateSections: any[] = [];
    let pageSize = { width: 1440, height: 2400 };

    try {
      const captureResult = await captureWebPage(targetUrl);
      fullPageBase64 = captureResult.screenshotBase64;
      candidateSections = captureResult.candidates;
      pageSize = captureResult.pageSize;
    } catch (captureErr) {
      console.error('[smart-analyze] Échec critique de capture :', captureErr);
      return NextResponse.json(
        {
          success: false,
          error: 'Impossible d’accéder au site web pour la capture d’écran.',
        },
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

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

        const cleanBase64 = fullPageBase64.replace(/^data:image\/\w+;base64,/, '');
        const imagePart = {
          inlineData: {
            data: cleanBase64,
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
  }
}
