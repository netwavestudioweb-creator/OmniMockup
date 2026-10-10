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
};
import { Lock, ExternalLink, Globe, RotateCw, ArrowLeft, ArrowRight, Plus } from 'lucide-react';

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
  onClickImage,
  deviceColor = 'graphite',
  fill = false,
}) => {
  const chassis = DEVICE_BODY[deviceColor] || DEVICE_BODY.graphite;
  const [imageError, setImageError] = React.useState(false);

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
      return url;
    }
  }, [domainName, url]);

  const faviconSrc = React.useMemo(() => {
    // Toujours servie depuis notre domaine : une image d'un autre domaine fait échouer l'export
    if (faviconUrl && !faviconUrl.includes('google.com/s2/favicons')) return faviconUrl;
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
          <div className="w-12 h-12 rounded-2xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center mb-3">
            <Globe className="w-6 h-6 text-violet-400" />
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
        style={{ objectPosition: `center ${cropOffsetY}%` }}
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
              ? 'bg-[#121316] border-zinc-700/60 shadow-2xl text-zinc-200 ring-1 ring-violet-500/20'
              : 'bg-[#f4f3ef] border-zinc-300 shadow-2xl text-zinc-800 ring-1 ring-violet-300/30'
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
                <Lock className="w-3 h-3 text-violet-400 shrink-0" />
                <span className="truncate font-semibold">{cleanDomain}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-violet-400">
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
                className={`text-[10px] font-mono uppercase font-semibold tracking-wider ${
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

  // 4. Cadre iPhone 16 Pro avec Dynamic Island
  if (type === 'iphone') {
    return (
      <div className="w-full flex justify-center select-none py-2">
        <div className={`w-full ${fill ? 'max-w-none' : 'max-w-[270px] sm:max-w-[290px]'} relative rounded-[44px] sm:rounded-[48px] p-[7px] sm:p-[9px] shadow-2xl border ${chassis.body}`}>
          {/* Boutons latéraux iPhone */}
          <div className={`absolute -left-[3px] top-24 w-[3px] h-9 rounded-l-sm ${chassis.button}`} />
          <div className={`absolute -left-[3px] top-36 w-[3px] h-9 rounded-l-sm ${chassis.button}`} />
          <div className={`absolute -right-[3px] top-28 w-[3px] h-12 rounded-r-sm ${chassis.button}`} />

          {/* Écran tactile iPhone */}
          <div
            className="relative rounded-[36px] sm:rounded-[40px] overflow-hidden aspect-[9/19] bg-black cursor-pointer group shadow-inner"
            onClick={onClickImage}
          >
            {/* Dynamic Island Apple */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-30 w-24 sm:w-26 h-5.5 bg-black rounded-full flex items-center justify-between px-2.5 shadow-md border border-white/[0.08]">
              <div className="w-2.5 h-2.5 rounded-full bg-stone-950 border border-stone-800 flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-blue-900/70" />
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-500/90 animate-pulse" />
            </div>

            {/* Screenshot dans l'écran de l'iPhone */}
            {renderScreen('group-hover:scale-[1.02]')}

            {/* Barre d'accueil tactile */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-30 w-28 h-1 bg-white/40 rounded-full backdrop-blur-md" />
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
            {renderScreen('group-hover:scale-[1.02]')}
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
