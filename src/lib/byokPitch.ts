'use client';

import { buildPitchPrompt, parseJsonReply, type PitchInput, type PitchResult } from '@/lib/pitchPrompt';
import { buildArtDirectorPrompt, type ArtDirectorCandidate, type ArtDirectorReply } from '@/lib/artDirectorPrompt';

/**
 * Pitch IA avec la clé du client (Gemini ou Claude).
 * La clé reste dans le navigateur du client (stockage local) : elle n'est jamais envoyée aux serveurs
 * de PitchMySite. L'appel part directement du navigateur vers Google ou Anthropic, qui facturent le client.
 */
export type AiProvider = 'groq' | 'gemini' | 'openai' | 'claude';

const KEY_STORAGE: Record<AiProvider, string> = {
  groq: 'pms_ai_key_groq',
  gemini: 'pms_ai_key_gemini',
  openai: 'pms_ai_key_openai',
  claude: 'pms_ai_key_claude',
};
const PROVIDER_STORAGE = 'pms_ai_provider';

export const PROVIDER_INFO: Record<AiProvider, { label: string; getKeyUrl: string; hint: string }> = {
  groq: {
    label: 'Groq (Gratuit & Ultra-rapide ⚡)',
    getKeyUrl: 'https://console.groq.com/keys',
    hint: 'Réponse en 1 seconde. Clé 100% gratuite créée en 30 secondes sans carte bancaire.',
  },
  gemini: {
    label: 'Google Gemini (Gratuit)',
    getKeyUrl: 'https://aistudio.google.com/apikey',
    hint: 'Clé gratuite pour commencer, créée en 1 minute avec un compte Google.',
  },
  openai: {
    label: 'OpenAI (GPT-4o / GPT-4o-mini)',
    getKeyUrl: 'https://platform.openai.com/api-keys',
    hint: 'Clé de votre compte OpenAI Developer (payante à l’usage).',
  },
  claude: {
    label: 'Claude (Anthropic)',
    getKeyUrl: 'https://platform.claude.com/settings/keys',
    hint: 'Clé de la console Claude (payante à l’usage). Un abonnement Claude.ai (chat) ne donne pas de clé.',
  },
};

export function getSavedAi(): { provider: AiProvider; key: string } | null {
  try {
    const provider = (localStorage.getItem(PROVIDER_STORAGE) as AiProvider) || 'groq';
    const key = localStorage.getItem(KEY_STORAGE[provider]) || localStorage.getItem(KEY_STORAGE.gemini) || '';
    if (key) {
      const activeProvider = localStorage.getItem(KEY_STORAGE[provider]) ? provider : 'gemini';
      return { provider: activeProvider, key };
    }
    return null;
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
    localStorage.removeItem(KEY_STORAGE.groq);
    localStorage.removeItem(KEY_STORAGE.gemini);
    localStorage.removeItem(KEY_STORAGE.openai);
    localStorage.removeItem(KEY_STORAGE.claude);
    localStorage.removeItem(PROVIDER_STORAGE);
  } catch {
    // rien à effacer
  }
}

/** Vérification simple du format, avant tout appel */
export function looksLikeKey(provider: AiProvider, key: string): boolean {
  const k = key.trim();
  switch (provider) {
    case 'claude':
      return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(k);
    case 'groq':
      return /^gsk_[A-Za-z0-9_-]{25,}$/.test(k);
    case 'openai':
      return /^sk-[A-Za-z0-9_-]{20,}$/.test(k);
    case 'gemini':
    default:
      return /^[A-Za-z0-9_-]{30,}$/.test(k);
  }
}

/** Erreur lisible par le client */
export class ByokError extends Error {
  constructor(message: string, public kind: 'invalid_key' | 'quota' | 'overloaded' | 'other') {
    super(message);
  }
}

const GEMINI_MODELS = ['gemini-3.8-flash', 'gemini-3.6-flash', 'gemini-flash-latest'];
const CLAUDE_MODEL = 'claude-opus-5-5';
const GROQ_VISION_MODEL = 'qwen/qwen3.8-27b';
const GROQ_MAX_IMAGES = 3;

/**
 * Appel aux fournisseurs compatibles OpenAI (Groq, OpenAI, etc.)
 */
async function askOpenAiCompatible(
  apiUrl: string,
  model: string,
  key: string,
  prompt: string,
  images: string[],
  temperature: number,
  providerLabel: string
): Promise<string> {
  const messages: unknown[] = [
    {
      role: 'user',
      content:
        images.length > 0
          ? [
              ...images.map((data) => ({
                type: 'image_url',
                image_url: { url: `data:image/jpeg;base64,${data}` },
              })),
              { type: 'text', text: prompt },
            ]
          : prompt,
    },
  ];

  try {
    const res = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key.trim()}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        throw new ByokError(`Votre clé ${providerLabel} est refusée. Vérifiez-la sur votre console ${providerLabel}.`, 'invalid_key');
      }
      if (res.status === 429) {
        throw new ByokError(`Votre compte ${providerLabel} a atteint sa limite de requêtes ou son quota.`, 'quota');
      }
      if (res.status >= 500) {
        throw new ByokError(`${providerLabel} est temporairement surchargé. Réessayez dans un instant.`, 'overloaded');
      }
      const errJson = await res.json().catch(() => ({}));
      throw new ByokError(errJson?.error?.message || `Erreur lors de la réponse de ${providerLabel}.`, 'other');
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (err) {
    if (err instanceof ByokError) throw err;
    throw new ByokError(`Connexion à ${providerLabel} impossible. Vérifiez votre clé et votre réseau.`, 'other');
  }
}

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
  if (provider === 'groq') {
    // Groq avec vision (Qwen 3.8 27B, 3 images au plus) ou texte seul ultra-rapide (Llama 3.3 70B)
    const model = images.length > 0 ? GROQ_VISION_MODEL : 'llama-3.3-70b-versatile';
    return askOpenAiCompatible(
      'https://api.groq.com/openai/v1/chat/completions',
      model,
      key,
      prompt,
      images.slice(0, GROQ_MAX_IMAGES),
      temperature,
      'Groq'
    );
  }

  if (provider === 'openai') {
    return askOpenAiCompatible(
      'https://api.openai.com/v1/chat/completions',
      'gpt-4o-mini',
      key,
      prompt,
      images,
      temperature,
      'OpenAI'
    );
  }

  if (provider === 'claude') {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey: key.trim(), dangerouslyAllowBrowser: true, maxRetries: 1 });
    try {
      const response = await client.beta.messages.create(
        {
          model: CLAUDE_MODEL,
          max_tokens: 8000,
          output_config: { effort: 'medium' },
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
  // Groq n'accepte que 3 images par demande : on garde les 3 premières sections (le haut de la page)
  const sent = provider === 'groq' ? sections.slice(0, GROQ_MAX_IMAGES) : sections;
  const prompt = buildPitchPrompt({ ...input, sectionCount: sent.length });
  return parseJsonReply(await askOwnAi(provider, key, prompt, sent, 0.7));
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
