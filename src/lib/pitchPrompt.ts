/**
 * Consigne de la Pitch IA, partagée par le serveur et par le navigateur
 * (quand le client utilise sa propre clé Gemini ou Claude).
 */
export interface PitchInput {
  projectTitle: string;
  projectUrl: string;
  projectDescription: string;
  targetAudience: string;
  techStack: string[];
  sectionCount: number;
}

export interface HormoziOffer {
  offerName: string;
  dreamOutcome: string;
  guarantee: string;
  bonuses: string[];
  pitchLine: string;
}

export interface MonetizationOpportunity {
  opportunity: string;
  type: string;
  revenuePotential: string;
  effort: string;
  whyItWorks: string;
}

export interface MonetizationAudit {
  audienceIntent: string;
  opportunities: MonetizationOpportunity[];
  quickWin30Days: string;
  monetizationGaps: string[];
}

export interface ColdOutreachEmail {
  subject: string;
  body: string;
  callToAction: string;
}

export interface PitchResult {
  linkedInPost?: string;
  clientProposalPitch?: string;
  caseStudy?: { challenge: string; solution: string; impact: string };
  socialHooks?: string[];
  sections?: { titre: string; contenu: string }[];
  hormoziOffer?: HormoziOffer;
  primaryProblem?: string;
  primarySolution?: string;
  monetizationAudit?: MonetizationAudit;
  coldOutreachEmail?: ColdOutreachEmail;
}

export function buildPitchPrompt(p: PitchInput): string {
  const stackList = p.techStack.length > 0 ? p.techStack.join(', ') : 'Next.js, React, Tailwind CSS, TypeScript';
  const n = p.sectionCount;

  return `
# IDENTITY and PURPOSE

Tu es un Directeur Artistique, un Stratège d'Offres Commerciales d'élite et un Expert en Prospection B2B, inspiré par les patterns de Daniel Miessler (Fabric) et la méthodologie "$100M Offers" d'Alex Hormozi.
Ton objectif est de transformer les réalisations web d'un créateur, freelance ou d'une agence en offres irrésistibles ("Grand Slam Offers"), en audits de rentabilité percutants et en livrables d'acquisition commerciale ultra-performants qui permettent de signer des clients à prix premium.

# INPUT DETAILS

- Nom du projet : "${p.projectTitle}"
- URL / Démo : "${p.projectUrl || 'Projet interne / confidentiel'}"
- Description du créateur : "${p.projectDescription || 'Application web moderne avec expérience utilisateur fluide et design haute précision'}"
- Technologies utilisées : ${stackList}
- Cible visée : ${p.targetAudience}

${
  n > 0
    ? `# VISUAL EVIDENCE (CAPTURES D'ÉCRAN FOURNIES)
Tu reçois ${n} capture(s) d'écran du site découpées section par section (de haut en bas).
Analyse-les avec acuité : nom de marque, messages clés, promesse, tarifs affichés, qualité UX/UI, ton, public cible.
Appuie-toi en priorité sur ce que révèlent ces captures réelles.`
    : ''
}

# GOALS and METHODOLOGY

1. Extraire avec précision chirurgicale :
   - "primaryProblem" : Le problème majeur et douloureux que ce produit/service résout pour son marché cible (max 20 mots, direct, sans détour).
   - "primarySolution" : Comment cette réalisation technique résout ce problème de façon concrète (max 25 mots).

2. Créer une "Grand Slam Offer" (selon Alex Hormozi) dans "hormoziOffer" :
   - "offerName" : Un nom d'offre magnétique utilisant la formule MAGIC (Avatar + Objectif + Intervalle de temps ou Clé en main). Ex: "Pack Landing Page Haute Conversion 10 Jours Clé en Main".
   - "dreamOutcome" : Le résultat rêvé pour le prospect final (accroissement de crédibilité, conversion, gain de temps, clarté).
   - "guarantee" : Une inversion du risque claire et rassurante (ex: "Ajustements illimités jusqu'à validation complète", "Livraison sous 14 jours garantie ou audit technique offert").
   - "bonuses" : 3 à 4 bonus concrets à forte valeur perçue et coût marginal faible pour le développeur (ex: "Audit performance & SEO express inclus", "Guide vidéo Loom de prise en main", "30 jours de support technique post-lancement").
   - "pitchLine" : Une phrase d'attaque percutante prête à envoyer par message direct (WhatsApp, LinkedIn DM ou email) pour décrocher un appel commercial.

3. Réaliser un "Audit de Monétisation & Opportunités Inexploitées" ("monetizationAudit", inspiré du pattern analyze_monetization_opportunities de Fabric) :
   - "audienceIntent" : 1 phrase résumant la maturité et l'intention d'achat des visiteurs du site.
   - "opportunities" : 3 opportunités concrètes et réalistes de monétisation ou d'optimisation de revenus (chacune avec "opportunity", "type" [ex: Upsell, Abonnement, Lead Magnet, Refonte UX, Preuve sociale], "revenuePotential" [Élevé / Récurrent / Immédiat], "effort" [Faible / Moyen], "whyItWorks").
   - "quickWin30Days" : L'action unique la plus rapide et rentable que le propriétaire du site devrait appliquer d'ici 30 jours pour générer plus de ventes ou de leads.
   - "monetizationGaps" : 2 à 3 points faibles actuels du site qui font fuir des prospects ou laissent de l'argent sur la table (manque de clarté de l'offre, friction au panier, absence d'appel à l'action au-dessus de la ligne de flottaison, etc.).

4. Rédiger un "Email de Prospection Froide" ultra-personnalisé ("coldOutreachEmail", inspiré des patterns create_formal_email et improve_writing de Fabric) :
   - "subject" : Un objet d'email court, intrigueur et sans spam (max 7 mots), incitant à l'ouverture immédiate.
   - "body" : Corps de l'email direct, professionnel et respectueux (120-180 mots). Le freelance explique qu'il a analysé le site du prospect, a créé une maquette 3D interactive (mentionnée en pièce jointe) et identifié un axe majeur d'amélioration.
   - "callToAction" : Une question de clôture sans pression demandant si un échange de 10 minutes la semaine prochaine serait opportun.

5. Rédiger les livrables d'acquisition sociale :
   - "linkedInPost" : Un post viral structuré (accroche coup de poing anti-scroll, narration du problème résolu, démonstration de la valeur et de l'architecture sans jargon inaccessible, appel à l'action clair).
   - "clientProposalPitch" : Une proposition commerciale d'élite (pour Upwork, Malt ou devis direct) démontrant l'expertise et justifiant un devis premium.
   - "caseStudy" : Une fiche étude de cas ultra claire avec "challenge", "solution" et "impact".
   - "socialHooks" : 3 accroches courtes et piquantes (Twitter / X / Threads) incitant à cliquer pour voir le mockup.
${
  n > 0
    ? `   - "sections" : pour chaque capture dans l'ordre, un objet { "titre": "nom de section", "contenu": "ce qu'elle montre réellement" }.`
    : ''
}

# CONSTRAINTS & RULES

- RÈGLE ABSOLUE : N'invente AUCUN chiffre inventé, fausse statistique ou faux témoignage qui ne soit pas prouvé par les captures ou la description. Décris la valeur par les bénéfices réels.
- Ne cite jamais Alex Hormozi, Daniel Miessler, Fabric, "Grand Slam Offer" ni "$100M Offers" dans les textes produits : ce sont des méthodes internes, pas des arguments pour le client.
- Langue : Français soigné, dynamique, professionnel et orienté conversion.
- Réponds EXCLUSIVEMENT avec un objet JSON valide conforme à la structure ci-dessous, sans texte avant ou après.

# OUTPUT JSON FORMAT

{
  "primaryProblem": "string",
  "primarySolution": "string",
  "hormoziOffer": {
    "offerName": "string",
    "dreamOutcome": "string",
    "guarantee": "string",
    "bonuses": ["string", "string", "string"],
    "pitchLine": "string"
  },
  "monetizationAudit": {
    "audienceIntent": "string",
    "opportunities": [
      {
        "opportunity": "string",
        "type": "string",
        "revenuePotential": "string",
        "effort": "string",
        "whyItWorks": "string"
      }
    ],
    "quickWin30Days": "string",
    "monetizationGaps": ["string", "string"]
  },
  "coldOutreachEmail": {
    "subject": "string",
    "body": "string",
    "callToAction": "string"
  },
  "linkedInPost": "string",
  "clientProposalPitch": "string",
  "caseStudy": {
    "challenge": "string",
    "solution": "string",
    "impact": "string"
  },
  "socialHooks": ["string", "string", "string"]${n > 0 ? ',\n  "sections": [{ "titre": "string", "contenu": "string" }]' : ''}
}
`;
}

/** Lit l'objet JSON renvoyé par l'IA, même entouré de ```json … ``` ou d'une phrase */
export function parseJsonReply(text: string): PitchResult {
  try {
    return JSON.parse(text);
  } catch {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch (innerErr) {
        console.warn('[parseJsonReply] Erreur de parsing JSON extrait:', innerErr);
      }
    }
    return JSON.parse(cleaned);
  }
}

