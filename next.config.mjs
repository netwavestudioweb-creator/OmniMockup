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
};

export default nextConfig;
