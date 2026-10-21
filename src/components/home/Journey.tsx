'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MockupFrame } from '@/components/MockupFrame';

/**
 * « Comment ça marche » en 4 étapes, une image à gauche puis à droite (en zigzag).
 * Au défilement, une ligne se remplit et chaque numéro s'allume : on voit le simple lien
 * prendre de la valeur jusqu'au visuel prêt à faire signer.
 */
const STEPS = [
  {
    t: 'Collez le lien du site.',
    d: 'Ou celui d’une vidéo YouTube. Site en local ou protégé par un mot de passe : déposez votre propre capture.',
    value: 'Un simple lien',
  },
  {
    t: 'Le site est capturé en entier.',
    d: 'En quelques secondes, sans les bannières de cookies. Sur ordinateur et sur téléphone.',
    value: 'Une capture propre',
  },
  {
    t: 'Mettez-le en scène.',
    d: 'MacBook, iPhone, iPad, Android ; l’angle, le fond et le format de chaque réseau.',
    value: 'Un visuel de présentation',
  },
  {
    t: 'Envoyez-le et faites signer.',
    d: 'Image jusqu’en 4K, vidéo, PDF pour un devis, ou un lien à envoyer à votre client, avec le texte de vente.',
    value: 'Un argument de vente',
  },
] as const;

const NETFLIX = { desktop: '/images/demo/netflix-desktop.jpg', mobile: '/images/demo/netflix-mobile.jpg', url: 'https://www.netflix.com', domain: 'netflix.com' };

function StepVisual({ step }: { step: number }) {
  if (step === 0) {
    return (
      <div className="w-full rounded-lg bg-pms-surface p-6 sm:p-8">
        <p className="text-[15px] text-pms-muted">Collez l’adresse du site</p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2 rounded-lg bg-pms-paper p-2">
          <span className="flex-1 min-w-0 truncate px-3 py-3 text-[17px]">https://www.netflix.com</span>
          <span className="rounded-md bg-pms-accent px-5 py-3 text-[15px] font-semibold text-white text-center">Créer mon mockup</span>
        </div>
      </div>
    );
  }
  if (step === 1) {
    // La capture brute, telle qu'elle sort du moteur : une page à plat, sans appareil
    return (
      <div className="w-full rounded-lg bg-pms-surface p-6 sm:p-8 flex items-end justify-center gap-4">
        <div className="w-[72%] aspect-[16/10] rounded-md overflow-hidden border border-pms-line bg-pms-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={NETFLIX.desktop} alt="" className="w-full h-full object-cover object-top" loading="lazy" />
        </div>
        <div className="w-[20%] aspect-[9/19] rounded-md overflow-hidden border border-pms-line bg-pms-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={NETFLIX.mobile} alt="" className="w-full h-full object-cover object-top" loading="lazy" />
        </div>
      </div>
    );
  }
  if (step === 2) {
    return (
      <div className="relative w-full aspect-video rounded-lg bg-pms-accent-tint flex items-center justify-center overflow-hidden">
        <div className="w-[68%] -translate-x-[8%]">
          <MockupFrame type="macbook" fill screenshotBase64={NETFLIX.desktop} url={NETFLIX.url} domainName={NETFLIX.domain} />
        </div>
        <div className="absolute right-[8%] bottom-[8%] w-[16%]">
          <MockupFrame type="iphone" fill screenshotBase64={NETFLIX.mobile} url={NETFLIX.url} domainName={NETFLIX.domain} />
        </div>
      </div>
    );
  }
  // Le visuel fini : mis en scène, avec son titre de vente et ses boutons d'envoi
  return (
    <div className="w-full rounded-lg bg-pms-field text-white p-6 sm:p-8">
      <p className="text-[clamp(1.25rem,1.1rem+0.6vw,1.5rem)] leading-snug max-w-[24ch]">Films et séries en illimité, sur tous vos écrans.</p>
      <div className="mt-6 flex items-end gap-4">
        <div className="w-[64%]">
          <MockupFrame type="macbook" fill screenshotBase64={NETFLIX.desktop} url={NETFLIX.url} domainName={NETFLIX.domain} />
        </div>
        <div className="w-[17%]">
          <MockupFrame type="iphone" fill screenshotBase64={NETFLIX.mobile} url={NETFLIX.url} domainName={NETFLIX.domain} />
        </div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <span className="rounded-md bg-pms-accent px-4 py-2.5 text-[15px] font-semibold">Télécharger en 4K</span>
        <span className="rounded-md bg-white/10 px-4 py-2.5 text-[15px] font-semibold">Lien pour le client</span>
      </div>
    </div>
  );
}

export function Journey() {
  const listRef = useRef<HTMLOListElement>(null);
  const [progress, setProgress] = useState(0); // 0 → 1 : remplissage de la ligne
  const [reached, setReached] = useState(-1); // dernière étape atteinte

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = list.getBoundingClientRect();
      const mark = window.innerHeight * 0.6; // la ligne avance quand le milieu bas de l'écran passe
      const p = Math.min(1, Math.max(0, (mark - rect.top) / rect.height));
      setProgress(p);
      const items = Array.from(list.querySelectorAll<HTMLElement>('[data-step]'));
      let last = -1;
      items.forEach((el, i) => {
        if (el.getBoundingClientRect().top + 40 < mark) last = i;
      });
      setReached(last);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <ol ref={listRef} className="journey relative mt-12 flex flex-col gap-16 lg:gap-24">
      {/* La ligne de progression : à gauche sur téléphone, au centre sur ordinateur */}
      <span aria-hidden className="absolute top-0 bottom-0 left-[21px] lg:left-1/2 w-[2px] -translate-x-1/2 bg-pms-line" />
      <span
        aria-hidden
        className="absolute top-0 left-[21px] lg:left-1/2 w-[2px] -translate-x-1/2 bg-pms-accent origin-top"
        style={{ height: '100%', transform: `translateX(-50%) scaleY(${progress})` }}
      />

      {STEPS.map((s, i) => {
        const on = i <= reached;
        const imageFirst = i % 2 === 0; // étapes 1 et 3 : image à gauche ; 2 et 4 : image à droite
        return (
          <li
            key={s.t}
            data-step
            className="relative grid grid-cols-[44px_1fr] gap-x-5 gap-y-6 lg:grid-cols-[1fr_56px_1fr] lg:gap-x-10 lg:items-center"
          >
            {/* Numéro posé sur la ligne */}
            <span
              className={`row-span-2 lg:row-span-1 lg:col-start-2 lg:row-start-1 self-start lg:self-center relative z-10 flex items-center justify-center w-11 h-11 lg:w-14 lg:h-14 rounded-full text-[17px] lg:text-[20px] font-semibold tabular-nums transition-colors duration-500 ${
                on ? 'bg-pms-accent text-white' : 'bg-pms-paper text-pms-muted border-2 border-pms-line'
              }`}
            >
              {i + 1}
            </span>

            <div className={`lg:row-start-1 ${imageFirst ? 'lg:col-start-3' : 'lg:col-start-1 lg:text-right lg:justify-self-end'}`}>
              <p className={`text-[15px] font-semibold transition-colors duration-500 ${on ? 'text-pms-accent' : 'text-pms-muted'}`}>{s.value}</p>
              <p className="mt-2 text-[clamp(1.25rem,1.1rem+0.6vw,1.5rem)] leading-snug">{s.t}</p>
              <p className={`mt-3 text-[17px] leading-relaxed text-pms-muted max-w-[36ch] ${imageFirst ? '' : 'lg:ml-auto'}`}>{s.d}</p>
            </div>

            <div
              className={`col-start-2 lg:row-start-1 ${imageFirst ? 'lg:col-start-1' : 'lg:col-start-3'} journey-shot ${on ? 'is-on' : ''}`}
              data-ui
            >
              <StepVisual step={i} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
