/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'playwright-core', '@sparticuz/chromium'],
    // Le navigateur Chrome (environ 70 Mo) n'est copié que dans les 2 fonctions qui capturent des sites.
    // Avant, il l'était dans les 22 fonctions du serveur (1,6 Go par déploiement, limite Vercel dépassée).
    outputFileTracingIncludes: {
      '/api/capture': ['./node_modules/@sparticuz/chromium/bin/*'],
      '/api/smart-analyze': ['./node_modules/@sparticuz/chromium/bin/*'],
    },
  },
  // En-têtes de protection envoyés avec chaque page
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // Le site ne peut pas être affiché dans le cadre d'un autre site (faux boutons par-dessus)
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Le navigateur ne devine pas le type d'un fichier (un faux « image » ne peut pas devenir un script)
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Les autres sites ne voient que le nom de domaine d'où vient le visiteur, pas la page exacte
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // Caméra, micro et position : jamais demandés par le site
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()' },
          // Pas de plugins, pas de changement de l'adresse de base des liens, pas d'affichage dans un autre site
          { key: 'Content-Security-Policy', value: "object-src 'none'; base-uri 'self'; frame-ancestors 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
