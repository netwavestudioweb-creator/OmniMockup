/**
 * src/lib/tracking.ts
 * Module de suivi analytique simple — Événements de conversion & monétisation
 * Événements supportés :
 * - pricing_view : affichage de la page de tarification
 * - plan_click : clic sur un CTA de plan ou pack de crédits
 * - checkout_start : ouverture du checkout Stripe / FedaPay
 * - bump_accepted : acceptation de l'order bump (Kit IA Pitch +2€)
 * - downsell_shown : affichage d'une modale de downsell (exit-intent, rétention)
 * - downsell_accepted : conversion suite à un downsell
 */

export type TrackedEventName =
  | 'pricing_view'
  | 'plan_click'
  | 'checkout_start'
  | 'bump_accepted'
  | 'downsell_shown'
  | 'downsell_accepted';

export function trackEvent(
  eventName: TrackedEventName,
  properties: Record<string, unknown> = {}
): void {
  if (typeof window === 'undefined') return;

  try {
    // Génération ou récupération de l'ID de session locale
    let sessionId = sessionStorage.getItem('omnimockup_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Math.random().toString(36).substring(2, 12);
      sessionStorage.setItem('omnimockup_session_id', sessionId);
    }

    const payload = {
      eventName,
      properties,
      sessionId,
    };

    // Utilisation de sendBeacon si disponible pour fiabilité lors des départs de page, sinon fetch non-bloquant
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', blob);
    } else {
      fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    // Mode silencieux — aucune interruption du flux utilisateur
  }
}
