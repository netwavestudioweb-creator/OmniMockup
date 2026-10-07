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
  custom_metadata?: Record<string, any>;
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
 * Tarifs officiels en FCFA pour le Bénin / zone UEMOA
 */
export const FEDAPAY_PLANS_FCFA: Record<
  string,
  {
    name: string;
    monthlyPrice: number; // en FCFA
    annualPrice: number; // en FCFA par mois facturé annuellement
    description: string;
  }
> = {
  pro: {
    name: 'Pro Développeur',
    monthlyPrice: 3900, // 3 900 FCFA/mois (~$5/mois)
    annualPrice: 3250, // 39 000 FCFA/an (2 mois offerts)
    description: 'Exports illimités HD/4K, Vidéo MP4 60fps, sans filigrane, IA Pitch Kit',
  },
  studio: {
    name: 'Studio Agence',
    monthlyPrice: 12900, // 12 900 FCFA/mois (~$20/mois)
    annualPrice: 10750, // 129 000 FCFA/an (2 mois offerts)
    description: 'Tout le plan Pro, 5 sièges, Marque blanche totale, Vidéo illimitée, Support WhatsApp VIP',
  },
  agence: {
    name: 'Studio Agence',
    monthlyPrice: 12900,
    annualPrice: 10750,
    description: 'Tout le plan Pro, 5 sièges, Marque blanche totale, Vidéo illimitée, Support WhatsApp VIP',
  },
  starter: {
    name: 'Starter Découverte',
    monthlyPrice: 1900,
    annualPrice: 1500,
    description: 'Exports HD occasionnels',
  },
  creator: {
    name: 'Créateur Solo',
    monthlyPrice: 2900,
    annualPrice: 2400,
    description: 'Exports HD réguliers',
  },
  // Crédits à la carte (Pay-per-use / Popcorn)
  credit_export_hd: {
    name: '1 Export PNG HD sans filigrane',
    monthlyPrice: 490,
    annualPrice: 490,
    description: '1 export immédiat en haute résolution sans filigrane',
  },
  credit_export_4k: {
    name: '1 Export PNG Ultra-HD 4K',
    monthlyPrice: 990,
    annualPrice: 990,
    description: '1 export Retina 4K sans filigrane',
  },
  credit_export_video: {
    name: '1 Export Vidéo MP4 Animée',
    monthlyPrice: 1490,
    annualPrice: 1490,
    description: '1 export vidéo 60fps pour réseaux sociaux',
  },
  credit_pack_10: {
    name: 'Pack 10 Crédits Polyvalents',
    monthlyPrice: 3900,
    annualPrice: 3900,
    description: 'Pack de 10 crédits utilisables à tout moment sans expiration',
  },
  credit_pack_50: {
    name: 'Pack 50 Crédits Studio',
    monthlyPrice: 14900,
    annualPrice: 14900,
    description: 'Pack de 50 crédits pour freelances et créateurs actifs',
  },
};
