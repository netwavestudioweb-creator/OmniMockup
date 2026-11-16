import crypto from 'crypto';

/**
 * Jeton signé remis avec chaque export autorisé : si l'image n'a pas pu être créée dans le navigateur,
 * le studio le renvoie à /api/exports/refund et l'export n'est plus compté (crédits rendus s'il y en avait).
 * Valable 10 minutes, pour l'identité qui a fait l'export (compte ou adresse IP).
 */
export interface ExportRefundClaim {
  /** Ligne de export_events */
  id: number;
  userId: string | null;
  ip: string | null;
  credits: number;
  at: number;
}

const MAX_AGE_MS = 10 * 60 * 1000;

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error('Secret de signature manquant');
  return s;
}

const sign = (payload: string) => crypto.createHmac('sha256', secret()).update(`export-refund.${payload}`).digest('base64url');

export function createRefundToken(claim: Omit<ExportRefundClaim, 'at'>): string {
  const payload = Buffer.from(JSON.stringify({ ...claim, at: Date.now() })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function readRefundToken(token: unknown): ExportRefundClaim | null {
  if (typeof token !== 'string' || token.length > 2000) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const claim = JSON.parse(Buffer.from(payload, 'base64url').toString()) as ExportRefundClaim;
    if (!Number.isInteger(claim.id) || Date.now() - claim.at > MAX_AGE_MS) return null;
    return claim;
  } catch {
    return null;
  }
}
