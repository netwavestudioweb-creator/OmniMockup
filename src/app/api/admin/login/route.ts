import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { getClientIp } from '@/lib/security';
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_HOURS,
  adminConfigured,
  createAdminSession,
  verifyPassword,
  verifyTotp,
} from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const MAX_FAILS = 5;
const WINDOW_MIN = 15;

/** Connexion administrateur : mot de passe + code à 6 chiffres. 5 erreurs en 15 min = blocage de 15 min. */
export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json(
      { error: 'L’accès administrateur n’est pas encore configuré (variables ADMIN_… absentes sur Vercel).' },
      { status: 503 }
    );
  }

  // Adresse IP gardée seulement sous forme d'empreinte (pas d'adresse lisible dans la base)
  const ipKey = crypto.createHash('sha256').update(`admin:${getClientIp(req)}`).digest('hex').slice(0, 24);
  const admin = createAdminClient();
  const since = new Date(Date.now() - WINDOW_MIN * 60 * 1000).toISOString();
  const { count } = await admin
    .from('events')
    .select('id', { count: 'exact', head: true })
    .eq('event_name', 'admin_login_failed')
    .eq('properties->>ip', ipKey)
    .gte('created_at', since);
  if ((count || 0) >= MAX_FAILS) {
    return NextResponse.json({ error: `Trop d’essais. Réessayez dans ${WINDOW_MIN} minutes.` }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const password = typeof body?.password === 'string' ? body.password.slice(0, 200) : '';
  const code = typeof body?.code === 'string' ? body.code.replace(/\s/g, '') : '';

  // Les deux vérifications sont toujours faites (même durée de réponse quel que soit l'élément faux)
  const passOk = verifyPassword(password);
  const codeOk = verifyTotp(code);
  if (!passOk || !codeOk) {
    await admin.from('events').insert({ event_name: 'admin_login_failed', properties: { ip: ipKey } });
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ error: 'Mot de passe ou code incorrect.' }, { status: 401 });
  }

  await admin.from('events').insert({ event_name: 'admin_login', properties: { ip: ipKey } });
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: createAdminSession(),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_HOURS * 3600,
  });
  return res;
}

/** Déconnexion */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: ADMIN_COOKIE, value: '', httpOnly: true, sameSite: 'strict', path: '/', maxAge: 0 });
  return res;
}
