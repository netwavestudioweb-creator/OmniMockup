'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { toPng, toBlob } from 'html-to-image';
import {
  CaptureItemResult,
  MockupType,
  SceneAspectRatio,
  SceneTextLayer,
  SceneLogoLayer,
  SceneConfig,
} from '@/types/analyzer';
import { MockupFrame } from './MockupFrame';
import {
  Download,
  Sparkles,
  Palette,
  Type,
  Image as ImageIcon,
  Move,
  RotateCw,
  Sliders,
  Trash2,
  Plus,
  RefreshCw,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Layers,
  Check,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  SunMedium,
  Moon,
  Sun,
  Copy,
  RotateCcw,
  Sparkle,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface SceneEditorProps {
  captureItem: CaptureItemResult;
  initialMockup?: MockupType;
  onClose?: () => void;
}

// Palettes prédéfinies luxueuses style macOS / Apple Wallpapers / Shots.so
const GRADIENT_PRESETS = [
  {
    name: 'macOS Sonoma Flow',
    value: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 25%, #db2777 50%, #f97316 75%, #06b6d4 100%)',
  },
  {
    name: 'Tahoe Warm Sunset',
    value: 'linear-gradient(135deg, #f97316 0%, #ea580c 30%, #c2410c 60%, #7c2d12 100%)',
  },
  {
    name: 'Big Sur Pacific',
    value: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #0f172a 100%)',
  },
  {
    name: 'Ventura Amber',
    value: 'linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #b45309 70%, #78350f 100%)',
  },
  {
    name: 'Aurora Borealis Glow',
    value: 'linear-gradient(135deg, #047857 0%, #0d9488 40%, #0e7490 70%, #1e1b4b 100%)',
  },
  {
    name: 'Dark Obsidian Studio',
    value: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
  },
  {
    name: 'Clean Dune Sand',
    value: 'linear-gradient(135deg, #fdfbf7 0%, #f4efe6 50%, #eae3d2 100%)',
  },
  {
    name: 'Rose Quartz & Amethyst',
    value: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #6366f1 100%)',
  },
  {
    name: 'Cyberpunk Neon',
    value: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
  },
];

const SOLID_PRESETS = [
  { name: 'Terracotta Riche', value: '#b85433' },
  { name: 'Brun Chaud', value: '#693121' },
  { name: 'Sable Clair', value: '#f5f3ee' },
  { name: 'Lin Épuré', value: '#eae6de' },
  { name: 'Blanc Pur', value: '#ffffff' },
  { name: 'Noir Studio', value: '#09090b' },
  { name: 'Charbon Pierre', value: '#1c1917' },
  { name: 'Vert Forêt', value: '#064e3b' },
  { name: 'Bleu Minéral', value: '#0f172a' },
];

const RATIO_PRESETS: { id: SceneAspectRatio; label: string; ratioClass: string; desc: string }[] = [
  { id: '16:9', label: 'Twitter / X', ratioClass: 'aspect-[16/9]', desc: '16:9 Bannière' },
  { id: '1:1', label: 'Instagram', ratioClass: 'aspect-square', desc: '1:1 Post carré' },
  { id: 'libre', label: 'Web Libre', ratioClass: 'aspect-[16/10]', desc: '16:10 Format web' },
  { id: '4:3', label: 'Dribbble', ratioClass: 'aspect-[4/3]', desc: '4:3 Showcase' },
  { id: '9:16', label: 'Story / Reel', ratioClass: 'aspect-[9/16]', desc: '9:16 Mobile' },
];

export const SceneEditor: React.FC<SceneEditorProps> = ({
  captureItem,
  initialMockup = 'browser',
  onClose,
}) => {
  // Configuration d'état de la scène avec paramètres 3D Shots.so
  const [config, setConfig] = useState<SceneConfig>({
    aspectRatio: '16:9',
    bgType: 'gradient',
    bgValue: GRADIENT_PRESETS[0].value,
    bgTransparent: false,
    bgNoise: false,
    mockupType: initialMockup,
    deviceTheme: 'light',
    deviceStyle: 'default',
    cornerRadius: 'curved',
    mockupX: 0,
    mockupY: 0,
    mockupScale: 85,
    mockupRotation: 0,
    mockupTiltX: 0,
    mockupTiltY: 0,
    framePadding: 8,
    shadowEnabled: true,
    shadowIntensity: 65,
    exportScale: 2,
    texts: [],
    logos: [],
  });

  // Navigation dans les onglets du studio
  const [activeTab, setActiveTab] = useState<'mockup' | 'frame' | 'text' | 'logo'>('mockup');
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [customColor, setCustomColor] = useState('#f5f3ee');
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);

  // Référence DOM de la scène pour capture html-to-image
  const sceneRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Gestion du Drag and drop tactile & souris
  const [draggingTarget, setDraggingTarget] = useState<'mockup' | { type: 'text'; id: string } | { type: 'logo'; id: string } | null>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number }>({
    clientX: 0,
    clientY: 0,
    initialX: 0,
    initialY: 0,
  });

  const handlePointerDown = (
    e: React.PointerEvent,
    target: 'mockup' | { type: 'text'; id: string } | { type: 'logo'; id: string }
  ) => {
    e.stopPropagation();
    setDraggingTarget(target);

    if (target === 'mockup') {
      dragStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        initialX: config.mockupX,
        initialY: config.mockupY,
      };
      setActiveTab('mockup');
    } else if (typeof target === 'object' && target.type === 'text') {
      const txt = config.texts.find((t) => t.id === target.id);
      if (txt) {
        dragStartRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          initialX: txt.x,
          initialY: txt.y,
        };
        setSelectedTextId(target.id);
        setActiveTab('text');
      }
    } else if (typeof target === 'object' && target.type === 'logo') {
      const lg = config.logos.find((l) => l.id === target.id);
      if (lg) {
        dragStartRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          initialX: lg.x,
          initialY: lg.y,
        };
        setSelectedLogoId(target.id);
        setActiveTab('logo');
      }
    }
  };

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingTarget || !sceneRef.current) return;

    const sceneRect = sceneRef.current.getBoundingClientRect();
    const deltaXPercent = ((e.clientX - dragStartRef.current.clientX) / sceneRect.width) * 100;
    const deltaYPercent = ((e.clientY - dragStartRef.current.clientY) / sceneRect.height) * 100;

    if (draggingTarget === 'mockup') {
      const newX = Math.max(-50, Math.min(50, dragStartRef.current.initialX + deltaXPercent));
      const newY = Math.max(-50, Math.min(50, dragStartRef.current.initialY + deltaYPercent));
      setConfig((prev) => ({ ...prev, mockupX: Math.round(newX), mockupY: Math.round(newY) }));
    } else if (typeof draggingTarget === 'object' && draggingTarget.type === 'text') {
      const targetId = draggingTarget.id;
      const newX = Math.max(0, Math.min(95, dragStartRef.current.initialX + deltaXPercent));
      const newY = Math.max(0, Math.min(95, dragStartRef.current.initialY + deltaYPercent));
      setConfig((prev) => ({
        ...prev,
        texts: prev.texts.map((t) => (t.id === targetId ? { ...t, x: Math.round(newX), y: Math.round(newY) } : t)),
      }));
    } else if (typeof draggingTarget === 'object' && draggingTarget.type === 'logo') {
      const targetId = draggingTarget.id;
      const newX = Math.max(0, Math.min(95, dragStartRef.current.initialX + deltaXPercent));
      const newY = Math.max(0, Math.min(95, dragStartRef.current.initialY + deltaYPercent));
      setConfig((prev) => ({
        ...prev,
        logos: prev.logos.map((l) => (l.id === targetId ? { ...l, x: Math.round(newX), y: Math.round(newY) } : l)),
      }));
    }
  }, [draggingTarget]);

  const handlePointerUp = useCallback(() => {
    setDraggingTarget(null);
  }, []);

  useEffect(() => {
    if (draggingTarget) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      return () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [draggingTarget, handlePointerMove, handlePointerUp]);

  // Réinitialisation 3D rapide
  const handleReset3D = () => {
    setConfig((prev) => ({
      ...prev,
      mockupX: 0,
      mockupY: 0,
      mockupScale: 85,
      mockupRotation: 0,
      mockupTiltX: 0,
      mockupTiltY: 0,
      framePadding: 8,
    }));
  };

  // Copie dans le presse-papier (Clipboard API instantané)
  const handleCopyToClipboard = async () => {
    if (!sceneRef.current || isCopying) return;
    setIsCopying(true);
    setCopySuccess(false);

    try {
      const prevText = selectedTextId;
      const prevLogo = selectedLogoId;
      setSelectedTextId(null);
      setSelectedLogoId(null);

      await new Promise((r) => setTimeout(r, 80));

      const blob = await toBlob(sceneRef.current, {
        pixelRatio: config.exportScale || 2,
        cacheBust: true,
        backgroundColor: config.bgTransparent ? undefined : undefined,
      });

      if (!blob) throw new Error("Impossible de générer l'image");

      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': blob,
        }),
      ]);

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);

      setSelectedTextId(prevText);
      setSelectedLogoId(prevLogo);
    } catch (err) {
      console.error('Erreur copie presse-papier:', err);
      alert("Votre navigateur requiert l'autorisation pour copier l'image. Utilisez le bouton Télécharger si nécessaire.");
    } finally {
      setIsCopying(false);
    }
  };

  // Exportation complète de la composition
  const handleExportPng = async () => {
    if (!sceneRef.current || isExporting) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const prevText = selectedTextId;
      const prevLogo = selectedLogoId;
      setSelectedTextId(null);
      setSelectedLogoId(null);

      await new Promise((r) => setTimeout(r, 100));

      const dataUrl = await toPng(sceneRef.current, {
        pixelRatio: config.exportScale || 2,
        cacheBust: true,
        backgroundColor: config.bgTransparent ? undefined : undefined,
      });

      const link = document.createElement('a');
      const cleanUrl = captureItem.url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
      link.download = `mockup_${config.mockupType}_${config.aspectRatio}_${config.exportScale || 2}x_${cleanUrl}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);

      setSelectedTextId(prevText);
      setSelectedLogoId(prevLogo);
    } catch (err) {
      console.error('Erreur export PNG:', err);
      alert("Une erreur est survenue lors de l'export PNG. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  // Ajout & gestion de texte
  const handleAddText = () => {
    const newText: SceneTextLayer = {
      id: `text_${Date.now()}`,
      text: 'Titre de votre visuel marketing',
      x: 50,
      y: 15,
      fontSize: 26,
      fontFamily: 'font-sans',
      color: '#ffffff',
      fontWeight: 'bold',
      align: 'center',
    };
    setConfig((prev) => ({ ...prev, texts: [...prev.texts, newText] }));
    setSelectedTextId(newText.id);
    setActiveTab('text');
  };

  const handleUpdateText = (id: string, updates: Partial<SceneTextLayer>) => {
    setConfig((prev) => ({
      ...prev,
      texts: prev.texts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  };

  const handleDeleteText = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      texts: prev.texts.filter((t) => t.id !== id),
    }));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  // Ajout & gestion de logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const newLogo: SceneLogoLayer = {
        id: `logo_${Date.now()}`,
        src: base64,
        x: 10,
        y: 10,
        width: 80,
        opacity: 1,
      };
      setConfig((prev) => ({ ...prev, logos: [...prev.logos, newLogo] }));
      setSelectedLogoId(newLogo.id);
      setActiveTab('logo');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUpdateLogo = (id: string, updates: Partial<SceneLogoLayer>) => {
    setConfig((prev) => ({
      ...prev,
      logos: prev.logos.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    }));
  };

  const handleDeleteLogo = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      logos: prev.logos.filter((l) => l.id !== id),
    }));
    if (selectedLogoId === id) setSelectedLogoId(null);
  };

  const activeRatioConfig = RATIO_PRESETS.find((r) => r.id === config.aspectRatio) || RATIO_PRESETS[0];
  const activeText = config.texts.find((t) => t.id === selectedTextId);
  const activeLogo = config.logos.find((l) => l.id === selectedLogoId);

  // Calcul du drop shadow multi-couche réaliste
  const dynamicShadow = config.shadowEnabled
    ? `0px ${Math.round(config.shadowIntensity * 0.35)}px ${Math.round(
        config.shadowIntensity * 0.7
      )}px rgba(0, 0, 0, ${(config.shadowIntensity * 0.006).toFixed(2)}), 0px ${Math.round(
        config.shadowIntensity * 0.15
      )}px ${Math.round(config.shadowIntensity * 0.3)}px rgba(0, 0, 0, ${(
        config.shadowIntensity * 0.004
      ).toFixed(2)})`
    : 'none';

  return (
    <div className="w-full rounded-3xl bg-white border border-sand-200 shadow-md overflow-hidden animate-fade-in" id="scene-editor">
      {/* 1. BARRE DE COMMANDE SUPÉRIEURE PRO (Shots.so Style) */}
      <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-sand-200 bg-sand-50/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="p-2 rounded-xl bg-violet-600 text-white shadow-xs">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-lg font-bold text-stone-900 tracking-tight">
                Studio de Scène & Mockup
              </h3>
              <span className="hidden xs:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-800 border border-violet-200 text-[10px] sm:text-xs font-semibold">
                <Sparkle className="w-3 h-3 text-violet-600" />
                <span>3D Shots Engine</span>
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-stone-500 hidden sm:block">
              Ajustez l&apos;angle 3D, le cadre, les fonds Apple et exportez en Ultra-HD ou copiez directement.
            </p>
          </div>
        </div>

        {/* Boutons d'actions rapides et export */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Bouton Réinitialiser 3D */}
          <button
            type="button"
            onClick={handleReset3D}
            className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white hover:bg-sand-100 text-stone-600 hover:text-stone-900 border border-sand-200 text-xs font-semibold transition-all shadow-2xs"
            title="Recentrer et réinitialiser les angles 3D à plat"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Recentrer</span>
          </button>

          {/* Sélecteur de résolution (1x / 2x / 4x) */}
          <div className="flex items-center bg-white p-0.5 rounded-xl border border-sand-200 text-xs shadow-2xs">
            {([1, 2, 4] as const).map((scale) => (
              <button
                key={scale}
                type="button"
                onClick={() => setConfig((p) => ({ ...p, exportScale: scale }))}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  (config.exportScale || 2) === scale
                    ? 'bg-violet-600 text-white shadow-xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
                title={`Résolution d'export ${scale}x`}
              >
                {scale}x
              </button>
            ))}
          </div>

          {/* Bouton Copier dans le presse-papier */}
          <button
            type="button"
            onClick={handleCopyToClipboard}
            disabled={isCopying}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-sand-100 text-stone-700 hover:text-stone-900 border border-sand-200 text-xs font-semibold transition-all shadow-2xs disabled:opacity-50"
            title="Copier directement l'image dans le presse-papier pour la coller n'importe où"
          >
            {isCopying ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-600" />
            ) : copySuccess ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                <span className="text-emerald-700 font-bold hidden sm:inline">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-600" />
                <span className="hidden sm:inline">Copier</span>
              </>
            )}
          </button>

          {/* Bouton Télécharger PNG */}
          <button
            type="button"
            onClick={handleExportPng}
            disabled={isExporting}
            className="flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                <span>Rendu {config.exportScale || 2}x...</span>
              </>
            ) : exportSuccess ? (
              <>
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white stroke-[3]" />
                <span>Téléchargé !</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Télécharger</span>
              </>
            )}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-sand-100 transition-colors"
              title="Fermer le studio"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. DISPOSITION PRINCIPALE DU STUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px] lg:min-h-[660px]">
        {/* ZONE DE PRÉVISUALISATION CENTRALE (8 colonnes sur grand écran) */}
        <div className="lg:col-span-8 p-4 sm:p-6 lg:p-8 bg-[#ebe7e0] flex flex-col items-center justify-center relative overflow-hidden border-b lg:border-b-0 lg:border-r border-sand-200 select-none min-h-[360px] sm:min-h-[460px]">
          {/* Grille d'établi design */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, #000000 1.2px, transparent 1.2px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* CANVAS DE LA SCÈNE RENDU (Élément capturé par html-to-image) */}
          <div
            ref={sceneRef}
            className={`w-full max-w-2xl relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 flex items-center justify-center touch-none ${activeRatioConfig.ratioClass}`}
            style={{
              background: config.bgTransparent
                ? 'transparent'
                : config.bgValue,
              backgroundImage: config.bgTransparent
                ? `linear-gradient(45deg, #e4e4e7 25%, transparent 25%), linear-gradient(-45deg, #e4e4e7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #e4e4e7 75%), linear-gradient(-45deg, transparent 75%, #e4e4e7 75%)`
                : undefined,
              backgroundSize: config.bgTransparent ? '16px 16px' : undefined,
              backgroundPosition: config.bgTransparent ? '0 0, 0 8px, 8px -8px, -8px 0px' : undefined,
            }}
            onClick={() => {
              setSelectedTextId(null);
              setSelectedLogoId(null);
            }}
          >
            {/* Texture de grain de studio photo optionnelle */}
            {config.bgNoise && !config.bgTransparent && (
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.07] mix-blend-overlay z-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                }}
              />
            )}

            {/* MOCKUP 3D DANS LA SCÈNE (avec Tilt X/Y, Rotation Z, Padding, Drag & Drop) */}
            <div
              className={`absolute cursor-move transition-all duration-150 touch-none z-20 ${
                config.mockupType === 'iphone'
                  ? 'w-[45%]'
                  : config.mockupType === 'ipad'
                  ? 'w-[68%]'
                  : 'w-[80%]'
              }`}
              style={{
                left: '50%',
                top: '50%',
                perspective: '1200px',
                transform: `translate(-50%, -50%) translate(${config.mockupX}%, ${config.mockupY}%) scale(${
                  config.mockupScale / 100
                }) rotateX(${config.mockupTiltX || 0}deg) rotateY(${config.mockupTiltY || 0}deg) rotateZ(${
                  config.mockupRotation || 0
                }deg)`,
                transformStyle: 'preserve-3d',
                filter: config.shadowEnabled ? `drop-shadow(${dynamicShadow})` : undefined,
              }}
              onPointerDown={(e) => handlePointerDown(e, 'mockup')}
            >
              {captureItem.screenshotBase64 && (
                <MockupFrame
                  type={config.mockupType}
                  screenshotBase64={captureItem.screenshotBase64}
                  url={captureItem.url}
                  title={captureItem.title}
                  theme={config.deviceTheme}
                  styleVariant={config.deviceStyle}
                  cornerRadius={config.cornerRadius}
                />
              )}
            </div>

            {/* CALQUES DE TEXTES AJOUTÉS */}
            {config.texts.map((txt) => {
              const isSelected = selectedTextId === txt.id;
              return (
                <div
                  key={txt.id}
                  onPointerDown={(e) => handlePointerDown(e, { type: 'text', id: txt.id })}
                  className={`absolute cursor-move select-none p-2 rounded-lg transition-all group touch-none z-30 ${
                    isSelected ? 'ring-2 ring-violet-500 bg-black/20 backdrop-blur-xs' : 'hover:ring-1 hover:ring-white/50'
                  }`}
                  style={{
                    left: `${txt.x}%`,
                    top: `${txt.y}%`,
                    transform: 'translate(-50%, -50%)',
                    color: txt.color,
                    fontSize: `${txt.fontSize}px`,
                    fontWeight: txt.fontWeight === '900' ? 900 : txt.fontWeight === 'bold' ? 700 : txt.fontWeight === 'medium' ? 500 : 400,
                    textAlign: txt.align,
                  }}
                >
                  <span className="whitespace-pre-wrap leading-tight block drop-shadow-xs">{txt.text}</span>
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteText(txt.id);
                      }}
                      className="absolute -top-3 -right-3 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500"
                      title="Supprimer ce texte"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* CALQUES DE LOGOS / FILIGRANES */}
            {config.logos.map((lg) => {
              const isSelected = selectedLogoId === lg.id;
              return (
                <div
                  key={lg.id}
                  onPointerDown={(e) => handlePointerDown(e, { type: 'logo', id: lg.id })}
                  className={`absolute cursor-move select-none p-1 rounded-lg transition-all group touch-none z-30 ${
                    isSelected ? 'ring-2 ring-violet-500 bg-black/20 backdrop-blur-xs' : 'hover:ring-1 hover:ring-white/50'
                  }`}
                  style={{
                    left: `${lg.x}%`,
                    top: `${lg.y}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${lg.width}px`,
                    opacity: lg.opacity,
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={lg.src} alt="Logo de scène" className="w-full h-auto object-contain pointer-events-none drop-shadow-xs" />
                  {isSelected && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLogo(lg.id);
                      }}
                      className="absolute -top-3 -right-3 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500"
                      title="Supprimer ce logo"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Indication d'interaction en bas de la zone de scène */}
          <div className="mt-3.5 flex items-center gap-3 text-[11px] sm:text-xs text-stone-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-violet-600 shrink-0" />
              <span>Glissez pour déplacer</span>
            </span>
            <span>•</span>
            <span className="text-stone-400">Ratio {config.aspectRatio}</span>
          </div>
        </div>

        {/* 3. PANNEAU LATÉRAL DE CONTRÔLES (ONGLETS STYLE SHOTS.SO) */}
        <div className="lg:col-span-4 bg-white border-t lg:border-t-0 flex flex-col justify-between overflow-hidden">
          {/* Header Mobile plier/déplier */}
          <button
            type="button"
            onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
            className="lg:hidden w-full px-4 py-3 bg-sand-50 border-b border-sand-200 flex items-center justify-between text-stone-800 hover:bg-sand-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-600" />
              <span className="text-xs font-bold font-mono">
                {mobileSheetOpen ? 'Réduire les réglages' : 'Ouvrir les réglages (Mockup, Cadre, 3D, Textes)'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
              <span>{mobileSheetOpen ? 'Masquer' : 'Modifier'}</span>
              {mobileSheetOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </div>
          </button>

          {/* Contenu des réglages */}
          <div className={`${mobileSheetOpen ? 'flex' : 'hidden lg:flex'} flex-col justify-between p-4 sm:p-6 space-y-6 overflow-y-auto max-h-[72vh] lg:max-h-[750px]`}>
            <div className="space-y-6">
              {/* Sélecteur des 4 onglets */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-sand-100 border border-sand-200 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('mockup')}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'mockup' ? 'bg-violet-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Mockup</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('frame')}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'frame' ? 'bg-violet-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>Cadre</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('text')}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'text' ? 'bg-violet-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  <span>Texte</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('logo')}
                  className={`py-2 px-1 rounded-lg flex flex-col items-center gap-1 transition-all ${
                    activeTab === 'logo' ? 'bg-violet-600 text-white shadow-xs' : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Logo</span>
                </button>
              </div>

              {/* ONGLET 1 : MOCKUP & CONTRÔLES 3D */}
              {activeTab === 'mockup' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Modèle d'appareil (5 options) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                      Appareil & Modèle
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { type: 'browser' as MockupType, label: 'Web', icon: Monitor },
                        { type: 'macbook' as MockupType, label: 'MacBook', icon: Laptop },
                        { type: 'ipad' as MockupType, label: 'iPad', icon: Tablet },
                        { type: 'iphone' as MockupType, label: 'iPhone', icon: Smartphone },
                        { type: 'flat' as MockupType, label: 'Flat', icon: Layers },
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = config.mockupType === item.type;
                        return (
                          <button
                            key={item.type}
                            type="button"
                            onClick={() => setConfig((p) => ({ ...p, mockupType: item.type }))}
                            className={`py-2 px-1 rounded-xl border text-[11px] font-semibold flex flex-col items-center gap-1 transition-all ${
                              isSelected
                                ? 'bg-violet-600 text-white border-violet-600 shadow-xs'
                                : 'bg-sand-50 border-sand-200 text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="truncate">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Thème clair / sombre pour Navigateur & Rayon des coins */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-sand-50 border border-sand-200">
                    {/* Thème */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-stone-600 uppercase">Thème Cadre</span>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-sand-200">
                        <button
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, deviceTheme: 'light' }))}
                          className={`flex-1 py-1 px-1.5 rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-all ${
                            config.deviceTheme === 'light'
                              ? 'bg-violet-600 text-white font-bold'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <Sun className="w-3 h-3" />
                          <span>Clair</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, deviceTheme: 'dark' }))}
                          className={`flex-1 py-1 px-1.5 rounded flex items-center justify-center gap-1 text-[11px] font-medium transition-all ${
                            config.deviceTheme === 'dark'
                              ? 'bg-stone-900 text-white font-bold'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          <Moon className="w-3 h-3" />
                          <span>Sombre</span>
                        </button>
                      </div>
                    </div>

                    {/* Finition de cadre */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-stone-600 uppercase">Finition</span>
                      <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-sand-200">
                        {(['default', 'glass'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setConfig((p) => ({ ...p, deviceStyle: st }))}
                            className={`flex-1 py-1 px-1 rounded text-[11px] font-medium capitalize transition-all ${
                              config.deviceStyle === st
                                ? 'bg-violet-600 text-white font-bold'
                                : 'text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            {st === 'default' ? 'Standard' : 'Glass'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rayon d'angles (Sharp / Curved / Round) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-stone-700 uppercase">Rayon des angles</span>
                      <span className="text-violet-600 font-bold capitalize">{config.cornerRadius}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5 bg-sand-50 p-1 rounded-xl border border-sand-200">
                      {[
                        { id: 'sharp' as const, label: 'Sharp (0px)' },
                        { id: 'curved' as const, label: 'Curved (16px)' },
                        { id: 'round' as const, label: 'Round (28px)' },
                      ].map((cr) => (
                        <button
                          key={cr.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, cornerRadius: cr.id }))}
                          className={`py-1.5 px-2 rounded-lg text-xs transition-all ${
                            config.cornerRadius === cr.id
                              ? 'bg-violet-600 text-white font-bold shadow-xs'
                              : 'text-stone-600 hover:text-stone-900'
                          }`}
                        >
                          {cr.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SECTION 3D PERSPECTIVE (SIGNATURE SHOTS.SO) */}
                  <div className="space-y-3.5 p-3.5 rounded-2xl bg-gradient-to-b from-sand-50 to-sand-100/60 border border-sand-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                        <span className="text-xs font-bold text-stone-800 font-mono uppercase">
                          Perspective 3D Réelle
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, mockupTiltX: 0, mockupTiltY: 0, mockupRotation: 0 }))}
                        className="text-[10px] font-mono text-violet-600 hover:text-violet-800 font-bold"
                      >
                        Remettre à plat (0°)
                      </button>
                    </div>

                    {/* Inclinaison X (Pitch) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-600">
                        <span>Tilt Vertical (Haut / Bas)</span>
                        <span className="font-bold text-violet-700">{config.mockupTiltX || 0}°</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={config.mockupTiltX || 0}
                        onChange={(e) => setConfig((p) => ({ ...p, mockupTiltX: Number(e.target.value) }))}
                        className="w-full accent-violet-600 cursor-pointer h-1.5 bg-sand-200 rounded-lg"
                      />
                    </div>

                    {/* Inclinaison Y (Yaw) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-600">
                        <span>Tilt Horizontal (Gauche / Droite)</span>
                        <span className="font-bold text-violet-700">{config.mockupTiltY || 0}°</span>
                      </div>
                      <input
                        type="range"
                        min="-30"
                        max="30"
                        value={config.mockupTiltY || 0}
                        onChange={(e) => setConfig((p) => ({ ...p, mockupTiltY: Number(e.target.value) }))}
                        className="w-full accent-violet-600 cursor-pointer h-1.5 bg-sand-200 rounded-lg"
                      />
                    </div>

                    {/* Rotation Z (Roll) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono text-stone-600">
                        <span className="flex items-center gap-1">
                          <RotateCw className="w-3 h-3 text-stone-500" />
                          <span>Rotation Angulaire (Angle Z)</span>
                        </span>
                        <span className="font-bold text-violet-700">{config.mockupRotation || 0}°</span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        value={config.mockupRotation || 0}
                        onChange={(e) => setConfig((p) => ({ ...p, mockupRotation: Number(e.target.value) }))}
                        className="w-full accent-violet-600 cursor-pointer h-1.5 bg-sand-200 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Échelle / Zoom */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-stone-700 uppercase">Échelle & Taille</span>
                      <span className="text-violet-600 font-bold">{config.mockupScale}%</span>
                    </div>
                    <input
                      type="range"
                      min="40"
                      max="140"
                      value={config.mockupScale}
                      onChange={(e) => setConfig((p) => ({ ...p, mockupScale: Number(e.target.value) }))}
                      className="w-full accent-violet-600 cursor-pointer h-1.5 bg-sand-200 rounded-lg"
                    />
                  </div>

                  {/* Ombres portées 3D */}
                  <div className="space-y-3 p-3.5 rounded-2xl bg-sand-50 border border-sand-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <SunMedium className="w-4 h-4 text-amber-500" />
                        <span className="text-xs font-bold text-stone-800">Ombre Portée Studio</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, shadowEnabled: !p.shadowEnabled }))}
                        className={`w-10 h-5 rounded-full transition-colors relative ${
                          config.shadowEnabled ? 'bg-violet-600' : 'bg-sand-300'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                            config.shadowEnabled ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {config.shadowEnabled && (
                      <div className="space-y-2 pt-2 border-t border-sand-200">
                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono">
                          <span>Diffusion & Intensité</span>
                          <span className="text-violet-600 font-bold">{config.shadowIntensity}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={config.shadowIntensity}
                          onChange={(e) => setConfig((p) => ({ ...p, shadowIntensity: Number(e.target.value) }))}
                          className="w-full accent-violet-600 cursor-pointer h-1.5 bg-sand-200 rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ONGLET 2 : CADRE GLOBAL, RATIOS & FONDS MAGIQUES */}
              {activeTab === 'frame' && (
                <div className="space-y-5 animate-fade-in">
                  {/* Ratios d'aspect */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                      Format de Cadre (Ratios)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {RATIO_PRESETS.map((rp) => (
                        <button
                          key={rp.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, aspectRatio: rp.id }))}
                          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                            config.aspectRatio === rp.id
                              ? 'bg-violet-50/90 border-violet-500 text-violet-900 shadow-xs ring-1 ring-violet-200'
                              : 'bg-sand-50 border-sand-200 text-stone-600 hover:border-sand-300 hover:text-stone-900'
                          }`}
                        >
                          <span className="text-xs font-bold">{rp.label}</span>
                          <span className="text-[10px] text-stone-500 font-mono mt-0.5">{rp.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Options rapides de rendu : Fond transparent & Bruit de studio */}
                  <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-sand-50 border border-sand-200">
                    {/* Toggle Transparent */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-stone-800">Détouré</span>
                        <span className="text-[10px] text-stone-500 font-mono">Transparent</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, bgTransparent: !p.bgTransparent }))}
                        className={`w-9 h-5 rounded-full transition-colors relative ${
                          config.bgTransparent ? 'bg-violet-600' : 'bg-sand-300'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                            config.bgTransparent ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Toggle Texture Bruit / Grain */}
                    <div className="flex items-center justify-between border-l border-sand-200 pl-3">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-stone-800">Grain Studio</span>
                        <span className="text-[10px] text-stone-500 font-mono">Effet photo</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig((p) => ({ ...p, bgNoise: !p.bgNoise }))}
                        className={`w-9 h-5 rounded-full transition-colors relative ${
                          config.bgNoise ? 'bg-violet-600' : 'bg-sand-300'
                        }`}
                      >
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-white transition-transform ${
                            config.bgNoise ? 'translate-x-4.5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Dégradés prédéfinis Apple & Mesh Wallpapers */}
                  {!config.bgTransparent && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                          Fonds Magiques (Apple / Mesh)
                        </label>
                        <span className="text-[10px] text-violet-600 font-bold font-mono">9 Présélections</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {GRADIENT_PRESETS.map((grad, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setConfig((p) => ({ ...p, bgType: 'gradient', bgValue: grad.value, bgTransparent: false }))}
                            className={`h-12 rounded-xl relative transition-all group overflow-hidden border ${
                              !config.bgTransparent && config.bgValue === grad.value
                                ? 'ring-2 ring-violet-600 border-white shadow-md scale-[1.03]'
                                : 'border-sand-300 hover:border-sand-400'
                            }`}
                            style={{ background: grad.value }}
                            title={grad.name}
                          >
                            {!config.bgTransparent && config.bgValue === grad.value && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                <Check className="w-4 h-4 text-white drop-shadow-sm stroke-[3]" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Couleurs unies */}
                  {!config.bgTransparent && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                        Couleurs Minimalistes
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {SOLID_PRESETS.map((col, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setConfig((p) => ({ ...p, bgType: 'solid', bgValue: col.value, bgTransparent: false }))}
                            className={`h-9 rounded-xl relative transition-all border ${
                              !config.bgTransparent && config.bgValue === col.value
                                ? 'ring-2 ring-violet-600 border-white shadow-md scale-105'
                                : 'border-sand-300 hover:border-sand-400'
                            }`}
                            style={{ background: col.value }}
                            title={col.name}
                          >
                            {!config.bgTransparent && config.bgValue === col.value && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Check
                                  className={`w-3.5 h-3.5 drop-shadow-sm ${
                                    col.value === '#ffffff' || col.value === '#f5f3ee' || col.value === '#eae6de'
                                      ? 'text-stone-900'
                                      : 'text-white'
                                  }`}
                                />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sélecteur de couleur personnalisée */}
                  {!config.bgTransparent && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                        Couleur Hexadécimale Personnalisée
                      </label>
                      <div className="flex items-center gap-3 p-2 rounded-xl bg-sand-50 border border-sand-200">
                        <input
                          type="color"
                          value={customColor}
                          onChange={(e) => {
                            setCustomColor(e.target.value);
                            setConfig((p) => ({ ...p, bgType: 'solid', bgValue: e.target.value, bgTransparent: false }));
                          }}
                          className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none"
                        />
                        <input
                          type="text"
                          value={config.bgValue.startsWith('#') ? config.bgValue : customColor}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomColor(val);
                            if (val.match(/^#[0-9A-Fa-f]{6}$/)) {
                              setConfig((p) => ({ ...p, bgType: 'solid', bgValue: val, bgTransparent: false }));
                            }
                          }}
                          placeholder="#7c3aed"
                          className="flex-1 bg-transparent text-xs font-mono text-stone-800 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ONGLET 3 : GESTION DES TEXTES */}
              {activeTab === 'text' && (
                <div className="space-y-6 animate-fade-in">
                  <button
                    type="button"
                    onClick={handleAddText}
                    className="w-full py-2.5 px-4 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
                  >
                    <Plus className="w-4 h-4 text-violet-600" />
                    <span>Ajouter un calque de texte</span>
                  </button>

                  {config.texts.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                        Calques de texte ({config.texts.length})
                      </label>
                      <div className="flex flex-col gap-2">
                        {config.texts.map((t, index) => (
                          <div
                            key={t.id}
                            onClick={() => setSelectedTextId(t.id)}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              selectedTextId === t.id
                                ? 'bg-violet-50 border-violet-400 text-stone-900 ring-1 ring-violet-200'
                                : 'bg-sand-50 border-sand-200 text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            <span className="text-xs truncate max-w-[180px] font-medium">
                              {t.text || `Texte ${index + 1}`}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteText(t.id);
                              }}
                              className="text-stone-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Paramètres du texte sélectionné */}
                  {activeText ? (
                    <div className="p-4 rounded-2xl bg-sand-50 border border-sand-200 space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-mono text-stone-600">Contenu du texte</label>
                        <textarea
                          rows={2}
                          value={activeText.text}
                          onChange={(e) => handleUpdateText(activeText.id, { text: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-white border border-sand-200 text-xs text-stone-900 outline-none focus:border-violet-500 resize-none shadow-2xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono text-stone-600">Taille ({activeText.fontSize}px)</label>
                          <input
                            type="range"
                            min="14"
                            max="64"
                            value={activeText.fontSize}
                            onChange={(e) => handleUpdateText(activeText.id, { fontSize: Number(e.target.value) })}
                            className="w-full accent-violet-600 h-1.5 bg-sand-200 rounded-lg"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[11px] font-mono text-stone-600">Couleur</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={activeText.color}
                              onChange={(e) => handleUpdateText(activeText.id, { color: e.target.value })}
                              className="w-7 h-7 rounded cursor-pointer bg-transparent border-none"
                            />
                            <input
                              type="text"
                              value={activeText.color}
                              onChange={(e) => handleUpdateText(activeText.id, { color: e.target.value })}
                              className="w-full bg-white px-2 py-1 rounded text-xs font-mono text-stone-800 border border-sand-200"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-sand-200">
                        <div className="flex items-center bg-white p-1 rounded-lg border border-sand-200">
                          <button
                            type="button"
                            onClick={() => handleUpdateText(activeText.id, { align: 'left' })}
                            className={`p-1.5 rounded ${activeText.align === 'left' ? 'bg-violet-600 text-white' : 'text-stone-500'}`}
                          >
                            <AlignLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateText(activeText.id, { align: 'center' })}
                            className={`p-1.5 rounded ${activeText.align === 'center' ? 'bg-violet-600 text-white' : 'text-stone-500'}`}
                          >
                            <AlignCenter className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateText(activeText.id, { align: 'right' })}
                            className={`p-1.5 rounded ${activeText.align === 'right' ? 'bg-violet-600 text-white' : 'text-stone-500'}`}
                          >
                            <AlignRight className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateText(activeText.id, {
                              fontWeight: activeText.fontWeight === 'bold' ? 'normal' : 'bold',
                            })
                          }
                          className={`px-3 py-1.5 rounded-lg border text-xs flex items-center gap-1 font-semibold ${
                            activeText.fontWeight === 'bold'
                              ? 'bg-violet-600 text-white border-violet-600'
                              : 'bg-white text-stone-600 border-sand-200'
                          }`}
                        >
                          <Bold className="w-3 h-3" />
                          <span>Gras</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 text-center py-4">
                      Sélectionnez un texte sur la scène ou ajoutez-en un nouveau.
                    </p>
                  )}
                </div>
              )}

              {/* ONGLET 4 : GESTION DES LOGOS & FILIGRANES */}
              {activeTab === 'logo' && (
                <div className="space-y-6 animate-fade-in">
                  <input
                    type="file"
                    accept="image/png,image/svg+xml,image/jpeg,image/webp"
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-violet-50 hover:bg-violet-100 text-violet-800 border border-violet-200 font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs"
                  >
                    <Plus className="w-4 h-4 text-violet-600" />
                    <span>Uploader un Logo (PNG / SVG)</span>
                  </button>

                  {config.logos.length > 0 && (
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                        Logos insérés ({config.logos.length})
                      </label>
                      <div className="flex flex-col gap-2">
                        {config.logos.map((l, index) => (
                          <div
                            key={l.id}
                            onClick={() => setSelectedLogoId(l.id)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              selectedLogoId === l.id
                                ? 'bg-violet-50 border-violet-400 text-stone-900 ring-1 ring-violet-200'
                                : 'bg-sand-50 border-sand-200 text-stone-600 hover:text-stone-900'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={l.src} alt="logo preview" className="w-6 h-6 object-contain rounded" />
                              <span className="text-xs font-medium">Logo #{index + 1}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteLogo(l.id);
                              }}
                              className="text-stone-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeLogo ? (
                    <div className="p-4 rounded-2xl bg-sand-50 border border-sand-200 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-stone-600">Largeur ({activeLogo.width}px)</span>
                          <span className="font-mono text-violet-600 font-bold">{activeLogo.width}px</span>
                        </div>
                        <input
                          type="range"
                          min="30"
                          max="240"
                          value={activeLogo.width}
                          onChange={(e) => handleUpdateLogo(activeLogo.id, { width: Number(e.target.value) })}
                          className="w-full accent-violet-600 h-1.5 bg-sand-200 rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono text-stone-600">Opacité</span>
                          <span className="font-mono text-violet-600 font-bold">{Math.round(activeLogo.opacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="100"
                          value={Math.round(activeLogo.opacity * 100)}
                          onChange={(e) => handleUpdateLogo(activeLogo.id, { opacity: Number(e.target.value) / 100 })}
                          className="w-full accent-violet-600 h-1.5 bg-sand-200 rounded-lg"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-stone-500 text-center py-4">
                      Importez un logo ou sélectionnez-en un pour ajuster sa taille.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Pied du panneau de contrôle */}
            <div className="pt-4 border-t border-sand-200 space-y-2">
              <button
                type="button"
                onClick={handleExportPng}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Rendu {config.exportScale || 2}x en cours...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Télécharger la composition ({config.exportScale || 2}x PNG)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
