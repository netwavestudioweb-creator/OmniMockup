'use client';

/**
 * Dernier recours si le site entier n'a pas pu s'afficher (même la mise en page).
 * Styles écrits directement : cette page ne dépend d'aucune autre ressource.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', background: '#faf8f5', color: '#1c1917' }}>
        <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 24, border: '1px solid #e7e0d6', padding: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#7c3aed', margin: 0 }}>OmniMockup</p>
            <h1 style={{ fontSize: 22, margin: '12px 0 8px' }}>Le site n&apos;a pas pu s&apos;afficher</h1>
            <p style={{ fontSize: 14, color: '#57534e', lineHeight: 1.5, margin: '0 0 20px' }}>
              Vérifiez votre connexion puis réessayez. Votre travail dans le studio est enregistré sur votre appareil.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ background: '#7c3aed', color: '#fff', border: 0, borderRadius: 12, padding: '12px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }}
            >
              Réessayer
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ display: 'block', marginTop: 12, fontSize: 13, color: '#6d28d9' }}>
              Revenir à l&apos;accueil
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
