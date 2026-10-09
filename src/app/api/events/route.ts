import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: {
      eventName?: string;
      properties?: Record<string, unknown>;
      sessionId?: string;
      userId?: string;
    } = {};

    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ success: false, error: 'JSON invalide' }, { status: 400 });
    }

    const { eventName, properties = {}, sessionId } = body;
    if (!eventName) {
      return NextResponse.json({ success: false, error: 'eventName requis' }, { status: 400 });
    }

    const admin = createAdminClient();
    await admin.from('events').insert({
      event_name: eventName,
      properties: properties || {},
      session_id: sessionId || null,
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    // Mode tolérant : ne jamais renvoyer de crash 500 bloquant
    const e = err as { message?: string };
    console.warn('[Tracking Event Warning]:', e?.message || err);
    return NextResponse.json({ success: true, logged: false });
  }
}
