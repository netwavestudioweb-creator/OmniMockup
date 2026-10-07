import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      projectTitle = 'Mon Application Web',
      projectUrl = '',
      projectDescription = '',
      techStack = [],
      targetAudience = 'Clients freelances & Entreprises',
    } = body;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Clé API Gemini non configurée (GEMINI_API_KEY).",
        },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
      },
    });

    const stackList = Array.isArray(techStack) && techStack.length > 0 ? techStack.join(', ') : 'Next.js, React, Tailwind CSS, TypeScript';

    const prompt = `
Tu es un Directeur Artistique et un Copywriter d'élite spécialisé dans l'aide aux développeurs web et créateurs tech pour VENDRE leurs services et projets à forte valeur ajoutée.

Voici les détails du projet réalisé :
- Nom du projet : "${projectTitle}"
- URL / Démo : "${projectUrl || 'Projet interne / confidentiel'}"
- Description du créateur : "${projectDescription || 'Application web moderne avec expérience utilisateur fluide et design haute précision'}"
- Technologies utilisées : ${stackList}
- Cible visée : ${targetAudience}

Génère 3 livrables de vente irrésistibles au format JSON strict :
1. "linkedInPost" : Un post LinkedIn viral ultra captivant (accroche percutante qui attire l'attention des décideurs, narration du problème résolu, démonstration de la valeur et de l'architecture tech sans jargon excessif, appel à l'action clair pour attirer des clients en messages privés).
2. "clientProposalPitch" : Un texte de proposition commerciale (pour Upwork, Malt, ou email de prospection directe) montrant comment ce projet prouve que le développeur est capable de résoudre le problème business d'un prospect et justifier un devis premium.
3. "caseStudy" : Une fiche étude de cas concise (Défi initial, Solution technique mise en place, Bénéfice / ROI pour l'utilisateur final).
4. "socialHooks" : 3 accroches courtes (Twitter / X / Threads) pour susciter l'envie et faire cliquer sur le lien du mockup.

Réponds EXCLUSIVEMENT avec cet objet JSON :
{
  "linkedInPost": "string",
  "clientProposalPitch": "string",
  "caseStudy": {
    "challenge": "string",
    "solution": "string",
    "impact": "string"
  },
  "socialHooks": ["string", "string", "string"]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch {
      // Nettoyage markdown json au cas où
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
    });
  } catch (error: unknown) {
    console.error('Erreur API Generate Pitch:', error);
    const message = error instanceof Error ? error.message : 'Erreur lors de la génération du pitch avec Gemini.';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}
