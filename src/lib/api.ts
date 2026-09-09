/**
 * Utilitaire d'appel API client sécurisé.
 * Garantit qu'une réponse HTML d'erreur ne provoquera jamais
 * l'exception "Unexpected token '<'" côté client.
 */
export async function safeFetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: unknown) {
    const errorObj = err as { message?: string };
    throw new Error(
      errorObj?.message || 'Impossible de contacter le serveur. Vérifiez votre connexion.'
    );
  }

  const contentType = res.headers.get('content-type') || '';
  let data: Record<string, unknown> | null = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      throw new Error('Le serveur a renvoyé une réponse JSON malformée.');
    }
  } else {
    // Si du HTML ou un message texte brut a été renvoyé par le proxy/serveur
    let textContent = '';
    try {
      textContent = await res.text();
    } catch {
      // Ignorer
    }

    const cleanSnippet = textContent
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150);

    throw new Error(
      cleanSnippet.length > 5
        ? `Réponse serveur inattendue (${res.status}) : ${cleanSnippet}`
        : `Le serveur a renvoyé une réponse non-JSON (HTTP ${res.status} ${res.statusText || 'Erreur'}).`
    );
  }

  if (!res.ok || (data && data.success === false)) {
    const errMsg = (data?.error as string) || `Erreur serveur (HTTP ${res.status})`;
    throw new Error(errMsg);
  }

  return data as T;
}
