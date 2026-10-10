import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, Layers } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

const BUCKET = 'shared-mockups';

type Share = { id: string; title: string; image_path: string; width: number; height: number; created_at: string };

async function getShare(id: string): Promise<Share | null> {
  if (!/^[a-z0-9]{8,16}$/.test(id)) return null;
  const { data } = await createAdminClient()
    .from('shared_mockups')
    .select('id, title, image_path, width, height, created_at')
    .eq('id', id)
    .is('revoked_at', null)
    .maybeSingle();
  return (data as Share) || null;
}

function imageUrl(path: string, download?: string) {
  const { data } = createAdminClient().storage.from(BUCKET).getPublicUrl(path, download ? { download } : undefined);
  return data.publicUrl;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const share = await getShare(params.id);
  // Lien supprimé ou inconnu : vraie réponse 404 (décidée avant l'envoi de la page)
  if (!share) notFound();
  const title = share.title || 'Aperçu du site';
  const img = imageUrl(share.image_path);
  return {
    title: `${title} • OmniMockup`,
    // Page privée destinée au client : jamais indexée par les moteurs de recherche
    robots: { index: false, follow: false },
    openGraph: { title, images: [{ url: img, width: share.width, height: share.height }] },
    twitter: { card: 'summary_large_image', title, images: [img] },
  };
}

/** Page publique d'un mockup partagé : ce que le client reçoit. */
export default async function SharedMockupPage({ params }: { params: { id: string } }) {
  const share = await getShare(params.id);
  if (!share) notFound();
  // Compteur de vues (sans bloquer l'affichage)
  createAdminClient().rpc('increment_share_view', { p_id: share.id }).then(() => {}, () => {});

  const title = share.title || 'Aperçu du site';
  const date = new Date(share.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const fileName = `${(share.title || 'mockup').replace(/[^a-zA-Z0-9À-ÿ_-]+/g, '-').slice(0, 60)}.${share.image_path.endsWith('.png') ? 'png' : 'jpg'}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight break-words">{title}</h1>
            <p className="text-xs text-zinc-500 mt-1">Partagé le {date}</p>
          </div>
          <a
            href={imageUrl(share.image_path, fileName)}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold"
          >
            <Download className="w-4 h-4" />
            Télécharger l&apos;image
          </a>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl(share.image_path)}
          alt={title}
          width={share.width}
          height={share.height}
          className="w-full h-auto rounded-2xl border border-zinc-800 shadow-2xl bg-zinc-900"
        />
      </main>

      <footer className="border-t border-zinc-900 py-5 px-4 text-center">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white">
          <Layers className="w-3.5 h-3.5 text-violet-400" />
          Mockup réalisé avec OmniMockup
        </Link>
      </footer>
    </div>
  );
}
