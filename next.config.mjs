/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['playwright', 'playwright-core', '@sparticuz/chromium'],
  },
};

export default nextConfig;
