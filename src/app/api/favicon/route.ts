import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security';

const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9-]{1,63}\.)+[a-z]{2,63}$/i;

// PNG transparent 1×1 (réponse de repli)
const EMPTY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
  'base64'
);

/**
 * Icône (favicon) d'un site servie depuis notre domaine.
 * L'export d'image (html-to-image) ne peut pas copier une image d'un autre domaine
 * sans en-tête CORS : sans ce relais, l'export échouait sur tous les sites capturés.
 */
export async function GET(req: NextRequest) {
  const limit = checkRateLimit(req, { maxRequests: 120, windowMs: 60 * 1000 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds);

  const domain = (req.nextUrl.searchParams.get('domain') || '').trim().toLowerCase();
  if (!DOMAIN_RE.test(domain)) {
    return new NextResponse(EMPTY_PNG, { status: 200, headers: { 'Content-Type': 'image/png' } });
  }

  try {
    const res = await fetch(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`, {
      signal: AbortSignal.timeout(5000),
    });
    const type = res.headers.get('content-type') || '';
    if (!res.ok || !type.startsWith('image/')) throw new Error(`HTTP ${res.status}`);
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length > 200_000) throw new Error('icône trop lourde');
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        'Content-Type': type,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      },
    });
  } catch {
    return new NextResponse(EMPTY_PNG, {
      status: 200,
      headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=3600' },
    });
  }
}
