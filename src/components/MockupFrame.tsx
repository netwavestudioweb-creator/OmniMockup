'use client';

import React from 'react';
import { MockupType, DeviceTheme, DeviceStyle, CornerRadius, BrowserStylePreset, DeviceColor } from '@/types/analyzer';

// Châssis selon la couleur choisie (téléphones, tablette, montre)
const DEVICE_BODY: Record<DeviceColor, { body: string; button: string }> = {
  graphite: { body: 'bg-gradient-to-b from-stone-700 via-stone-800 to-stone-950 border-stone-600', button: 'bg-stone-600' },
  silver: { body: 'bg-gradient-to-b from-zinc-100 via-zinc-300 to-zinc-400 border-zinc-200', button: 'bg-zinc-300' },
  titanium: { body: 'bg-gradient-to-b from-stone-400 via-stone-500 to-stone-600 border-stone-300', button: 'bg-stone-400' },
  midnight: { body: 'bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border-slate-600', button: 'bg-slate-600' },
  gold: { body: 'bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 border-amber-100', button: 'bg-amber-200' },
  'deep-black': { body: 'bg-gradient-to-b from-neutral-700 via-neutral-900 to-black border-neutral-700', button: 'bg-neutral-700' },
  glacier: { body: 'bg-gradient-to-b from-sky-100 via-sky-200 to-sky-300 border-sky-100', button: 'bg-sky-200' },
  burgundy: { body: 'bg-gradient-to-b from-rose-800 via-rose-900 to-rose-950 border-rose-700', button: 'bg-rose-800' },
};
import { Lock, ExternalLink, Globe, RotateCw, ArrowLeft, ArrowRight, Plus } from 'lucide-react';

/**
 * Couleur du haut de la capture, pour la barre d'état du téléphone (comme sur un vrai iPhone,
 * la barre prend la couleur du site). Blanc par défaut si l'image ne peut pas être lue.
 */
function useTopColor(src: string, enabled: boolean): string {
  const [color, setColor] = React.useState('#ffffff');
  React.useEffect(() => {
    if (!enabled || !src) return;
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = 8;
        c.height = 1;
        const ctx = c.getContext('2d');
        if (!ctx) return;
        // Une fine bande en haut de l'image, réduite à 8 points, dont on fait la moyenne
        ctx.drawImage(img, 0, 0, img.naturalWidth, Math.max(1, Math.round(img.naturalHeight * 0.004)), 0, 0, 8, 1);
        const d = ctx.getImageData(0, 0, 8, 1).data;
        let r = 0, g = 0, b = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i];
          g += d[i + 1];
          b += d[i + 2];
        }
        if (!cancelled) setColor(`rgb(${Math.round(r / 8)}, ${Math.round(g / 8)}, ${Math.round(b / 8)})`);
      } catch {
        /* image d'un autre domaine : on garde le blanc */
      }
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src, enabled]);
  return color;
}

/** Texte sombre ou clair selon la couleur de fond */
function isDarkColor(rgb: string): boolean {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return false;
  const [r, g, b] = m.map(Number);
  return 0.299 * r + 0.587 * g + 0.114 * b < 140;
}

/** Barre d'état d'un téléphone (heure, réseau, wifi, batterie), à l'échelle de l'écran */
function PhoneStatusBar({ bg, ratio }: { bg: string; ratio: number }) {
  const fg = isDarkColor(bg) ? '#ffffff' : '#111111';
  const w = 1206;
  const h = Math.round(w * ratio);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-x-0 top-0 z-20 w-full h-auto block" aria-hidden>
      <rect width={w} height={h} fill={bg} />
      <text x="150" y={h * 0.62} fontSize={h * 0.32} fontWeight="600" fill={fg} fontFamily="-apple-system, system-ui, sans-serif">
        9:41
      </text>
      <g fill={fg} transform={`translate(860 ${h * 0.4})`}>
        <rect x="0" y={h * 0.16} width="10" height={h * 0.1} rx="3" />
        <rect x="16" y={h * 0.11} width="10" height={h * 0.15} rx="3" />
        <rect x="32" y={h * 0.05} width="10" height={h * 0.21} rx="3" />
        <rect x="48" y="0" width="10" height={h * 0.26} rx="3" />
        <rect x="160" y="0" width="76" height={h * 0.26} rx="10" fill="none" stroke={fg} strokeWidth="5" opacity="0.6" />
        <rect x="168" y={h * 0.045} width="54" height={h * 0.17} rx="5" />
      </g>
      <path
        d={`M 965 ${h * 0.47} a 34 34 0 0 1 56 0`}
        transform={`translate(0 ${h * 0.05})`}
        stroke={fg}
        strokeWidth="9"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="993" cy={h * 0.64} r="7" fill={fg} />
    </svg>
  );
}

interface MockupFrameProps {
  type: MockupType;
  /** L'appareil remplit toute la largeur disponible (pas de taille maximale fixe) : mode Solo */
  fill?: boolean;
  screenshotBase64: string;
  url: string;
  title?: string;
  domainName?: string;
  faviconUrl?: string;
  theme?: DeviceTheme;
  styleVariant?: DeviceStyle;
  browserStyle?: BrowserStylePreset;
  cornerRadius?: CornerRadius;
  cropOffsetY?: number;
  /** Zone montrée : 1 = toute la largeur, plus grand = une partie de la page agrandie */
  cropZoom?: number;
  onClickImage?: () => void;
  deviceColor?: DeviceColor;
}

export const MockupFrame: React.FC<MockupFrameProps> = ({
  type,
  screenshotBase64,
  url,
  title,
  domainName,
  faviconUrl,
  theme = 'light',
  styleVariant = 'default',
  browserStyle,
  cornerRadius = 'curved',
  cropOffsetY = 0,
  cropZoom = 1,
  onClickImage,
  deviceColor = 'graphite',
  fill = false,
}) => {
  const chassis = DEVICE_BODY[deviceColor] || DEVICE_BODY.graphite;
  const [imageError, setImageError] = React.useState(false);
  const isPhone = type === 'iphone' || type === 'android';
  const statusBg = useTopColor(screenshotBase64, isPhone);

  React.useEffect(() => {
    setImageError(false);
  }, [screenshotBase64]);

  // Extraction dynamique du domaine si non fourni
  const cleanDomain = React.useMemo(() => {
    if (domainName) return domainName;
    if (!url) return 'example.com';
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      // Image déposée (« Image locale ») : barre d'adresse vide plutôt qu'un texte technique
      return '';
    }
  }, [domainName, url]);

  const faviconSrc = React.useMemo(() => {
    // Toujours servie depuis notre domaine : une image d'un autre domaine fait échouer l'export
    if (faviconUrl && !faviconUrl.includes('google.com/s2/favicons')) return faviconUrl;
    if (!cleanDomain) return 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=='; // pixel transparent
    return `/api/favicon?domain=${encodeURIComponent(cleanDomain)}`;
  }, [faviconUrl, cleanDomain]);

  // Détermination du rayon d'angle
  const radiusClass =
    cornerRadius === 'sharp'
      ? 'rounded-none'
      : cornerRadius === 'round'
      ? 'rounded-3xl sm:rounded-[32px]'
      : 'rounded-xl sm:rounded-2xl';

  const innerRadiusClass =
    cornerRadius === 'sharp'
      ? 'rounded-none'
      : cornerRadius === 'round'
      ? 'rounded-2xl sm:rounded-[24px]'
      : 'rounded-lg sm:rounded-xl';

  // Rendu unifié et sécurisé de l'écran (avec fallback anti-écran vert)
  const renderScreen = (customClasses = '') => {
    if (imageError || !screenshotBase64) {
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center p-6 bg-zinc-950 text-zinc-300 text-center select-none ${customClasses}`}>
          <div className="w-12 h-12 rounded-2xl bg-pms-accent/20 border border-pms-accent/30 flex items-center justify-center mb-3">
            <Globe className="w-6 h-6 text-pms-accent-soft" />
          </div>
          <span className="font-semibold text-sm text-white mb-1 truncate max-w-[240px]">{cleanDomain}</span>
          <span className="text-xs text-zinc-400 max-w-xs">
            Aperçu non disponible ou erreur de chargement.
          </span>
        </div>
      );
    }

    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={screenshotBase64}
        alt={title || url}
        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01] ${customClasses}`}
        style={{
          objectPosition: `center ${cropOffsetY}%`,
          // Agrandissement autour de la même hauteur : la zone choisie reste en place
          ...(cropZoom > 1 ? { transform: `scale(${cropZoom})`, transformOrigin: `50% ${cropOffsetY}%` } : {}),
        }}
        onError={() => setImageError(true)}
      />
    );
  };

  // 1. Cadre Navigateur Desktop (Safari, Chrome, Arc - Light / Dark / Glass)
  if (type === 'browser') {
    const isDark = browserStyle ? browserStyle.includes('dark') : theme === 'dark';
    const isGlass = styleVariant === 'glass';
    const isChrome = browserStyle === 'chrome-light' || browserStyle === 'chrome-dark';
    const isArc = browserStyle === 'arc-light' || browserStyle === 'arc-dark';

    return (
      <div
        className={`w-full overflow-hidden transition-all select-none border ${radiusClass} ${
          isGlass
            ? isDark
              ? 'bg-stone-900/60 backdrop-blur-xl border-white/10 shadow-2xl text-stone-200'
              : 'bg-white/60 backdrop-blur-xl border-white/60 shadow-2xl text-stone-800'
            : isArc
            ? isDark
              ? 'bg-[#121316] border-zinc-700/60 shadow-2xl text-zinc-200 ring-1 ring-pms-accent/20'
              : 'bg-[#f4f3ef] border-zinc-300 shadow-2xl text-zinc-800 ring-1 ring-pms-accent/30'
            : isDark
            ? 'bg-[#18181b] border-stone-800 shadow-2xl text-stone-200'
            : 'bg-white border-stone-200/90 shadow-xl text-stone-800'
        }`}
      >
        {/* ── DESIGN ARC BROWSER ── */}
        {isArc ? (
          <div
            className={`h-11 px-3.5 border-b flex items-center justify-between transition-colors ${
              isDark ? 'bg-[#16171c] border-zinc-800' : 'bg-[#ece9e3] border-zinc-300/80'
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="w-px h-3.5 bg-zinc-700/40 mx-1" />
              <div className="flex items-center gap-1 text-zinc-400">
                <ArrowLeft className="w-3 h-3" />
                <ArrowRight className="w-3 h-3 opacity-40" />
              </div>
            </div>

            <div className="flex-1 max-w-xs mx-3">
              <div
                className={`flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono shadow-xs border transition-colors ${
                  isDark
                    ? 'bg-zinc-900/90 border-zinc-750 text-zinc-200'
                    : 'bg-white border-zinc-300 text-zinc-700'
                }`}
              >
                <Lock className="w-3 h-3 text-pms-accent-soft shrink-0" />
                <span className="truncate font-semibold">{cleanDomain}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-pms-accent-soft">
              <span>ARC</span>
            </div>
          </div>
        ) : isChrome ? (
          /* ── DESIGN GOOGLE CHROME ── */
          <div>
            {/* Onglet Chrome supérieur */}
            <div
              className={`h-9 px-3 pt-1.5 flex items-center justify-between border-b ${
                isDark ? 'bg-[#1e1f22] border-zinc-850' : 'bg-[#dee1e6] border-zinc-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 mr-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>

                {/* Onglet actif */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-t-lg text-[11px] font-medium shadow-xs border-t border-x ${
                    isDark
                      ? 'bg-[#2b2d31] border-zinc-750 text-white'
                      : 'bg-white border-zinc-300 text-zinc-800'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={faviconSrc}
                    alt="Favicon"
                    className="w-3 h-3 rounded-xs shrink-0 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="truncate max-w-[140px] font-medium">{title || cleanDomain}</span>
                </div>

                <div className="p-0.5 rounded text-zinc-400 hover:text-zinc-200">
                  <Plus className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Barre de navigation et Omnibox */}
            <div
              className={`h-9 px-3 border-b flex items-center gap-2 ${
                isDark ? 'bg-[#2b2d31] border-zinc-800' : 'bg-white border-zinc-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-zinc-400">
                <ArrowLeft className="w-3.5 h-3.5" />
                <ArrowRight className="w-3.5 h-3.5 opacity-40" />
                <RotateCw className="w-3 h-3" />
              </div>

              <div className="flex-1 mx-1">
                <div
                  className={`flex items-center justify-between px-3 py-0.5 rounded-full text-[11px] font-mono border ${
                    isDark
                      ? 'bg-[#1e1f22] border-zinc-750 text-zinc-200'
                      : 'bg-[#f1f3f4] border-transparent text-zinc-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
                    <span className="truncate">{cleanDomain}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ── DESIGN APPLE SAFARI STANDARD ── */
          <div
            className={`h-10 px-4 border-b flex items-center justify-between transition-colors ${
              isGlass
                ? isDark
                  ? 'bg-black/30 border-white/10'
                  : 'bg-white/40 border-stone-200/50'
                : isDark
                ? 'bg-[#202024] border-stone-800'
                : 'bg-stone-100/90 border-stone-200'
            }`}
          >
            {/* Boutons rouge / jaune / vert Apple */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] shadow-xs" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] shadow-xs" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f] shadow-xs" />
            </div>

            {/* Barre d'adresse URL avec Favicon */}
            <div className="flex-1 max-w-sm mx-3">
              <div
                className={`flex items-center justify-between px-3 py-1 rounded-md text-[11px] font-mono shadow-2xs border transition-colors ${
                  isDark
                    ? 'bg-stone-900/80 border-stone-700/60 text-stone-300'
                    : 'bg-white border-stone-200 text-stone-600'
                }`}
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Lock className="w-3 h-3 text-emerald-500 shrink-0" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={faviconSrc}
                    alt="Favicon"
                    className="w-3.5 h-3.5 rounded-xs shrink-0 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  <span className="truncate font-medium">{cleanDomain}</span>
                </span>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className={`ml-2 transition-colors ${
                      isDark ? 'text-stone-400 hover:text-stone-100' : 'text-stone-400 hover:text-stone-700'
                    }`}
                    title="Ouvrir le site original"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="w-8 flex justify-end shrink-0">
              <span
                className={`text-[10px] font-mono font-semibold ${
                  isDark ? 'text-stone-400' : 'text-stone-400'
                }`}
              >
                Web
              </span>
            </div>
          </div>
        )}

        {/* Écran Navigateur avec image */}
        <div
          className={`relative aspect-[16/10] overflow-hidden cursor-pointer group ${
            isDark ? 'bg-stone-950' : 'bg-stone-100'
          }`}
          onClick={onClickImage}
        >
          {renderScreen()}
        </div>
      </div>
    );
  }

  // 2. Cadre MacBook Pro M3
  if (type === 'macbook') {
    return (
      <div className="w-full flex flex-col items-center select-none">
        {/* Écran & Bordure aluminium supérieure */}
        <div
          className={`w-full bg-[#121214] border-[7px] sm:border-[10px] border-[#1c1c1f] ${radiusClass} shadow-2xl relative overflow-hidden`}
        >
          {/* Webcam & micro en haut */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-900 border border-stone-700" />
            <div className="w-0.5 h-0.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Dalle écran MacBook */}
          <div
            className="relative aspect-[16/10] bg-black overflow-hidden cursor-pointer group"
            onClick={onClickImage}
          >
            {renderScreen()}
            {/* Reflet vitré Apple */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Base du châssis & encoche d'ouverture */}
        <div className="w-[104%] h-3 sm:h-4 bg-gradient-to-b from-stone-400 via-stone-500 to-stone-600 rounded-b-xl sm:rounded-b-2xl shadow-xl relative flex items-start justify-center border-t border-stone-300">
          <div className="w-16 sm:w-20 h-1 sm:h-1.5 bg-stone-700/80 rounded-b-md" />
        </div>
      </div>
    );
  }

  // 2 bis. Ordinateur portable Windows générique (sans marque)
  if (type === 'laptop') {
    return (
      <div className="w-full flex flex-col items-center select-none">
        {/* Écran : bordures fines, webcam centrée */}
        <div className={`w-full bg-[#0b0b0d] border-[5px] sm:border-[8px] border-t-[9px] sm:border-t-[14px] border-[#18181b] rounded-t-lg sm:rounded-t-xl shadow-2xl relative overflow-hidden`}>
          <div className="absolute -top-[7px] sm:-top-[11px] left-1/2 -translate-x-1/2 z-20 w-1.5 h-1.5 rounded-full bg-zinc-800 border border-zinc-700" />
          <div className="relative aspect-[16/9] bg-black overflow-hidden cursor-pointer group" onClick={onClickImage}>
            {renderScreen()}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
          </div>
        </div>
        {/* Charnière et base gris anthracite */}
        <div className="w-[101%] h-1.5 sm:h-2 bg-gradient-to-b from-zinc-700 to-zinc-800" />
        <div className="w-[108%] h-2.5 sm:h-3.5 bg-gradient-to-b from-zinc-600 via-zinc-700 to-zinc-800 rounded-b-lg sm:rounded-b-xl shadow-xl relative flex items-start justify-center border-t border-zinc-500/60">
          <div className="w-14 sm:w-20 h-0.5 sm:h-1 bg-zinc-900/70 rounded-b-md" />
        </div>
      </div>
    );
  }

  // 3. Cadre iPad Pro M4
  if (type === 'ipad') {
    return (
      <div className="w-full flex justify-center select-none py-1">
        <div
          className={`w-full ${fill ? 'max-w-none' : 'max-w-[560px]'} relative rounded-[28px] sm:rounded-[36px] p-[8px] sm:p-[12px] shadow-2xl border ${chassis.body}`}
        >
          {/* Caméra avant iPad */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 w-2 h-2 rounded-full bg-stone-950 border border-stone-700 flex items-center justify-center">
            <div className="w-0.5 h-0.5 rounded-full bg-blue-900/80" />
          </div>

          {/* Écran tactile iPad */}
          <div
            className="relative rounded-[20px] sm:rounded-[26px] overflow-hidden aspect-[4/3] bg-black cursor-pointer group shadow-inner"
            onClick={onClickImage}
          >
            {renderScreen()}
            {/* Barre de retour iPad */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-20 w-32 h-1 bg-white/40 rounded-full backdrop-blur-md" />
          </div>
        </div>
      </div>
    );
  }

  // 4. Cadre iPhone 18 Pro (dernière série, présentée le 9 septembre 2026) : écran 6,3" au format
  // 1206 × 2622, bords très fins, Dynamic Island plus étroite, bouton Action et commande de l'appareil photo
  if (type === 'iphone') {
    return (
      <div className="w-full flex justify-center select-none py-2">
        <div className={`w-full ${fill ? 'max-w-none' : 'max-w-[270px] sm:max-w-[290px]'} relative rounded-[15%/7%] p-[2.4%] shadow-2xl border ${chassis.body}`}>
          {/* Gauche : bouton Action et volume */}
          <div className={`absolute -left-[3px] top-[17%] w-[3px] h-[5%] rounded-l-sm ${chassis.button}`} />
          <div className={`absolute -left-[3px] top-[25%] w-[3px] h-[8%] rounded-l-sm ${chassis.button}`} />
          <div className={`absolute -left-[3px] top-[35%] w-[3px] h-[8%] rounded-l-sm ${chassis.button}`} />
          {/* Droite : bouton latéral et commande de l'appareil photo */}
          <div className={`absolute -right-[3px] top-[26%] w-[3px] h-[12%] rounded-r-sm ${chassis.button}`} />
          <div className={`absolute -right-[2px] top-[56%] w-[2px] h-[6%] rounded-r-sm ${chassis.button} opacity-80`} />

          {/* Écran */}
          <div
            className="relative rounded-[13%/6%] overflow-hidden aspect-[1206/2622] bg-black cursor-pointer group shadow-inner"
            onClick={onClickImage}
          >
            {/* Dynamic Island (plus étroite que sur les modèles précédents) */}
            <div className="absolute top-[1.6%] left-1/2 -translate-x-1/2 z-30 w-[27%] aspect-[3.6/1] bg-black rounded-full flex items-center justify-end pr-[4%] border border-white/[0.06]">
              <div className="w-[16%] aspect-square rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center">
                <div className="w-1/2 h-1/2 rounded-full bg-blue-900/70" />
              </div>
            </div>

            {/* Barre d'état, puis la capture en dessous : le haut du site n'est plus caché par la Dynamic Island */}
            <PhoneStatusBar bg={statusBg} ratio={(0.064 * 2622) / 1206} />
            <div className="absolute inset-x-0 bottom-0 top-[6.4%] overflow-hidden" style={{ background: statusBg }}>
              {renderScreen('group-hover:scale-[1.02]')}
            </div>

            {/* Barre d'accueil */}
            <div className="absolute bottom-[1.2%] left-1/2 -translate-x-1/2 z-30 w-[36%] h-[0.45%] min-h-[3px] bg-white/45 rounded-full backdrop-blur-md" />
          </div>
        </div>
      </div>
    );
  }

  // 4b. Téléphone Android générique (caméra centrale percée, bords fins)
  if (type === 'android') {
    return (
      <div className="w-full flex justify-center select-none py-2">
        <div className={`w-full ${fill ? 'max-w-none' : 'max-w-[270px] sm:max-w-[290px]'} relative rounded-[34px] p-[5px] shadow-2xl border ${chassis.body}`}>
          {/* Boutons latéraux (volume + alimentation à droite) */}
          <div className={`absolute -right-[3px] top-24 w-[3px] h-14 rounded-r-sm ${chassis.button}`} />
          <div className={`absolute -right-[3px] top-44 w-[3px] h-8 rounded-r-sm ${chassis.button}`} />

          <div
            className="relative rounded-[29px] overflow-hidden aspect-[9/20] bg-black cursor-pointer group shadow-inner"
            onClick={onClickImage}
          >
            {/* Caméra frontale percée */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-3 h-3 rounded-full bg-black border border-white/10 shadow-md" />
            <PhoneStatusBar bg={statusBg} ratio={(0.055 * 20) / 9} />
            <div className="absolute inset-x-0 bottom-0 top-[5.5%] overflow-hidden" style={{ background: statusBg }}>
              {renderScreen('group-hover:scale-[1.02]')}
            </div>
            {/* Barre de navigation par gestes */}
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30 w-24 h-1 bg-white/40 rounded-full backdrop-blur-md" />
          </div>
        </div>
      </div>
    );
  }

  // 5. Cadre iMac 24" (Desktop tout-en-un avec menton aluminium et pied)
  if (type === 'imac') {
    return (
      <div className="w-full flex flex-col items-center select-none py-1">
        {/* Écran iMac & Menton aluminium */}
        <div className="w-full bg-stone-900 border-[8px] border-stone-800 rounded-t-2xl sm:rounded-t-3xl shadow-2xl relative overflow-hidden flex flex-col">
          {/* Caméra FaceTime en haut */}
          <div className="absolute top-1.5 left-1/2 -translate-x-1/2 z-20 w-1.5 h-1.5 rounded-full bg-stone-950 border border-stone-700 flex items-center justify-center">
            <div className="w-0.5 h-0.5 rounded-full bg-emerald-500/80" />
          </div>

          {/* Dalle de l'écran 16:9 */}
          <div
            className="relative aspect-[16/9] bg-black overflow-hidden cursor-pointer group"
            onClick={onClickImage}
          >
            {renderScreen()}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent pointer-events-none" />
          </div>

          {/* Menton Aluminium iMac bas de dalle */}
          <div className="h-6 sm:h-8 bg-gradient-to-r from-stone-200 via-stone-300 to-stone-200 border-t border-stone-400 flex items-center justify-center shadow-inner">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-400/80 border border-stone-500/50 shadow-2xs" />
          </div>
        </div>

        {/* Pied et socle iMac */}
        <div className="w-28 sm:w-36 h-10 sm:h-12 bg-gradient-to-b from-stone-300 via-stone-400 to-stone-300 rounded-b-xl border-t border-stone-400 shadow-xl flex items-end justify-center">
          <div className="w-full h-1 bg-stone-400 rounded-b-xl" />
        </div>
      </div>
    );
  }

  // 6. Cadre Apple Watch Ultra / Series
  if (type === 'watch') {
    return (
      <div className="w-full flex justify-center select-none py-2">
        <div className={`w-full ${fill ? 'max-w-none' : 'max-w-[230px] sm:max-w-[250px]'} flex flex-col items-center`}>
          {/* Attache bracelet haut */}
          <div className="w-28 sm:w-32 h-3 sm:h-4 bg-gradient-to-b from-stone-800 to-stone-700 rounded-t-lg shadow-sm border-t border-stone-600" />

          {/* Boîtier principal Apple Watch */}
          <div className={`w-full relative rounded-[38px] sm:rounded-[44px] p-[8px] sm:p-[10px] shadow-2xl border-2 ${chassis.body}`}>
            {/* Couronne numérique à droite */}
            <div className="absolute -right-[7px] top-10 w-[7px] h-9 bg-gradient-to-b from-stone-500 via-stone-600 to-stone-500 rounded-r-md border border-stone-400 shadow-sm flex items-center justify-center">
              <div className="w-1 h-7 bg-stone-800/80 rounded-full" />
            </div>

            {/* Bouton latéral droit */}
            <div className="absolute -right-[5px] top-24 w-[5px] h-8 bg-stone-600 rounded-r-xs border border-stone-500" />

            {/* Écran montre tactile */}
            <div
              className="relative rounded-[30px] sm:rounded-[34px] overflow-hidden aspect-[4/5] bg-black cursor-pointer group shadow-inner"
              onClick={onClickImage}
            >
              {renderScreen('group-hover:scale-[1.02]')}
            </div>
          </div>

          {/* Attache bracelet bas */}
          <div className="w-28 sm:w-32 h-3 sm:h-4 bg-gradient-to-b from-stone-700 to-stone-800 rounded-b-lg shadow-sm border-b border-stone-600" />
        </div>
      </div>
    );
  }

  // 7. Cadre Flat / Borderless (Très populaire sur Shots.so pour un look épuré)
  return (
    <div
      className={`w-full overflow-hidden transition-all select-none border border-black/10 dark:border-white/10 ${radiusClass} ${
        styleVariant === 'glass'
          ? 'p-2 sm:p-3 bg-white/25 dark:bg-black/25 backdrop-blur-md shadow-2xl'
          : styleVariant === 'inset'
          ? 'p-1.5 sm:p-2 bg-stone-200/50 dark:bg-stone-800/50 shadow-inner'
          : 'shadow-2xl'
      }`}
      onClick={onClickImage}
    >
      <div className={`relative aspect-[16/10] overflow-hidden ${innerRadiusClass} bg-stone-100 group`}>
        {renderScreen()}
      </div>
    </div>
  );
};
