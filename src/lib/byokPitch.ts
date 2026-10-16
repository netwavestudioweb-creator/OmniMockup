'use client';

import { buildPitchPrompt, parseJsonReply, type PitchInput, type PitchResult } from '@/lib/pitchPrompt';
import { buildArtDirectorPrompt, type ArtDirectorCandidate, type ArtDirectorReply } from '@/lib/artDirectorPrompt';

/**
 * Pitch IA avec la clé du client (Gemini ou Claude).
 * La clé reste dans le navigateur du client (stockage local) : elle n'est jamais envoyée aux serveurs
 * de PitchMySite. L'appel part directement du navigateur vers Google ou Anthropic, qui facturent le client.
 */
export type AiProvider = 'gemini' | 'claude';

const KEY_STORAGE: Record<AiProvider, string> = { gemini: 'pms_ai_key_gemini', claude: 'pms_ai_key_claude' };
const PROVIDER_STORAGE = 'pms_ai_provider';

export const PROVIDER_INFO: Record<AiProvider, { label: string; getKeyUrl: string; hint: string }> = {
  gemini: {
    label: 'Google Gemini',
    getKeyUrl: 'https://aistudio.google.com/apikey',
    hint: 'Clé gratuite pour commencer, créée en 1 minute avec un compte Google.',
  },
  claude: {
    label: 'Claude (Anthropic)',
    getKeyUrl: 'https://platform.claude.com/settings/keys',
    hint: 'Clé de la console Claude (payante à l’usage). Un abonnement Claude.ai (chat) ne donne pas de clé.',
  },
};

export function getSavedAi(): { provider: AiProvider; key: string } | null {
  try {
    const provider = (localStorage.getItem(PROVIDER_STORAGE) as AiProvider) || 'gemini';
    const key = localStorage.getItem(KEY_STORAGE[provider]) || '';
    return key ? { provider, key } : null;
  } catch {
    return null;
  }
}

export function saveAi(provider: AiProvider, key: string) {
  try {
    localStorage.setItem(PROVIDER_STORAGE, provider);
    localStorage.setItem(KEY_STORAGE[provider], key.trim());
  } catch {
    // navigation privée : la clé ne sera pas retenue
  }
}

export function forgetAi() {
  try {
    localStorage.removeItem(KEY_STORAGE.gemini);
    localStorage.removeItem(KEY_STORAGE.claude);
    localStorage.removeItem(PROVIDER_STORAGE);
  } catch {
    // rien à effacer
  }
}

/** Vérification simple du format, avant tout appel */
export function looksLikeKey(provider: AiProvider, key: string): boolean {
  const k = key.trim();
  return provider === 'claude' ? /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(k) : /^[A-Za-z0-9_-]{30,}$/.test(k);
}

/** Erreur lisible par le client */
export class ByokError extends Error {
  constructor(message: string, public kind: 'invalid_key' | 'quota' | 'overloaded' | 'other') {
    super(message);
  }
}

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
const CLAUDE_MODEL = 'claude-opus-5-5';

/**
 * Appel à l'IA du client avec des images (captures en JPEG, base64 sans préfixe) et une consigne.
 * Rend le texte de la réponse. Les erreurs sont traduites en messages clairs (ByokError).
 */
async function askOwnAi(
  provider: AiProvider,
  key: string,
  prompt: string,
  images: string[],
  temperature: number
): Promise<string> {
  if (provider === 'claude') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: key.trim(), dangerouslyAllowBrowser: true, maxRetries: 1 });
    try {
      const response = await client.beta.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: 8000,
          output_config: { effort: 'medium' },
          // Si une protection de Claude refuse la demande, Anthropic la relance sur le modèle conseillé
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          messages: [
            {
              role: 'user',
              content: [
                ...images.map((data) => ({
                  type: 'image' as const,
                  source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
                })),
                { type: 'text' as const, text: prompt },
              ],
            },
          ],
        },
        { timeout: 120_000 }
      );
      if (response.stop_reason === 'refusal') throw new ByokError('Claude a refusé cette demande. Reformulez la description et réessayez.', 'other');
      return response.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
    } catch (err) {
      if (err instanceof ByokError) throw err;
      if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
        throw new ByokError('Votre clé Claude est refusée. Vérifiez-la dans la console Claude.', 'invalid_key');
      }
      if (err instanceof Anthropic.RateLimitError) {
        throw new ByokError('Votre compte Claude a atteint sa limite ou n’a plus de crédit. Vérifiez votre console Claude.', 'quota');
      }
      if (err instanceof Anthropic.APIError && (err.status ?? 0) >= 500) {
        throw new ByokError('Claude est surchargé en ce moment. Réessayez dans quelques minutes.', 'overloaded');
      }
      throw new ByokError('L’IA n’a pas pu répondre. Vérifiez votre connexion et réessayez.', 'other');
    }
  }

  // Gemini : chaque modèle est essayé à tour de rôle
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(key.trim());
  const imageParts = images.map((data) => ({ inlineData: { mimeType: 'image/jpeg', data } }));
  let last = '';
  for (const name of GEMINI_MODELS) {
    try {
      const model = genAI.getGenerativeModel(
        { model: name, generationConfig: { responseMimeType: 'application/json', temperature } },
        { timeout: 60_000 }
      );
      const result = await model.generateContent(imageParts.length ? [prompt, ...imageParts] : prompt);
      return result.response.text();
    } catch (err) {
      last = err instanceof Error ? err.message : String(err);
      if (/API key not valid|API_KEY_INVALID|PERMISSION_DENIED|\b403\b/i.test(last)) {
        throw new ByokError('Votre clé Gemini est refusée. Vérifiez-la sur Google AI Studio.', 'invalid_key');
      }
      if (/\b429\b|RESOURCE_EXHAUSTED|quota/i.test(last)) {
        throw new ByokError('Votre clé Gemini a atteint sa limite gratuite pour le moment. Réessayez plus tard.', 'quota');
      }
      // 503 (surcharge) ou modèle indisponible : on essaie le modèle suivant
    }
  }
  throw new ByokError(
    /\b503\b|overloaded|UNAVAILABLE/i.test(last)
      ? 'Gemini est surchargé en ce moment. Réessayez dans quelques minutes.'
      : 'L’IA n’a pas pu répondre. Réessayez dans un instant.',
    /\b503\b|overloaded|UNAVAILABLE/i.test(last) ? 'overloaded' : 'other'
  );
}

export async function generatePitchWithOwnKey(
  provider: AiProvider,
  key: string,
  input: Omit<PitchInput, 'sectionCount'>,
  sections: string[]
): Promise<PitchResult> {
  const prompt = buildPitchPrompt({ ...input, sectionCount: sections.length });
  return parseJsonReply(await askOwnAi(provider, key, prompt, sections, 0.7));
}

/** Directeur artistique IA avec la clé du client : note chaque section repérée sur la capture de la page */
export async function analyzeSectionsWithOwnKey(
  provider: AiProvider,
  key: string,
  candidates: ArtDirectorCandidate[],
  pageImage: string
): Promise<ArtDirectorReply> {
  const prompt = buildArtDirectorPrompt(candidates);
  return parseJsonReply(await askOwnAi(provider, key, prompt, [pageImage], 0.2)) as unknown as ArtDirectorReply;
}
