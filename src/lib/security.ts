import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dns from 'dns/promises';
import net from 'net';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * ============================================================================
 * 1. MODULE DE PROTECTION ANTI-SSRF (Server-Side Request Forgery)
 * ============================================================================
 */

// Hostnames et domaines réservés ou locaux strictement interdits
const FORBIDDEN_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'local',
  'internal',
  'intranet',
]);

/**
 * Vérifie si une adresse IPv4 appartient à une plage privée ou réservée.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformée = rejetée par sécurité
  }

  const [a, b] = parts;

  // 0.0.0.0/8 (Current network)
  if (a === 0) return true;

  // 10.0.0.0/8 (Private network)
  if (a === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (a === 127) return true;

  // 169.254.0.0/16 (Link-local / Cloud metadata service ex: AWS/GCP 169.254.169.254)
  if (a === 169 && b === 254) return true;

  // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
  if (a === 172 && b >= 16 && b <= 31) return true;

  // 192.168.0.0/16 (Private network)
  if (a === 192 && b === 168) return true;

  // 100.64.0.0/10 (Carrier-grade NAT)
  if (a === 100 && b >= 64 && b <= 127) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (a === 198 && (b === 18 || b === 19)) return true;

  // 224.0.0.0/4 (Multicast)
  if (a >= 224 && a <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future)
  if (a >= 240) return true;

  // 255.255.255.255 (Broadcast)
  if (a === 255 && parts[1] === 255 && parts[2] === 255 && parts[3] === 255) return true;

  return false;
}

/**
 * Vérifie si une adresse IPv6 appartient à une plage privée ou réservée.
 */
function isPrivateIPv6(ip: string): boolean {
  const clean = ip.toLowerCase().trim().replace(/^\[|\]$/g, '');

  // Loopback (::1) ou non spécifiée (::)
  if (clean === '::1' || clean === '::' || clean === '0:0:0:0:0:0:0:1' || clean === '0:0:0:0:0:0:0:0') {
    return true;
  }

  // Multicast ff00::/8, traduction IPv4 (NAT64 64:ff9b::/96), IPv4 compatible (::a.b.c.d)
  if (clean.startsWith('ff') || clean.startsWith('64:ff9b:')) return true;
  if (/^::\d+\.\d+\.\d+\.\d+$/.test(clean)) return true;

  // Unique Local Address (ULA) fc00::/7 (fc00:: - fdff::)
  if (clean.startsWith('fc') || clean.startsWith('fd')) {
    return true;
  }

  // Link-Local fe80::/10 (fe80:: - febf::)
  if (clean.startsWith('fe8') || clean.startsWith('fe9') || clean.startsWith('fea') || clean.startsWith('feb')) {
    return true;
  }

  // IPv4-mapped IPv6 (::ffff:127.0.0.1 ou ::ffff:10.x.x.x)
  if (clean.includes('::ffff:')) {
    const ipv4Part = clean.split('::ffff:')[1];
    if (ipv4Part && net.isIPv4(ipv4Part)) {
      return isPrivateIPv4(ipv4Part);
    }
    return true;
  }

  return false;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  parsedUrl?: URL;
}

/**
 * Valide rigoureusement une URL en entrée pour se prémunir contre les attaques SSRF.
 * Vérifie le protocole, le nom d'hôte, les IP directes et effectue une résolution DNS préventive.
 */
export async function validateSafeUrl(rawUrl: string): Promise<ValidationResult> {
  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { valid: false, error: 'Une URL valide est requise.' };
  }

  let normalized = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = 'https://' + normalized;
  }

  let parsed: URL;
  try {
    parsed = new URL(normalized);
  } catch {
    return { valid: false, error: "L'URL fournie n'est pas un format valide." };
  }

  // 1. Restriction stricte aux protocoles http et https
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      valid: false,
      error: `Protocole « ${parsed.protocol} » interdit. Seuls HTTP et HTTPS sont autorisés.`,
    };
  }

  // Les adresses IPv6 arrivent entre crochets (« [::1] ») : on les retire avant de vérifier
  const hostname = parsed.hostname.toLowerCase().trim().replace(/^\[|\]$/g, '');

  // 2. Vérification des hôtes interdits directs
  if (
    FORBIDDEN_HOSTS.has(hostname) ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.arpa')
  ) {
    return {
      valid: false,
      error: `Accès refusé : l'analyse d'adresses locales ou internes (« ${hostname} ») est bloquée pour des raisons de sécurité.`,
    };
  }

  // 3. Si le hostname est directement une IP (IPv4 ou IPv6)
  if (net.isIPv4(hostname)) {
    if (isPrivateIPv4(hostname)) {
      return {
        valid: false,
        error: `Accès refusé : l'adresse IP privée « ${hostname} » est strictement interdite.`,
      };
    }
    return { valid: true, parsedUrl: parsed };
  }

  if (net.isIPv6(hostname)) {
    if (isPrivateIPv6(hostname)) {
      return {
        valid: false,
        error: `Accès refusé : l'adresse IPv6 locale « ${hostname} » est strictement interdite.`,
      };
    }
    return { valid: true, parsedUrl: parsed };
  }

  // 4. Résolution DNS préventive pour déjouer le DNS Rebinding et les domaines pointant vers des IP privées
  try {
    const lookupResult = await dns.lookup(hostname, { all: true });
    if (lookupResult && lookupResult.length > 0) {
      for (const record of lookupResult) {
        if (record.family === 4 && isPrivateIPv4(record.address)) {
          return {
            valid: false,
            error: `Accès refusé : le domaine « ${hostname} » résout vers une IP locale ou privée (${record.address}).`,
          };
        }
        if (record.family === 6 && isPrivateIPv6(record.address)) {
          return {
            valid: false,
            error: `Accès refusé : le domaine « ${hostname} » résout vers une adresse IPv6 locale (${record.address}).`,
          };
        }
      }
    }
  } catch (err: unknown) {
    const errorObj = err as { code?: string };
    if (errorObj?.code === 'ENOTFOUND') {
      return {
        valid: false,
        error: `Le nom de domaine « ${hostname} » est introuvable. Vérifiez l'adresse saisie.`,
      };
    }
    // Si la résolution DNS échoue pour une autre raison, laisser la couche applicative gérer l'erreur de fetch
  }

  return { valid: true, parsedUrl: parsed };
}

/** true si l'adresse IP (v4 ou v6) est interne, privée ou réservée */
export function isPrivateIp(ip: string | null | undefined): boolean {
  const clean = (ip || '').trim().replace(/^\[|\]$/g, '');
  if (!clean) return false;
  if (net.isIPv4(clean)) return isPrivateIPv4(clean);
  if (net.isIPv6(clean)) return isPrivateIPv6(clean);
  return false;
}

/** Message affiché quand une page tente d'atteindre le réseau interne pendant la capture */
export const INTERNAL_ACCESS_ERROR =
  'Accès refusé : cette page redirige vers une adresse interne ou privée, sa capture est bloquée pour des raisons de sécurité.';

/**
 * Filtre de CHAQUE requête faite par le navigateur de capture (redirections, images, cadres, scripts) :
 * une page publique ne doit pas pouvoir faire charger une adresse interne au serveur.
 * Les résolutions DNS sont mémorisées pendant la capture pour rester rapide.
 */
export function createBrowserRequestGuard() {
  const verdicts = new Map<string, Promise<boolean>>();

  const hostIsSafe = (hostname: string): Promise<boolean> => {
    const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');
    let verdict = verdicts.get(host);
    if (!verdict) {
      verdict = (async () => {
        if (
          FORBIDDEN_HOSTS.has(host) ||
          host.endsWith('.localhost') ||
          host.endsWith('.local') ||
          host.endsWith('.internal') ||
          host.endsWith('.arpa')
        ) {
          return false;
        }
        if (net.isIPv4(host)) return !isPrivateIPv4(host);
        if (net.isIPv6(host)) return !isPrivateIPv6(host);
        try {
          const records = await dns.lookup(host, { all: true });
          return records.every((r) => (r.family === 4 ? !isPrivateIPv4(r.address) : !isPrivateIPv6(r.address)));
        } catch {
          // Domaine introuvable : le navigateur échouera de lui-même, sans risque
          return true;
        }
      })();
      verdicts.set(host, verdict);
    }
    return verdict;
  };

  /** true si la requête peut partir */
  return async function isAllowed(rawUrl: string): Promise<boolean> {
    let url: URL;
    try {
      url = new URL(rawUrl);
    } catch {
      return false;
    }
    // Contenus déjà dans la page (images en ligne, polices générées) : aucun accès réseau
    if (url.protocol === 'data:' || url.protocol === 'blob:' || url.protocol === 'about:') return true;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    return hostIsSafe(url.hostname);
  };
}


/**
 * ============================================================================
 * 2. MODULE DE RATE LIMITING PAR IP (Sliding Window en mémoire)
 * ============================================================================
 */

interface RateLimitEntry {
  timestamps: number[];
}

// Map stockant les requêtes par clé IP
const ipRequestStore = new Map<string, RateLimitEntry>();

// Nettoyage régulier toutes les 5 minutes pour éviter toute fuite de mémoire
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;

  lastCleanup = now;
  const threshold = now - windowMs;

  ipRequestStore.forEach((entry, ip) => {
    const validTimestamps = entry.timestamps.filter((t) => t > threshold);
    if (validTimestamps.length === 0) {
      ipRequestStore.delete(ip);
    } else {
      entry.timestamps = validTimestamps;
    }
  });
}

/**
 * Extrait l'adresse IP cliente à partir des en-têtes HTTP de la requête.
 */
export function getClientIp(req: NextRequest): string {
  // Sur Vercel, cet en-tête est posé par Vercel lui-même (le visiteur ne peut pas le falsifier)
  const vercelIp = req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
  if (vercelIp) return vercelIp;

  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = req.headers.get('x-real-ip')?.trim();
  if (realIp) return realIp;

  // Fallback
  return req.ip || '127.0.0.1';
}

export interface RateLimitOptions {
  maxRequests?: number; // Défaut: 10 requêtes
  windowMs?: number; // Défaut: 60 000 ms (1 minute)
  /** Nom de la route : chaque route a son propre compteur */
  key?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Vérifie et applique la limitation du débit pour l'IP émettrice.
 */
export function checkRateLimit(
  req: NextRequest,
  options: RateLimitOptions = {}
): RateLimitResult {
  const maxRequests = options.maxRequests ?? 10;
  const windowMs = options.windowMs ?? 60 * 1000;
  const now = Date.now();

  cleanupExpiredEntries(windowMs);

  const ip = `${options.key || 'global'}:${getClientIp(req)}`;
  let entry = ipRequestStore.get(ip);

  if (!entry) {
    entry = { timestamps: [] };
    ipRequestStore.set(ip, entry);
  }

  // Filtrer les timestamps hors de la fenêtre actuelle
  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

  if (entry.timestamps.length >= maxRequests) {
    const oldestTimestamp = entry.timestamps[0];
    const resetTimeMs = oldestTimestamp + windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - entry.timestamps.length),
    retryAfterSeconds: 0,
  };
}

/**
 * Limite commune à tous les serveurs (compteur dans la base) : sur Vercel, le compteur en mémoire
 * est propre à chaque serveur et ne suffit pas. Le compteur en mémoire reste un premier filtre gratuit.
 * Si la base ne répond pas (ou si la table n'existe pas encore), on garde le compteur en mémoire.
 */
export async function checkRateLimitShared(
  req: NextRequest,
  name: string,
  options: RateLimitOptions = {}
): Promise<RateLimitResult> {
  const local = checkRateLimit(req, { ...options, key: name });
  if (!local.allowed) return local;

  const maxRequests = options.maxRequests ?? 10;
  const windowSeconds = Math.max(1, Math.round((options.windowMs ?? 60 * 1000) / 1000));
  try {
    // Adresse IP gardée seulement sous forme d'empreinte
    const ipHash = crypto.createHash('sha256').update(`rl:${getClientIp(req)}`).digest('hex').slice(0, 24);
    const { data, error } = await createAdminClient().rpc('hit_rate_limit', {
      p_bucket: `${name}:${ipHash}`,
      p_max: maxRequests,
      p_window_seconds: windowSeconds,
    });
    if (error || !data) return local;
    const d = data as { allowed: boolean; hits: number; retry_after: number };
    return {
      allowed: !!d.allowed,
      remaining: Math.max(0, maxRequests - (Number(d.hits) || 0)),
      retryAfterSeconds: d.allowed ? 0 : Number(d.retry_after) || 1,
    };
  } catch {
    return local;
  }
}

/**
 * Construit une réponse HTTP 429 Too Many Requests standardisée en JSON.
 */
export function createRateLimitResponse(retryAfterSeconds: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: `Trop de requêtes. Veuillez patienter ${retryAfterSeconds} seconde${
        retryAfterSeconds > 1 ? 's' : ''
      } avant de relancer une analyse.`,
    },
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  );
}
