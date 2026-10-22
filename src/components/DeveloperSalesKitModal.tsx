'use client';

import React, { useEffect, useState } from 'react';
import {
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
  Flame,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Target,
  MessageSquare,
  Mail,
  BadgeDollarSign,
  Lightbulb,
  PenLine,
} from 'lucide-react';
import Link from 'next/link';
import { AVAILABLE_TECHS } from './TechStackPicker';
import { sliceIntoSections } from '@/lib/pageSections';
import type { PitchResult } from '@/lib/pitchPrompt';

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
  const [salesData, setSalesData] = useState<PitchResult | null>(null);

  const [activeTab, setActiveTab] = useState<'hormozi' | 'audit' | 'coldemail' | 'proposal' | 'linkedin' | 'casestudy' | 'twitter' | 'sections'>('hormozi');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // IA du client : sa propre clé Gemini ou Claude, gardée dans son navigateur seulement
  const [ai, setAi] = useState<{ provider: AiProvider; key: string } | null>(null);
  const [showAiSetup, setShowAiSetup] = useState(false);
  const [setupProvider, setSetupProvider] = useState<AiProvider>('gemini');
  const [setupKey, setSetupKey] = useState('');
  const [setupError, setSetupError] = useState('');
  // Échap ferme la fenêtre
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    const saved = getSavedAi();
    setAi(saved);
    if (saved) setSetupProvider(saved.provider);
  }, [isOpen]);

  if (!isOpen) return null;

  const saveOwnKey = () => {
    if (!looksLikeKey(setupProvider, setupKey)) {
      let msg = 'Cette clé ne semble pas valide pour ce fournisseur.';
      if (setupProvider === 'claude') msg = 'Cette clé ne ressemble pas à une clé Claude (elle commence par « sk-ant- »).';
      else if (setupProvider === 'groq') msg = 'Cette clé ne ressemble pas à une clé Groq (elle commence par « gsk_ »).';
      else if (setupProvider === 'openai') msg = 'Cette clé ne ressemble pas à une clé OpenAI (elle commence par « sk- »).';
      else if (setupProvider === 'gemini') msg = 'Cette clé ne ressemble pas à une clé Gemini. Copiez-la depuis Google AI Studio.';
      setSetupError(msg);
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
          if (data.hormoziOffer) setActiveTab('hormozi');
          else if (data.monetizationAudit) setActiveTab('audit');
          else if (data.coldOutreachEmail) setActiveTab('coldemail');
          else setActiveTab('linkedin');
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
        if (json.data.hormoziOffer) setActiveTab('hormozi');
        else if (json.data.monetizationAudit) setActiveTab('audit');
        else if (json.data.coldOutreachEmail) setActiveTab('coldemail');
        else setActiveTab('linkedin');
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
          className="absolute top-4 right-4 min-w-[44px] min-h-[44px] flex items-center justify-center text-stone-500 hover:text-stone-800 rounded-full hover:bg-sand-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* En-tête */}
        <div className="flex items-center gap-3 mb-5 shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-pms-accent text-white flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-stone-900">Les textes qui font signer</h3>
            <p className="text-[13px] text-stone-500">
              L&apos;offre, l&apos;e-mail de prospection et le post LinkedIn, écrits à partir de ce site.
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
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-sand-300 text-sm focus:outline-none focus:border-pms-accent"
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
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-sand-300 text-sm focus:outline-none focus:border-pms-accent"
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
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-sand-300 text-[16px] sm:text-xs focus:outline-none focus:border-pms-accent"
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
                <div className="p-4 rounded-2xl bg-pms-accent-tint border border-pms-accent-tint space-y-3 text-xs">
                  <p className="font-bold text-stone-900 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-pms-accent" /> Connectez votre IA
                  </p>
                  <p className="text-stone-600 leading-relaxed">
                    Le Pitch IA utilise <strong>votre propre clé</strong> (Groq, Gemini, OpenAI ou Claude). Elle reste dans votre navigateur :
                    elle n&apos;est jamais envoyée à PitchMySite et vos requêtes sont traitées directement par le fournisseur.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 rounded-xl bg-white border border-sand-200">
                    {(['groq', 'gemini', 'openai', 'claude'] as AiProvider[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          setSetupProvider(p);
                          setSetupError('');
                        }}
                        aria-pressed={setupProvider === p}
                        className={`min-h-[44px] py-2 px-1 text-[13px] rounded-lg font-bold transition-colors ${setupProvider === p ? 'bg-pms-accent text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'}`}
                      >
                        {p === 'groq' ? 'Groq (Gratuit)' : p === 'gemini' ? 'Gemini (Gratuit)' : p === 'openai' ? 'OpenAI' : 'Claude'}
                      </button>
                    ))}
                  </div>
                  <p className="text-stone-500">{PROVIDER_INFO[setupProvider].hint}</p>
                  <a
                    href={PROVIDER_INFO[setupProvider].getKeyUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 min-h-[44px] font-bold text-pms-accent underline"
                  >
                    Obtenir ma clé {PROVIDER_INFO[setupProvider].label.split(' ')[0]} <ExternalLink className="w-3 h-3" />
                  </a>
                  <input
                    type="password"
                    autoComplete="off"
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    placeholder={
                      setupProvider === 'claude'
                        ? 'sk-ant-…'
                        : setupProvider === 'groq'
                        ? 'gsk_…'
                        : setupProvider === 'openai'
                        ? 'sk-…'
                        : 'Collez votre clé Gemini'
                    }
                    aria-label={`Clé ${PROVIDER_INFO[setupProvider].label}`}
                    className="w-full px-3 py-2 rounded-xl border border-sand-300 bg-white focus:outline-none focus:border-pms-accent"
                  />
                  {setupError && <p role="alert" className="text-rose-700">{setupError}</p>}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={saveOwnKey} disabled={!setupKey.trim()} className="px-4 py-2 rounded-xl bg-pms-accent hover:bg-pms-accent text-white font-bold disabled:opacity-50">
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
                <PenLine className="w-4 h-4 text-pms-accent shrink-0 mt-0.5" />
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
                className="w-full py-3.5 px-4 rounded-2xl bg-pms-accent hover:bg-pms-accent-hover text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{loadingStep || 'Rédaction de vos textes de vente…'}</span>
                  </>
                ) : (
                  <>
                    <PenLine className="w-4 h-4 text-amber-300" />
                    <span>Écrire mes textes de vente</span>
                  </>
                )}
              </button>

              {notice && (
                <div
                  role="alert"
                  className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-2.5 ${
                    notice.kind === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-pms-accent-tint border-pms-accent-tint text-pms-accent'
                  }`}
                >
                  <p>{notice.text}</p>
                  {notice.kind === 'credits' && (
                    <button
                      type="button"
                      onClick={() => handleGenerate(true)}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-xl bg-pms-accent hover:bg-pms-accent text-white font-bold disabled:opacity-60"
                    >
                      Utiliser {notice.cost} crédits (solde : {notice.balance})
                    </button>
                  )}
                  {notice.kind === 'login' && (
                    <Link href="/login" className="inline-flex px-4 py-2 rounded-xl bg-pms-accent hover:bg-pms-accent text-white font-bold">
                      Se connecter
                    </Link>
                  )}
                  {notice.kind === 'upsell' && (
                    <Link href="/pricing" className="inline-flex px-4 py-2 rounded-xl bg-pms-accent hover:bg-pms-accent text-white font-bold">
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
                {salesData.hormoziOffer && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('hormozi')}
                    className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'hormozi'
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-white" />
                    <span>Offre irrésistible</span>
                  </button>
                )}

                {salesData.monetizationAudit && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('audit')}
                    className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'audit'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <BadgeDollarSign className="w-3.5 h-3.5" />
                    <span>Audit Revenus</span>
                  </button>
                )}

                {salesData.coldOutreachEmail && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('coldemail')}
                    className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'coldemail'
                        ? ' bg-pms-accent text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Prospect</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveTab('proposal')}
                  className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'proposal'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pitch Devis</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('linkedin')}
                  className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
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
                  onClick={() => setActiveTab('casestudy')}
                  className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'casestudy'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Award className="w-3.5 h-3.5 text-pms-accent" />
                  <span>Étude de Cas</span>
                </button>

                {salesData.socialHooks && salesData.socialHooks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('twitter')}
                    className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'twitter'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>3 Hooks X</span>
                  </button>
                )}

                {salesData.sections && salesData.sections.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('sections')}
                    className={`flex-1 py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
                      activeTab === 'sections' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <PenLine className="w-3.5 h-3.5 text-amber-500" />
                    <span>Captures</span>
                  </button>
                )}
              </div>

              {/* Contenu onglet Offre Irrésistible  */}
              {activeTab === 'hormozi' && salesData.hormoziOffer && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-pms-accent border border-amber-200/80">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-2xs">
                          Offre irrésistible
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">
                          Valeur, garantie et bonus
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const h = salesData.hormoziOffer;
                          const full = `OFFRE GRAND SLAM : ${h?.offerName || ''}\n\n` +
                            `PROBLÈME CLÉ : ${salesData.primaryProblem || ''}\n` +
                            `SOLUTION TECHNIQUE : ${salesData.primarySolution || ''}\n\n` +
                            `RÉSULTAT RÊVÉ (DREAM OUTCOME) :\n${h?.dreamOutcome || ''}\n\n` +
                            `GARANTIE & INVERSION DU RISQUE :\n${h?.guarantee || ''}\n\n` +
                            `BONUS OFFERTS :\n${(h?.bonuses || []).map((b) => `- ${b}`).join('\n')}\n\n` +
                            `PHRASE D'ATTAQUE DIRECTE :\n${h?.pitchLine || ''}`;
                          handleCopy(full, 'hormozi_full');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-all"
                      >
                        {copiedKey === 'hormozi_full' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Pack complet copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier tout le pack</span>
                          </>
                        )}
                      </button>
                    </div>

                    <h4 className="text-base font-semibold text-stone-900 leading-snug">
                      {salesData.hormoziOffer.offerName}
                    </h4>
                  </div>

                  {/* Problème primaire & Solution */}
                  {(salesData.primaryProblem || salesData.primarySolution) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      {salesData.primaryProblem && (
                        <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200">
                          <span className="font-bold text-rose-900 flex items-center gap-1 mb-1">
                            <Target className="w-3.5 h-3.5 text-rose-600" /> Problème Douloureux :
                          </span>
                          <p className="text-stone-700 leading-relaxed">{salesData.primaryProblem}</p>
                        </div>
                      )}
                      {salesData.primarySolution && (
                        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200">
                          <span className="font-bold text-blue-900 flex items-center gap-1 mb-1">
                            <Zap className="w-3.5 h-3.5 text-blue-600" /> Solution Apportée :
                          </span>
                          <p className="text-stone-700 leading-relaxed">{salesData.primarySolution}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Résultat Rêvé (Dream Outcome) */}
                  {salesData.hormoziOffer.dreamOutcome && (
                    <div className="p-3 rounded-xl bg-pms-accent-tint border border-pms-accent-tint text-xs">
                      <span className="font-bold text-pms-accent flex items-center gap-1.5 mb-1">
                        <TrendingUp className="w-3.5 h-3.5 text-pms-accent" /> Résultat Rêvé du Prospect (Dream Outcome) :
                      </span>
                      <p className="text-stone-700 leading-relaxed">{salesData.hormoziOffer.dreamOutcome}</p>
                    </div>
                  )}

                  {/* Inversion du risque & Garantie */}
                  {salesData.hormoziOffer.guarantee && (
                    <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Garantie & Inversion du Risque :
                        </span>
                        <span className="text-[10px] font-semibold text-emerald-700">Supprime le frein à l&apos;achat</span>
                      </div>
                      <p className="text-stone-700 leading-relaxed">{salesData.hormoziOffer.guarantee}</p>
                    </div>
                  )}

                  {/* Stack de Bonus */}
                  {salesData.hormoziOffer.bonuses && salesData.hormoziOffer.bonuses.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                      <span className="font-bold text-amber-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" /> Stack de Bonus Inclus (Élève la valeur perçue) :
                      </span>
                      <ul className="space-y-1 text-stone-700 pl-1">
                        {salesData.hormoziOffer.bonuses.map((bonus, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold shrink-0">+{idx + 1}.</span>
                            <span>{bonus}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Phrase d'attaque directe pour WhatsApp / DM */}
                  {salesData.hormoziOffer.pitchLine && (
                    <div className="p-3 rounded-xl bg-stone-900 text-white text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5" /> Phrase d&apos;attaque directe (DM / WhatsApp) :
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(salesData.hormoziOffer!.pitchLine, 'pitch_line')}
                          className="px-2.5 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-[11px] flex items-center gap-1 transition-colors"
                        >
                          {copiedKey === 'pitch_line' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copié !</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-stone-200 italic font-medium leading-relaxed bg-stone-950/60 p-2.5 rounded-lg border border-stone-800">
                        « {salesData.hormoziOffer.pitchLine} »
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Contenu onglet Audit de Monétisation */}
              {activeTab === 'audit' && salesData.monetizationAudit && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-200/80">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-2xs">
                          Audit de Monétisation
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">
                          Opportunités de revenus
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const a = salesData.monetizationAudit;
                          const full = `AUDIT DE MONÉTISATION & LEVIERS DE CROISSANCE\n\n` +
                            `INTENTION DU VISITEUR :\n${a?.audienceIntent || ''}\n\n` +
                            `ACTION RAPIDE 30 JOURS (QUICK WIN) :\n${a?.quickWin30Days || ''}\n\n` +
                            `OPPORTUNITÉS DE REVENUS IDENTIFIÉES :\n` +
                            (a?.opportunities || [])
                              .map(
                                (o, i) =>
                                  `${i + 1}. ${o.opportunity} [Type: ${o.type} | Potentiel: ${o.revenuePotential} | Effort: ${o.effort}]\n   Pourquoi ça marche: ${o.whyItWorks}`
                              )
                              .join('\n\n') +
                            `\n\nFUITES DE REVENUS ACTUELLES :\n` +
                            (a?.monetizationGaps || []).map((g) => `- ${g}`).join('\n');
                          handleCopy(full, 'audit_full');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-all"
                      >
                        {copiedKey === 'audit_full' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Audit copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier tout l&apos;audit</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="flex items-start gap-2 text-xs text-stone-800">
                      <Lightbulb className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-stone-900">Intention & Maturité du Visiteur : </span>
                        <span>{salesData.monetizationAudit.audienceIntent}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Win 30 Jours */}
                  {salesData.monetizationAudit.quickWin30Days && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/5 border border-emerald-300/80 text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-950 mb-1">
                        <Zap className="w-4 h-4 text-emerald-600 fill-emerald-500" />
                        <span>Action Prioritaire 30 Jours (Quick Win) :</span>
                      </div>
                      <p className="text-stone-800 font-medium leading-relaxed">
                        {salesData.monetizationAudit.quickWin30Days}
                      </p>
                    </div>
                  )}

                  {/* Opportunités */}
                  {salesData.monetizationAudit.opportunities && salesData.monetizationAudit.opportunities.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-stone-700 block">
                        Opportunités de monétisation à exploiter :
                      </span>
                      <div className="grid grid-cols-1 gap-2.5">
                        {salesData.monetizationAudit.opportunities.map((opp, idx) => (
                          <div key={idx} className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-xs space-y-1.5">
                            <div className="flex flex-wrap items-center justify-between gap-1.5">
                              <span className="font-bold text-stone-900 text-[13px]">{opp.opportunity}</span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-pms-accent-tint text-pms-accent font-semibold">
                                  {opp.type}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                                  {opp.revenuePotential}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
                                  Effort : {opp.effort}
                                </span>
                              </div>
                            </div>
                            <p className="text-stone-600 leading-relaxed">
                              <strong className="text-stone-800 font-medium">Pourquoi le prospect va signer :</strong> {opp.whyItWorks}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fuites de revenus / Gaps */}
                  {salesData.monetizationAudit.monetizationGaps && salesData.monetizationAudit.monetizationGaps.length > 0 && (
                    <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200 text-xs space-y-1.5">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-amber-700" />
                        <span>Ce que le site actuel laisse sur la table (Failles de conversion) :</span>
                      </span>
                      <ul className="space-y-1 text-stone-700 pl-1">
                        {salesData.monetizationAudit.monetizationGaps.map((gap, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-amber-700 font-bold shrink-0">•</span>
                            <span>{gap}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Contenu onglet Email de Prospection Froide */}
              {activeTab === 'coldemail' && salesData.coldOutreachEmail && (
                <div className="space-y-3.5">
                  <div className="p-4 rounded-2xl bg-pms-accent border border-pms-accent/80">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-pms-accent text-white shadow-2xs">
                          Cold Outreach B2B
                        </span>
                        <span className="text-[10px] font-semibold text-stone-500">
                          Email de prospection avec maquette 3D
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const mail = salesData.coldOutreachEmail;
                          const full = `Objet : ${mail?.subject || ''}\n\n${mail?.body || ''}\n\n${mail?.callToAction || ''}`;
                          handleCopy(full, 'coldemail_full');
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs transition-all"
                      >
                        {copiedKey === 'coldemail_full' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Email complet copié !</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier Objet + Corps</span>
                          </>
                        )}
                      </button>
                    </div>

                    <p className="text-xs text-stone-600">
                      Prêt à envoyer au décideur. Joignez l&apos;image du mockup 3D en pièce jointe pour maximiser le taux de réponse.
                    </p>
                  </div>

                  {/* Objet de l'email */}
                  <div className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-700">Objet de l&apos;email :</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(salesData.coldOutreachEmail!.subject, 'email_subject')}
                        className="px-2 py-0.5 rounded-md bg-white border border-sand-300 hover:bg-sand-100 text-stone-700 text-[11px] font-medium flex items-center gap-1 transition-colors"
                      >
                        {copiedKey === 'email_subject' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Objet copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copier l&apos;objet</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="font-semibold text-stone-900 bg-white p-2.5 rounded-lg border border-sand-200">
                      {salesData.coldOutreachEmail.subject}
                    </p>
                  </div>

                  {/* Corps de l'email */}
                  <div className="space-y-1.5 text-xs">
                    <span className="font-bold text-stone-700">Corps du message :</span>
                    <div className="p-4 rounded-2xl bg-sand-50 border border-sand-200 text-stone-800 font-sans leading-relaxed whitespace-pre-line max-h-64 overflow-y-auto">
                      {salesData.coldOutreachEmail.body}
                      {salesData.coldOutreachEmail.callToAction && `\n\n${salesData.coldOutreachEmail.callToAction}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Contenu onglet Twitter / 3 Hooks X */}
              {activeTab === 'twitter' && salesData.socialHooks && (
                <div className="space-y-3">
                  <div className="text-xs font-bold text-stone-700">
                    3 Accroches virales courtes (Twitter / X / Threads) :
                  </div>
                  <div className="space-y-2.5">
                    {salesData.socialHooks.map((hook, i) => (
                      <div key={i} className="p-3 rounded-xl bg-sand-50 border border-sand-200 text-xs flex items-start justify-between gap-3">
                        <p className="text-stone-800 font-medium leading-relaxed">{hook}</p>
                        <button
                          type="button"
                          onClick={() => handleCopy(hook, `hook_${i}`)}
                          className="shrink-0 p-1.5 rounded-lg bg-white border border-sand-300 hover:bg-sand-100 text-stone-700 text-xs transition-colors"
                          title="Copier ce hook"
                        >
                          {copiedKey === `hook_${i}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
