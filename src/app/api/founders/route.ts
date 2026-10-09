import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, createRateLimitResponse } from '@/lib/security';

export const dynamic = 'force-dynamic';

const SITES_OPTIONS = ['1-2', '3-5', '6+'];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

/**
 * Candidature au programme "10 agences fondatrices".
 */
export async function POST(req: NextRequest) {
  const limit = checkRateLimit(req, { maxRequests: 5, windowMs: 10 * 60 * 1000 });
  if (!limit.allowed) return createRateLimitResponse(limit.retryAfterSeconds);

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Requête invalide.' }, { status: 400 });
  }

  // Champ piège invisible : rempli uniquement par les robots
  if (clean(body.company, 200)) {
    return NextResponse.json({ success: true });
  }

  const fullName = clean(body.fullName, 120);
  const agencyName = clean(body.agencyName, 160);
  const email = clean(body.email, 200).toLowerCase();
  let agencyWebsite = clean(body.agencyWebsite, 300);
  const sitesPerMonth = clean(body.sitesPerMonth, 10);

  if (!fullName || !agencyName || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { success: false, error: 'Merci de renseigner votre nom, le nom de votre agence et un email valide.' },
      { status: 400 }
    );
  }
  if (agencyWebsite && !/^https?:\/\//i.test(agencyWebsite)) {
    agencyWebsite = `https://${agencyWebsite}`;
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from('founder_applications').insert({
      full_name: fullName,
      agency_name: agencyName,
      agency_website: agencyWebsite || null,
      email,
      sites_per_month: SITES_OPTIONS.includes(sitesPerMonth) ? sitesPerMonth : null,
    });
    if (error) throw error;

    await admin.from('events').insert({
      event_name: 'founder_application_submitted',
      properties: { sites_per_month: sitesPerMonth || null },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[founders] Enregistrement impossible :', err);
    return NextResponse.json(
      { success: false, error: 'Enregistrement impossible pour le moment. Réessayez dans quelques minutes.' },
      { status: 500 }
    );
  }
}
