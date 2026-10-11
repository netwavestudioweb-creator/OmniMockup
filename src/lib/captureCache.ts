import type { CaptureItemResult } from '@/types/analyzer';

/**
 * Mémoire courte des captures réussies, dans l'onglet du navigateur.
 * Rouvrir le même lien avec les mêmes réglages dans les 15 minutes est instantané
 * (plus de nouvelle attente de 5 à 40 s). Seules les 6 dernières captures sont gardées.
 */
const TTL_MS = 15 * 60 * 1000;
const MAX_ENTRIES = 6;
const cache = new Map<string, { at: number; item: CaptureItemResult }>();

export function captureCacheKey(body: Record<string, unknown>): string {
  return JSON.stringify(body);
}

export function getCachedCapture(key: string): CaptureItemResult | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.item;
}

export function setCachedCapture(key: string, item: CaptureItemResult) {
  cache.delete(key);
  cache.set(key, { at: Date.now(), item });
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }
}

/**
 * Capture d'un seul lien via /api/capture, avec la mémoire courte.
 * Renvoie le résultat (réussi ou non) ; lève une erreur seulement si le serveur est injoignable.
 */
export async function captureOne(body: Record<string, unknown>, signal?: AbortSignal): Promise<CaptureItemResult> {
  const key = captureCacheKey(body);
  const cached = getCachedCapture(key);
  if (cached) return cached;

  const res = await fetch('/api/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal,
  });
  let data: { results?: CaptureItemResult[]; error?: string } | null = null;
  try {
    data = await res.json();
  } catch {
    // réponse non JSON : délai dépassé côté serveur (504) ou page d'erreur
  }
  const item = data?.results?.[0];
  if (!item) {
    const target = Array.isArray(body.targets) ? String(body.targets[0]) : '';
    return {
      url: target,
      title: target,
      success: false,
      error:
        data?.error ||
        (res.status === 504
          ? 'Ce site a mis trop de temps à répondre. Réessayez, ou importez directement une capture d’écran.'
          : 'La capture a échoué. Réessayez dans un instant.'),
      capturedAt: new Date().toISOString(),
      durationMs: 0,
    };
  }
  if (item.success && item.screenshotBase64) setCachedCapture(key, item);
  return item;
}
