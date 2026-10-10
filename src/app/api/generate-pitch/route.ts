import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectivePlan } from '@/lib/plan';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Modèles actifs (les plus anciens, comme gemini-1.5-flash, ont été retirés par Google)
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
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

Génère 3 livrables de vente irrésistibles au format JSON strict :
1. "linkedInPost" : Un post LinkedIn viral ultra captivant (accroche percutante qui attire l'attention des décideurs, narration du problème résolu, démonstration de la valeur et de l'architecture tech sans jargon excessif, appel à l'action clair pour attirer des clients en messages privés).
2. "clientProposalPitch" : Un texte de proposition commerciale (pour Upwork, Malt, ou email de prospection directe) montrant comment ce projet prouve que le développeur est capable de résoudre le problème business d'un prospect et justifier un devis premium.
3. "caseStudy" : Une fiche étude de cas concise (Défi initial, Solution technique mise en place, Bénéfice / ROI pour l'utilisateur final).
4. "socialHooks" : 3 accroches courtes (Twitter / X / Threads) pour susciter l'envie et faire cliquer sur le lien du mockup.

Règles absolues :
- N'invente AUCUN chiffre, pourcentage, statistique, nom de client, témoignage ou résultat mesuré qui ne figure pas dans les informations ci-dessus. Décris la valeur avec des mots, sans données inventées.
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
  "socialHooks": ["string", "string", "string"]
}
`;

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = '';
  // Chaque modèle est essayé deux fois : Google renvoie parfois « surchargé » (503) quelques secondes
  for (const name of [...MODELS, ...MODELS]) {
    if (lastError.includes('503')) await new Promise((r) => setTimeout(r, 2500));
    try {
      const model = genAI.getGenerativeModel({
        model: name,
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 },
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = JSON.parse(text.replace(/```json/g, '').replace(/```/g, '').trim());
      }
      return NextResponse.json({ success: true, data });
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[generate-pitch] Échec avec ${name} :`, lastError.slice(0, 200));
    }
  }

  // Aucun modèle n'a répondu : l'utilisation (et les crédits) sont rendus
  if (eventId !== null) await createAdminClient().rpc('refund_pitch', { p_event_id: eventId });
  return NextResponse.json(
    { success: false, error: "L'IA n'a pas pu générer le texte. Réessayez dans un instant (rien n'a été décompté)." },
    { status: 502 }
  );
}
