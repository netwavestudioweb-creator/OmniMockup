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

/** Accroche : le site de Wave sur ordinateur et téléphone, sur un aplat */
export function HeroShowcase() {
  return (
    <figure data-ui className="relative h-full w-full overflow-hidden rounded-lg bg-pms-surface flex flex-col">
      <div className="relative flex-1 min-h-0 flex items-center justify-center px-[6%] pt-[8%]">
        <div className="w-[88%] -translate-x-[6%]">
          <Laptop site="wave" />
        </div>
        <div className="absolute right-[6%] bottom-[6%] w-[20%]">
          <Phone site="wave" />
        </div>
      </div>
      <figcaption className="px-6 pb-5 pt-3 text-[13px] text-pms-muted">
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
    desc: 'Le site sur ordinateur et téléphone, avec le texte de vente rédigé par la Pitch IA. À glisser dans votre devis ou à envoyer à votre client.',
  },
  {
    id: 'statut',
    label: 'Story et statut',
    ratio: '9:16',
    title: 'Pour vos réseaux',
    desc: 'Un visuel au bon format pour les stories Instagram, le statut WhatsApp et LinkedIn, ou tout le pack de formats en un clic.',
  },
  {
    id: 'store',
    label: 'App Store',
    ratio: '1290 × 2796',
    title: 'Pour les stores d’applications',
    desc: 'Des captures aux tailles exactes de l’App Store et de Google Play, avec une accroche au-dessus de l’écran.',
  },
];

/** Une sortie dans son format (avec le site de Netflix) : carte à la bonne proportion, couleur unie */
export function FormatShot({ format, compact = false }: { format: FormatId; compact?: boolean }) {
  if (format === 'devis') {
    return (
      <div data-ui className="relative w-full max-w-[520px] aspect-video rounded-lg bg-pms-surface flex items-center justify-center overflow-hidden">
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
        className={`${compact ? 'h-[min(48svh,420px)]' : 'h-[min(62svh,520px)]'} aspect-[9/16] rounded-lg bg-pms-surface flex items-center justify-center px-[10%] overflow-hidden`}
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

/** Bouton d'interface montré dans les illustrations (pas cliquable) */
function Chip({ children, on = false }: { children: React.ReactNode; on?: boolean }) {
  return (
    <span className={`px-3 py-1.5 rounded-md text-[15px] font-semibold ${on ? 'bg-pms-ink text-white' : 'bg-pms-paper text-pms-ink'}`}>
      {children}
    </span>
  );
}

/**
 * « Comment ça marche » : chaque image montre exactement la phrase à côté d'elle.
 * 0 = le champ du lien rempli, 1 = le choix de l'appareil et du format, 2 = le visuel fini et ses boutons d'export.
 */
export function StepShot({ step }: { step: 0 | 1 | 2 }) {
  if (step === 0) {
    return (
      <figure data-ui className="w-full rounded-lg bg-pms-surface p-6 sm:p-8">
        <p className="text-[15px] text-pms-muted">Collez l’adresse du site</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2 rounded-lg bg-pms-paper p-2">
          <span className="flex-1 min-w-0 truncate px-3 py-3 text-[17px]">https://www.netflix.com</span>
          <span className="rounded-md bg-pms-accent px-5 py-3 text-[15px] font-semibold text-white text-center">Créer mon Mockup</span>
        </div>
        <figcaption className="mt-4 text-[15px] text-pms-muted">La page est capturée en quelques secondes, bannières de cookies masquées.</figcaption>
      </figure>
    );
  }
  if (step === 1) {
    return (
      <figure data-ui className="w-full rounded-lg bg-pms-surface p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-20 text-[15px] text-pms-muted">Appareil</span>
          <Chip on>MacBook</Chip>
          <Chip>iPhone</Chip>
          <Chip>iPad</Chip>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="w-20 text-[15px] text-pms-muted">Format</span>
          <Chip on>16:9</Chip>
          <Chip>1:1</Chip>
          <Chip>9:16</Chip>
        </div>
        <div className="mt-6 mx-auto w-[82%]">
          <Laptop site="netflix" />
        </div>
      </figure>
    );
  }
  return (
    <figure data-ui className="w-full rounded-lg bg-pms-surface p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
      <div className="w-[150px] shrink-0">
        <Phone site="netflix" />
      </div>
      <div className="flex flex-col gap-2 w-full sm:w-auto">
        <span className="rounded-md bg-pms-accent px-5 py-3 text-[15px] font-semibold text-white text-center">Télécharger en PNG 4K</span>
        <span className="rounded-md bg-pms-paper px-5 py-3 text-[15px] font-semibold text-center">Copier le lien de partage</span>
        <figcaption className="mt-2 text-[15px] text-pms-muted">Le visuel est prêt : en image, en vidéo, en PDF, ou en lien pour votre client.</figcaption>
      </div>
    </figure>
  );
}

/** Petit téléphone pour les modules « Ce que contient le studio » */
export function SmallPhone({ site }: { site: SiteId }) {
  return <Phone site={site} />;
}

/** Carrousel d'exemples : un client réel (Al Kareem) et des sites connus, chacun sur un appareil */
const EXAMPLES: { site: SiteId; device: 'laptop' | 'phone'; note: string }[] = [
  { site: 'alkareem', device: 'laptop', note: 'Site client, parfumerie en ligne' },
  { site: 'apple', device: 'phone', note: 'Page produit sur iPhone' },
  { site: 'notion', device: 'laptop', note: 'Page d’accueil d’un logiciel' },
  { site: 'spotify', device: 'phone', note: 'Application de musique' },
];

export function ExamplesCarousel() {
  return (
    <ul className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 -mx-5 px-5 scroll-pl-5 sm:-mx-10 sm:px-10 sm:scroll-pl-10 lg:-mx-[68px] lg:px-[68px] lg:scroll-pl-[68px] [scrollbar-width:thin]">
      {EXAMPLES.map((ex) => (
        <li key={ex.site} className="snap-start shrink-0 w-[78vw] sm:w-[420px]">
          <figure data-ui className="h-[300px] rounded-lg bg-pms-surface flex items-center justify-center overflow-hidden">
            <div className={ex.device === 'laptop' ? 'w-[82%]' : 'w-[34%] mt-10'}>
              {ex.device === 'laptop' ? <Laptop site={ex.site} /> : <Phone site={ex.site} />}
            </div>
          </figure>
          <p className="mt-3 text-[17px] font-semibold">{SITES[ex.site].name}</p>
          <p className="text-[15px] text-pms-muted">{ex.note}</p>
        </li>
      ))}
    </ul>
  );
}

/** Grand ordinateur pour le pied de page */
export function FooterLaptop() {
  return <Laptop site="apple" />;
}
