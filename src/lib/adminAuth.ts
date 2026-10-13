import crypto from 'crypto';

/**
 * Accès administrateur indépendant des comptes clients : mot de passe + code à 6 chiffres
 * (application d'authentification sur le téléphone de Dodo).
 * Aucun secret dans le code : trois variables Vercel, créées par Dodo avec `node scripts/admin-setup.mjs` :
 *   ADMIN_PASSWORD_HASH   empreinte scrypt du mot de passe (jamais le mot de passe lui-même)
 *   ADMIN_TOTP_SECRET     clé du code à 6 chiffres (base32)
 *   ADMIN_SESSION_SECRET  clé de signature du cookie de session
 * Sans ces trois variables, personne ne peut ouvrir le tableau de bord.
 */

export const ADMIN_COOKIE = 'pms_admin';
export const ADMIN_SESSION_HOURS = 12;

export function adminConfigured(): boolean {
  return !!(process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_TOTP_SECRET && (process.env.ADMIN_SESSION_SECRET || '').length >= 32);
}

/**
 * Mot de passe : format « scrypt:N:r:p:selBase64:empreinteBase64 », comparaison à temps constant.
 * (Séparateur « : » et pas « $ » : Next.js remplace les « $… » des variables d'environnement.)
 */
export function verifyPassword(password: string, stored = process.env.ADMIN_PASSWORD_HASH || ''): boolean {
  const parts = stored.trim().split(':');
  if (parts.length !== 6 || parts[0] !== 'scrypt' || !password) return false;
  const [, n, r, p, saltB64, hashB64] = parts;
  try {
    const expected = Buffer.from(hashB64, 'base64');
    const actual = crypto.scryptSync(password.normalize('NFKC'), Buffer.from(saltB64, 'base64'), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 256 * 1024 * 1024,
    });
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/* ── Code à 6 chiffres (TOTP, RFC 6238 : HMAC-SHA1, pas de 30 s) ── */
function base32Decode(input: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const ch of clean) {
    value = (value << 5) | alphabet.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

export function totpCode(secretBase32: string, timeMs: number, digits = 6): string {
  const counter = Math.floor(timeMs / 1000 / 30);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', base32Decode(secretBase32)).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin = ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(bin % 10 ** digits).padStart(digits, '0');
}

/** Accepte le code de la période en cours et des périodes voisines (décalage d'horloge du téléphone) */
export function verifyTotp(code: string, secret = process.env.ADMIN_TOTP_SECRET || '', now = Date.now()): boolean {
  if (!/^\d{6}$/.test(code) || !secret) return false;
  let ok = false;
  for (const drift of [-1, 0, 1]) {
    const expected = Buffer.from(totpCode(secret, now + drift * 30_000));
    if (crypto.timingSafeEqual(expected, Buffer.from(code))) ok = true;
  }
  return ok;
}

/* ── Cookie de session signé (aucune donnée personnelle dedans) ── */
function sign(payload: string): string {
  return crypto.createHmac('sha256', process.env.ADMIN_SESSION_SECRET || '').update(payload).digest('base64url');
}

export function createAdminSession(now = Date.now()): string {
  const exp = now + ADMIN_SESSION_HOURS * 3600 * 1000;
  const payload = `v1.${exp}.${crypto.randomBytes(12).toString('base64url')}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminSession(token: string | undefined, now = Date.now()): boolean {
  if (!token || !adminConfigured()) return false;
  const i = token.lastIndexOf('.');
  if (i < 0) return false;
  const payload = token.slice(0, i);
  const mac = token.slice(i + 1);
  const expected = sign(payload);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return false;
  const [v, exp] = payload.split('.');
  return v === 'v1' && Number(exp) > now;
}
