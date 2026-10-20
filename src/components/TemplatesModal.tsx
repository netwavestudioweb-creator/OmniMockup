'use client';

import React, { useEffect, useState } from 'react';
import { TEMPLATES_CATALOG, TEMPLATE_CATEGORIES, StudioTemplate } from '@/lib/shotsPresets';
import { X, Sparkles, ArrowRight, Monitor, Smartphone, Tablet, Layers } from 'lucide-react';

interface TemplatesModalProps {
  onSelectTemplate: (template: StudioTemplate) => void;
  onClose: () => void;
  /** Capture du site en cours : les aperçus montrent le vrai site du client */
  screenshot?: string;
}

const RATIO_CSS: Record<string, string> = {
  '1.91:1': '1200 / 627',
  '1:1': '1 / 1',
  '4:5': '4 / 5',
  '9:16': '9 / 16',
  '16:9': '16 / 9',
  '4:3': '4 / 3',
};

/** Mini écran : la capture du site, calée en haut */
const Screen: React.FC<{ src?: string; className?: string }> = ({ src, className = '' }) => (
  <div
    className={`bg-zinc-200 bg-cover bg-top ${className}`}
    style={src ? { backgroundImage: `url(${src})` } : undefined}
  />
);

const MiniPhone: React.FC<{ src?: string; width: string; style?: React.CSSProperties }> = ({ src, width, style }) => (
  <div className="rounded-[18%/8%] bg-neutral-900 p-[3%] shadow-xl" style={{ width, ...style }}>
    <Screen src={src} className="rounded-[15%/7%] aspect-[1206/2622]" />
  </div>
);

const MiniDesktop: React.FC<{ src?: string; width: string; dark?: boolean; laptop?: boolean; style?: React.CSSProperties }> = ({
  src,
  width,
  dark,
  laptop,
  style,
}) => (
  <div style={{ width, ...style }}>
    <div className={`rounded-md overflow-hidden shadow-xl border ${dark ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-200'}`}>
      <div className={`h-[7px] flex items-center gap-[2px] px-1 ${dark ? 'bg-zinc-800' : 'bg-zinc-100'}`}>
        <span className="w-[3px] h-[3px] rounded-full bg-rose-400" />
        <span className="w-[3px] h-[3px] rounded-full bg-amber-400" />
        <span className="w-[3px] h-[3px] rounded-full bg-emerald-400" />
      </div>
      <Screen src={src} className="aspect-[16/10]" />
    </div>
    {laptop && <div className="mx-[-6%] h-[5px] rounded-b-md bg-gradient-to-b from-zinc-300 to-zinc-500" />}
  </div>
);

/** Aperçu d'un modèle avec le site du client */
const TemplatePreview: React.FC<{ tmpl: StudioTemplate; src?: string }> = ({ tmpl, src }) => {
  const tilt = `perspective(600px) rotateX(${tmpl.mockupTiltX}deg) rotateY(${tmpl.mockupTiltY}deg) rotateZ(${tmpl.mockupRotation}deg)`;
  const dark = tmpl.browserStyle?.endsWith('dark');
  const layout = tmpl.layoutMode || 'single';
  return (
    <div
      className="relative w-full overflow-hidden rounded-xl border border-zinc-700/60 flex items-center justify-center"
      style={{ background: tmpl.bgValue, aspectRatio: RATIO_CSS[tmpl.aspectRatio] || '4 / 3', maxHeight: 220 }}
    >
      {tmpl.sceneOverlay === 'blinds' && (
        <div
          className="absolute inset-0 pointer-events-none opacity-30 blur-[3px]"
          style={{ backgroundImage: 'repeating-linear-gradient(-35deg, rgba(0,0,0,0.8) 0 10px, transparent 10px 20px)' }}
        />
      )}
      {(tmpl.sceneOverlay === 'leaves' || tmpl.sceneOverlay === 'palm') && (
        <div className="absolute -top-6 -left-6 w-1/2 h-1/2 bg-black/35 rounded-full blur-2xl pointer-events-none" />
      )}

      {layout === 'trio-ecosystem' ? (
        <div className="relative w-[78%] flex items-end justify-center">
          <MiniDesktop src={src} width="70%" laptop />
          <div className="absolute left-[2%] bottom-0 w-[24%] rounded-md bg-neutral-900 p-[1.5%] shadow-xl">
            <Screen src={src} className="rounded-sm aspect-[3/4]" />
          </div>
          <MiniPhone src={src} width="12%" style={{ position: 'absolute', right: '4%', bottom: 0 }} />
        </div>
      ) : layout === 'dual-stacked' ? (
        <div className="relative w-[72%] flex items-end">
          <MiniDesktop src={src} width="88%" laptop={tmpl.mockupType === 'macbook'} dark={dark} />
          <MiniPhone src={src} width="22%" style={{ position: 'absolute', right: 0, bottom: '-4%', transform: 'rotate(3deg)' }} />
        </div>
      ) : tmpl.mockupType === 'iphone' ? (
        <div style={{ transform: tilt }} className="h-[80%] flex items-center">
          <MiniPhone src={src} width="auto" style={{ height: '100%', aspectRatio: '1206 / 2700' }} />
        </div>
      ) : tmpl.mockupType === 'ipad' ? (
        <div style={{ transform: tilt }} className="w-[52%] rounded-lg bg-neutral-900 p-[1.5%] shadow-xl">
          <Screen src={src} className="rounded-md aspect-[4/3]" />
        </div>
      ) : tmpl.mockupType === 'flat' ? (
        <div style={{ transform: tilt }} className="w-[70%] rounded-lg overflow-hidden shadow-xl bg-white">
          <Screen src={src} className="aspect-[16/10]" />
        </div>
      ) : (
        <div style={{ transform: tilt }} className="w-[74%] flex justify-center">
          <MiniDesktop src={src} width="100%" dark={dark} laptop={tmpl.mockupType === 'macbook'} />
        </div>
      )}

      {tmpl.badge && (
        <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-pms-accent text-white">
          {tmpl.badge}
        </span>
      )}
    </div>
  );
};

/**
 * La capture (souvent 0,5 à 1 Mo en texte base64) est convertie une seule fois en adresse courte (blob:) :
 * sinon les 13 aperçus recopiaient chacun l'image entière dans la page.
 */
function useBlobUrl(dataUrl?: string) {
  const [url, setUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    if (!dataUrl) return;
    if (!dataUrl.startsWith('data:')) {
      setUrl(dataUrl);
      return;
    }
    let objectUrl: string | undefined;
    let cancelled = false;
    fetch(dataUrl)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => !cancelled && setUrl(dataUrl));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [dataUrl]);
  return url;
}

export const TemplatesModal: React.FC<TemplatesModalProps> = ({ onSelectTemplate, onClose, screenshot: rawScreenshot }) => {
  const screenshot = useBlobUrl(rawScreenshot);
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-[#141418] border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up">
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between gap-3 shrink-0 bg-zinc-900/60">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pms-accent-soft shrink-0" />
              <span>Modèles prêts à publier</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Choisissez où vous allez publier : l&apos;appareil, le fond et le format exact sont réglés d&apos;un coup.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
          {TEMPLATE_CATEGORIES.map((cat) => {
            const tmpls = TEMPLATES_CATALOG.filter((t) => t.category === cat.id);
            if (tmpls.length === 0) return null;
            return (
              <section key={cat.id} className="space-y-3">
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">{cat.label}</h3>
                  <p className="text-[11px] text-zinc-500">{cat.hint}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tmpls.map((tmpl) => {
                    const DeviceIcon =
                      tmpl.layoutMode && tmpl.layoutMode !== 'single'
                        ? Layers
                        : tmpl.mockupType === 'iphone'
                          ? Smartphone
                          : tmpl.mockupType === 'ipad'
                            ? Tablet
                            : Monitor;
                    return (
                      <button
                        type="button"
                        key={tmpl.id}
                        onClick={() => {
                          onSelectTemplate(tmpl);
                          onClose();
                        }}
                        className="group text-left rounded-2xl border border-zinc-800 hover:border-pms-accent bg-zinc-900/60 p-3 flex flex-col gap-3 transition-colors"
                      >
                        <TemplatePreview tmpl={tmpl} src={screenshot} />
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white group-hover:text-pms-accent-soft transition-colors">{tmpl.title}</h4>
                            <p className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                              <DeviceIcon className="w-3 h-3 text-zinc-500 shrink-0" />
                              <span className="truncate">{tmpl.deviceLabel}</span>
                            </p>
                            <p className="text-[11px] text-zinc-500 mt-1 leading-snug">{tmpl.description}</p>
                          </div>
                          <span className="p-2 rounded-xl bg-zinc-800 text-zinc-400 group-hover:bg-pms-accent group-hover:text-white transition-colors shrink-0">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};
