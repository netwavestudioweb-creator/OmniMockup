import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectivePlan } from '@/lib/plan';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security';

export const dynamic = 'force-dynamic';

const BUCKET = 'shared-mockups';
const MAX_BYTES = 8 * 1024 * 1024;
/** Liens actifs autorisés en forfait gratuit (illimité pour Solo, Pro et Agence) */
const FREE_SHARE_LIMIT = 5;

type Identity = { userId: string | null; plan: string; demo: boolean };

/**
 * Compte connecté obligatoire. En développement local uniquement, la session de démonstration
 * du navigateur (sans compte réel) peut créer des liens, enregistrés sans propriétaire.
 */
async function identify(demoRequested: boolean): Promise<Identity | null> {
  try {
    const { data } = await createClient().auth.getUser();
    if (data.user) {
      const { data: profile } = await createAdminClient()
        .from('profiles')
        .select('plan, plan_expires_at')
        .eq('id', data.user.id)
        .maybeSingle();
      return { userId: data.user.id, plan: getEffectivePlan(profile), demo: false };
    }
  } catch {
    // session illisible
  }
  if (process.env.NODE_ENV === 'development' && demoRequested) return { userId: null, plan: 'free', demo: true };
  return null;
}

function ownerFilter<T extends { eq: (c: string, v: string) => T; is: (c: string, v: null) => T }>(q: T, id: Identity): T {
  return id.userId ? q.eq('user_id', id.userId) : q.is('user_id', null);
}

const shareUrl = (req: NextRequest, id: string) => `${req.nextUrl.origin}/p/${id}`;

async function countActive(identity: Identity): Promise<number> {
  const q = createAdminClient().from('shared_mockups').select('id', { count: 'exact', head: true }).is('revoked_at', null);
  const { count } = await ownerFilter(q, identity);
  return count ?? 0;
}

/** Créer un lien : { image: data URL JPEG/PNG, title, width, height } */
export async function POST(req: NextRequest) {
  const rl = checkRateLimit(req, { maxRequests: 20, windowMs: 60 * 1000 });
  if (!rl.allowed) return createRateLimitResponse(rl.retryAfterSeconds);

  const body = await req.json().catch(() => null);
  const identity = await identify(body?.demo === true);
  if (!identity) return NextResponse.json({ error: 'login_required' }, { status: 401 });

  const match = /^data:(image\/(?:jpeg|png));base64,([A-Za-z0-9+/=]+)$/.exec(String(body?.image || ''));
  if (!match) return NextResponse.json({ error: 'invalid_image' }, { status: 400 });
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length === 0 || buffer.length > MAX_BYTES) return NextResponse.json({ error: 'image_too_large' }, { status: 413 });
  const width = Math.round(Number(body?.width));
  const height = Math.round(Number(body?.height));
  if (!(width > 0 && width <= 8000 && height > 0 && height <= 8000)) {
    return NextResponse.json({ error: 'invalid_size' }, { status: 400 });
  }
  const title = String(body?.title || '').replace(/\s+/g, ' ').trim().slice(0, 120);

  const limit = identity.plan === 'free' ? FREE_SHARE_LIMIT : null;
  const active = await countActive(identity);
  if (limit !== null && active >= limit) {
    return NextResponse.json({ error: 'limit_reached', active, limit }, { status: 403 });
  }

  const admin = createAdminClient();
  const id = Array.from(randomBytes(10), (b) => 'abcdefghijklmnopqrstuvwxyz0123456789'[b % 36]).join('');
  const ext = match[1] === 'image/png' ? 'png' : 'jpg';
  const path = `${identity.userId || 'demo'}/${id}.${ext}`;

  const up = await admin.storage.from(BUCKET).upload(path, buffer, { contentType: match[1], upsert: false });
  if (up.error) {
    console.error('[share] Envoi de l’image impossible :', up.error.message);
    return NextResponse.json({ error: 'storage_error' }, { status: 500 });
  }
  const ins = await admin.from('shared_mockups').insert({ id, user_id: identity.userId, title, image_path: path, width, height });
  if (ins.error) {
    await admin.storage.from(BUCKET).remove([path]);
    console.error('[share] Enregistrement du lien impossible :', ins.error.message);
    return NextResponse.json({ error: 'db_error' }, { status: 500 });
  }
  return NextResponse.json({ id, url: shareUrl(req, id), active: active + 1, limit });
}

/** Liste des liens actifs de l'utilisateur */
export async function GET(req: NextRequest) {
  const identity = await identify(req.nextUrl.searchParams.get('demo') === '1');
  if (!identity) return NextResponse.json({ error: 'login_required' }, { status: 401 });
  const q = createAdminClient()
    .from('shared_mockups')
    .select('id, title, created_at, view_count')
    .is('revoked_at', null)
    .order('created_at', { ascending: false })
    .limit(100);
  const { data, error } = await ownerFilter(q, identity);
  if (error) return NextResponse.json({ error: 'db_error' }, { status: 500 });
  return NextResponse.json({
    links: (data || []).map((l) => ({ ...l, url: shareUrl(req, l.id) })),
    limit: identity.plan === 'free' ? FREE_SHARE_LIMIT : null,
  });
}

/** Désactiver un lien : la page publique disparaît et l'image est supprimée */
export async function DELETE(req: NextRequest) {
  const identity = await identify(req.nextUrl.searchParams.get('demo') === '1');
  if (!identity) return NextResponse.json({ error: 'login_required' }, { status: 401 });
  const id = String(req.nextUrl.searchParams.get('id') || '');
  if (!/^[a-z0-9]{8,16}$/.test(id)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 });

  const admin = createAdminClient();
  const q = admin.from('shared_mockups').select('image_path').eq('id', id).is('revoked_at', null);
  const { data } = await ownerFilter(q, identity).maybeSingle();
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await admin.from('shared_mockups').update({ revoked_at: new Date().toISOString() }).eq('id', id);
  await admin.storage.from(BUCKET).remove([data.image_path]);
  return NextResponse.json({ ok: true });
}
