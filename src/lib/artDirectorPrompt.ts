/**
 * Consigne du directeur artistique IA, partagée par le serveur (clé du site) et le navigateur (clé du client).
 * L'IA reçoit la capture de la page entière et la liste des sections repérées, et rend une note par section.
 */
export interface ArtDirectorCandidate {
  id: string;
  coordinates: { x: number; y: number; width: number; height: number };
  [key: string]: unknown;
}

export interface ArtDirectorSection {
  id?: string;
  label?: string;
  description?: string;
  visualAnalysis?: string;
  verdict?: 'excellent' | 'bon' | 'moyen' | 'faible';
  justification?: string;
  marketingScore?: number;
  qualityScore?: number;
}

export interface ArtDirectorReply {
  sections?: ArtDirectorSection[];
  recommendations?: { mobile?: string[]; desktop?: string[]; social?: string[] };
}

export function buildArtDirectorPrompt(candidates: unknown[]): string {
  return `Tu es un Directeur Artistique Senior et Expert en Conversion Marketing Web & Mockups Publicitaires de niveau mondial.
Voici la capture visuelle complète d'une page web ainsi que la liste des coordonnées DOM des sections détectées par analyse multi-signaux :
${JSON.stringify(candidates, null, 2)}

Effectue un RAISONNEMENT EN 2 TEMPS pour chaque section :
TEMPS 1 - ÉVALUATION VISUELLE & GRAPHIQUE :
- Observe la composition, le contraste, la typographie, la clarté de l'interface ou des éléments graphiques.
- Évalue si la section se démarque immédiatement dans un cadre d'ordinateur ou de smartphone (mockup).

TEMPS 2 - DÉCISION MARKETING & JUSTIFICATION CONCRÈTE :
- Attribue un verdict franc et justifié ("excellent" | "bon" | "moyen" | "faible").
- Rédige une JUSTIFICATION CONCRÈTE OBLIGATOIRE (pas de réponse vague ou générique) expliquant pourquoi cette section mérite ou non d'être mise en valeur dans un portfolio, une publicité ou une présentation client.

EXEMPLES FEW-SHOT :
Exemple 1 (Hero) :
- label: "Hero & Proposition de Valeur Principale"
- visualAnalysis: "Titre percutant en grand corps avec fort contraste, badge coloré et aperçu complet de l'interface logicielle."
- verdict: "excellent"
- justification: "Forte accroche visuelle avec le produit en vedette et un bouton d'action net, idéal pour capter l'attention dans un mockup vitrine."
- marketingScore: 96
- qualityScore: 94

Exemple 2 (Grille de fonctionnalités) :
- label: "Grille de Fonctionnalités Clés"
- visualAnalysis: "Mise en page modulaire en 3 colonnes avec icônes distinctes et captures de micro-interactions."
- verdict: "bon"
- justification: "Excellente lisibilité des bénéfices produit, composition équilibrée pour un mockup au format paysage."
- marketingScore: 82
- qualityScore: 86

Exemple 3 (Footer / Pied de page) :
- label: "Pied de page & Liens Légaux"
- visualAnalysis: "Colonnes de liens textuels compactes sur fond neutre sans élément graphique saillant."
- verdict: "faible"
- justification: "Contenu purement utilitaire et textuel, sans impact émotionnel ou commercial suffisant pour un mockup marketing."
- marketingScore: 35
- qualityScore: 68

RECOMMANDATIONS PAR FORMAT :
Sélectionne les meilleures sections pour :
- "mobile" (2 à 3 sections à fort impact vertical : ex Hero, Chiffres clés, Témoignage phare)
- "desktop" (2 à 4 sections larges : ex Hero, Grille de features, Tarifs)
- "social" (1 à 2 sections ultra-visuelles au format carré 1:1)

Réponds STRICTEMENT au format JSON avec ce schéma :
{
  "sections": [
    {
      "id": "sec-1",
      "label": "Hero & Proposition de Valeur Principale",
      "visualAnalysis": "...",
      "verdict": "excellent",
      "justification": "...",
      "marketingScore": 95,
      "qualityScore": 92
    }
  ],
  "recommendations": {
    "mobile": ["sec-1"],
    "desktop": ["sec-1", "sec-2"],
    "social": ["sec-1"]
  }
}`;
}
