'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, ChevronRight, Layers, Plus, X } from 'lucide-react';
import { MockupFrame } from '@/components/MockupFrame';
import { FORMATS, FormatShot, type FormatId } from '@/components/home/HomeStage';
import { SUPPORT_EMAIL } from '@/lib/contact';

/*
 * Sections de l'accueil refaites d'après les modèles envoyés par Dodo (21/10/2026) :
 * avant / après, trois usages, applis, questions (catégories + accordéon), pied de page en colonnes.
 * Les tarifs restent dans page.tsx (ils dépendent de la devise et du choix mensuel / annuel).
 */

const head = 'text-[clamp(2rem,1.4rem+2vw,2.75rem)] leading-[1.05] tracking-[-0.02em] font-normal';
const pad = 'px-5 sm:px-10 lg:px-[68px]';

const DEMO = {
  netflix: { desktop: '/images/demo/netflix-desktop.jpg', mobile: '/images/demo/netflix-mobile.jpg', url: 'https://www.netflix.com', domain: 'netflix.com' },
  spotify: { mobile: '/images/demo/spotify-mobile.jpg', url: 'https://www.spotify.com', domain: 'spotify.com' },
  apple: { mobile: '/images/demo/apple-mobile.jpg', url: 'https://www.apple.com', domain: 'apple.com' },
  wave: { mobile: '/images/demo/wave-mobile.jpg', url: 'https://www.wave.com', domain: 'wave.com' },
};

/* ───────────── Le problème : avant / après, avec le temps passé ───────────── */
export function ProblemSection() {
  return (
    <section data-reveal className={`${pad} py-12 sm:py-16`}>
      <div className="max-w-[60ch]">
        <h2 className={head}>Votre client juge votre travail sur une image</h2>
        <p className="mt-5 text-[17px] leading-relaxed text-pms-muted">
          Devis, livraison, portfolio : tout se joue sur un visuel. Une capture plate fait passer un site soigné pour un site
          bâclé.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl bg-pms-surface p-6 sm:p-8 flex flex-col">
          <p className="text-[15px] font-semibold text-pms-muted">Sans PitchMySite</p>
          <p className="mt-2 text-[clamp(2rem,1.6rem+1.6vw,2.75rem)] leading-none tabular-nums">2 heures</p>
          <p className="mt-2 text-[15px] text-pms-muted">par client, entre captures et Figma</p>
          <div className="mt-8 aspect-[16/10] rounded-lg overflow-hidden border border-pms-line bg-pms-paper grayscale">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={DEMO.netflix.desktop} alt="Une capture d'écran plate, sans mise en scène" className="w-full h-full object-cover object-top" loading="lazy" />
          </div>
          <ul className="mt-8 space-y-3 text-[16px] leading-relaxed">
            {[
              'Une capture plate qui ne vend rien.',
              'Des heures non facturées à préparer chaque visuel.',
              'Tout à refaire dès que le site change.',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <X className="w-5 h-5 mt-0.5 shrink-0 text-pms-muted" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-2xl bg-pms-accent-tint p-6 sm:p-8 flex flex-col">
          <p className="text-[15px] font-semibold text-pms-accent">Avec PitchMySite</p>
          <p className="mt-2 text-[clamp(2rem,1.6rem+1.6vw,2.75rem)] leading-none tabular-nums">2 minutes</p>
          <p className="mt-2 text-[15px] text-pms-muted">du lien collé au visuel prêt à envoyer</p>
          <div className="relative mt-8 aspect-[16/10] rounded-lg bg-pms-paper flex items-center justify-center overflow-hidden">
            <div className="w-[70%] -translate-x-[8%]">
              <MockupFrame type="macbook" fill screenshotBase64={DEMO.netflix.desktop} url={DEMO.netflix.url} domainName={DEMO.netflix.domain} />
            </div>
            <div className="absolute right-[8%] bottom-[8%] w-[17%]">
              <MockupFrame type="iphone" fill screenshotBase64={DEMO.netflix.mobile} url={DEMO.netflix.url} domainName={DEMO.netflix.domain} />
            </div>
          </div>
          <ul className="mt-8 space-y-3 text-[16px] leading-relaxed">
            {[
              'Le site mis en scène sur ordinateur, téléphone et tablette.',
              'Le texte de vente rédigé par la Pitch IA, prêt à copier.',
              'Un lien pour votre client. Le site change ? 2 minutes pour refaire.',
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="w-5 h-5 mt-0.5 shrink-0 text-pms-accent" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </article>
      </div>
    </section>
  );
}

/* ───────────── Un lien, trois usages : on choisit à gauche, on voit le résultat à droite ───────────── */
export function UsagesSection() {
  const [format, setFormat] = useState<FormatId>('devis');
  const [touched, setTouched] = useState(false);

  // Tant que le visiteur n'a rien choisi, les trois usages défilent tout seuls
  useEffect(() => {
    if (touched || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => {
      setFormat((f) => FORMATS[(FORMATS.findIndex((x) => x.id === f) + 1) % FORMATS.length].id);
    }, 5000);
    return () => window.clearInterval(id);
  }, [touched]);

  return (
    <section id="usages" data-reveal className={`scroll-mt-16 ${pad} py-12 sm:py-16`}>
      <div className="max-w-[60ch]">
        <h2 className={head}>Un lien, trois usages</h2>
        <p className="mt-5 text-[17px] leading-relaxed text-pms-muted">
          Le même lien (ici, la page publique de Netflix) sert pour votre devis, vos réseaux ou les stores d&apos;applications.
          Choisissez un usage.
        </p>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-[5fr_7fr] lg:items-start">
        <div className="flex flex-col gap-3" role="radiogroup" aria-label="Usage">
          {FORMATS.map((f, i) => {
            const on = format === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setTouched(true);
                  setFormat(f.id);
                }}
                className={`text-left rounded-2xl p-5 sm:p-6 transition-colors ${
                  on ? 'bg-pms-surface' : 'bg-transparent hover:bg-pms-surface/60'
                }`}
              >
                <span className="flex items-baseline justify-between gap-4">
                  <span className="flex items-baseline gap-3">
                    <span className={`text-[15px] font-semibold tabular-nums ${on ? 'text-pms-accent' : 'text-pms-muted'}`}>0{i + 1}</span>
                    <span className="text-[19px] font-semibold">{f.title}</span>
                  </span>
                  <span className="text-[14px] tabular-nums text-pms-muted whitespace-nowrap">{f.ratio}</span>
                </span>
                {on && <span className="mt-3 block text-[16px] leading-relaxed text-pms-muted">{f.desc}</span>}
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl bg-pms-surface p-6 sm:p-10 min-h-[420px] sm:min-h-[560px] flex flex-col items-center justify-center">
          <div className="relative w-full flex justify-center">
            {FORMATS.map((f) => (
              <div
                key={f.id}
                aria-hidden={format !== f.id}
                className={`${format === f.id ? 'relative opacity-100' : 'absolute inset-x-0 top-0 opacity-0 pointer-events-none'} flex justify-center transition-opacity duration-700 motion-reduce:transition-none`}
              >
                <FormatShot format={f.id} compact />
              </div>
            ))}
          </div>
          <p className="mt-6 text-[14px] text-pms-muted text-center">
            {FORMATS.find((f) => f.id === format)?.label}, à partir du lien https://www.netflix.com
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Applis : trois écrans de store montrent ce qu'on obtient ───────────── */
const STORE_SHOTS = [
  { site: DEMO.wave, text: 'Votre accroche au-dessus de chaque écran', bg: 'bg-pms-ink text-white' },
  { site: DEMO.spotify, text: 'Un iPhone par écran de votre appli', bg: 'bg-pms-accent text-white' },
  { site: DEMO.apple, text: 'Aux tailles de l’App Store et de Google Play', bg: 'bg-[#FDEDE8] text-pms-ink' },
];

export function AppsSection({ onPick, inputSlot }: { onPick: () => void; inputSlot: React.ReactNode }) {
  return (
    <section data-reveal id="stores" className={`scroll-mt-16 ${pad} py-12 sm:py-16`}>
      <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:items-center">
        <div>
          <h2 className={`${head} max-w-[18ch]`}>Vous faites des applis ?</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-pms-muted max-w-[46ch]">
            Déposez les écrans de votre appli. Chacun entre dans un iPhone, avec votre accroche au-dessus. Tout sort aux tailles
            de l&apos;App Store et de Google Play.
          </p>
          <ul className="mt-6 space-y-2 text-[16px]">
            {['Jusqu’à 8 écrans à la fois', 'Une accroche et un fond par écran', 'Tout le jeu exporté en un clic'].map((t) => (
              <li key={t} className="flex gap-3">
                <Check className="w-5 h-5 mt-0.5 shrink-0 text-pms-accent" aria-hidden />
                <span>{t}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={onPick}
            className="mt-8 w-full sm:w-auto min-h-[48px] px-6 rounded-md bg-pms-accent hover:bg-pms-accent-hover text-white font-semibold text-[15px] transition-colors"
          >
            Je dépose mes écrans
          </button>
          <p className="mt-2 text-[13px] text-pms-muted">PNG ou JPG. Sans compte.</p>
          {inputSlot}
        </div>

        <div data-ui className="grid grid-cols-3 gap-3 sm:gap-4">
          {STORE_SHOTS.map((s, i) => (
            <figure
              key={s.text}
              className={`aspect-[1320/2868] rounded-xl sm:rounded-2xl ${s.bg} flex flex-col items-center px-[9%] pt-[12%] gap-[7%] overflow-hidden ${i === 1 ? 'translate-y-6' : ''}`}
            >
              <figcaption className="text-center text-[12px] sm:text-[15px] leading-tight font-semibold">{s.text}</figcaption>
              <div className="w-[86%]">
                <MockupFrame type="iphone" fill screenshotBase64={s.site.mobile} url={s.site.url} domainName={s.site.domain} />
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Questions : catégories à gauche, réponses dépliables à droite ───────────── */
type Faq = { q: string; a: string };
const FAQ: { cat: string; items: Faq[] }[] = [
  {
    cat: 'Pour commencer',
    items: [
      { q: 'À quoi sert PitchMySite ?', a: 'À transformer le lien d’un site en visuels qui donnent envie de signer, avec le texte de vente. 2 minutes au lieu de 2 heures sur Figma.' },
      { q: 'Je ne suis pas designer. Est-ce pour moi ?', a: 'Oui. Vous collez un lien et choisissez un des 14 modèles prêts. L’appareil, le fond et le format sont déjà réglés.' },
      { q: 'Faut-il créer un compte pour tester ?', a: 'Non. Vous pouvez exporter 3 images par jour, avec un filigrane discret. Sans compte ni carte bancaire.' },
      { q: 'Puis-je coller un lien YouTube ?', a: 'Oui. La miniature et le titre de la vidéo sont récupérés en un instant, puis mis en scène comme un site.' },
      { q: 'Le site du client est en local ou protégé par un mot de passe ?', a: 'Déposez votre propre capture (PNG, JPG ou WebP). Vous avez la même mise en scène.' },
    ],
  },
  {
    cat: 'Utilisation',
    items: [
      { q: 'Puis-je utiliser les visuels pour mes clients ?', a: 'Oui : propositions, livrables, portfolio, publications, y compris à des fins commerciales.' },
      { q: 'Comment fonctionne la marque blanche ?', a: 'Dès le plan Pro, plus aucun filigrane. Avec le plan Agence, vos pages de partage affichent votre nom et votre logo.' },
      { q: 'La Pitch IA est-elle payante ?', a: 'Non. Elle utilise votre propre clé IA. Groq et Gemini en donnent une gratuitement. Votre clé reste dans votre navigateur.' },
    ],
  },
  {
    cat: 'Paiement et tarifs',
    items: [
      { q: 'Comment payer ?', a: 'Par Mobile Money (MTN, Moov, Celtiis, Orange, Wave, selon votre pays), en FCFA. La carte bancaire arrive bientôt.' },
      { q: 'Est-ce cher pour un freelance ?', a: 'Solo coûte 5 500 FCFA (8 €) par mois. Le prix baisse ensuite chaque mois payé d’affilée.' },
      { q: 'Comment marche le prix fidélité ?', a: 'Chaque mois payé d’affilée sur la même formule baisse le prix du mois suivant, trois fois au maximum. Repayez au plus tard 3 jours après la fin du mois. Un mois raté vous ramène au prix de départ.' },
      { q: 'Puis-je arrêter à tout moment ?', a: 'Il n’y a rien à résilier. Un paiement couvre 1 mois ou 1 an, sans renouvellement automatique.' },
    ],
  },
  {
    cat: 'Confidentialité',
    items: [
      { q: 'Que deviennent les captures des sites de mes clients ?', a: 'L’image va directement dans votre navigateur. Nous ne la gardons pas, sauf si vous créez un lien de partage. Elle reste alors en ligne jusqu’à ce que vous supprimiez le lien.' },
      { q: 'Où est stockée ma clé IA ?', a: 'Uniquement dans votre navigateur, jamais sur nos serveurs.' },
    ],
  },
];

export function FaqSection() {
  const [cat, setCat] = useState(0);
  const [open, setOpen] = useState(0);
  const items = FAQ[cat].items;

  return (
    <section data-reveal id="questions" className="scroll-mt-16 px-3 sm:px-6 lg:px-[68px] py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-pms-paper shadow-[0_30px_80px_-40px_rgba(17,17,17,0.35)] ring-1 ring-pms-line px-5 sm:px-10 lg:px-16 py-12 sm:py-16">
        {/* Fond doux : deux taches de couleur très claires */}
        <span aria-hidden className="pointer-events-none absolute -left-24 top-1/3 w-[420px] h-[420px] rounded-full bg-[#FDEDE8] blur-3xl opacity-80" />
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 w-[460px] h-[460px] rounded-full bg-[#E4F4FA] blur-3xl opacity-90" />

        <div className="relative text-center max-w-[52ch] mx-auto">
          <h2 className={head}>Vos questions</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-pms-muted">
            Avant d&apos;essayer : le studio, le paiement, vos données.
          </p>
        </div>

        <div className="relative mt-12 grid gap-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-8 max-w-5xl mx-auto">
          <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-5 px-5 sm:mx-0 sm:px-0 pb-1" role="tablist" aria-label="Catégories">
            {FAQ.map((c, i) => (
              <button
                key={c.cat}
                type="button"
                role="tab"
                aria-selected={cat === i}
                onClick={() => {
                  setCat(i);
                  setOpen(0);
                }}
                className={`shrink-0 min-h-[48px] lg:min-h-[60px] px-5 rounded-xl flex items-center justify-between gap-4 text-left text-[16px] font-semibold transition-colors ${
                  cat === i ? 'bg-pms-paper text-pms-ink shadow-[0_8px_24px_-14px_rgba(17,17,17,0.35)] ring-1 ring-pms-line' : 'bg-pms-paper/50 text-pms-muted hover:text-pms-ink'
                }`}
              >
                <span className="whitespace-nowrap">{c.cat}</span>
                <ChevronRight className="hidden lg:block w-5 h-5 shrink-0" aria-hidden />
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-3">
            {items.map((f, i) => {
              const isOpen = open === i;
              return (
                <div key={f.q} className={`rounded-xl transition-colors ${isOpen ? 'bg-pms-paper shadow-[0_8px_24px_-14px_rgba(17,17,17,0.3)] ring-1 ring-pms-line' : 'bg-pms-paper/60 ring-1 ring-pms-line/70'}`}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="w-full min-h-[56px] px-5 py-4 flex items-center justify-between gap-4 text-left text-[16px] font-semibold"
                  >
                    <span>{f.q}</span>
                    {isOpen ? <X className="w-5 h-5 shrink-0" aria-hidden /> : <Plus className="w-5 h-5 shrink-0" aria-hidden />}
                  </button>
                  {isOpen && <p className="px-5 pb-5 -mt-1 text-[15px] leading-relaxed text-pms-muted">{f.a}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Pied de page : marque, deux colonnes de liens, contact ───────────── */
export function SiteFooter({ notice }: { notice: string }) {
  return (
    <footer className="mt-3 border-t border-pms-line bg-pms-surface">
      <div className={`${pad} py-14 sm:py-16 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr]`}>
        <div>
          <p className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-lg bg-pms-accent flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" aria-hidden />
            </span>
            <span className="text-[19px] font-semibold">PitchMySite</span>
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-pms-muted max-w-[34ch]">
            Collez un lien. Repartez avec des visuels et un texte qui font signer.
          </p>
          <a
            href="https://www.netwave-studio.company/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 min-h-[44px] text-[15px] font-semibold text-pms-ink hover:text-pms-accent transition-colors"
          >
            Un service de NetWave Studio
            <ArrowUpRight className="w-4 h-4" aria-hidden />
          </a>
        </div>

        <nav aria-label="PitchMySite">
          <p className="text-[16px] font-semibold">PitchMySite</p>
          <ul className="mt-4 space-y-3 text-[15px] text-pms-muted">
            <li><a href="#usages" className="hover:text-pms-ink">Les usages</a></li>
            <li><a href="#pricing" className="hover:text-pms-ink">Les tarifs</a></li>
            <li><a href="#questions" className="hover:text-pms-ink">Vos questions</a></li>
            <li><Link href="/login" className="hover:text-pms-ink">Connexion</Link></li>
            <li><Link href="/signup" className="hover:text-pms-ink">Créer un compte</Link></li>
          </ul>
        </nav>

        <nav aria-label="Produit">
          <p className="text-[16px] font-semibold">Produit</p>
          <ul className="mt-4 space-y-3 text-[15px] text-pms-muted">
            <li><a href="#comment" className="hover:text-pms-ink">Comment ça marche</a></li>
            <li><a href="#stores" className="hover:text-pms-ink">Captures pour les stores</a></li>
            <li><Link href="/pricing#credits" className="hover:text-pms-ink">Packs de crédits</Link></li>
            <li><Link href="/terms" className="hover:text-pms-ink">Conditions (CGU/CGV)</Link></li>
            <li><Link href="/privacy" className="hover:text-pms-ink">Confidentialité</Link></li>
          </ul>
        </nav>

        <div>
          <p className="text-[16px] font-semibold">Une question ?</p>
          <p className="mt-4 text-[15px] leading-relaxed text-pms-muted">Écrivez-nous, nous répondons par e-mail.</p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-4 flex items-center justify-between gap-3 rounded-full bg-pms-paper ring-1 ring-pms-line pl-5 pr-1.5 py-1.5 shadow-[0_8px_24px_-16px_rgba(17,17,17,0.35)] hover:ring-pms-accent transition-colors"
          >
            <span className="text-[15px] text-pms-muted truncate">{SUPPORT_EMAIL}</span>
            <span className="shrink-0 rounded-full bg-pms-accent text-white text-[14px] font-semibold px-4 min-h-[40px] inline-flex items-center">Écrire</span>
          </a>
        </div>
      </div>

      <div className={`${pad} py-6 border-t border-pms-line text-[13px] text-pms-muted flex flex-col sm:flex-row sm:justify-between gap-2`}>
        <span>
          © {new Date().getFullYear()} PitchMySite, par{' '}
          <a href="https://www.netwave-studio.company/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-pms-ink">
            NetWave Studio
          </a>
        </span>
        <span className="max-w-[80ch]">{notice} Exemple de site client : Al Kareem Parfumerie.</span>
      </div>
    </footer>
  );
}

/* ───────────── La fonction phare : choisir la partie du site montrée (démonstration à toucher) ───────────── */
const LONG_PAGE = { src: '/images/demo/wave-long.jpg', ratio: 1824 / 900, url: 'https://www.wave.com', domain: 'wave.com' };
const ZONES = [
  { label: 'Haut de page', desc: 'Le premier écran, celui qu’on voit en arrivant', y: 0 },
  { label: 'Les avantages', desc: 'Ce que le service apporte au client', y: 46 },
  { label: 'Les avis clients', desc: 'La preuve qui rassure', y: 84 },
  { label: 'Pied de page', desc: 'Les liens, les contacts, les applis', y: 100 },
];

export function ZoneSection() {
  const boxRef = React.useRef<HTMLDivElement>(null);
  const [boxW, setBoxW] = useState(0);
  const [y, setY] = useState(0);
  const [zoom, setZoom] = useState(1);
  const dragging = React.useRef(false);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxW(el.clientWidth));
    ro.observe(el);
    setBoxW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Même calcul que dans le studio : le cadre a la proportion de l'écran du MacBook (16:10)
  const pageH = boxW * LONG_PAGE.ratio;
  const rectW = boxW / zoom;
  const rectH = boxW / (zoom * 1.6);
  const travel = Math.max(0, pageH - rectH);

  const setFromPointer = (clientY: number) => {
    const el = boxRef.current;
    if (!el || travel <= 0) return;
    const r = el.getBoundingClientRect();
    const v = clientY - r.top - rectH / 2;
    setY(Math.round(Math.max(0, Math.min(1, v / travel)) * 100));
  };
  const active = ZONES.reduce((a, z) => (Math.abs(z.y - y) < Math.abs(a.y - y) ? z : a), ZONES[0]);

  return (
    <section data-reveal id="zone" className="scroll-mt-16 px-3 sm:px-6 lg:px-[68px] py-12 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-pms-field text-white px-5 sm:px-10 lg:px-14 py-12 sm:py-16">
        {/* Lumière bleue très douce derrière l'ordinateur */}
        <span aria-hidden className="pointer-events-none absolute -right-32 -top-32 w-[620px] h-[620px] rounded-full bg-pms-accent/25 blur-3xl" />

        <div className="relative grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center">
          <div>
            <p className="text-[15px] font-semibold text-pms-accent-soft">La fonction qui change tout</p>
            <h2 className={`mt-3 ${head}`}>Montrez la partie du site qui fait vendre</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-white/70 max-w-[46ch]">
              Le site est capturé en entier, pas seulement le haut. Choisissez la section : l&apos;écran suit.
            </p>

            <div className="mt-8 flex flex-col gap-2" role="radiogroup" aria-label="Sections de la page">
              {ZONES.map((z, i) => {
                const on = active.label === z.label;
                return (
                  <button
                    key={z.label}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setY(z.y)}
                    className={`group text-left rounded-xl px-4 py-3 flex items-start gap-4 transition-colors ${
                      on ? 'bg-white/10 ring-1 ring-white/20' : 'hover:bg-white/5'
                    }`}
                  >
                    <span className={`mt-0.5 text-[14px] font-semibold tabular-nums ${on ? 'text-pms-accent-soft' : 'text-white/40'}`}>0{i + 1}</span>
                    <span>
                      <span className={`block text-[17px] font-semibold ${on ? 'text-white' : 'text-white/80'}`}>{z.label}</span>
                      <span className="block text-[14px] text-white/55">{z.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 max-w-sm">
              <div className="flex items-center justify-between text-[15px]">
                <label htmlFor="demo-zoom" className="font-semibold">Agrandir un détail</label>
                <span className="text-white/60 tabular-nums">{zoom <= 1.01 ? 'Toute la largeur' : `${zoom.toFixed(1).replace('.', ',')} fois`}</span>
              </div>
              <input
                id="demo-zoom"
                type="range"
                min={1}
                max={2.5}
                step={0.1}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="mt-3 w-full accent-pms-accent cursor-pointer"
              />
            </div>
          </div>

          <div className="relative pb-10 sm:pb-6 lg:pl-10">
            <MockupFrame type="macbook" fill screenshotBase64={LONG_PAGE.src} url={LONG_PAGE.url} domainName={LONG_PAGE.domain} cropOffsetY={y} cropZoom={zoom} />

            {/* La page entière, posée sur l'ordinateur : on y fait glisser le cadre bleu */}
            <div className="absolute left-0 -bottom-2 sm:bottom-0 w-[30%] sm:w-[26%] lg:w-[24%] -rotate-3 rounded-xl bg-white p-1.5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)]">
              <div
                ref={boxRef}
                className="relative rounded-lg overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
                onPointerDown={(e) => {
                  dragging.current = true;
                  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                  setFromPointer(e.clientY);
                }}
                onPointerMove={(e) => dragging.current && setFromPointer(e.clientY)}
                onPointerUp={() => (dragging.current = false)}
                onPointerCancel={() => (dragging.current = false)}
                role="slider"
                aria-label="Faire glisser le cadre sur la page"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={y}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') setY((v) => Math.min(100, v + 5));
                  if (e.key === 'ArrowUp') setY((v) => Math.max(0, v - 5));
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={LONG_PAGE.src} alt="La page d'accueil de Wave capturée en entier" draggable={false} className="block w-full h-auto" loading="lazy" />
                {boxW > 0 && (
                  <div
                    className="absolute rounded-[3px] ring-2 ring-pms-accent bg-pms-accent/15 shadow-[0_0_0_9999px_rgba(17,17,17,0.45)] pointer-events-none transition-[top] duration-200"
                    style={{ top: (y / 100) * travel, left: (boxW - rectW) / 2, width: rectW, height: rectH }}
                  />
                )}
              </div>
              <p className="px-1 pt-1.5 pb-0.5 text-[11px] sm:text-[12px] font-semibold text-pms-ink text-center">Glissez le cadre</p>
            </div>
          </div>
        </div>
        <p className="relative mt-10 text-[13px] text-white/45">Exemple réalisé à partir de la page publique de Wave, sans lien avec la marque.</p>
      </div>
    </section>
  );
}

/* ───────────── Ce que contient le studio : de vraies captures, en grille de cartes ───────────── */
const STUDIO_CARDS: { img: string; alt: string; title: string; text: string; wide?: boolean; tall?: boolean }[] = [
  {
    img: '/images/studio/studio-ensemble.jpg',
    alt: 'Le studio PitchMySite : le site de Wave sur ordinateur et téléphone',
    title: 'Neuf appareils, seul ou en duo',
    text: 'MacBook, iPhone, iPad, Android, iMac, montre… L’ordinateur et le téléphone côte à côte, avec la vraie version mobile du site.',
    wide: true,
  },
  {
    img: '/images/studio/studio-zone.jpg',
    alt: 'Le réglage « Partie du site montrée »',
    title: 'La partie qui fait vendre',
    text: 'Glissez le cadre sur la partie du site à montrer, agrandissez un détail.',
    tall: true,
    // carte haute : même hauteur d'image que la grande carte voisine
  },
  {
    img: '/images/studio/studio-modeles.jpg',
    alt: 'Les modèles prêts à publier',
    title: '14 modèles prêts à publier',
    text: 'LinkedIn, Instagram, statut WhatsApp, devis, portfolio : appareil, fond et format réglés d’un coup.',
  },
  {
    img: '/images/studio/studio-pitch.jpg',
    alt: 'La Pitch IA',
    title: 'Le texte de vente, déjà écrit',
    text: 'L’offre, l’e-mail de prospection et le post LinkedIn, écrits à partir du site. Avec votre clé IA, gratuite chez Groq ou Gemini.',
  },
  {
    img: '/images/studio/studio-exporter.jpg',
    alt: 'Le menu Exporter',
    title: 'Envoyé en un clic',
    text: 'Image jusqu’en 4K, statut WhatsApp, packs réseaux et stores, PDF de présentation ou lien pour le client.',
  },
];

export function StudioSection() {
  return (
    <section data-reveal className={`${pad} py-12 sm:py-16`}>
      <div className="max-w-[60ch]">
        <h2 className={head}>Tout pour présenter un site, sans Figma</h2>
        <p className="mt-5 text-[17px] leading-relaxed text-pms-muted">
          Ces images sont de vraies captures du studio, prises avec le site de Wave.
        </p>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {STUDIO_CARDS.map((c) => (
          <article
            key={c.title}
            className={`rounded-2xl bg-pms-surface overflow-hidden flex flex-col ${c.wide ? 'md:col-span-2' : ''}`}
          >
            <div className={`bg-[#0b0b0f] overflow-hidden ${c.wide || c.tall ? 'h-[240px] sm:h-[340px]' : 'h-[240px]'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt={c.alt} loading="lazy" className={`w-full h-full object-cover ${c.tall ? 'object-top' : 'object-left-top'}`} />
            </div>
            <div className="p-5 sm:p-6">
              <h3 className="text-[19px] font-semibold">{c.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">{c.text}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-8 text-[16px] leading-relaxed text-pms-muted max-w-[70ch]">
        Et aussi : scènes photo réalistes, avant / après d&apos;une refonte, annotations et floutage, kit de marque, vidéos et GIF,
        et tous vos projets enregistrés.
      </p>
    </section>
  );
}

/* ───────────── Bientôt : ce qui arrive, dit honnêtement ───────────── */
const SOON = [
  { title: 'Tutoriels vidéo', text: 'De courtes vidéos pour prendre le studio en main en quelques minutes.' },
  { title: 'Paiement par carte bancaire', text: 'Visa et Mastercard, en plus du Mobile Money.' },
];

export function SoonSection() {
  return (
    <section data-reveal id="bientot" className={`scroll-mt-16 ${pad} py-12 sm:py-16`}>
      <div className="max-w-[60ch]">
        <h2 className={head}>Bientôt disponible</h2>
        <p className="mt-5 text-[17px] leading-relaxed text-pms-muted">
          PitchMySite est lancé depuis octobre 2026. Voici ce que nous préparons.
        </p>
      </div>
      <ol className="mt-10 grid gap-3 sm:grid-cols-2 max-w-3xl">
        {SOON.map((s, i) => (
          <li key={s.title} className="rounded-2xl bg-pms-surface p-5 flex flex-col">
            <span className="flex items-center justify-between text-[14px]">
              <span className="font-semibold tabular-nums text-pms-muted">0{i + 1}</span>
              <span className="rounded-full bg-pms-paper ring-1 ring-pms-line px-2.5 py-0.5 text-[13px] text-pms-accent font-semibold">Bientôt</span>
            </span>
            <h3 className="mt-4 text-[17px] font-semibold leading-snug">{s.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">{s.text}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
