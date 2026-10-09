import crypto from 'crypto';

/**
 * Client minimal de l'API SasPay (https://docs.saspay.me).
 * Utilisable UNIQUEMENT côté serveur : la clé secrète donne accès au compte marchand.
 */

const SASPAY_API_URL = 'https://api.saspay.me/api/v1';

export interface SaspayCheckoutSession {
  id: string;
  checkout_url: string;
  amount: string;
  currency: string;
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'CANCELLED';
  metadata: Record<string, unknown>;
  transaction: string | null;
}

export interface SaspayPayment {
  id: string;
  requested_amount: string;
  currency: string;
  status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  flow_direction: string;
}

function getSecretKey(): string {
  const key = process.env.SASPAY_SECRET_KEY;
  if (!key) throw new Error('SASPAY_SECRET_KEY manquante');
  return key;
}

async function saspayRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${SASPAY_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${getSecretKey()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
    cache: 'no-store',
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json || json.success === false) {
    const message =
      (json?.error && typeof json.error === 'object' && 'message' in json.error && json.error.message) ||
      `HTTP ${res.status}`;
    throw new Error(`[SasPay] ${init?.method || 'GET'} ${path} : ${message}`);
  }
  // Toutes les réponses sont enveloppées dans { success, data, code }
  return (json.data ?? json) as T;
}

export function createSaspayCheckout(params: {
  amount: number;
  description: string;
  customerEmail: string;
  customerName: string;
  returnUrl: string;
  metadata: Record<string, string>;
}): Promise<SaspayCheckoutSession> {
  return saspayRequest<SaspayCheckoutSession>('/checkout-sessions/', {
    method: 'POST',
    body: JSON.stringify({
      amount: params.amount.toFixed(2),
      currency: 'XOF',
      description: params.description,
      customer_email: params.customerEmail,
      customer_name: params.customerName,
      return_url: params.returnUrl,
      metadata: params.metadata,
    }),
  });
}

export function getSaspayCheckout(sessionId: string): Promise<SaspayCheckoutSession> {
  return saspayRequest<SaspayCheckoutSession>(`/checkout-sessions/${encodeURIComponent(sessionId)}/`);
}

/** Revérifie l'état réel du paiement auprès de SasPay (jamais un statut mémorisé). */
export function verifySaspayPayment(paymentId: string): Promise<SaspayPayment> {
  return saspayRequest<SaspayPayment>(`/payments/${encodeURIComponent(paymentId)}/verify/`);
}

const WEBHOOK_TOLERANCE_SECONDS = 300;

/**
 * Vérifie un webhook SasPay : HMAC-SHA256 hex de `${timestamp}.${corps brut}`
 * avec le secret de signature, et horodatage à moins de 5 minutes.
 */
export function isValidSaspayWebhook(
  rawBody: string,
  signature: string | null,
  timestamp: string | null
): boolean {
  const secret = process.env.SASPAY_WEBHOOK_SECRET;
  if (!secret || !signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Math.floor(Date.now() / 1000) - ts) > WEBHOOK_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  const a = Buffer.from(signature.toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
