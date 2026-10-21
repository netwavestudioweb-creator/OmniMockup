'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Layers, Plus, X } from 'lucide-react';
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
    <section data-reveal className={`${pad} py-20 sm:py-28`}>
      <div className="max-w-[60ch]">
        <h2 className={head}>Vos clients jugent un site sur une image</h2>
        <p className="mt-5 text-[17px] leading-relaxed text-pms-muted">
          Proposition commerciale, livraison, portfolio : la première impression se joue sur un visuel. Une capture plate fait
          paraître un site soigné comme un site bâclé.
        </p>
      </div>

      <div className="mt-12 grid gap-4 md:grid-cols-2">
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
              'Une capture plate qui ne met pas votre travail en valeur.',
              'Des heures non facturées à préparer chaque visuel.',
              'Tout à refaire à la main à chaque modification du site.',
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
              'Un lien à envoyer au client, refait en 2 minutes si le site change.',
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
    <section id="usages" data-reveal className={`scroll-mt-16 ${pad} py-20 sm:py-28 bg-pms-surface`}>
      <div className="max-w-[60ch]">
        <h2 className={head}>Un lien, trois usages</h2>
        <p className="mt-5 text-[17px] leading-relaxed text-pms-muted">
          Le même lien (ici, la page publique de Netflix) devient un visuel pour votre devis, pour vos réseaux ou pour les stores
          d&apos;applications. Choisissez un usage pour voir le résultat.
        </p>
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-[5fr_7fr] lg:items-start">
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
                  on ? 'bg-pms-paper shadow-[0_12px_32px_-18px_rgba(17,17,17,0.35)]' : 'bg-transparent hover:bg-pms-paper/60'
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

        <div className="rounded-2xl bg-pms-paper p-6 sm:p-10 min-h-[420px] sm:min-h-[560px] flex flex-col items-center justify-center">
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
    <section data-reveal id="stores" className={`scroll-mt-16 ${pad} py-20 sm:py-28`}>
      <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:items-center">
        <div>
          <h2 className={`${head} max-w-[18ch]`}>Vous faites des applis ?</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-pms-muted max-w-[46ch]">
            Déposez les captures de votre appli. Chaque écran est placé dans un iPhone, avec votre phrase d&apos;accroche
            au-dessus, puis exporté aux tailles exactes demandées par l&apos;App Store et Google Play.
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
            Déposer les écrans de mon appli
          </button>
          <p className="mt-2 text-[13px] text-pms-muted">PNG ou JPG, sans inscription.</p>
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
      { q: 'À quoi sert PitchMySite ?', a: 'À transformer le lien d’un site en visuels qui donnent envie de signer : le site mis en scène sur ordinateur et téléphone, au bon format pour un devis, les réseaux ou les stores, avec le texte de vente. Ce qui prend 2 heures sur Figma se fait en 2 minutes.' },
      { q: 'Faut-il créer un compte pour tester ?', a: 'Non. Vous pouvez tester le studio et exporter jusqu’à 3 images par jour, avec un filigrane discret, sans compte ni carte bancaire.' },
      { q: 'Puis-je coller un lien YouTube ?', a: 'Oui. Collez le lien d’une vidéo YouTube : sa miniature et son titre sont récupérés en un instant, puis mis en scène comme un site. Pratique pour présenter une chaîne ou une vidéo à un client.' },
      { q: 'Le site du client est en local ou protégé par un mot de passe ?', a: 'Déposez votre propre capture d’écran (PNG, JPG ou WebP) : vous profitez de la même mise en scène.' },
    ],
  },
  {
    cat: 'Utilisation',
    items: [
      { q: 'Puis-je utiliser les visuels pour mes clients et à des fins commerciales ?', a: 'Oui. Les visuels que vous créez peuvent servir dans vos propositions commerciales, vos livrables clients, votre portfolio et vos publications.' },
      { q: 'Comment fonctionne la marque blanche ?', a: 'Dès le plan Pro, vos images, vidéos et PDF ne portent plus de filigrane. Avec le plan Agence, les pages de partage affichent aussi le nom et le logo de votre agence, sans mention de PitchMySite.' },
      { q: 'La Pitch IA est-elle payante ?', a: 'Elle utilise votre propre clé IA. Groq et Gemini proposent des clés gratuites : vous ne payez rien de plus, et votre clé reste dans votre navigateur.' },
    ],
  },
  {
    cat: 'Paiement et tarifs',
    items: [
      { q: 'Comment payer ?', a: 'Par Mobile Money via SasPay (MTN, Moov, Celtiis, Orange, Wave, selon votre pays), en FCFA. Le paiement par carte bancaire arrive bientôt.' },
      { q: 'Comment marche le prix fidélité ?', a: 'En payant au mois, chaque mois payé d’affilée sur la même formule baisse le prix du mois suivant, trois fois au maximum. Repayez au plus tard 3 jours après la fin de votre mois pour garder votre prix ; un mois raté vous ramène au prix de départ.' },
      { q: 'Puis-je arrêter à tout moment ?', a: 'Il n’y a rien à résilier : un paiement couvre 1 mois ou 1 an, sans renouvellement automatique. Vous repayez seulement si vous voulez continuer.' },
    ],
  },
  {
    cat: 'Confidentialité',
    items: [
      { q: 'Que deviennent les captures des sites de mes clients ?', a: 'La page est chargée par notre moteur de capture, puis l’image est envoyée directement à votre navigateur. Nous ne conservons pas les captures, sauf si vous créez un lien de partage : l’image est alors hébergée jusqu’à ce que vous supprimiez le lien.' },
      { q: 'Où est stockée ma clé IA ?', a: 'Uniquement dans votre navigateur. Elle n’est jamais enregistrée sur nos serveurs.' },
    ],
  },
];

export function FaqSection() {
  const [cat, setCat] = useState(0);
  const [open, setOpen] = useState(0);
  const items = FAQ[cat].items;

  return (
    <section data-reveal id="questions" className="scroll-mt-16 px-3 sm:px-6 lg:px-[68px] py-20 sm:py-28">
      <div className="relative overflow-hidden rounded-3xl bg-pms-paper shadow-[0_30px_80px_-40px_rgba(17,17,17,0.35)] ring-1 ring-pms-line px-5 sm:px-10 lg:px-16 py-14 sm:py-20">
        {/* Fond doux : deux taches de couleur très claires */}
        <span aria-hidden className="pointer-events-none absolute -left-24 top-1/3 w-[420px] h-[420px] rounded-full bg-[#FDEDE8] blur-3xl opacity-80" />
        <span aria-hidden className="pointer-events-none absolute -right-24 -top-24 w-[460px] h-[460px] rounded-full bg-[#E4F4FA] blur-3xl opacity-90" />

        <div className="relative text-center max-w-[52ch] mx-auto">
          <h2 className={head}>Vos questions</h2>
          <p className="mt-5 text-[17px] leading-relaxed text-pms-muted">
            Tout ce qu&apos;il faut savoir avant d&apos;essayer : le studio, le paiement et vos données.
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
            Le lien d&apos;un site ou d&apos;une vidéo YouTube, transformé en visuels et en texte qui font signer vos clients.
          </p>
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
        <span>© {new Date().getFullYear()} PitchMySite</span>
        <span className="max-w-[80ch]">{notice} Exemple de site client : Al Kareem Parfumerie.</span>
      </div>
    </footer>
  );
}
