import type { CaptureItemResult } from '@/types/analyzer';

/**
 * Brouillon du studio enregistré dans le navigateur (IndexedDB) : la capture, la version
 * mobile et tous les réglages. Permet de reprendre son travail après avoir fermé l'onglet.
 * Rien n'est envoyé au serveur.
 */
export interface StudioDraft {
  captureItem: CaptureItemResult;
  mobileScreenshot?: string;
  /** Avant / Après : capture de l'ancien site */
  beforeScreenshot?: string;
  beforeUrl?: string;
  /** Instantané des réglages du studio (format interne de SceneEditor) */
  snapshot: unknown;
  updatedAt: number;
}

const DB_NAME = 'omnimockup';
const STORE = 'drafts';
const KEY = 'last';
const MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB indisponible'));
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = fn(tx.objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export async function saveStudioDraft(draft: StudioDraft): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.put(draft, KEY));
  } catch {
    // Navigation privée ou quota dépassé : la sauvegarde est simplement ignorée
  }
}

export async function loadStudioDraft(): Promise<StudioDraft | null> {
  try {
    const draft = (await withStore('readonly', (s) => s.get(KEY))) as StudioDraft | undefined;
    if (!draft?.captureItem?.screenshotBase64 || Date.now() - draft.updatedAt > MAX_AGE_MS) return null;
    return draft;
  } catch {
    return null;
  }
}

export async function clearStudioDraft(): Promise<void> {
  try {
    await withStore('readwrite', (s) => s.delete(KEY));
  } catch {
    // ignorer
  }
}
