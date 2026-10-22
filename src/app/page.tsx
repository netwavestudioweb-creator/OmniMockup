'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { UrlInputForm } from '@/components/UrlInputForm';
import { Journey } from '@/components/home/Journey';
import dynamic from 'next/dynamic';

// Le studio (plus de 5 000 lignes) n'est chargé qu'à son ouverture : accueil plus rapide.
// Son téléchargement démarre dès le lancement d'une capture (voir handleAnalyzeUrl) : il est prêt à l'arrivée de l'image.
const loadSceneEditor = () => import('@/components/SceneEditor');
const SceneEditor = dynamic(() => loadSceneEditor().then((m) => m.SceneEditor), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 text-zinc-400 text-sm">
      Ouverture du studio…
    </div>
  ),
});
import { listProjects, newProjectId, type StudioProject } from '@/lib/studioDraft';
import { ProjectsModal } from '@/components/ProjectsModal';

import { captureOne } from '@/lib/captureCache';
import { trackEvent } from '@/lib/tracking';
import { getHeroVariant } from '@/lib/heroTest';
import { CaptureItemResult } from '@/types/analyzer';
import { useCurrency } from '@/context/CurrencyContext';
import {
  PLANS,
  formatPrice,
  getPlanMonthlyPrice,
  getPlanAnnualPrice,
  getPlanMonthlyEquivalent,
  getLoyaltyFloorFcfa,
} from '@/lib/pricing';
import { Check, Loader2 } from 'lucide-react';
import { HeroShowcase, HeroBackdrop, ExamplesMarquee, BRANDS_NOTICE } from '@/components/home/HomeStage';
import { ProblemSection, UsagesSection, ZoneSection, AppsSection, StudioSection, SoonSection, FaqSection, SiteFooter } from '@/components/home/Sections';

export default function HomePage() {
  const { currency, mobileMoneyRegion } = useCurrency();

  const [activeCaptureItem, setActiveCaptureItem] = useState<CaptureItemResult | null>(null);
  // Mes projets : mockups enregistrés sur cet appareil, le plus récent proposé à la reprise
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [showProjects, setShowProjects] = useState(false);
  const [resumedDraft, setResumedDraft] = useState<StudioProject | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  useEffect(() => {
    if (activeCaptureItem) return;
    listProjects().then(setProjects);
  }, [activeCaptureItem]);
  // Tableau de bord : une visite de l'accueil par session
  useEffect(() => {
    try {
      if (sessionStorage.getItem('pms_home_view')) return;
      sessionStorage.setItem('pms_home_view', '1');
    } catch {
      // navigation privée : on compte quand même
    }
    trackEvent('home_view', { hero: getHeroVariant() });
  }, []);
  const savedDraft = projects[0] || null;
  const openProject = (project: StudioProject) => {
    setShowProjects(false);
    setResumedDraft(project);
    setActiveProjectId(project.id);
    setActiveCaptureItem(project.captureItem);
  };
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const captureAbortRef = useRef<AbortController | null>(null);
  const [isAnnualPricing, setIsAnnualPricing] = useState<boolean>(true);
  // Mode « Captures pour les stores » : écrans d'une appli déposés depuis l'accueil
  const [storeShots, setStoreShots] = useState<string[] | null>(null);
  const storeInputRef = useRef<HTMLInputElement>(null);
  const handleStoreFiles = async (files: FileList | null) => {
    const list = Array.from(files || []).filter((f) => f.type.startsWith('image/')).slice(0, 8);
    if (!list.length) return;
    const shots = await Promise.all(
      list.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result as string);
            r.readAsDataURL(f);
          })
      )
    );
    setStoreShots(shots);
    setResumedDraft(null);
    setActiveProjectId(newProjectId());
    setActiveCaptureItem({
      url: 'Image locale',
      title: 'Captures pour les stores',
      success: true,
      screenshotBase64: shots[0],
      capturedAt: new Date().toISOString(),
      durationMs: 0,
    });
  };


  // Entrées au défilement : chaque section apparaît une fois (rien sans JavaScript ni si l'animation est réduite)
  useEffect(() => {
    if (activeCaptureItem) return;
    document.documentElement.classList.add('reveal-ready');
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add('is-in'), io.unobserve(e.target))),
      { rootMargin: '0px 0px -12% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [activeCaptureItem]);

  const handleAnalyzeUrl = async (urlToCapture: string, settings?: import('@/types/analyzer').CaptureSettings) => {
    trackEvent('hero_capture', { hero: getHeroVariant() });
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingSeconds(0);
    // Le studio se télécharge pendant la capture
    loadSceneEditor().catch(() => {});

    const controller = new AbortController();
    captureAbortRef.current = controller;
    const startedAt = Date.now();
    const ticker = setInterval(() => setLoadingSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);

    try {
      const item = await captureOne(
        {
          targets: [urlToCapture],
          fullPage: settings?.fullPage ?? true,
          hideBanners: settings?.hideBanners ?? true,
          viewport: settings
            ? { width: settings.viewportWidth, height: settings.viewportHeight }
            : { width: 1440, height: 900 },
          delayMs: (settings?.delaySeconds ?? 0) * 1000,
          colorScheme: settings?.darkMode ? 'dark' : 'light',
        },
        controller.signal
      );

      if (item.success && item.screenshotBase64) {
        setResumedDraft(null);
        setActiveProjectId(newProjectId());
        setActiveCaptureItem(item);
      } else {
        setErrorMessage(item.error || 'Impossible de réaliser la capture de cette page web.');
      }
    } catch (err: unknown) {
      if ((err as Error)?.name !== 'AbortError') {
        setErrorMessage('Impossible de contacter le serveur. Vérifiez votre connexion internet, puis réessayez.');
      }
    } finally {
      clearInterval(ticker);
      captureAbortRef.current = null;
      setIsLoading(false);
    }
  };

  const cancelCapture = () => captureAbortRef.current?.abort();

  const handleUploadImage = (base64Image: string, title: string) => {
    setResumedDraft(null);
    setActiveProjectId(newProjectId());
    setActiveCaptureItem({
      url: 'Image locale',
      title: title || 'Capture téléversée',
      success: true,
      screenshotBase64: base64Image,
      capturedAt: new Date().toISOString(),
      durationMs: 0,
    });
  };

  const handleReset = () => {
    setStoreShots(null);
    setActiveCaptureItem(null);
    setErrorMessage(null);
  };

  if (activeCaptureItem) {
    return (
      <div id="studio-scroll" className="fixed inset-0 z-50 w-screen h-[100dvh] bg-zinc-950 overflow-y-auto overscroll-contain lg:overflow-hidden flex flex-col select-none">
        <SceneEditor
          captureItem={activeCaptureItem}
          initialMockup="browser"
          onClose={handleReset}
          initialSnapshot={resumedDraft?.snapshot}
          initialMobileScreenshot={resumedDraft?.mobileScreenshot}
          initialBeforeScreenshot={resumedDraft?.beforeScreenshot}
          initialBeforeUrl={resumedDraft?.beforeUrl}
          projectId={activeProjectId}
          initialStoreScreens={storeShots || undefined}
        />
      </div>
    );
  }

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const display = 'text-[clamp(2.125rem,1.5rem+2.6vw,3.5rem)] leading-[1.02] tracking-[-0.02em] font-normal';
  const head = 'text-[clamp(2rem,1.4rem+2vw,2.75rem)] leading-[1.05] tracking-[-0.02em] font-normal';
  const lead = 'text-[clamp(1.25rem,1.1rem+0.6vw,1.5rem)] leading-snug';

  return (
    <div className="font-archivo min-h-screen bg-pms-paper text-pms-ink flex flex-col w-full max-w-full overflow-x-clip selection:bg-pms-accent selection:text-white">
      <Navbar />
      {showProjects && <ProjectsModal onClose={() => setShowProjects(false)} onOpen={openProject} onChange={setProjects} />}

      {/* ═══ Accroche centrée : titre, champ du lien, puis le site de Wave mis en scène en grand ═══ */}
      <section className="p-3">
        <div className="relative isolate px-5 sm:px-10 pt-12 sm:pt-20 pb-10 flex flex-col items-center text-center">
          <HeroBackdrop />
          <h1 className={`relative ${display} max-w-[20ch]`}>
            <span className="hero-court">Votre site, prêt à faire signer.</span>
            <span className="hero-long">2 minutes au lieu de 2 heures sur Figma</span>
          </h1>
          <p className={`relative mt-6 ${lead} text-pms-ink max-w-[42ch]`}>
            Collez un lien : visuels et texte de vente en 2 minutes.
          </p>
          <div className="relative mt-8 w-full max-w-3xl -mx-2 sm:-mx-4 text-left">
            {savedDraft && (
              <div className="mx-2 sm:mx-4 mb-5 p-4 rounded-lg bg-pms-surface flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[15px] text-pms-muted min-w-0">
                  Reprendre votre dernier mockup : <strong className="font-semibold text-pms-ink">{savedDraft.name}</strong>
                  {', '}
                  {new Date(savedDraft.updatedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openProject(savedDraft)}
                    className="min-h-[44px] px-4 rounded-md bg-pms-accent hover:bg-pms-accent-hover text-white text-[15px] font-semibold transition-colors"
                  >
                    Reprendre
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowProjects(true)}
                    className="min-h-[44px] px-3 rounded-md text-pms-accent hover:underline text-[15px] font-semibold"
                  >
                    Mes projets ({projects.length})
                  </button>
                </div>
              </div>
            )}
            <UrlInputForm onAnalyze={handleAnalyzeUrl} onUploadImage={handleUploadImage} isLoading={isLoading} errorMessage={errorMessage} />
          </div>
        </div>

        <HeroShowcase />

      </section>

      <ProblemSection />

      {/* ═══ Comment ça marche : 4 étapes en zigzag, la ligne se remplit au défilement ═══ */}
      <section data-reveal id="comment" className="scroll-mt-16 px-5 sm:px-10 lg:px-[68px] py-12 sm:py-16">
        <h2 className={head}>Comment ça marche</h2>
        <p className="mt-5 text-[17px] leading-relaxed text-pms-muted max-w-[46ch]">
          4 étapes, 2 minutes. Pas besoin d’être designer.
        </p>
        <Journey />
      </section>

      <ZoneSection />

      <UsagesSection />

      <AppsSection
        onPick={() => storeInputRef.current?.click()}
        inputSlot={
          <input
            ref={storeInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              handleStoreFiles(e.target.files);
              e.target.value = '';
            }}
          />
        }
      />

      {/* ═══ Exemples : un client réel et des sites connus, qui défilent tout seuls ═══ */}
      <section data-reveal className="px-5 sm:px-10 lg:px-[68px] pb-12 sm:pb-16">
        <h2 className={head}>Des sites que vous connaissez</h2>
        <p className="mt-5 mb-10 text-[17px] leading-relaxed text-pms-muted max-w-[52ch]">
          Boutique, page produit, logiciel : chaque site a été collé tel quel, puis mis en scène en quelques clics.
        </p>
        <ExamplesMarquee />
        <p className="mt-6 text-[13px] text-pms-muted max-w-[70ch]">{BRANDS_NOTICE}</p>
      </section>

      {/* ═══ Ce que contient le studio : de vraies captures du studio, en grille ═══ */}
      <StudioSection />

      {/* ═══ Tarifs ═══ */}
      <section data-reveal className="px-5 sm:px-10 lg:px-[68px] py-14 sm:py-20 bg-pms-surface scroll-mt-16" id="pricing">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className={head}>Gratuit pour tester, simple à payer</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-pms-ink max-w-[46ch]">
              Un paiement couvre un mois ou un an. Rien ne se renouvelle tout seul. Et votre prix baisse chaque mois payé d’affilée.
            </p>
          </div>
          <div className="inline-flex self-start md:self-auto p-1 rounded-md bg-pms-paper" role="group" aria-label="Durée">
            <button
              type="button"
              onClick={() => setIsAnnualPricing(false)}
              aria-pressed={!isAnnualPricing}
              className={`min-h-[44px] px-4 rounded text-[15px] font-semibold transition-colors ${
                !isAnnualPricing ? 'bg-pms-ink text-white' : 'text-pms-muted hover:text-pms-ink'
              }`}
            >
              Mensuel
            </button>
            <button
              type="button"
              onClick={() => setIsAnnualPricing(true)}
              aria-pressed={isAnnualPricing}
              className={`min-h-[44px] px-4 rounded text-[15px] font-semibold transition-colors ${
                isAnnualPricing ? 'bg-pms-ink text-white' : 'text-pms-muted hover:text-pms-ink'
              }`}
            >
              Annuel, prix le plus bas
            </button>
          </div>
        </div>

        {(() => {
          const fcfa = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} FCFA`;
          // Une couleur très claire en haut de chaque carte (modèle de Dodo), sans violet
          const tint: Record<string, string> = { free: '#FDEDE8', solo: '#EFEFEF', pro: '#E8EEFD', agence: '#E4F4FA' };
          return (
            <>
              <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:grid-rows-[auto_auto_1fr] xl:gap-y-0">
                {PLANS.map((p) => {
                  const free = p.id === 'free';
                  const pro = p.id === 'pro';
                  const price = free ? 0 : isAnnualPricing ? getPlanMonthlyEquivalent(p, currency) : getPlanMonthlyPrice(p, currency);
                  return (
                    <div
                      key={p.id}
                      className={`relative flex flex-col xl:grid xl:grid-rows-subgrid xl:row-span-3 rounded-2xl bg-pms-paper p-6 sm:p-7 shadow-[0_20px_50px_-30px_rgba(17,17,17,0.35)] ${pro ? 'ring-2 ring-pms-accent' : 'ring-1 ring-pms-line'}`}
                    >
                      <div
                        aria-hidden
                        className="absolute inset-x-0 top-0 h-48 rounded-t-2xl"
                        style={{ background: `linear-gradient(to bottom, ${tint[p.id]}, rgba(255,255,255,0))` }}
                      />
                      {pro && (
                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10 rounded-md bg-pms-ink text-white text-[13px] font-semibold px-3 py-1.5 whitespace-nowrap">
                          Recommandé
                        </span>
                      )}
                      <div className="relative">
                        <h3 className="text-[19px] font-semibold">{p.name}</h3>
                        <p className="mt-5 flex items-baseline gap-2">
                          <span className="text-[2.5rem] leading-none tabular-nums whitespace-nowrap">{formatPrice(price, currency)}</span>
                          <span className="text-[15px] text-pms-muted">{free ? 'gratuit à vie' : 'par mois'}</span>
                        </p>
                        {!free && mobileMoneyRegion && (
                          <p className="mt-2 text-[15px] font-semibold">
                            Par Mobile Money : {isAnnualPricing ? `${fcfa(p.annualFcfa)} pour 1 an` : `${fcfa(p.monthlyFcfa)} pour 1 mois`}
                          </p>
                        )}
                        {!free && !isAnnualPricing && (
                          <p className="mt-1 text-[14px] text-pms-muted">
                            Puis {fcfa(p.loyaltyStepFcfa)} de moins chaque mois payé d&apos;affilée, jusqu&apos;à {fcfa(getLoyaltyFloorFcfa(p))}.
                          </p>
                        )}
                        {!free && isAnnualPricing && (
                          <p className="mt-1 text-[14px] text-pms-muted">Facturé {formatPrice(getPlanAnnualPrice(p, currency), currency)} par an</p>
                        )}
                        <p className="mt-4 text-[15px] leading-relaxed text-pms-muted">{p.description}</p>
                      </div>

                      <div className="relative">
                        {free ? (
                          <button
                            type="button"
                            onClick={scrollToTop}
                            className="mt-6 w-full min-h-[48px] rounded-lg bg-pms-paper ring-1 ring-pms-line hover:ring-pms-ink text-[15px] font-semibold shadow-sm transition-colors"
                          >
                            Commencer gratuitement
                          </button>
                        ) : (
                          <Link
                            href="/pricing"
                            className={`mt-6 w-full min-h-[48px] flex items-center justify-center rounded-lg text-[15px] font-semibold shadow-sm transition-colors ${
                              pro ? 'bg-pms-accent text-white hover:bg-pms-accent-hover' : 'bg-pms-paper ring-1 ring-pms-line hover:ring-pms-ink'
                            }`}
                          >
                            {p.ctaText}
                          </Link>
                        )}
                      </div>
                      <div className="relative">
                        <hr className="my-7 border-pms-line" />
                        <p className="text-[16px] font-semibold">{free ? 'Gratuit, pour toujours :' : 'Ce qui est inclus :'}</p>
                        <ul className="mt-4 space-y-3 text-[15px] leading-snug">
                          {p.features
                            .filter((f) => f.included)
                            .map((f) => (
                              <li key={f.name} className="flex gap-2.5">
                                <Check className={`w-4 h-4 mt-0.5 shrink-0 ${f.highlight ? 'text-pms-accent' : 'text-pms-ink'}`} aria-hidden />
                                <span>{f.name}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-10 text-[17px] leading-relaxed max-w-[60ch]">
                Besoin de quelques visuels seulement ?{' '}
                <Link href="/pricing#credits" className="text-pms-accent font-semibold underline underline-offset-4">
                  Les packs de crédits
                </Link>{' '}
                se paient une fois, sans abonnement.
              </p>
            </>
          );
        })()}
      </section>

      <SoonSection />

      <FaqSection />

      {/* ═══ Dernier mot : une phrase, une action ═══ */}
      <section data-reveal className="px-5 sm:px-10 lg:px-[68px] pt-4 pb-16 sm:pb-20 flex flex-col items-center text-center">
        <p className={`${lead} max-w-[34ch]`}>
          Essayez avec le site de votre dernier client. C&apos;est gratuit.
        </p>
        <button
          type="button"
          onClick={scrollToTop}
          className="mt-6 min-h-[44px] px-5 rounded-md bg-pms-accent hover:bg-pms-accent-hover text-white font-semibold text-[15px] transition-colors"
        >
          Je crée mon premier visuel
        </button>
      </section>

      <SiteFooter notice={BRANDS_NOTICE} />

      {/* Fenêtre de chargement */}
      {isLoading && (
        <div className="fixed inset-0 bg-pms-ink/60 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-pms-paper rounded-lg p-7 sm:p-9 max-w-sm w-full text-center space-y-4" role="status">
            <Loader2 className="w-8 h-8 mx-auto text-pms-accent animate-spin" />
            <h3 className="text-[22px] font-semibold">Capture du site en cours</h3>
            <p className="text-[15px] text-pms-muted" aria-live="polite">
              {loadingSeconds < 8
                ? 'Ouverture de la page et prise de la photo.'
                : loadingSeconds < 20
                  ? 'Les pages longues ou chargées d’images prennent un peu plus de temps.'
                  : 'Ce site est lent à répondre, encore quelques secondes.'}
            </p>
            <p className="text-[15px] text-pms-muted tabular-nums">{loadingSeconds} s</p>
            <button
              type="button"
              onClick={cancelCapture}
              className="w-full sm:w-auto min-h-[44px] px-5 rounded-md bg-pms-surface hover:bg-pms-line text-[15px] font-semibold transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
