/**
 * Test de l'accroche de la page d'accueil : chaque visiteur voit toujours la même version
 * (gardée sur son appareil), tirée au hasard la première fois.
 * - « court » : « Votre site. Prêt à signer. »
 * - « long »  : « Collez le lien de votre site. Recevez des visuels qui donnent envie de signer. »
 * Le choix est fait par un petit script en tête de page, avant l'affichage : pas de clignotement.
 * Résultats : tableau de bord administrateur, onglet Résumé.
 */
export type HeroVariant = 'court' | 'long';

export const HERO_SCRIPT = `try{var k='pms_hero',v=localStorage.getItem(k);if(v!=='court'&&v!=='long'){v=Math.random()<0.5?'court':'long';localStorage.setItem(k,v)}document.documentElement.setAttribute('data-hero',v)}catch(e){document.documentElement.setAttribute('data-hero','long')}`;

/** Version vue par ce visiteur (côté navigateur seulement) */
export function getHeroVariant(): HeroVariant {
  if (typeof document === 'undefined') return 'long';
  return document.documentElement.getAttribute('data-hero') === 'court' ? 'court' : 'long';
}
