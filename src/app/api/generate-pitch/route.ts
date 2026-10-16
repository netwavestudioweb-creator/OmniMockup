import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectivePlan } from '@/lib/plan';
import { createRateLimitResponse, checkRateLimitShared } from '@/lib/security';
import { logServerEvent } from '@/lib/admin';
import { buildPitchPrompt, parseJsonReply } from '@/lib/pitchPrompt';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// IA principale : Claude (Anthropic), si ANTHROPIC_API_KEY est configurée sur le serveur
const CLAUDE_MODEL = 'claude-opus-5-5';
// IA de secours : Google Gemini (les anciens modèles, comme gemini-1.5-flash, ont été retirés par Google)
const MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];

const clip = (v: unknown, max: number, fallback: string) =>
  (typeof v === 'string' && v.trim() ? v.trim() : fallback).slice(0, max);

/**
 * Pitch IA : textes de vente générés à partir du projet.
 * Compte obligatoire ; gratuit et Solo : 2 crédits ; Pro : 5 par mois ; Agence : illimité
 * (contrôle et décompte dans authorize_pitch). Une génération qui échoue est remboursée.
 */
export async function POST(req: NextRequest) {
  const rl = await checkRateLimitShared(req, 'generate-pitch', { maxRequests: 10, windowMs: 60 * 1000 });
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

  const prompt = buildPitchPrompt({
    projectTitle,
    projectUrl,
    projectDescription,
    targetAudience,
    techStack,
    sectionCount: sections.length,
  });

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
