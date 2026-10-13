'use client';

import React, { useEffect, useState } from 'react';
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
  KeyRound,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { AVAILABLE_TECHS } from './TechStackPicker';
import { sliceIntoSections } from '@/lib/pageSections';
import {
  ByokError,
  PROVIDER_INFO,
  forgetAi,
  generatePitchWithOwnKey,
  getSavedAi,
  looksLikeKey,
  saveAi,
  type AiProvider,
} from '@/lib/byokPitch';
import { trackEvent } from '@/lib/tracking';

interface DeveloperSalesKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultProjectTitle?: string;
  defaultProjectUrl?: string;
  selectedTechIds?: string[];
  /** Session de démonstration en développement local */
  demo?: boolean;
  /** Capture pleine page du site : l'IA la lit section par section */
  screenshot?: string;
}

type PitchNotice =
  | { kind: 'error' | 'login'; text: string }
  | { kind: 'credits'; text: string; cost: number; balance: number }
  | { kind: 'upsell'; text: string };

export const DeveloperSalesKitModal: React.FC<DeveloperSalesKitModalProps> = ({
  isOpen,
  onClose,
  defaultProjectTitle = 'Mon Application Web',
  defaultProjectUrl = '',
  selectedTechIds = [],
  demo = false,
  screenshot = '',
}) => {
  const [notice, setNotice] = useState<PitchNotice | null>(null);
  const [projectTitle, setProjectTitle] = useState(defaultProjectTitle);
  const [projectUrl] = useState(defaultProjectUrl);
  // Vides par défaut : l'IA lit le site lui-même, ces champs servent seulement à préciser
  const [projectDescription, setProjectDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [loadingStep, setLoadingStep] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [salesData, setSalesData] = useState<{
    linkedInPost?: string;
    clientProposalPitch?: string;
    caseStudy?: { challenge: string; solution: string; impact: string };
    socialHooks?: string[];
    sections?: { titre: string; contenu: string }[];
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'linkedin' | 'proposal' | 'casestudy' | 'twitter' | 'sections'>('linkedin');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // IA du client : sa propre clé Gemini ou Claude, gardée dans son navigateur seulement
  const [ai, setAi] = useState<{ provider: AiProvider; key: string } | null>(null);
  const [showAiSetup, setShowAiSetup] = useState(false);
  const [setupProvider, setSetupProvider] = useState<AiProvider>('gemini');
  const [setupKey, setSetupKey] = useState('');
  const [setupError, setSetupError] = useState('');
  useEffect(() => {
    if (!isOpen) return;
    const saved = getSavedAi();
    setAi(saved);
    if (saved) setSetupProvider(saved.provider);
  }, [isOpen]);

  if (!isOpen) return null;

  const saveOwnKey = () => {
    if (!looksLikeKey(setupProvider, setupKey)) {
      setSetupError(
        setupProvider === 'claude'
          ? 'Cette clé ne ressemble pas à une clé Claude (elle commence par « sk-ant- »).'
          : 'Cette clé ne ressemble pas à une clé Gemini. Copiez-la en entier depuis Google AI Studio.'
      );
      return;
    }
    saveAi(setupProvider, setupKey);
    setAi({ provider: setupProvider, key: setupKey.trim() });
    setSetupKey('');
    setSetupError('');
    setShowAiSetup(false);
    setNotice(null);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleGenerate = async (useCredits = false) => {
    setIsLoading(true);
    setNotice(null);
    try {
      const techNames = selectedTechIds
        .map((id) => AVAILABLE_TECHS.find((t) => t.id === id)?.name)
        .filter(Boolean);

      // Le site est découpé en sections (de haut en bas) pour que l'IA lise son vrai contenu
      setLoadingStep('Lecture du site, section par section…');
      const sections = screenshot ? await sliceIntoSections(screenshot).catch(() => []) : [];
      setLoadingStep('Rédaction de vos textes de vente…');

      // 1. Clé du client : l'appel part directement de son navigateur vers Google ou Anthropic
      if (ai) {
        try {
          const data = await generatePitchWithOwnKey(
            ai.provider,
            ai.key,
            { projectTitle, projectUrl, projectDescription, targetAudience: targetAudience || 'Clients freelances & Entreprises', techStack: techNames as string[] },
            sections
          );
          setSalesData(data);
          trackEvent('pitch_byok', { provider: ai.provider, ok: true, sections: sections.length });
        } catch (err) {
          const e = err instanceof ByokError ? err : new ByokError('L’IA n’a pas pu répondre. Réessayez dans un instant.', 'other');
          trackEvent('pitch_byok', { provider: ai.provider, ok: false, kind: e.kind });
          setNotice({ kind: 'error', text: e.message });
          if (e.kind === 'invalid_key') {
            setSetupProvider(ai.provider);
            setShowAiSetup(true);
          }
        }
        return;
      }

      // 2. Sans clé du client : IA du site, si elle est configurée
      const res = await fetch('/api/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectTitle,
          projectUrl,
          projectDescription,
          techStack: techNames,
          targetAudience: targetAudience || undefined,
          useCredits,
          demo,
          sections,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.status === 503) {
        // Pas d'IA sur le serveur : le client connecte la sienne
        setShowAiSetup(true);
        setNotice({ kind: 'error', text: 'Connectez votre IA (Gemini ou Claude) pour générer vos textes.' });
      } else if (json.success && json.data) {
        setSalesData(json.data);
      } else if (json.reason === 'login_required') {
        setNotice({ kind: 'login', text: 'Connectez-vous pour utiliser le Pitch IA.' });
      } else if (json.reason === 'not_included' || json.reason === 'quota_reached') {
        const intro =
          json.reason === 'quota_reached'
            ? `Vos ${json.limit} Pitch IA du mois sont utilisés.`
            : 'Le Pitch IA est inclus dans les forfaits Pro (5 par mois) et Agence (illimité).';
        if ((json.balance ?? 0) >= (json.cost ?? 2)) {
          setNotice({ kind: 'credits', text: intro, cost: json.cost ?? 2, balance: json.balance ?? 0 });
        } else {
          setNotice({ kind: 'upsell', text: `${intro} Sinon, chaque génération coûte ${json.cost ?? 2} crédits.` });
        }
      } else {
        setNotice({ kind: 'error', text: json.error || "L'IA n'a pas pu générer le texte. Réessayez dans un instant." });
      }
    } catch (err) {
      console.error('Erreur génération pitch:', err);
      setNotice({ kind: 'error', text: 'Connexion impossible. Vérifiez votre connexion internet et réessayez.' });
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
                    placeholder="Ex: PitchMySite SaaS"
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
                    placeholder="Facultatif : ex. boutiques, restaurants, PME"
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
                  placeholder="Facultatif : ce que le site apporte au client, le problème résolu…"
                />
              </div>

              {/* IA du client */}
              {ai && !showAiSetup ? (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-emerald-600" />
                    IA connectée : <strong>{PROVIDER_INFO[ai.provider].label}</strong> (votre clé)
                  </span>
                  <button type="button" onClick={() => setShowAiSetup(true)} className="font-bold underline">
                    Changer
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-violet-50/70 border border-violet-200 space-y-3 text-xs">
                  <p className="font-bold text-stone-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-violet-600" /> Connectez votre IA
                  </p>
                  <p className="text-stone-600 leading-relaxed">
                    Le Pitch IA utilise <strong>votre propre clé</strong> Gemini ou Claude. Elle reste dans votre navigateur :
                    elle n&apos;est jamais envoyée à PitchMySite, et c&apos;est Google ou Anthropic qui vous facture directement.
                  </p>
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white border border-sand-200">
                    {(['gemini', 'claude'] as AiProvider[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setSetupProvider(p);
                          setSetupError('');
                        }}
                        aria-pressed={setupProvider === p}
                        className={`py-2 rounded-lg font-bold transition-colors ${setupProvider === p ? 'bg-violet-600 text-white' : 'text-stone-600 hover:text-stone-900'}`}
                      >
                        {PROVIDER_INFO[p].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-stone-500">{PROVIDER_INFO[setupProvider].hint}</p>
                  <a
                    href={PROVIDER_INFO[setupProvider].getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-bold text-violet-700 underline"
                  >
                    Obtenir ma clé {setupProvider === 'claude' ? 'Claude' : 'Gemini'} <ExternalLink className="w-3 h-3" />
                  </a>
                  <input
                    type="password"
                    autoComplete="off"
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    placeholder={setupProvider === 'claude' ? 'sk-ant-…' : 'Collez votre clé Gemini'}
                    aria-label={`Clé ${PROVIDER_INFO[setupProvider].label}`}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 bg-white focus:outline-none focus:border-violet-500"
                  />
                  {setupError && <p role="alert" className="text-rose-700">{setupError}</p>}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={saveOwnKey} disabled={!setupKey.trim()} className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold disabled:opacity-50">
                      Enregistrer sur cet appareil
                    </button>
                    {ai && (
                      <>
                        <button type="button" onClick={() => setShowAiSetup(false)} className="px-3 py-2 rounded-xl text-stone-600 hover:text-stone-900 font-semibold">
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            forgetAi();
                            setAi(null);
                          }}
                          className="px-3 py-2 rounded-xl text-rose-700 hover:text-rose-800 font-semibold"
                        >
                          Oublier ma clé
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-sand-50 border border-sand-200 text-xs text-stone-600 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                <span>
                  {screenshot
                    ? 'L’IA lit votre site section par section, puis rédige un post LinkedIn, une proposition commerciale et une étude de cas fidèles à ce qu’elle a vu. Les champs ci-dessus sont facultatifs.'
                    : 'L’IA rédige un post LinkedIn, une proposition commerciale et une étude de cas à partir de vos informations.'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleGenerate(false)}
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-xl shadow-violet-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{loadingStep || 'Rédaction de vos textes de vente…'}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Générer mes Textes de Vente en 1 Clic</span>
                  </>
                )}
              </button>

              {notice && (
                <div
                  role="alert"
                  className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2.5 ${
                    notice.kind === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-violet-50 border-violet-200 text-violet-900'
                  }`}
                >
                  <p>{notice.text}</p>
                  {notice.kind === 'credits' && (
                    <button
                      type="button"
                      onClick={() => handleGenerate(true)}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold disabled:opacity-60"
                    >
                      Utiliser {notice.cost} crédits (solde : {notice.balance})
                    </button>
                  )}
                  {notice.kind === 'login' && (
                    <Link href="/login" className="inline-flex px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold">
                      Se connecter
                    </Link>
                  )}
                  {notice.kind === 'upsell' && (
                    <Link href="/pricing" className="inline-flex px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold">
                      Voir les forfaits et les crédits
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Onglets des livrables */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-sand-100 border border-sand-200 text-xs">
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

                {salesData.sections && salesData.sections.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('sections')}
                    className={`flex-1 py-2 px-3 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'sections' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ce que l&apos;IA a vu</span>
                  </button>
                )}
              </div>

              {activeTab === 'sections' && salesData.sections && (
                <ol className="space-y-2 text-xs">
                  {salesData.sections.map((sec, i) => (
                    <li key={i} className="p-3 rounded-xl bg-sand-50 border border-sand-200">
                      <span className="font-bold text-stone-900">
                        {i + 1}. {sec.titre}
                      </span>
                      <p className="text-stone-600 mt-0.5 leading-relaxed">{sec.contenu}</p>
                    </li>
                  ))}
                </ol>
              )}

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
