import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createRateLimitResponse, checkRateLimitShared } from '@/lib/security';

export const dynamic = 'force-dynamic';

/**
 * Événements envoyés par le navigateur (statistiques du tableau de bord).
 * Seuls les événements prévus sont acceptés, avec des propriétés courtes : personne ne peut remplir
 * la base de données ni fausser les chiffres avec des noms inventés.
 */
const ALLOWED_EVENTS = new Set([
  'pricing_view',
  'plan_click',
  'checkout_start',
  'bump_accepted',
  'downsell_shown',
  'downsell_accepted',
  'rewarded_ad_start',
  'rewarded_ad_granted',
  'rewarded_ad_not_granted',
  'home_view',
  'template_applied',
  'layout_selected',
  'quota_reached',
  'whatsapp_status',
  'pdf_generated',
  'carousel_generated',
  'photo_scene_used',
  'video_exported',
  'pitch_byok',
]);

export async function POST(req: NextRequest) {
  const limit = await checkRateLimitShared(req, 'events', { maxRequests: 60, windowMs: 60 * 1000 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds);

  try {
    let body: { eventName?: string; properties?: Record<string, unknown>; sessionId?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'JSON invalide' }, { status: 400 });
    }

    const eventName = String(body.eventName || '');
    if (!ALLOWED_EVENTS.has(eventName)) {
      return NextResponse.json({ success: false, error: 'Événement inconnu' }, { status: 400 });
    }

    // Propriétés simples et courtes seulement (texte, nombre, oui/non), 12 au plus
    const properties: Record<string, string | number | boolean> = {};
    for (const [k, v] of Object.entries(body.properties || {}).slice(0, 12)) {
      if (typeof v === 'number' || typeof v === 'boolean') properties[k.slice(0, 40)] = v;
      else if (typeof v === 'string') properties[k.slice(0, 40)] = v.slice(0, 120);
    }

    let userId: string | null = null;
    try {
      const { data } = await createClient().auth.getUser();
      userId = data.user?.id ?? null;
    } catch {
      // visiteur
    }

    await createAdminClient().from('events').insert({
      event_name: eventName,
      properties,
      session_id: typeof body.sessionId === 'string' ? body.sessionId.slice(0, 64) : null,
      user_id: userId,
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    // Mode tolérant : une statistique perdue ne doit jamais gêner le visiteur
    const e = err as { message?: string };
    console.warn('[Tracking Event Warning]:', e?.message || err);
    return NextResponse.json({ success: true, logged: false });
  }
}
