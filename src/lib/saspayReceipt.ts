import type { SaspayItem } from '@/lib/saspay-apply';
import type { SaspayPayment } from '@/lib/saspay';
import { MOBILE_MONEY_COUNTRIES } from '@/lib/paymentMethods';
import { createAdminClient } from '@/lib/supabase/admin';
import { logServerEvent } from '@/lib/admin';
import { SUPPORT_EMAIL } from '@/lib/contact';

/**
 * Reçu d'un paiement SasPay déjà appliqué côté serveur : affiché dans /account et envoyé par e-mail.
 * Le montant débité, les frais, la référence et l'opérateur viennent de SasPay, jamais du navigateur.
 */
export interface SaspayReceipt {
  id: string;
  label: string;
  /** Prix de l'achat (hors frais de l'opérateur) */
  amountXof: number;
  /** Montant réellement débité, frais compris (lu chez SasPay ; null s'il n'a pas pu être lu) */
  debitedXof: number | null;
  feeXof: number | null;
  paidAt: string;
  reference: string | null;
  operator: string | null;
  activated: string;
}

/** Ancien article retiré du catalogue, encore présent dans l'historique */
const LEGACY_LABELS: Record<string, string> = { test_200: 'Paiement de test (1 crédit)' };
const LEGACY_ACTIVATED: Record<string, string> = { test_200: '1 crédit ajouté à votre compte (sans date de fin)' };

/** Nom lisible d'un réseau SasPay (« mtn_bj » → « MTN, Bénin ») */
function operatorName(code: string | undefined): string | null {
  if (!code) return null;
  const [net, cc] = code.split('_');
  const country = { bj: 'Bénin', ci: 'Côte d’Ivoire', sn: 'Sénégal', tg: 'Togo', ml: 'Mali', bf: 'Burkina Faso', ne: 'Niger' }[cc || ''];
  const known = MOBILE_MONEY_COUNTRIES.flatMap((c) => c.operators).find((o) => o.toLowerCase().startsWith(net));
  return [known || net.toUpperCase(), country].filter(Boolean).join(', ');
}

const num = (v: string | undefined) => (v !== undefined && Number.isFinite(Number(v)) ? Math.round(Number(v)) : null);

export function buildSaspayReceipt(input: {
  id: string;
  itemId: string;
  item: SaspayItem | null;
  amountXof: number;
  payment: SaspayPayment | null;
  paidAt: string;
  transactionId: string | null;
}): SaspayReceipt {
  const { item, payment } = input;
  const activated = !item
    ? LEGACY_ACTIVATED[input.itemId] || 'Achat enregistré'
    : item.kind === 'credits'
      ? `${item.credits} crédits ajoutés à votre compte (sans date de fin)`
      : `Forfait ${item.label.replace('Plan ', '')} activé`;
  return {
    id: input.id,
    label: item ? item.label.replace(/^Plan /, 'Forfait ') : LEGACY_LABELS[input.itemId] || input.itemId,
    amountXof: input.amountXof,
    debitedXof: num(payment?.debited_amount),
    feeXof: num(payment?.client_fee),
    paidAt: input.paidAt,
    reference: payment?.reference || input.transactionId,
    operator: operatorName(payment?.network_code),
    activated,
  };
}

const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n).replace(/ /g, ' ')} FCFA`;
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Lignes du reçu, dans l'ordre affiché (e-mail et texte brut) */
function receiptRows(r: SaspayReceipt, planEnd: string | null): [string, string][] {
  const dateFr = new Date(r.paidAt).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Africa/Porto-Novo' });
  const end =
    planEnd && !/crédits/.test(r.activated)
      ? `, jusqu’au ${new Date(planEnd).toLocaleDateString('fr-FR', { dateStyle: 'long', timeZone: 'Africa/Porto-Novo' })}`
      : '';
  return [
    ['Achat', r.label],
    ['Montant débité', fcfa(r.debitedXof ?? r.amountXof)],
    ...(r.feeXof !== null ? ([['Dont frais de l’opérateur', fcfa(r.feeXof)]] as [string, string][]) : []),
    ['Date', `${dateFr} (heure du Bénin)`],
    ...(r.operator ? ([['Payé avec', r.operator]] as [string, string][]) : []),
    ['Référence SasPay', r.reference || '—'],
    ['Ce qui est activé', r.activated + end],
  ];
}

/** E-mail du reçu, aux couleurs du site (mêmes règles que les e-mails de Supabase) */
export function receiptEmail(r: SaspayReceipt, planEnd: string | null): { subject: string; html: string; text: string } {
  const rows = receiptRows(r, planEnd);
  const subject = `Votre reçu PitchMySite : ${r.label}`;
  const html = `<!DOCTYPE html>
<html lang="fr">
<body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;">
        <tr><td style="padding:28px 32px 8px 32px;">
          <a href="https://pitchmysite.com" style="text-decoration:none;"><img src="https://pitchmysite.com/email/logo.png" width="200" height="43" alt="PitchMySite" style="display:block;border:0;"></a>
        </td></tr>
        <tr><td style="padding:16px 32px 0 32px;color:#111111;">
          <h1 style="margin:0 0 12px 0;font-size:22px;line-height:1.3;font-weight:bold;">Merci, votre paiement est confirmé</h1>
          <p style="margin:0 0 20px 0;font-size:15px;line-height:1.6;color:#3f3f3f;">Voici votre reçu. Gardez cet e-mail : il vous sert de preuve de paiement.</p>
        </td></tr>
        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e5e5;font-size:14px;line-height:1.5;">
            ${rows
              .map(
                ([k, v]) =>
                  `<tr><td style="padding:10px 12px 10px 0;color:#6b6b6b;vertical-align:top;width:42%;border-bottom:1px solid #e5e5e5;">${esc(k)}</td><td style="padding:10px 0;color:#111111;vertical-align:top;border-bottom:1px solid #e5e5e5;word-break:break-word;">${esc(v)}</td></tr>`
              )
              .join('\n            ')}
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 0 32px;">
          <a href="https://pitchmysite.com/account" style="display:inline-block;background:#1A4BE0;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none;padding:14px 24px;border-radius:10px;">Voir mon compte</a>
        </td></tr>
        <tr><td style="padding:24px 32px 28px 32px;font-size:13px;line-height:1.6;color:#6b6b6b;">
          <p style="margin:0;">Rien ne se renouvelle tout seul : vous repayez seulement si vous voulez continuer. Une question sur ce paiement ? Répondez à cet e-mail ou écrivez à <a href="mailto:${SUPPORT_EMAIL}" style="color:#1A4BE0;">${SUPPORT_EMAIL}</a>.</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0 0;font-size:12px;color:#8a8a8a;">PitchMySite, un service de NetWave Studio · <a href="https://pitchmysite.com" style="color:#8a8a8a;">pitchmysite.com</a></p>
    </td></tr>
  </table>
</body>
</html>`;
  const text = [
    'Merci, votre paiement est confirmé. Voici votre reçu PitchMySite.',
    '',
    ...rows.map(([k, v]) => `${k} : ${v}`),
    '',
    'Votre compte : https://pitchmysite.com/account',
    `Une question ? ${SUPPORT_EMAIL}`,
  ].join('\n');
  return { subject, html, text };
}

/**
 * Envoie le reçu par e-mail (Resend). Appelée une seule fois par paiement : au moment où le paiement
 * est appliqué côté serveur (le verrou SQL empêche une deuxième application). La clé d'idempotence de Resend
 * empêche aussi un double envoi. Chaque envoi (ou échec) est noté dans « events » (receipt_email).
 * Sans RESEND_API_KEY, rien n'est envoyé : le reçu reste visible dans /account.
 */
export async function sendSaspayReceiptEmail(params: {
  checkoutId: string;
  userId: string;
  receipt: SaspayReceipt;
  test?: boolean;
}): Promise<{ ok: boolean; reason?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    await logServerEvent('receipt_email', { checkout: params.checkoutId, ok: false, reason: 'no_api_key', test: !!params.test }, params.userId);
    return { ok: false, reason: 'no_api_key' };
  }
  try {
    const { data: profile } = await createAdminClient()
      .from('profiles')
      .select('email, plan_expires_at')
      .eq('id', params.userId)
      .maybeSingle();
    if (!profile?.email) {
      await logServerEvent('receipt_email', { checkout: params.checkoutId, ok: false, reason: 'no_email', test: !!params.test }, params.userId);
      return { ok: false, reason: 'no_email' };
    }
    const { subject, html, text } = receiptEmail(params.receipt, profile.plan_expires_at || null);
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': params.test ? `recu-test-${params.checkoutId}-${Date.now()}` : `recu-${params.checkoutId}`,
      },
      body: JSON.stringify({
        from: 'PitchMySite <no-reply@pitchmysite.com>',
        to: [profile.email],
        reply_to: SUPPORT_EMAIL,
        subject: params.test ? `[Test] ${subject}` : subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = (await res.json().catch(() => null)) as { id?: string; message?: string } | null;
    const ok = res.ok && !!data?.id;
    await logServerEvent(
      'receipt_email',
      { checkout: params.checkoutId, ok, resend_id: data?.id || null, reason: ok ? null : `HTTP ${res.status} ${data?.message || ''}`.trim(), test: !!params.test },
      params.userId
    );
    return ok ? { ok } : { ok, reason: `HTTP ${res.status}` };
  } catch (err) {
    await logServerEvent('receipt_email', { checkout: params.checkoutId, ok: false, reason: (err as Error)?.message || 'erreur', test: !!params.test }, params.userId);
    return { ok: false, reason: 'error' };
  }
}
