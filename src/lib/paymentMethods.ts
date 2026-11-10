/**
 * Moyens de paiement réellement acceptés, à afficher près des boutons d'achat.
 * Liste relevée le 10/11/2026 sur l'API SasPay (GET /networks/, réseaux actifs des pays payant en FCFA).
 * À relire si SasPay ajoute ou retire un réseau.
 */
export const MOBILE_MONEY_COUNTRIES: { country: string; operators: string[] }[] = [
  { country: 'Bénin', operators: ['MTN', 'Moov', 'Celtiis'] },
  { country: 'Côte d’Ivoire', operators: ['Orange', 'MTN', 'Moov', 'Wave', 'Djamo'] },
  { country: 'Sénégal', operators: ['Orange', 'Wave', 'Free Money', 'Expresso', 'Wizall', 'Djamo'] },
  { country: 'Togo', operators: ['Moov', 'Mixx'] },
  { country: 'Mali', operators: ['Orange', 'Moov', 'Wave', 'Mobi Cash'] },
  { country: 'Burkina Faso', operators: ['Orange', 'Moov'] },
  { country: 'Niger', operators: ['Airtel'] },
];

/** Version courte, sous les boutons */
export const MOBILE_MONEY_SHORT = 'MTN, Moov, Orange, Wave, Celtiis, Free Money…';
