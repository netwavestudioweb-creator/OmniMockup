'use client';

import React from 'react';
import { MockupFrame } from '@/components/MockupFrame';

/**
 * Les images de l'accueil sont de vraies sorties du produit : des sites connus, capturés depuis leurs pages
 * publiques, puis mis dans les mêmes cadres d'appareils que le studio. Rien n'est imité.
 */
type SiteId = 'wave' | 'netflix' | 'apple' | 'notion' | 'spotify' | 'alkareem';

const SITES: Record<SiteId, { name: string; url: string; domain: string; desktop: string; mobile: string }> = {
  wave: { name: 'Wave', url: 'https://www.wave.com', domain: 'wave.com', desktop: '/images/demo/wave-desktop.jpg', mobile: '/images/demo/wave-mobile.jpg' },
  netflix: { name: 'Netflix', url: 'https://www.netflix.com', domain: 'netflix.com', desktop: '/images/demo/netflix-desktop.jpg', mobile: '/images/demo/netflix-mobile.jpg' },
  apple: { name: 'Apple', url: 'https://www.apple.com', domain: 'apple.com', desktop: '/images/demo/apple-desktop.jpg', mobile: '/images/demo/apple-mobile.jpg' },
  notion: { name: 'Notion', url: 'https://www.notion.com', domain: 'notion.com', desktop: '/images/demo/notion-desktop.jpg', mobile: '/images/demo/notion-mobile.jpg' },
  spotify: { name: 'Spotify', url: 'https://www.spotify.com', domain: 'spotify.com', desktop: '/images/demo/spotify-desktop.jpg', mobile: '/images/demo/spotify-mobile.jpg' },
  alkareem: {
    name: 'Al Kareem Parfumerie',
    url: 'https://www.al-kareemparfurmerie.com',
    domain: 'al-kareemparfurmerie.com',
    desktop: '/images/demo/al-kareem-desktop.jpg',
    mobile: '/images/demo/al-kareem-mobile.jpg',
  },
};

/** Mention affichée sous les exemples : ces marques ne sont ni clientes ni partenaires */
export const BRANDS_NOTICE =
  'Wave, Netflix, Apple, Notion et Spotify sont des exemples réalisés à partir de leurs pages publiques, sans lien avec ces marques.';

function Laptop({ site }: { site: SiteId }) {
  const s = SITES[site];
  return <MockupFrame type="macbook" fill screenshotBase64={s.desktop} url={s.url} domainName={s.domain} />;
}

function Phone({ site }: { site: SiteId }) {
  const s = SITES[site];
  return <MockupFrame type="iphone" fill screenshotBase64={s.mobile} url={s.url} domainName={s.domain} />;
}

/** Petite étiquette posée sur la scène de l'accroche : une vraie option du studio */
function Tag({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`absolute z-10 items-center rounded-full bg-pms-paper px-4 py-2 text-[15px] font-semibold shadow-[0_8px_24px_-12px_rgba(17,17,17,0.35)] ${className}`}>
      {children}
    </span>
  );
}

/** Accroche : le site de Wave sur ordinateur et téléphone, en grand, avec trois options du studio autour */
export function HeroShowcase() {
  return (
    <figure data-ui className="relative w-full rounded-lg bg-pms-surface overflow-hidden">
      <div className="relative mx-auto max-w-[1100px] px-[6%] pt-[6%] pb-[4%]">
        <Tag className="hidden sm:inline-flex left-[3%] top-[18%]">MacBook et iPhone</Tag>
        <Tag className="hidden sm:inline-flex right-[3%] top-[10%]">Format LinkedIn 4:5</Tag>
        <Tag className="hidden sm:inline-flex right-[2%] bottom-[30%]">Export 4K</Tag>
        <div className="w-[86%] mx-auto -translate-x-[4%]">
          <Laptop site="wave" />
        </div>
        <div className="absolute right-[7%] bottom-[5%] w-[17%]">
          <Phone site="wave" />
        </div>
      </div>
      <figcaption className="px-6 pb-5 text-[13px] text-pms-muted text-center">
        Le site de Wave, collé tel quel dans PitchMySite. Exemple sans lien avec la marque.
      </figcaption>
    </figure>
  );
}

export type FormatId = 'devis' | 'statut' | 'store';

export const FORMATS: { id: FormatId; label: string; ratio: string; title: string; desc: string }[] = [
  {
    id: 'devis',
    label: 'Proposition commerciale',
    ratio: '16:9',
    title: 'Pour votre devis',
    desc: 'Le site sur ordinateur et téléphone, avec son texte de vente. À glisser dans votre devis ou à envoyer tel quel.',
  },
  {
    id: 'statut',
    label: 'Story et statut',
    ratio: '9:16',
    title: 'Pour vos réseaux',
    desc: 'Le bon format pour Instagram, le statut WhatsApp et LinkedIn. Ou tous les formats d’un coup.',
  },
  {
    id: 'store',
    label: 'App Store',
    ratio: '1320 × 2868',
    title: 'Pour les stores d’applications',
    desc: 'Vos écrans aux tailles exactes de l’App Store et de Google Play, avec une accroche au-dessus.',
  },
];

/** Une sortie dans son format (avec le site de Netflix) : carte à la bonne proportion, couleur unie */
export function FormatShot({ format, compact = false }: { format: FormatId; compact?: boolean }) {
  if (format === 'devis') {
    return (
      <div data-ui className="relative w-full max-w-[520px] aspect-video rounded-lg bg-pms-paper flex items-center justify-center overflow-hidden">
        <div className="w-[70%] -translate-x-[8%]">
          <Laptop site="netflix" />
        </div>
        <div className="absolute right-[7%] bottom-[8%] w-[17%]">
          <Phone site="netflix" />
        </div>
      </div>
    );
  }
  if (format === 'statut') {
    return (
      <div
        data-ui
        className={`${compact ? 'h-[min(48svh,420px)]' : 'h-[min(62svh,520px)]'} aspect-[9/16] rounded-lg bg-pms-paper flex items-center justify-center px-[10%] overflow-hidden`}
      >
        <div className="w-[88%]">
          <Phone site="netflix" />
        </div>
      </div>
    );
  }
  return (
    <div
      data-ui
      className={`${compact ? 'h-[min(48svh,420px)]' : 'h-[min(64svh,560px)]'} aspect-[1290/2796] rounded-lg bg-pms-ink flex flex-col items-center pt-[12%] gap-[6%] px-[10%] overflow-hidden`}
    >
      {/* Accroche reprise telle quelle de la page publique de Netflix */}
      <p className="text-white text-center text-[15px] leading-tight font-semibold">Films et séries en illimité</p>
      <div className="w-[84%]">
        <Phone site="netflix" />
      </div>
    </div>
  );
}

/** Petit téléphone pour les modules « Ce que contient le studio » */
export function SmallPhone({ site }: { site: SiteId }) {
  return <Phone site={site} />;
}

/** Exemples qui défilent tout seuls, en boucle (pause au survol) : un client réel et des sites connus */
const EXAMPLES: { site: SiteId; device: 'laptop' | 'phone'; note: string }[] = [
  { site: 'alkareem', device: 'laptop', note: 'Site client, parfumerie en ligne' },
  { site: 'apple', device: 'phone', note: 'Page produit sur iPhone' },
  { site: 'notion', device: 'laptop', note: 'Page d’accueil d’un logiciel' },
  { site: 'spotify', device: 'phone', note: 'Application de musique' },
  { site: 'wave', device: 'laptop', note: 'Service de paiement mobile' },
  { site: 'netflix', device: 'phone', note: 'Plateforme de vidéo' },
];

export function ExamplesMarquee() {
  const card = (ex: (typeof EXAMPLES)[number], copy: boolean) => (
    <li key={`${ex.site}-${copy}`} aria-hidden={copy || undefined} className="shrink-0 w-[78vw] sm:w-[436px] pl-4">
      <figure data-ui className="h-[300px] rounded-2xl bg-pms-surface flex items-center justify-center overflow-hidden">
        <div className={ex.device === 'laptop' ? 'w-[82%]' : 'w-[34%] mt-10'}>
          {ex.device === 'laptop' ? <Laptop site={ex.site} /> : <Phone site={ex.site} />}
        </div>
      </figure>
      <p className="mt-3 text-[17px] font-semibold">{SITES[ex.site].name}</p>
      <p className="text-[15px] text-pms-muted">{ex.note}</p>
    </li>
  );
  return (
    <div className="marquee overflow-hidden -mx-5 sm:-mx-10 lg:-mx-[68px]">
      {/* La liste est doublée : quand la première moitié est sortie, la boucle repart sans à-coup */}
      <ul className="marquee-track flex w-max">
        {EXAMPLES.map((ex) => card(ex, false))}
        {EXAMPLES.map((ex) => card(ex, true))}
      </ul>
    </div>
  );
}

/** Fond de l'accroche : des sites mis en scène, inclinés et très atténués, avec une ombre douce */
export function HeroBackdrop() {
  const shots = ['netflix', 'apple', 'notion', 'spotify', 'wave', 'alkareem', 'apple', 'netflix'] as SiteId[];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-6%] w-[150%] sm:w-[120%] -translate-x-1/2 -rotate-[8deg] grid grid-cols-3 sm:grid-cols-4 gap-5 sm:gap-8 opacity-[0.22]">
        {shots.map((id, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={SITES[id].desktop}
            alt=""
            className="w-full aspect-[16/10] object-cover object-top rounded-xl shadow-[0_30px_60px_-20px_rgba(17,17,17,0.6)]"
          />
        ))}
      </div>
      {/* Voile blanc : le fond reste visible sur les bords, le texte reste lisible au centre */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_45%,rgba(255,255,255,0.97)_0%,rgba(255,255,255,0.86)_55%,rgba(255,255,255,0.55)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-white" />
    </div>
  );
}

/** Grand ordinateur pour le pied de page */
export function FooterLaptop() {
  return <Laptop site="apple" />;
}
