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

export interface PitchResult {
  linkedInPost?: string;
  clientProposalPitch?: string;
  caseStudy?: { challenge: string; solution: string; impact: string };
  socialHooks?: string[];
  sections?: { titre: string; contenu: string }[];
}

export function buildPitchPrompt(p: PitchInput): string {
  const stackList = p.techStack.length > 0 ? p.techStack.join(', ') : 'Next.js, React, Tailwind CSS, TypeScript';
  const n = p.sectionCount;
  return `
Tu es un Directeur Artistique et un Copywriter d'élite spécialisé dans l'aide aux développeurs web et créateurs tech pour VENDRE leurs services et projets à forte valeur ajoutée.

Voici les détails du projet réalisé :
- Nom du projet : "${p.projectTitle}"
- URL / Démo : "${p.projectUrl || 'Projet interne / confidentiel'}"
- Description du créateur : "${p.projectDescription || 'Application web moderne avec expérience utilisateur fluide et design haute précision'}"
- Technologies utilisées : ${stackList}
- Cible visée : ${p.targetAudience}

${
  n > 0
    ? `Tu reçois aussi ${n} capture(s) du site, découpée(s) section par section, de haut en bas.
Lis-les attentivement : nom de l'entreprise, activité, produits ou services, offres, prix affichés, ton, couleurs, public visé.
Appuie-toi d'abord sur ce que montrent réellement ces captures ; la description du créateur ne fait que compléter.
`
    : ''
}
Génère les livrables de vente au format JSON strict :
1. "linkedInPost" : Un post LinkedIn viral ultra captivant (accroche percutante qui attire l'attention des décideurs, narration du problème résolu, démonstration de la valeur et de l'architecture tech sans jargon excessif, appel à l'action clair pour attirer des clients en messages privés).
2. "clientProposalPitch" : Un texte de proposition commerciale (pour Upwork, Malt, ou email de prospection directe) montrant comment ce projet prouve que le développeur est capable de résoudre le problème business d'un prospect et justifier un devis premium.
3. "caseStudy" : Une fiche étude de cas concise (Défi initial, Solution technique mise en place, Bénéfice / ROI pour l'utilisateur final).
4. "socialHooks" : 3 accroches courtes (Twitter / X / Threads) pour susciter l'envie et faire cliquer sur le lien du mockup.
${
  n > 0
    ? `0. "sections" : pour chaque capture, dans l'ordre, un objet { "titre": nom court de la section (ex. « En-tête », « Produits phares », « Contact »), "contenu": une phrase sur ce qu'elle montre réellement }.
`
    : ''
}
Règles absolues :
- N'invente AUCUN chiffre, pourcentage, statistique, nom de client, témoignage ou résultat mesuré qui ne figure pas dans les informations ci-dessus ou sur les captures. Décris la valeur avec des mots, sans données inventées.
- Écris en français, avec un ton professionnel et chaleureux.

Réponds EXCLUSIVEMENT avec cet objet JSON :
{
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
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    return JSON.parse(start >= 0 && end > start ? cleaned.slice(start, end + 1) : cleaned);
  }
}
