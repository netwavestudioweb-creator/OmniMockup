/**
 * Adresse de retour après connexion : seulement une page de ce site.
 * Refuse les adresses externes (« https://autre-site », « //autre-site », « /\autre-site ») qui
 * serviraient à envoyer la personne sur un faux site une fois connectée.
 */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/'): string {
  const value = (raw || '').trim();
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  try {
    // L'adresse doit rester sur le même site une fois interprétée par le navigateur
    const url = new URL(value, 'https://exemple.invalid');
    if (url.origin !== 'https://exemple.invalid') return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
