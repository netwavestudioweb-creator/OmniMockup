import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Download, Layers } from 'lucide-react';
import { createAdminClient } from '@/lib/supabase/admin';
import { getEffectivePlan } from '@/lib/plan';

export const dynamic = 'force-dynamic';

const BUCKET = 'shared-mockups';

type Share = { id: string; user_id: string | null; title: string; image_path: string; width: number; height: number; created_at: string };
/** Marque blanche (forfait Agence) : la page porte le nom et le logo de l'agence, sans mention d'OmniMockup */
type WhiteLabel = { name: string; logo: string | null; color: string | null } | null;

async function getShare(id: string): Promise<Share | null> {
  if (!/^[a-z0-9]{8,16}$/.test(id)) return null;
  const { data } = await createAdminClient()
    .from('shared_mockups')
    .select('id, user_id, title, image_path, width, height, created_at')
    .eq('id', id)
    .is('revoked_at', null)
    .maybeSingle();
  return (data as Share) || null;
}

async function getWhiteLabel(userId: string | null): Promise<WhiteLabel> {
  if (!userId) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin.from('profiles').select('plan, plan_expires_at').eq('id', userId).maybeSingle();
  if (getEffectivePlan(profile) !== 'agence') return null;
  const { data: kit } = await admin.from('brand_kits').select('name, logo, colors').eq('user_id', userId).maybeSingle();
  const color = Array.isArray(kit?.colors) && typeof kit.colors[0] === 'string' && /^#[0-9a-f]{6}$/i.test(kit.colors[0]) ? kit.colors[0] : null;
  return { name: kit?.name || '', logo: kit?.logo || null, color };
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
  const brand = await getWhiteLabel(share.user_id);
  return {
    title: brand ? (brand.name ? `${title} • ${brand.name}` : title) : `${title} • OmniMockup`,
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

  const brand = await getWhiteLabel(share.user_id);
  const title = share.title || 'Aperçu du site';
  const date = new Date(share.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const fileName = `${(share.title || 'mockup').replace(/[^a-zA-Z0-9À-ÿ_-]+/g, '-').slice(0, 60)}.${share.image_path.endsWith('.png') ? 'png' : 'jpg'}`;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
      {brand && (brand.logo || brand.name) && (
        <header className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 flex items-center gap-3">
          {brand.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={brand.logo} alt="" className="h-9 max-w-[160px] object-contain" />
          )}
          {brand.name && <span className="text-sm font-bold text-zinc-200">{brand.name}</span>}
        </header>
      )}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight break-words">{title}</h1>
            <p className="text-xs text-zinc-500 mt-1">Partagé le {date}</p>
          </div>
          <a
            href={imageUrl(share.image_path, fileName)}
            style={brand?.color ? { backgroundColor: brand.color } : undefined}
            className="shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 hover:opacity-90 text-white text-sm font-bold"
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

      {!brand && (
        <footer className="border-t border-zinc-900 py-5 px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white">
            <Layers className="w-3.5 h-3.5 text-violet-400" />
            Mockup réalisé avec OmniMockup
          </Link>
        </footer>
      )}
    </div>
  );
}
