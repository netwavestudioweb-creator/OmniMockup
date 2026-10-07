'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Loader2,
  TrendingUp,
  Briefcase,
  Share2,
  Award,
} from 'lucide-react';
import { AVAILABLE_TECHS } from './TechStackPicker';

interface DeveloperSalesKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectTitle?: string;
  defaultProjectUrl?: string;
  selectedTechIds?: string[];
}

export const DeveloperSalesKitModal: React.FC<DeveloperSalesKitModalProps> = ({
  isOpen,
  onClose,
  defaultProjectTitle = 'Mon Application Web',
  defaultProjectUrl = '',
  selectedTechIds = [],
}) => {
  const [projectTitle, setProjectTitle] = useState(defaultProjectTitle);
  const [projectUrl] = useState(defaultProjectUrl);
  const [projectDescription, setProjectDescription] = useState(
    'Application SaaS moderne conçue pour simplifier la vie des utilisateurs et booster les conversions.'
  );
  const [targetAudience, setTargetAudience] = useState('Clients freelances, Startups & PME');

  const [isLoading, setIsLoading] = useState(false);
  const [salesData, setSalesData] = useState<{
    linkedInPost?: string;
    clientProposalPitch?: string;
    caseStudy?: { challenge: string; solution: string; impact: string };
    socialHooks?: string[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'linkedin' | 'proposal' | 'casestudy' | 'twitter'>('linkedin');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const techNames = selectedTechIds
        .map((id) => AVAILABLE_TECHS.find((t) => t.id === id)?.name)
        .filter(Boolean);

      const res = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle,
          projectUrl,
          projectDescription,
          techStack: techNames,
          targetAudience,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setSalesData(json.data);
      }
    } catch (err) {
      console.error('Erreur génération pitch:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-sand-300 relative flex flex-col max-h-[90vh] overflow-hidden">
        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-sand-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-violet-500/30">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200">
                Assistant Vente & Freelance IA
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-stone-900 mt-0.5">
              Générateur d&apos;Arguments Commerciaux & Posts
            </h3>
            <p className="text-xs text-stone-500">
              Transformez cette réalisation en clients payants et opportunités professionnelles.
            </p>
          </div>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {!salesData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Nom du projet :
                  </label>
                  <input
                    type="text"
                    value={projectTitle}
                    onChange={(e) => setProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:border-violet-500"
                    placeholder="Ex: OmniMockup SaaS"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    Cible / Marché :
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 focus:outline-none focus:border-violet-500"
                    placeholder="Ex: Startups, PME, Agences"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  En quoi cette réalisation apporte de la valeur ? (Description courte) :
                </label>
                <textarea
                  rows={3}
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-sand-300 text-xs focus:outline-none focus:border-violet-500"
                  placeholder="Décrivez le problème que résout votre projet pour les utilisateurs ou l'entreprise..."
                />
              </div>

              <div className="p-3.5 rounded-2xl bg-sand-50 border border-sand-200 text-xs text-stone-600 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <span>
                  L&apos;IA Gemini va rédiger un post LinkedIn captivant pour trouver des clients, une proposition commerciale pour remporter des missions freelances (Upwork, Malt), et une étude de cas valorisant votre savoir-faire technique.
                </span>
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Rédaction de vos arguments de vente...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Générer mes Textes de Vente en 1 Clic</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Onglets des livrables */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-sand-100 border border-sand-200 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveTab('linkedin')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'linkedin'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Share2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>Post LinkedIn</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('proposal')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'proposal'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pitch Devis / Email</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('casestudy')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'casestudy'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-violet-600" />
                  <span>Étude de Cas</span>
                </button>
              </div>

              {/* Contenu onglet LinkedIn */}
              {activeTab === 'linkedin' && salesData.linkedInPost && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">Post prêt à publier :</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(salesData.linkedInPost!, 'linkedin')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-all"
                    >
                      {copiedKey === 'linkedin' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copié dans le presse-papier !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier pour LinkedIn</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-sand-50 border border-sand-200 text-xs text-stone-800 font-sans leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
                    {salesData.linkedInPost}
                  </div>
                </div>
              )}

              {/* Contenu onglet Pitch Devis */}
              {activeTab === 'proposal' && salesData.clientProposalPitch && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">Proposition commerciale pour prospect :</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(salesData.clientProposalPitch!, 'proposal')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-all"
                    >
                      {copiedKey === 'proposal' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier la proposition</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-sand-50 border border-sand-200 text-xs text-stone-800 font-sans leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
                    {salesData.clientProposalPitch}
                  </div>
                </div>
              )}

              {/* Contenu onglet Étude de cas */}
              {activeTab === 'casestudy' && salesData.caseStudy && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-stone-700">Structure d&apos;étude de cas portfolio :</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          `Défi : ${salesData.caseStudy?.challenge}\n\nSolution : ${salesData.caseStudy?.solution}\n\nImpact : ${salesData.caseStudy?.impact}`,
                          'casestudy'
                        )
                      }
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-all"
                    >
                      {copiedKey === 'casestudy' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier l&apos;étude de cas</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-red-50/60 border border-red-200/60">
                      <p className="font-bold text-red-900">1. Défi / Problème résolu :</p>
                      <p className="text-stone-700 mt-1">{salesData.caseStudy.challenge}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/60">
                      <p className="font-bold text-blue-900">2. Solution technique mise en œuvre :</p>
                      <p className="text-stone-700 mt-1">{salesData.caseStudy.solution}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                      <p className="font-bold text-emerald-900">3. Impact business & Résultat :</p>
                      <p className="text-stone-700 mt-1">{salesData.caseStudy.impact}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between border-t border-sand-200">
                <button
                  type="button"
                  onClick={() => setSalesData(null)}
                  className="text-xs text-stone-500 hover:text-stone-800 underline"
                >
                  ← Modifier les paramètres et régénérer
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-sand-200 hover:bg-sand-300 text-stone-800 font-bold text-xs"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
