import type { CaptureItemResult } from '@/types/analyzer';

/**
 * Projets du studio enregistrés dans le navigateur (IndexedDB) : la capture, la version
 * mobile et tous les réglages. Permet de reprendre, dupliquer ou supprimer ses mockups.
 * Rien n'est envoyé au serveur : les projets restent sur cet appareil.
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

export interface StudioProject extends StudioDraft {
  id: string;
  name: string;
  /** Miniature JPEG (320 px de large) */
  thumbnail?: string;
  createdAt: number;
  /** Dossier du client (ex. « Hôtel du Lac ») ; absent = sans dossier */
  folder?: string;
}

const DB_NAME = 'omnimockup';
const LEGACY_STORE = 'drafts';
const LEGACY_KEY = 'last';
const STORE = 'projects';
/** Au-delà, les projets les plus anciens sont retirés pour ne pas saturer le navigateur */
export const MAX_PROJECTS = 50;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB indisponible'));
    const req = indexedDB.open(DB_NAME, 2);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(LEGACY_STORE)) db.createObjectStore(LEGACY_STORE);
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(store: string, mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(store, mode);
      const req = fn(tx.objectStore(store));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}

export function newProjectId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `p_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function projectDefaultName(item: CaptureItemResult): string {
  return item.domainName || item.title || 'Image importée';
}

/** Miniature légère du haut de la capture (pour la liste des projets). */
export async function makeThumbnail(screenshot: string): Promise<string | undefined> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = screenshot;
    });
    const w = 320;
    const h = 200;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    if (!ctx) return undefined;
    const sh = Math.min(img.naturalHeight, (img.naturalWidth * h) / w);
    ctx.drawImage(img, 0, 0, img.naturalWidth, sh, 0, 0, w, h);
    return c.toDataURL('image/jpeg', 0.7);
  } catch {
    return undefined;
  }
}

/** Récupère l'ancien brouillon unique (version précédente) et le range parmi les projets. */
let migration: Promise<void> | null = null;
function migrateLegacyDraft(): Promise<void> {
  // Une seule migration à la fois : deux listes demandées en même temps ne créent pas de doublon
  if (!migration) migration = doMigrateLegacyDraft().finally(() => (migration = null));
  return migration;
}

async function doMigrateLegacyDraft(): Promise<void> {
  try {
    const legacy = (await run(LEGACY_STORE, 'readonly', (s) => s.get(LEGACY_KEY))) as StudioDraft | undefined;
    if (!legacy?.captureItem?.screenshotBase64) return;
    const project: StudioProject = {
      ...legacy,
      id: newProjectId(),
      name: projectDefaultName(legacy.captureItem),
      thumbnail: await makeThumbnail(legacy.captureItem.screenshotBase64),
      createdAt: legacy.updatedAt,
    };
    await run(STORE, 'readwrite', (s) => s.put(project));
    await run(LEGACY_STORE, 'readwrite', (s) => s.delete(LEGACY_KEY));
  } catch {
    // ignorer
  }
}

export async function listProjects(): Promise<StudioProject[]> {
  try {
    await migrateLegacyDraft();
    const all = (await run(STORE, 'readonly', (s) => s.getAll())) as StudioProject[];
    return all.filter((p) => p?.captureItem?.screenshotBase64).sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export async function getProject(id: string): Promise<StudioProject | null> {
  try {
    return ((await run(STORE, 'readonly', (s) => s.get(id))) as StudioProject | undefined) ?? null;
  } catch {
    return null;
  }
}

/** Enregistre (ou met à jour) un projet. Le nom et la date de création existants sont gardés. */
export async function saveProject(
  id: string,
  draft: StudioDraft,
  options: { thumbnail?: string; name?: string } = {}
): Promise<void> {
  try {
    const existing = await getProject(id);
    const project: StudioProject = {
      ...draft,
      id,
      name: options.name || existing?.name || projectDefaultName(draft.captureItem),
      thumbnail: options.thumbnail || existing?.thumbnail,
      createdAt: existing?.createdAt || draft.updatedAt,
      folder: existing?.folder,
    };
    await run(STORE, 'readwrite', (s) => s.put(project));
    const all = await listProjects();
    for (const old of all.slice(MAX_PROJECTS)) await deleteProject(old.id);
  } catch {
    // Navigation privée ou quota dépassé : la sauvegarde est simplement ignorée
  }
}

export async function renameProject(id: string, name: string): Promise<void> {
  const p = await getProject(id);
  if (!p) return;
  try {
    await run(STORE, 'readwrite', (s) => s.put({ ...p, name: name.trim().slice(0, 80) || p.name }));
  } catch {
    // ignorer
  }
}

/** Range un projet dans le dossier d'un client (chaîne vide = sans dossier). */
export async function setProjectFolder(id: string, folder: string): Promise<void> {
  const p = await getProject(id);
  if (!p) return;
  const clean = folder.trim().slice(0, 60);
  try {
    await run(STORE, 'readwrite', (s) => s.put({ ...p, folder: clean || undefined }));
  } catch {
    // ignorer
  }
}

/** Liste des dossiers existants, triés par ordre alphabétique. */
export function projectFolders(projects: StudioProject[]): string[] {
  return Array.from(new Set(projects.map((p) => p.folder).filter((f): f is string => !!f))).sort((a, b) =>
    a.localeCompare(b, 'fr')
  );
}

export async function duplicateProject(id: string): Promise<StudioProject | null> {
  const p = await getProject(id);
  if (!p) return null;
  const now = Date.now();
  const copy: StudioProject = { ...p, id: newProjectId(), name: `${p.name} (copie)`, createdAt: now, updatedAt: now };
  try {
    await run(STORE, 'readwrite', (s) => s.put(copy));
    return copy;
  } catch {
    return null;
  }
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await run(STORE, 'readwrite', (s) => s.delete(id));
  } catch {
    // ignorer
  }
}
