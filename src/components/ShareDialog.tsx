'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ExternalLink, Link2, Loader2, MessageCircle, Trash2, X } from 'lucide-react';

interface ShareLink {
  id: string;
  title: string;
  created_at: string;
  view_count: number;
  url: string;
}

interface ShareDialogProps {
  loggedIn: boolean;
  /** Session de démonstration en développement local (sans compte réel) */
  demo: boolean;
  defaultTitle: string;
  /** Rend la scène actuelle en image (JPEG) */
  renderImage: () => Promise<{ image: string; width: number; height: number }>;
  onClose: () => void;
}

/** Message prêt à envoyer avec le lien : pour un prospect (trouver un client) ou pour un client (montrer son travail) */
type Audience = 'prospect' | 'client';
function buildMessage(audience: Audience, name: string, site: string, url: string): string {
  const hello = name.trim() ? `Bonjour ${name.trim()},` : 'Bonjour,';
  const label = site.trim() ? `votre site ${site.trim()}` : 'votre site';
  if (audience === 'prospect') {
    return [
      hello,
      `j'ai préparé un aperçu de ${label} sur ordinateur et sur téléphone, pour vous montrer comment vos clients le voient :`,
      url,
      `Je peux vous aider à le rendre encore plus convaincant. Seriez-vous disponible 10 minutes cette semaine pour en parler ?`,
    ].join('\n\n');
  }
  return [hello, `voici l'aperçu de ${label} sur ordinateur et sur téléphone :`, url, `Dites-moi ce que vous en pensez !`].join('\n\n');
}

const ERRORS: Record<string, string> = {
  login_required: 'Connectez-vous pour créer un lien de partage.',
  image_too_large: "L'image est trop lourde pour être partagée.",
  storage_error: "L'image n'a pas pu être enregistrée. Réessayez dans un instant.",
  db_error: "Le lien n'a pas pu être créé. Réessayez dans un instant.",
};

/** Lien de partage : une page publique pour que le client voie et télécharge le mockup. */
export const ShareDialog: React.FC<ShareDialogProps> = ({ loggedIn, demo, defaultTitle, renderImage, onClose }) => {
  const [title, setTitle] = useState(defaultTitle);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [links, setLinks] = useState<ShareLink[] | null>(null);
  const [limit, setLimit] = useState<number | null>(null);
  const [audience, setAudience] = useState<Audience>('prospect');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [messageEdited, setMessageEdited] = useState(false);
  const q = demo ? '?demo=1' : '';

  // Message proposé, tant que la personne ne l'a pas réécrit elle-même
  const suggested = useMemo(
    () => (created ? buildMessage(audience, recipient, title, created) : ''),
    [audience, recipient, title, created]
  );
  useEffect(() => {
    if (!messageEdited) setMessage(suggested);
  }, [suggested, messageEdited]);

  const refresh = useCallback(async () => {
    if (!loggedIn) return;
    try {
      const res = await fetch(`/api/share${q}`);
      const data = await res.json();
      if (res.ok) {
        setLinks(data.links);
        setLimit(data.limit);
      }
    } catch {
      // liste indisponible : la création reste possible
    }
  }, [loggedIn, q]);

  useEffect(() => {
    refresh();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [refresh, busy, onClose]);

  const create = async () => {
    setBusy(true);
    setError('');
    setCreated(null);
    try {
      const { image, width, height } = await renderImage();
      const res = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image, width, height, title, demo }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          data?.error === 'limit_reached'
            ? `Vous avez déjà ${data.limit} liens actifs, la limite du forfait gratuit. Supprimez-en un ci-dessous ou passez au forfait Solo.`
            : ERRORS[data?.error] || 'Le lien n’a pas pu être créé. Réessayez dans un instant.'
        );
        return;
      }
      setCreated(data.url);
      refresh();
    } catch {
      setError("Le lien n'a pas pu être créé. Vérifiez votre connexion et réessayez.");
    } finally {
      setBusy(false);
    }
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const remove = async (id: string) => {
    await fetch(`/api/share${q}${q ? '&' : '?'}id=${id}`, { method: 'DELETE' });
    if (created?.endsWith(`/p/${id}`)) setCreated(null);
    refresh();
  };

  const active = links?.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Lien de partage"
    >
      <div className="bg-[#0c0d14] border border-zinc-800 w-full sm:max-w-lg max-h-[92vh] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <Link2 className="w-4 h-4 text-pms-accent-soft" />
            Lien de partage
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Fermer" className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-4 space-y-4 text-xs">
          <p className="text-zinc-400 leading-relaxed">
            Votre client ouvre une page avec ce mockup et peut le télécharger, sans créer de compte. La page n&apos;est pas
            visible sur Google.
          </p>

          {!loggedIn ? (
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 space-y-3">
              <p className="text-zinc-300">Le partage par lien nécessite un compte (gratuit).</p>
              <Link href="/login" className="inline-flex px-4 py-2 rounded-xl bg-pms-accent hover:bg-pms-accent text-white font-bold">
                Se connecter
              </Link>
            </div>
          ) : (
            <>
              <label className="block space-y-1">
                <span className="text-[10px] font-bold text-zinc-500">Titre affiché au client</span>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={120}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-white text-xs focus:outline-none focus:border-pms-accent"
                />
              </label>
              <button
                type="button"
                onClick={create}
                disabled={busy}
                className="w-full py-2.5 rounded-xl bg-pms-accent hover:bg-pms-accent-hover text-white font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
                {busy ? 'Création du lien…' : 'Créer le lien'}
              </button>

              {error && (
                <p className="text-rose-400 leading-relaxed" role="alert">
                  {error}
                </p>
              )}

              {created && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                  <p className="font-bold text-emerald-300">Lien prêt à envoyer</p>
                  <input readOnly value={created} aria-label="Lien de partage" className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs" onFocus={(e) => e.target.select()} />

                  {/* Message prêt à envoyer */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400">Message à envoyer avec le lien</span>
                    <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-zinc-950 border border-zinc-800" role="radiogroup" aria-label="Destinataire du message">
                      {(
                        [
                          { id: 'prospect', label: 'À un prospect' },
                          { id: 'client', label: 'À mon client' },
                        ] as { id: Audience; label: string }[]
                      ).map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          role="radio"
                          aria-checked={audience === o.id}
                          onClick={() => {
                            setAudience(o.id);
                            setMessageEdited(false);
                          }}
                          className={`py-1.5 rounded-md font-semibold ${audience === o.id ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <input
                      value={recipient}
                      onChange={(e) => setRecipient(e.target.value.slice(0, 60))}
                      placeholder="Prénom ou nom de l'entreprise (facultatif)"
                      aria-label="Nom du destinataire"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-pms-accent"
                    />
                    <textarea
                      value={message}
                      onChange={(e) => {
                        setMessage(e.target.value);
                        setMessageEdited(true);
                      }}
                      rows={6}
                      aria-label="Message"
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs leading-relaxed focus:outline-none focus:border-pms-accent"
                    />
                    {messageEdited && (
                      <button type="button" onClick={() => setMessageEdited(false)} className="text-[11px] text-pms-accent-soft underline">
                        Revenir au message proposé
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(message || created)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      WhatsApp
                    </a>
                    <button type="button" onClick={() => copy(message || created)} className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold flex items-center justify-center gap-1.5">
                      {copied === (message || created) ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === (message || created) ? 'Copié' : 'Copier le message'}
                    </button>
                    <a href={created} target="_blank" rel="noopener noreferrer" className="py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-semibold flex items-center justify-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ouvrir
                    </a>
                  </div>
                  <p className="text-[11px] text-zinc-400">Le nombre de vues du lien s&apos;affiche ci-dessous : vous savez quand votre destinataire l&apos;a ouvert.</p>
                </div>
              )}

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-zinc-500">
                  Mes liens actifs ({active}
                  {limit !== null ? ` / ${limit}` : ''})
                </span>
                {links?.length === 0 && <p className="text-zinc-500">Aucun lien pour l&apos;instant.</p>}
                {links?.map((l) => (
                  <div key={l.id} className="flex items-center gap-2 p-2 rounded-xl bg-zinc-900 border border-zinc-800">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-200 truncate">{l.title || 'Sans titre'}</p>
                      <p className="text-[10px] text-zinc-500">
                        {new Date(l.created_at).toLocaleDateString('fr-FR')} · {l.view_count} vue{l.view_count > 1 ? 's' : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => copy(l.url)} aria-label={`Copier le lien ${l.title}`} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
                      {copied === l.url ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button type="button" onClick={() => remove(l.id)} aria-label={`Supprimer le lien ${l.title}`} className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
