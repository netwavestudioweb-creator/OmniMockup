'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { UrlInputForm } from '@/components/UrlInputForm';
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
} from '@/lib/pricing';
import { Loader2 } from 'lucide-react';
import {
  HeroShowcase,
  FormatShot,
  StepShot,
  SmallPhone,
  ExamplesCarousel,
  FooterLaptop,
  FORMATS,
  BRANDS_NOTICE,
  type FormatId,
} from '@/components/home/HomeStage';
import { SUPPORT_EMAIL } from '@/lib/contact';

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
  const [activePricingPlan, setActivePricingPlan] = useState<number>(2); // 0=Découverte, 1=Solo, 2=Pro (recommandé), 3=Agence
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

  // « Un lien, trois formats » : le format choisi par le visiteur
  const [format, setFormat] = useState<FormatId>('devis');

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
  const current = FORMATS.find((f) => f.id === format) || FORMATS[0];

  return (
    <div className="font-archivo min-h-screen bg-pms-paper text-pms-ink flex flex-col w-full max-w-full overflow-x-clip selection:bg-pms-accent selection:text-white">
      <Navbar />
      {showProjects && <ProjectsModal onClose={() => setShowProjects(false)} onOpen={openProject} onChange={setProjects} />}

      {/* ═══ Accroche : la carte rayée à gauche, à droite le site de Wave mis en scène ═══ */}
      <section className="p-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:min-h-[calc(100svh-64px)]">
        <div className="h-[48svh] lg:h-auto lg:order-2 lg:sticky lg:top-[76px] lg:max-h-[calc(100svh-88px)]">
          <HeroShowcase />
        </div>

        <div className="relative -mt-6 lg:mt-0 lg:order-1 rounded-lg bg-pms-surface overflow-hidden flex flex-col">

          <div className="flex-1 flex flex-col justify-center px-5 sm:px-10 lg:px-14 py-10 lg:py-14">
            <h1 className={`${display} max-w-[20ch]`}>
              <span className="hero-court">Votre site, prêt à faire signer.</span>
              <span className="hero-long">Un lien, des visuels qui font signer.</span>
            </h1>
            <p className={`mt-6 ${lead} text-pms-ink max-w-[36ch]`}>
              Préparez en 2 minutes les visuels et le texte qui font signer un client, au lieu de 2 heures sur Figma.
            </p>

            <div className="mt-8 -mx-2 sm:-mx-4">
              {savedDraft && (
                <div className="mx-2 sm:mx-4 mb-5 p-4 rounded-lg bg-pms-paper flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            <p className="mt-6 text-[15px] text-pms-muted max-w-[46ch]">
              Essai sans inscription ni carte bancaire.{' '}
              {mobileMoneyRegion
                ? 'Paiement unique en FCFA par Mobile Money, sans prélèvement automatique.'
                : 'Paiement unique, sans abonnement automatique.'}
            </p>
            <nav className="mt-8 flex flex-wrap gap-x-7 gap-y-2 text-[15px] font-semibold" aria-label="Sur cette page">
              <a href="#usages" className="min-h-[44px] inline-flex items-center text-pms-accent hover:underline underline-offset-4">Les formats</a>
              <a href="#pricing" className="min-h-[44px] inline-flex items-center text-pms-accent hover:underline underline-offset-4">Les tarifs</a>
              <a href="#questions" className="min-h-[44px] inline-flex items-center text-pms-accent hover:underline underline-offset-4">Vos questions</a>
            </nav>
          </div>
        </div>
      </section>

      {/* ═══ Un lien → trois formats : ce que vous donnez à gauche, ce que vous recevez à droite ═══ */}
      <section id="usages" aria-labelledby="usages-titre" className="scroll-mt-16 mt-3 md:grid md:grid-cols-2">
        <div className="relative bg-pms-field text-white px-5 sm:px-10 lg:px-[68px] pt-16 pb-28 md:min-h-[90svh] flex flex-col">
          <p className="text-[15px] text-white/70">Le lien que vous collez</p>
          <code className="mt-3 block font-archivo text-[clamp(1.25rem,1.1rem+0.6vw,1.5rem)] leading-snug break-all max-w-[34ch]">
            https://www.netflix.com
          </code>

          <p className="mt-12 text-[15px] text-white/70" id="format-label">Choisissez un format</p>
          <div className="mt-3 flex flex-col gap-2 max-w-sm" role="radiogroup" aria-labelledby="format-label">
            {FORMATS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={format === f.id}
                onClick={() => setFormat(f.id)}
                className={`min-h-[52px] px-4 rounded-md text-left flex items-center justify-between gap-4 transition-colors ${
                  format === f.id ? 'bg-white text-pms-ink' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <span className="text-[17px] font-semibold">{f.label}</span>
                <span className={`text-[15px] tabular-nums ${format === f.id ? 'text-pms-muted' : 'text-white/70'}`}>{f.ratio}</span>
              </button>
            ))}
          </div>
          <p className="mt-8 text-[17px] leading-relaxed text-white/85 max-w-[40ch]" aria-live="polite">
            {current.desc}
          </p>

          <h2 id="usages-titre" className={`absolute bottom-8 left-5 sm:left-10 lg:left-[68px] ${head}`}>Un lien collé,</h2>
        </div>

        <div className="relative bg-pms-paper px-5 sm:px-10 pt-24 pb-28 md:pt-16 min-h-[70svh] md:min-h-[90svh] flex items-start justify-center">
          <div className="relative w-full flex justify-center">
            {FORMATS.map((f) => (
              <div
                key={f.id}
                aria-hidden={format !== f.id}
                className={`${format === f.id ? 'relative opacity-100' : 'absolute inset-x-0 top-0 opacity-0 pointer-events-none'} flex justify-center transition-opacity duration-700 motion-reduce:transition-none`}
              >
                <FormatShot format={f.id} />
              </div>
            ))}
          </div>
          <p className={`absolute bottom-8 right-5 sm:right-10 lg:right-[68px] ${head} text-right`}>trois formats.</p>
        </div>
      </section>

      {/* ═══ Applis mobiles : captures pour l'App Store et Google Play ═══ */}
      <section data-reveal id="stores" className="scroll-mt-16 mt-3 px-5 sm:px-10 lg:px-[68px] py-16 sm:py-20 bg-pms-surface lg:mx-3 lg:rounded-lg">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div>
            <h2 className={`${head} max-w-[18ch]`}>Vous faites des applis ?</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-pms-ink max-w-[52ch]">
              Déposez les écrans de votre appli : chacun est mis dans un iPhone, avec votre accroche au-dessus, puis exporté aux
              tailles exactes de l&apos;App Store et de Google Play.
            </p>
          </div>
          <div className="shrink-0">
            <button
              type="button"
              onClick={() => storeInputRef.current?.click()}
              className="w-full sm:w-auto min-h-[48px] px-6 rounded-md bg-pms-accent hover:bg-pms-accent-hover text-white font-semibold text-[15px] transition-colors"
            >
              Déposer les écrans de mon appli
            </button>
            <p className="mt-2 text-[13px] text-pms-muted">Jusqu&apos;à 8 images, PNG ou JPG.</p>
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
          </div>
        </div>
      </section>

      {/* ═══ Le problème : grand aplat d'encre ═══ */}
      <section data-reveal className="bg-pms-field text-white mt-3">
        <div className="px-5 sm:px-10 lg:px-[68px] py-20 sm:py-28">
          <h2 className={`${head} max-w-[22ch]`}>Vos clients jugent un site sur une image</h2>
          <p className="mt-6 text-[17px] leading-relaxed text-white/85 max-w-[56ch]">
            Proposition commerciale, livraison, portfolio : la première impression se joue sur un visuel. Une capture plate fait
            paraître un site soigné comme un site bâclé.
          </p>
          <div className="mt-14 grid gap-12 md:grid-cols-2 max-w-5xl">
            <div>
              <h3 className={`${lead} text-white/70`}>Sans PitchMySite</h3>
              <ul className="mt-5 space-y-4 text-[17px] leading-relaxed text-white/85">
                <li>Des captures plates qui ne mettent pas votre travail en valeur.</li>
                <li>Des heures non facturées à préparer des visuels sur Figma pour chaque client.</li>
                <li>Des captures à refaire à la main à chaque modification du site.</li>
              </ul>
            </div>
            <div>
              <h3 className={lead}>Avec PitchMySite</h3>
              <ul className="mt-5 space-y-4 text-[17px] leading-relaxed text-white">
                <li>Vous collez l&apos;adresse : les pages sont capturées, bannières de cookies masquées.</li>
                <li>Le site est mis en scène sur ordinateur, téléphone et tablette, angle et fond réglables.</li>
                <li>Un lien de partage pour votre client, à votre marque avec le plan Agence.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Exemples : un client réel et des sites connus, chacun mis en scène ═══ */}
      <section data-reveal className="px-5 sm:px-10 lg:px-[68px] pt-20 sm:pt-28">
        <h2 className={head}>Des sites que vous connaissez</h2>
        <p className="mt-5 mb-10 text-[17px] leading-relaxed text-pms-ink max-w-[52ch]">
          Une boutique en ligne, une page produit, un logiciel : chaque site a été collé tel quel, puis mis en scène en quelques
          clics.
        </p>
        <ExamplesCarousel />
        <p className="mt-4 text-[13px] text-pms-muted max-w-[70ch]">{BRANDS_NOTICE}</p>
      </section>

      {/* ═══ Comment ça marche : chaque phrase a son image juste à côté, qui montre exactement ce qu'elle dit ═══ */}
      <section data-reveal className="px-5 sm:px-10 lg:px-[68px] pt-20 sm:pt-28">
        <h2 className={head}>Comment ça marche</h2>
        <ol className="mt-12 flex flex-col gap-16 lg:gap-20">
          {[
            { t: 'D’abord, collez le lien du site.', d: 'Ou déposez votre propre capture si le site est en local ou protégé par un mot de passe.' },
            { t: 'Ensuite, choisissez l’appareil et le format.', d: 'MacBook, iPhone, iPad, Android ; l’angle, le fond et le format de chaque réseau.' },
            { t: 'Enfin, exportez ou partagez.', d: 'Image jusqu’en 4K, vidéo, PDF pour un devis, ou un lien à envoyer à votre client.' },
          ].map((s, i) => (
            <li key={s.t} className="grid gap-8 lg:grid-cols-12 lg:gap-10 lg:items-center">
              <div className="lg:col-span-5">
                <p className={lead}>{s.t}</p>
                <p className="mt-3 text-[17px] leading-relaxed text-pms-muted max-w-[36ch]">{s.d}</p>
              </div>
              <div className="lg:col-start-7 lg:col-span-6">
                <StepShot step={i as 0 | 1 | 2} />
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* ═══ Ce que contient le studio : une petite preuve à côté de chaque texte ═══ */}
      <section data-reveal className="px-5 sm:px-10 lg:px-[68px] py-20 sm:py-28">
        <h2 className={`${head}`}>Ce que contient le studio</h2>
        <div className="mt-16 grid gap-16 xl:grid-cols-2 xl:gap-x-16 xl:gap-y-20">
          <article className="flex flex-col sm:flex-row gap-5 max-w-[640px]">
            <div className="sm:w-[360px] shrink-0 h-[160px] rounded-lg bg-pms-surface overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/demo/netflix-desktop.jpg" alt="" width={1440} height={900} loading="lazy" className="w-full h-full object-cover object-left-top" />
            </div>
            <div className="sm:w-[250px]">
              <h3 className="text-[17px] font-semibold">Une capture propre</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">Plusieurs pages du site, la version mobile ou sombre.</p>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">Les bannières de cookies sont masquées toutes seules.</p>
            </div>
          </article>

          <article className="flex flex-col sm:flex-row gap-5 max-w-[640px]">
            <div className="sm:w-[360px] shrink-0 h-[200px] rounded-lg bg-pms-surface overflow-hidden flex items-start justify-center pt-5">
              <div className="w-[118px]">
                <SmallPhone site="wave" />
              </div>
            </div>
            <div className="sm:w-[250px]">
              <h3 className="text-[17px] font-semibold">Neuf appareils</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">MacBook, PC portable, iMac, iPad, iPhone, Android, montre, navigateur et cadre plat.</p>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">Avec la vraie version mobile du site sur le téléphone.</p>
            </div>
          </article>

          <article className="flex flex-col sm:flex-row gap-5 max-w-[640px]">
            <div className="sm:w-[360px] shrink-0 h-[120px] rounded-lg bg-pms-surface p-5 flex flex-wrap content-center gap-2">
              {['Offre irrésistible', 'Audit des revenus', 'E-mail de prospection', 'Post LinkedIn'].map((t, i) => (
                <span key={t} className={`px-3 py-1.5 rounded-md text-[13px] font-semibold ${i === 0 ? 'bg-pms-ink text-white' : 'bg-pms-paper text-pms-ink'}`}>
                  {t}
                </span>
              ))}
            </div>
            <div className="sm:w-[250px]">
              <h3 className="text-[17px] font-semibold">Pitch IA</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">Les textes de vente rédigés à partir du site : offre, audit, e-mail, post LinkedIn.</p>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">Avec votre propre clé IA (Groq et Gemini sont gratuits).</p>
            </div>
          </article>

          <article className="flex flex-col sm:flex-row gap-5 max-w-[640px]">
            <div className="sm:w-[360px] shrink-0 h-[120px] rounded-lg bg-pms-surface p-5 flex items-end gap-3">
              {[
                ['16:9', 'w-16 h-9'],
                ['1:1', 'w-12 h-12'],
                ['4:5', 'w-10 h-[50px]'],
                ['9:16', 'w-[34px] h-[60px]'],
              ].map(([r, size]) => (
                <div key={r} className="flex flex-col items-center gap-1.5">
                  <div className={`${size} rounded bg-pms-ink`} />
                  <span className="text-[13px] tabular-nums text-pms-muted">{r}</span>
                </div>
              ))}
            </div>
            <div className="sm:w-[250px]">
              <h3 className="text-[17px] font-semibold">Tous les formats</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">LinkedIn, Instagram, statut WhatsApp, carrousels, App Store et Google Play.</p>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">Le pack de formats s’exporte en un clic.</p>
            </div>
          </article>

          <article className="flex flex-col sm:flex-row gap-5 max-w-[640px]">
            <div className="sm:w-[360px] shrink-0 h-[120px] rounded-lg bg-pms-surface p-5 flex flex-col justify-center gap-2">
              <span className="text-[13px] text-pms-muted">Lien à envoyer au client</span>
              <span className="flex items-center gap-2">
                <span className="flex-1 truncate rounded-md bg-pms-paper px-3 py-2 text-[15px]">pitchmysite.com/p/mon-client</span>
                <span className="rounded-md bg-pms-accent px-3 py-2 text-[13px] font-semibold text-white">Copier</span>
              </span>
            </div>
            <div className="sm:w-[250px]">
              <h3 className="text-[17px] font-semibold">Lien de partage</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">Votre client voit le mockup et le télécharge, sans créer de compte.</p>
              <p className="mt-2 text-[15px] leading-relaxed text-pms-muted">À votre nom et à votre logo avec le plan Agence.</p>
            </div>
          </article>
        </div>
        <p className="mt-20 text-[17px] leading-relaxed text-pms-muted max-w-[60ch]">
          Et aussi : scènes photo réalistes, directeur artistique IA, présentation client en PDF, vidéos et GIF, annotations et
          floutage, kit de marque, et tous vos projets enregistrés.
        </p>
      </section>

      {/* ═══ Tarifs ═══ */}
      <section data-reveal className="px-5 sm:px-10 lg:px-[68px] py-20 sm:py-28 bg-pms-surface scroll-mt-16" id="pricing">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className={head}>Les tarifs</h2>
            <p className="mt-5 text-[17px] leading-relaxed text-pms-ink max-w-[46ch]">
              Gratuit pour tester. Ensuite, un paiement couvre un mois ou un an, sans renouvellement automatique.
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
              Annuel, 2 mois offerts
            </button>
          </div>
        </div>

        {(() => {
          const homepagePlans = [
            {
              id: 0,
              name: 'Découverte',
              price: formatPrice(0, currency),
              period: 'gratuit à vie',
              fcfa: null as string | null,
              billedInfo: null as string | null,
              desc: PLANS[0].description,
              cta: 'Commencer gratuitement',
              href: '#',
              onCtaClick: scrollToTop as (() => void) | undefined,
              highlighted: false,
              features: PLANS[0].features,
            },
            ...[PLANS[1], PLANS[2], PLANS[3]].map((p, idx) => {
              const monthlyPrice = getPlanMonthlyPrice(p, currency);
              const annualPrice = getPlanAnnualPrice(p, currency);
              const eq = getPlanMonthlyEquivalent(p, currency);
              const displayPrice = isAnnualPricing ? eq : monthlyPrice;
              return {
                id: idx + 1,
                name: p.name,
                price: formatPrice(displayPrice, currency),
                period: 'par mois',
                fcfa: mobileMoneyRegion
                  ? `soit ${new Intl.NumberFormat('fr-FR').format(isAnnualPricing ? p.annualFcfa : p.monthlyFcfa)} FCFA${isAnnualPricing ? ' pour 1 an' : ' pour 1 mois'}`
                  : null,
                billedInfo: isAnnualPricing ? `Facturé ${formatPrice(annualPrice, currency)} par an` : null,
                desc: p.description,
                cta: `Choisir ${p.name}`,
                href: '/pricing',
                onCtaClick: undefined as (() => void) | undefined,
                highlighted: p.id === 'pro',
                features: p.features,
              };
            }),
          ];

          const renderPlan = (plan: (typeof homepagePlans)[number]) => (
            <div
              key={plan.id}
              className={`flex flex-col justify-between p-6 rounded-lg ${plan.highlighted ? 'bg-pms-field text-white' : 'bg-pms-paper text-pms-ink'}`}
            >
              <div>
                <h3 className="text-[22px] leading-tight font-semibold">{plan.name}</h3>
                <p className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-[2.25rem] leading-none tabular-nums whitespace-nowrap">{plan.price}</span>
                  <span className={`text-[15px] ${plan.highlighted ? 'text-white/75' : 'text-pms-muted'}`}>{plan.period}</span>
                </p>
                {plan.fcfa && <p className="mt-2 text-[15px] font-semibold">{plan.fcfa}</p>}
                {plan.billedInfo && (
                  <p className={`mt-1 text-[15px] ${plan.highlighted ? 'text-white/75' : 'text-pms-muted'}`}>{plan.billedInfo}</p>
                )}
                <p className={`mt-4 text-[15px] leading-relaxed ${plan.highlighted ? 'text-white/85' : 'text-pms-muted'}`}>
                  {plan.highlighted && 'La formule que nous conseillons. '}
                  {plan.desc}
                </p>
                <ul className="mt-6 space-y-2 text-[15px] leading-snug">
                  {plan.features
                    .filter((f) => f.included)
                    .map((f) => (
                      <li key={f.name}>{f.name}</li>
                    ))}
                </ul>
              </div>
              {plan.onCtaClick ? (
                <button
                  type="button"
                  onClick={plan.onCtaClick}
                  className="mt-8 w-full min-h-[44px] rounded-md bg-pms-surface hover:bg-pms-line text-[15px] font-semibold transition-colors"
                >
                  {plan.cta}
                </button>
              ) : (
                <Link
                  href={plan.href}
                  className={`mt-8 w-full min-h-[44px] flex items-center justify-center rounded-md text-[15px] font-semibold transition-colors ${
                    plan.highlighted ? 'bg-pms-accent text-white hover:bg-pms-accent-hover' : 'bg-pms-surface hover:bg-pms-line'
                  }`}
                >
                  {plan.cta}
                </Link>
              )}
            </div>
          );

          const activePlan = homepagePlans[activePricingPlan] || homepagePlans[2];
          return (
            <>
              <div className="mt-12 hidden lg:grid lg:grid-cols-4 gap-3 items-stretch">{homepagePlans.map(renderPlan)}</div>
              <div className="mt-10 lg:hidden">
                <div className="flex p-1 rounded-md bg-pms-paper max-w-md" role="tablist" aria-label="Formules">
                  {homepagePlans.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={activePricingPlan === tab.id}
                      onClick={() => setActivePricingPlan(tab.id)}
                      className={`flex-1 min-h-[44px] px-1 rounded text-[15px] font-semibold transition-colors ${
                        activePricingPlan === tab.id ? 'bg-pms-ink text-white' : 'text-pms-muted hover:text-pms-ink'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </div>
                <div className="mt-4 max-w-md">{renderPlan(activePlan)}</div>
              </div>
              <p className="mt-10 text-[17px] leading-relaxed max-w-[60ch]">
                Vous lancez un SaaS et n&apos;avez besoin que de quelques visuels ?{' '}
                <Link href="/pricing#credits" className="text-pms-accent font-semibold underline underline-offset-4">
                  Les packs de crédits
                </Link>{' '}
                se paient une fois, sans abonnement.
              </p>
            </>
          );
        })()}
      </section>

      {/* ═══ Questions : à lire d'un coup d'œil, sans menus dépliants ═══ */}
      <section data-reveal id="questions" className="scroll-mt-16 px-5 sm:px-10 lg:px-[68px] py-20 sm:py-28 lg:grid lg:grid-cols-[1fr_3fr] lg:gap-16">
        <h2 className={head}>Vos questions</h2>
        <div className="mt-10 lg:mt-0 md:columns-2 md:gap-14 text-[17px] leading-[1.55]">
          {[
            {
              q: 'Puis-je utiliser les mockups pour mes clients et à des fins commerciales ?',
              a: 'Oui. Les visuels que vous créez avec PitchMySite peuvent servir dans vos propositions commerciales, vos livrables clients, votre portfolio et vos publications.',
            },
            {
              q: 'Comment fonctionne la marque blanche ?',
              a: 'Dès le plan Pro, vos images, vidéos et PDF ne portent plus de filigrane. Avec le plan Agence, les pages de partage affichent aussi le nom et le logo de votre agence, sans mention de PitchMySite.',
            },
            {
              q: 'Que deviennent les captures des sites de mes clients ?',
              a: 'La page est chargée par notre moteur de capture, puis l’image est envoyée directement à votre navigateur. Nous ne conservons pas les captures, sauf si vous créez un lien de partage : l’image est alors hébergée jusqu’à ce que vous supprimiez le lien.',
            },
            {
              q: 'Faut-il créer un compte pour tester ?',
              a: 'Non. Vous pouvez tester le studio et exporter jusqu’à 3 images par jour, avec un filigrane discret, sans compte ni carte bancaire.',
            },
            {
              q: 'Le site du client est en local ou protégé par un mot de passe ?',
              a: 'Déposez votre propre capture d’écran (PNG, JPG ou WebP) : vous profitez de la même mise en scène.',
            },
            {
              q: 'Comment payer ?',
              a: 'Par Mobile Money via SasPay (MTN, Moov, Celtiis, Orange, Wave, selon votre pays), en FCFA. Le paiement par carte bancaire arrive bientôt.',
            },
            {
              q: 'Puis-je arrêter à tout moment ?',
              a: 'Il n’y a rien à résilier : un paiement couvre 1 mois ou 1 an, sans renouvellement automatique. Vous repayez seulement si vous voulez continuer.',
            },
          ].map((faq) => (
            <p key={faq.q} className="mb-5 break-inside-avoid text-pms-ink">
              <strong className="font-semibold">{faq.q}</strong> {faq.a}
            </p>
          ))}
        </div>
      </section>

      {/* ═══ Dernier mot : une phrase, une action ═══ */}
      <section data-reveal className="px-5 sm:px-10 lg:px-[68px] pt-[16svh] pb-[14svh]">
        <p className={`${lead} max-w-[34ch]`}>
          Essayez avec le site de votre dernier client : c&apos;est gratuit, il suffit de son adresse.
        </p>
        <button
          type="button"
          onClick={scrollToTop}
          className="mt-6 min-h-[44px] px-5 rounded-md bg-pms-accent hover:bg-pms-accent-hover text-white font-semibold text-[15px] transition-colors"
        >
          Coller un lien
        </button>
      </section>

      {/* ═══ Pied de page : la photo à gauche, le menu en grand à droite ═══ */}
      <footer className="md:grid md:grid-cols-2 bg-pms-surface">
        <div data-ui className="bg-pms-field flex items-center justify-center px-8 py-16 min-h-[50svh]">
          <div className="w-full max-w-[560px]">
            <FooterLaptop />
          </div>
        </div>
        <div className="px-5 sm:px-10 lg:px-[68px] py-16 md:py-20 flex flex-col">
          <p className="text-[17px] font-semibold">PitchMySite</p>
          <nav className="mt-10 flex flex-col gap-5 text-[clamp(1.75rem,1.2rem+1.6vw,2.25rem)] leading-none" aria-label="Pied de page">
            <a href="#usages" className="hover:text-pms-accent transition-colors">Les formats</a>
            <a href="#pricing" className="hover:text-pms-accent transition-colors">Les tarifs</a>
            <a href="#questions" className="hover:text-pms-accent transition-colors">Vos questions</a>
            <Link href="/login" className="hover:text-pms-accent transition-colors">Connexion</Link>
            <Link href="/signup" className="hover:text-pms-accent transition-colors">Créer un compte</Link>
          </nav>
          <div className="mt-14 text-[15px]">
            <p className="text-pms-muted">Contact</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="mt-1 inline-block hover:text-pms-accent">{SUPPORT_EMAIL}</a>
          </div>
          <div className="mt-auto pt-14 text-[13px] text-pms-muted space-y-2">
            <p className="flex flex-wrap gap-x-5 gap-y-1">
              <Link href="/terms" className="hover:text-pms-ink">Conditions (CGU/CGV)</Link>
              <Link href="/privacy" className="hover:text-pms-ink">Confidentialité</Link>
              <span>© {new Date().getFullYear()} PitchMySite</span>
            </p>
            <p>{BRANDS_NOTICE} Exemple de site client : Al Kareem Parfumerie.</p>
          </div>
        </div>
      </footer>

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
