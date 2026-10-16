import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Mémoire des captures côté serveur : un site déjà capturé avec les mêmes réglages dans les
 * 3 dernières heures est resservi tout de suite, sans relancer de navigateur ni consommer le
 * quota du service de capture (Microlink gratuit : environ 50 par jour).
 * Les fichiers sont rangés par jour (`AAAA-MM-JJ/empreinte.json`) dans un espace privé ;
 * les dossiers de plus de 2 jours sont effacés de temps en temps.
 * Toute erreur de cette mémoire est ignorée : la capture normale prend le relais.
 */
const BUCKET = 'captures-cache';
const MAX_AGE_MS = 3 * 3600 * 1000;

export interface StoredCapture {
  screenshotBase64: string;
  pageTitle: string;
  domainName: string;
  faviconUrl: string;
  cachedAt: string;
}

const day = (offsetDays = 0) => new Date(Date.now() - offsetDays * 24 * 3600 * 1000).toISOString().slice(0, 10);

/** Empreinte des réglages qui changent l'image (jamais l'adresse en clair dans le nom du fichier) */
export function captureKey(url: string, options: Record<string, unknown>): string {
  return crypto.createHash('sha256').update(JSON.stringify({ url, ...options })).digest('hex').slice(0, 40);
}

export async function readStoredCapture(key: string): Promise<StoredCapture | null> {
  try {
    const storage = createAdminClient().storage.from(BUCKET);
    for (const folder of [day(0), day(1)]) {
      const { data, error } = await storage.download(`${folder}/${key}.json`);
      if (error || !data) continue;
      const stored = JSON.parse(await data.text()) as StoredCapture;
      if (stored?.screenshotBase64 && Date.now() - new Date(stored.cachedAt).getTime() < MAX_AGE_MS) return stored;
    }
  } catch {
    // mémoire indisponible : capture normale
  }
  return null;
}

export async function saveStoredCapture(key: string, capture: Omit<StoredCapture, 'cachedAt'>): Promise<void> {
  try {
    const storage = createAdminClient().storage.from(BUCKET);
    const body = JSON.stringify({ ...capture, cachedAt: new Date().toISOString() });
    await storage.upload(`${day(0)}/${key}.json`, body, { contentType: 'application/json', upsert: true });
    if (Math.random() < 0.02) await cleanupOldFolders();
  } catch {
    // sans importance : la prochaine capture sera simplement refaite
  }
}

async function cleanupOldFolders() {
  const storage = createAdminClient().storage.from(BUCKET);
  const keep = new Set([day(0), day(1)]);
  const { data: folders } = await storage.list('', { limit: 100 });
  for (const folder of folders || []) {
    if (keep.has(folder.name) || !/^\d{4}-\d{2}-\d{2}$/.test(folder.name)) continue;
    const { data: files } = await storage.list(folder.name, { limit: 1000 });
    const paths = (files || []).map((f) => `${folder.name}/${f.name}`);
    if (paths.length) await storage.remove(paths);
  }
}
