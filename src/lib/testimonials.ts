/**
 * Avis de VRAIS clients, affichés sur l'accueil (section « Ils l'utilisent »).
 * Tant que la liste est vide, la section n'apparaît pas : on n'invente jamais d'avis.
 *
 * Pour ajouter un avis : demander l'accord écrit du client, puis ajouter un objet ici.
 * `visual` (facultatif) : un visuel qu'il a créé avec PitchMySite, déposé dans public/images/clients/.
 */
export interface Testimonial {
  name: string; // Prénom et nom, tels que le client accepte de les montrer
  role: string; // ex. « Freelance web, Cotonou »
  quote: string; // Ses mots, sans les réécrire
  visual?: string; // ex. '/images/clients/aminata.jpg'
  site?: string; // ex. 'https://son-site.com'
}

export const TESTIMONIALS: Testimonial[] = [];
