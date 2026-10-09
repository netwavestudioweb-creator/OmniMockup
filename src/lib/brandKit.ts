import { createClient } from '@/lib/supabase/client';

/** Kit de marque d'une agence : réappliqué en un clic sur chaque mockup. */
export interface BrandKit {
  name: string;
  /** Logo en data URL (≤ 400 Ko) */
  logo: string | null;
  /** Jusqu'à 3 couleurs utilisées pour le fond */
  colors: string[];
  /** Identifiant d'une police du studio */
  font: string | null;
  /** Signature affichée en bas de l'image (ex. « Réalisé par Studio Pixel ») */
  signature: string | null;
}

export const BRAND_LOGO_MAX_BYTES = 400 * 1024;
const LOCAL_KEY = 'omnimockup_brand_kit';
const ACCOUNT_TIMEOUT_MS = 5000;

/** Limite de temps : un appel au compte qui ne répond pas ne doit jamais bloquer le studio */
function withTimeout<T>(promise: PromiseLike<T>, ms = ACCOUNT_TIMEOUT_MS): Promise<T> {
  return Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('délai dépassé')), ms)),
  ]);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readLocal(): BrandKit | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as BrandKit) : null;
  } catch {
    return null;
  }
}

function writeLocal(kit: BrandKit | null) {
  try {
    if (kit) localStorage.setItem(LOCAL_KEY, JSON.stringify(kit));
    else localStorage.removeItem(LOCAL_KEY);
  } catch {
    // stockage indisponible
  }
}

/**
 * Charge le kit : depuis le compte (Supabase) si l'utilisateur est connecté,
 * sinon depuis ce navigateur.
 */
export async function loadBrandKit(userId: string | null | undefined): Promise<BrandKit | null> {
  if (userId && UUID_RE.test(userId)) {
    try {
      const { data, error } = await withTimeout<{ data: (Omit<BrandKit, 'colors'> & { colors: unknown }) | null; error: unknown }>(
        createClient()
          .from('brand_kits')
          .select('name, logo, colors, font, signature')
          .eq('user_id', userId)
          .maybeSingle()
      );
      if (!error) return data ? { ...data, colors: Array.isArray(data.colors) ? (data.colors as string[]) : [] } : readLocal();
    } catch {
      // table absente ou réseau : repli sur le navigateur
    }
  }
  return readLocal();
}

/** Enregistre le kit (compte si connecté, toujours aussi dans ce navigateur). */
export async function saveBrandKit(userId: string | null | undefined, kit: BrandKit): Promise<'account' | 'browser'> {
  writeLocal(kit);
  if (!userId || !UUID_RE.test(userId)) return 'browser';
  try {
    const { error } = await withTimeout<{ error: unknown }>(
      createClient()
        .from('brand_kits')
        .upsert({ user_id: userId, ...kit, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    );
    return error ? 'browser' : 'account';
  } catch {
    return 'browser';
  }
}

export async function deleteBrandKit(userId: string | null | undefined): Promise<void> {
  writeLocal(null);
  if (!userId || !UUID_RE.test(userId)) return;
  try {
    await withTimeout(createClient().from('brand_kits').delete().eq('user_id', userId));
  } catch {
    // ignorer
  }
}
