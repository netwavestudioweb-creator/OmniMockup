/**
 * Service d'intégration FedaPay (Bénin & Afrique de l'Ouest)
 * Permet l'encaissement via MTN Mobile Money, Moov Money, Wave et Cartes bancaires
 * Reversement direct vers le compte MTN MoMo du marchand.
 */

export interface FedaPayCustomer {
  firstname?: string;
  lastname?: string;
  email: string;
  phone_number?: {
    number: string;
    country: string; // 'bj' pour Bénin
  };
}

export interface CreateTransactionParams {
  description: string;
  amount: number; // Montant en FCFA (ex: 15000)
  currency?: string; // Par défaut 'XOF'
  callbackUrl: string;
  customer: FedaPayCustomer;
  customMetadata?: Record<string, string | number>;
}

export interface FedaPayTransactionResponse {
  id: number;
  reference: string;
  amount: number;
  status: 'pending' | 'approved' | 'declined' | 'canceled' | 'transferred';
  currency: {
    iso: string;
  };
  custom_metadata?: Record<string, unknown>;
  customer?: {
    email: string;
    phone_number?: {
      number: string;
    };
  };
}

export interface FedaPayTokenResponse {
  token: string;
  url: string;
}

/**
 * Récupère l'URL de base de l'API selon l'environnement
 */
export function getFedaPayApiUrl(): string {
  const env = (process.env.FEDAPAY_ENVIRONMENT || 'sandbox').toLowerCase();
  return env === 'live' || env === 'production'
    ? 'https://api.fedapay.com/v1'
    : 'https://sandbox-api.fedapay.com/v1';
}

/**
 * Récupère la clé secrète FedaPay
 */
export function getFedaPaySecretKey(): string {
  const key = process.env.FEDAPAY_SECRET_KEY || '';
  return key.trim();
}

/**
 * Crée une transaction sur FedaPay et génère l'URL de paiement Checkout
 */
export async function createFedaPayCheckout(params: CreateTransactionParams): Promise<{
  success: boolean;
  transactionId: number;
  checkoutUrl: string;
  token: string;
  error?: string;
}> {
  const secretKey = getFedaPaySecretKey();
  if (!secretKey) {
    throw new Error(
      "Clé secrète FedaPay (FEDAPAY_SECRET_KEY) manquante. Veuillez la configurer dans votre fichier .env.local."
    );
  }

  const baseUrl = getFedaPayApiUrl();

  // 1. Création de la transaction
  const txPayload = {
    description: params.description,
    amount: Math.round(params.amount),
    currency: {
      iso: params.currency || 'XOF',
    },
    callback_url: params.callbackUrl,
    customer: {
      firstname: params.customer.firstname || 'Client',
      lastname: params.customer.lastname || 'OmniMockup',
      email: params.customer.email,
      phone_number: params.customer.phone_number || undefined,
    },
    custom_metadata: params.customMetadata || {},
  };

  const txRes = await fetch(`${baseUrl}/transactions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(txPayload),
  });

  const txData = await txRes.json();

  if (!txRes.ok || (!txData['v1/transaction'] && !txData.transaction)) {
    console.error('Erreur création transaction FedaPay:', txData);
    const errMsg =
      txData.message ||
      txData.errors?.[0]?.message ||
      'Échec de création de la transaction sur FedaPay';
    return {
      success: false,
      transactionId: 0,
      checkoutUrl: '',
      token: '',
      error: errMsg,
    };
  }

  const transaction = txData['v1/transaction'] || txData.transaction;
  const transactionId = transaction.id;

  // 2. Génération du jeton (token) de paiement avec URL Checkout
  const tokenRes = await fetch(`${baseUrl}/transactions/${transactionId}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.token || !tokenData.url) {
    console.error('Erreur génération jeton FedaPay:', tokenData);
    return {
      success: false,
      transactionId,
      checkoutUrl: '',
      token: '',
      error: tokenData.message || 'Impossible de générer le lien de paiement.',
    };
  }

  return {
    success: true,
    transactionId,
    checkoutUrl: tokenData.url,
    token: tokenData.token,
  };
}

/**
 * Récupère et vérifie l'état d'une transaction FedaPay en direct depuis l'API
 */
export async function getFedaPayTransaction(
  transactionId: string | number
): Promise<FedaPayTransactionResponse | null> {
  const secretKey = getFedaPaySecretKey();
  if (!secretKey) return null;

  const baseUrl = getFedaPayApiUrl();
  const res = await fetch(`${baseUrl}/transactions/${transactionId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    console.error(`Erreur lecture transaction FedaPay #${transactionId}:`, await res.text());
    return null;
  }

  const data = await res.json();
  return (data['v1/transaction'] || data.transaction) as FedaPayTransactionResponse;
}

/**
import { PLANS, CREDIT_PACKS } from '@/lib/pricing';

/**
 * Tarifs officiels en FCFA pour le Bénin / zone UEMOA
 * Connecté directement à la source unique src/lib/pricing.ts
 */
export const FEDAPAY_PLANS_FCFA: Record<
  string,
  {
    name: string;
    monthlyPrice: number; // en FCFA
    annualTotal: number;  // total en FCFA pour l'année
    annualPrice: number;  // par mois en annuel (compatibilité)
    description: string;
    isCreditPack?: boolean;
    credits?: number;
  }
> = {
  solo: {
    name: 'Solo',
    monthlyPrice: 3300,
    annualTotal: 33000,
    annualPrice: 2750,
    description: '20 exports HD/mois avec filigrane discret',
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 5900,
    annualTotal: 59000,
    annualPrice: 4917,
    description: 'Exports illimités HD/4K, Vidéo MP4 60fps, ZÉRO filigrane, IA Pitch Kit',
  },
  agence: {
    name: 'Agence',
    monthlyPrice: 19000,
    annualTotal: 190000,
    annualPrice: 15833,
    description: 'Tout le plan Pro, 5 sièges, Marque blanche totale, Vidéo illimitée, Support WhatsApp 7j/7',
  },
  // Alias studio -> agence pour compatibilité
  studio: {
    name: 'Agence',
    monthlyPrice: 19000,
    annualTotal: 190000,
    annualPrice: 15833,
    description: 'Tout le plan Pro, 5 sièges, Marque blanche totale, Vidéo illimitée, Support WhatsApp 7j/7',
  },
  // Packs de crédits
  credit_petit: {
    name: 'Petit Pack (10 crédits)',
    monthlyPrice: 2600,
    annualTotal: 2600,
    annualPrice: 2600,
    description: '10 crédits sans expiration',
    isCreditPack: true,
    credits: 10,
  },
  credit_moyen: {
    name: 'Pack Moyen (30 crédits)',
    monthlyPrice: 6600,
    annualTotal: 6600,
    annualPrice: 6600,
    description: '30 crédits sans expiration',
    isCreditPack: true,
    credits: 30,
  },
  credit_grand: {
    name: 'Grand Pack (75 crédits)',
    monthlyPrice: 9800,
    annualTotal: 9800,
    annualPrice: 9800,
    description: '75 crédits sans expiration — Meilleure valeur (-50%)',
    isCreditPack: true,
    credits: 75,
  },
};

