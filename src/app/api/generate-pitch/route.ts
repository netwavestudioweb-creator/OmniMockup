import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectivePlan } from '@/lib/plan';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security';
import { logServerEvent } from '@/lib/admin';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// IA principale : Claude (Anthropic), si ANTHROPIC_API_KEY est configurée sur le serveur
const CLAUDE_MODEL = 'claude-opus-5-5';
// IA de secours : Google Gemini (les anciens modèles, comme gemini-1.5-flash, ont été retirés par Google)
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];

/** Lit l'objet JSON renvoyé par l'IA, même entouré de ```json … ``` ou d'une phrase */
function parseJsonReply(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
  }
}
const clip = (v: unknown, max: number, fallback: string) =>
  (typeof v === 'string' && v.trim() ? v.trim() : fallback).slice(0, max);

/**
 * Pitch IA : textes de vente générés à partir du projet.
 * Compte obligatoire ; gratuit et Solo : 2 crédits ; Pro : 5 par mois ; Agence : illimité
 * (contrôle et décompte dans authorize_pitch). Une génération qui échoue est remboursée.
 */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rl.allowed) return createRateLimitResponse(rl.retryAfterSeconds);

  const body = await req.json().catch(() => ({}));
  const projectTitle = clip(body?.projectTitle, 120, 'Mon Application Web');
  const projectUrl = clip(body?.projectUrl, 300, '');
  const projectDescription = clip(body?.projectDescription, 1200, '');
  const targetAudience = clip(body?.targetAudience, 200, 'Clients freelances & Entreprises');
  const techStack = Array.isArray(body?.techStack) ? body.techStack.slice(0, 15).map((t: unknown) => String(t).slice(0, 40)) : [];
  // Captures du site découpées en sections (JPG en base64), pour que l'IA lise le vrai contenu
  const sections: string[] = Array.isArray(body?.sections)
    ? body.sections
        .filter((x: unknown): x is string => typeof x === 'string' && x.length > 100 && x.length < 700_000 && /^[A-Za-z0-9+/=]+$/.test(x))
        .slice(0, 6)
    : [];

  const apiKey = process.env.GEMINI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey && !anthropicKey) {
    return NextResponse.json({ success: false, error: 'Service IA indisponible pour le moment.' }, { status: 503 });
  }

  // Identité et forfait réels (lus dans la base, jamais envoyés par le navigateur)
  let userId: string | null = null;
  let plan = 'free';
  try {
    const { data } = await createClient().auth.getUser();
    if (data.user) {
      userId = data.user.id;
      const { data: profile } = await createAdminClient()
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', userId)
        .maybeSingle();
      plan = getEffectivePlan(profile);
    }
  } catch {
    // session illisible : traité comme visiteur
  }
  // Développement local uniquement : la session de démonstration n'est pas décomptée
  const demo = process.env.NODE_ENV === 'development' && !userId && body?.demo === true;

  let eventId: number | null = null;
  if (!demo) {
    const { data: auth, error } = await createAdminClient().rpc('authorize_pitch', {
      p_user_id: userId,
      p_plan: plan,
      p_use_credits: body?.useCredits === true,
    });
    if (error) {
      console.error('[generate-pitch] Contrôle du forfait impossible :', error.message);
      return NextResponse.json({ success: false, error: 'Service momentanément indisponible.' }, { status: 503 });
    }
    const a = auth as { allowed: boolean; event_id?: number };
    if (!a.allowed) return NextResponse.json({ success: false, ...a }, { status: 402 });
    eventId = a.event_id ?? null;
  }

  const stackList = techStack.length > 0 ? techStack.join(', ') : 'Next.js, React, Tailwind CSS, TypeScript';
    const prompt = `
Tu es un Directeur Artistique et un Copywriter d'élite spécialisé dans l'aide aux développeurs web et créateurs tech pour VENDRE leurs services et projets à forte valeur ajoutée.

Voici les détails du projet réalisé :
- Nom du projet : "${projectTitle}"
- URL / Démo : "${projectUrl || 'Projet interne / confidentiel'}"
- Description du créateur : "${projectDescription || 'Application web moderne avec expérience utilisateur fluide et design haute précision'}"
- Technologies utilisées : ${stackList}
- Cible visée : ${targetAudience}

${
  sections.length > 0
    ? `Tu reçois aussi ${sections.length} capture(s) du site, découpée(s) section par section, de haut en bas.
Lis-les attentivement : nom de l'entreprise, activité, produits ou services, offres, prix affichés, ton, couleurs, public visé.
Appuie-toi d'abord sur ce que montrent réellement ces captures ; la description du créateur ne fait que compléter.
`
    : ''
}
Génère les livrables de vente au format JSON strict :
1. "linkedInPost" : Un post LinkedIn viral ultra captivant (accroche percutante qui attire l'attention des décideurs, narration du problème résolu, démonstration de la valeur et de l'architecture tech sans jargon excessif, appel à l'action clair pour attirer des clients en messages privés).
2. "clientProposalPitch" : Un texte de proposition commerciale (pour Upwork, Malt, ou email de prospection directe) montrant comment ce projet prouve que le développeur est capable de résoudre le problème business d'un prospect et justifier un devis premium.
3. "caseStudy" : Une fiche étude de cas concise (Défi initial, Solution technique mise en place, Bénéfice / ROI pour l'utilisateur final).
4. "socialHooks" : 3 accroches courtes (Twitter / X / Threads) pour susciter l'envie et faire cliquer sur le lien du mockup.

${
  sections.length > 0
    ? `0. "sections" : pour chaque capture, dans l'ordre, un objet { "titre": nom court de la section (ex. « En-tête », « Produits phares », « Contact »), "contenu": une phrase sur ce qu'elle montre réellement }.
`
    : ''
}
Règles absolues :
- N'invente AUCUN chiffre, pourcentage, statistique, nom de client, témoignage ou résultat mesuré qui ne figure pas dans les informations ci-dessus ou sur les captures. Décris la valeur avec des mots, sans données inventées.
- Écris en français, avec un ton professionnel et chaleureux.

Réponds EXCLUSIVEMENT avec cet objet JSON :
{
  "linkedInPost": "string",
  "clientProposalPitch": "string",
  "caseStudy": {
    "challenge": "string",
    "solution": "string",
    "impact": "string"
  },
  "socialHooks": ["string", "string", "string"]${sections.length > 0 ? ',\n  "sections": [{ "titre": "string", "contenu": "string" }]' : ''}
}
`;

  let lastError = '';
  let overloaded = false;
  // Budget total de 50 s (la fonction en ligne est coupée à 60 s) : chaque essai a sa limite de temps,
  // sinon un modèle surchargé bloquait jusqu'à 30 s et l'utilisateur n'obtenait jamais de réponse.
  const deadline = Date.now() + 50_000;

  // 1. Claude d'abord (lit le texte et les captures du site)
  if (anthropicKey) {
    try {
      const client = new Anthropic({ apiKey: anthropicKey, maxRetries: 0 });
      const content: Anthropic.Beta.BetaContentBlockParam[] = [
        ...sections.map(
          (data): Anthropic.Beta.BetaContentBlockParam => ({
            type: 'image',
            source: { type: 'base64', media_type: 'image/jpeg', data },
          })
        ),
        { type: 'text', text: prompt },
      ];
      const response = await client.beta.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: 8000,
          output_config: { effort: 'medium' },
          // Si une protection de Claude refuse la demande, Anthropic la relance sur le modèle conseillé
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          messages: [{ role: 'user', content }],
        },
        { timeout: 35_000 }
      );
      if (response.stop_reason === 'refusal') throw new Error('Claude a refusé la demande');
      const text = response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
      const data = parseJsonReply(text);
      await logServerEvent('pitch_result', { ok: true, provider: 'claude', sections: sections.length }, userId);
      return NextResponse.json({ success: true, data, provider: 'claude' });
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError || (err instanceof Anthropic.APIError && (err.status ?? 0) >= 500)) {
        overloaded = true;
      }
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[generate-pitch] Échec avec ${CLAUDE_MODEL}, bascule sur Gemini :`, lastError.slice(0, 200));
    }
  }

  // 2. Gemini en secours (modèles « flash », qui lisent aussi les images)
  if (apiKey) {
    const imageParts = sections.map((data) => ({ inlineData: { mimeType: 'image/jpeg', data } }));
    const genAI = new GoogleGenerativeAI(apiKey);
    // Chaque modèle est essayé deux fois : Google renvoie parfois « surchargé » (503) quelques secondes
    for (const name of [...MODELS, ...MODELS]) {
      if (lastError.includes('503')) await new Promise((r) => setTimeout(r, 2500));
      const remaining = deadline - Date.now();
      if (remaining < 5_000) break;
      try {
        const model = genAI.getGenerativeModel(
          {
            model: name,
            generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
          },
          { timeout: Math.min(20_000, remaining) }
        );
        const result = await model.generateContent(imageParts.length > 0 ? [prompt, ...imageParts] : prompt);
        const data = parseJsonReply(result.response.text());
        await logServerEvent('pitch_result', { ok: true, provider: 'gemini', sections: sections.length }, userId);
        return NextResponse.json({ success: true, data, provider: 'gemini' });
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (lastError.includes('503')) overloaded = true;
        console.warn(`[generate-pitch] Échec avec ${name} :`, lastError.slice(0, 200));
      }
    }
  }

  // Aucun modèle n'a répondu : l'utilisation (et les crédits) sont rendus
  await logServerEvent('pitch_result', { ok: false, overloaded, error: lastError.slice(0, 120) }, userId);
  if (eventId !== null) await createAdminClient().rpc('refund_pitch', { p_event_id: eventId });
  return NextResponse.json(
    {
      success: false,
      error: overloaded
        ? "Le service d'IA est surchargé en ce moment. Réessayez dans quelques minutes (rien n'a été décompté)."
        : "L'IA n'a pas pu générer le texte. Réessayez dans un instant (rien n'a été décompté).",
    },
    { status: 502 }
  );
}
