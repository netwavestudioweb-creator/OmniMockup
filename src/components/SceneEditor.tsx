'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { toPng, toBlob } from 'html-to-image';
import {
  CaptureItemResult,
  MockupType,
  SceneAspectRatio,
  SceneTextLayer,
  SceneLogoLayer,
  SceneConfig,
  CornerRadius,
  VideoAnimPreset,
  FeatureCallout,
  SocialProofBadgeType,
  SceneSocialBadge,
} from '@/types/analyzer';
import { MockupFrame } from './MockupFrame';
import { useUser } from '@/context/UserContext';
import {
  Download,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Move,
  Sliders,
  Trash2,
  Plus,
  RefreshCw,
  Monitor,
  Laptop,
  Smartphone,
  Tablet,
  Check,
  X,
  Moon,
  Sun,
  Copy,
  RotateCcw,
  ChevronUp,
  ChevronDown,
  Video,
  Watch,
  Tv,
  Upload,
  Layers,
  ArrowLeft,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Camera,
  Layout,
  Eye,
  EyeOff,
  Globe,
  Lightbulb,
  ChevronRight,
  Droplets,
  Grid,
  Pipette,
  ImageUp,
  Flame,
  ChevronLeft,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Box,
  Type,
  Tag,
  ShieldCheck,
  Star,
  BadgeCheck,
  User as UserIcon,
  LogOut,
  CreditCard,
  Shield,
  Zap,
  Crown,
} from 'lucide-react';
import { TechStackPicker, AVAILABLE_TECHS } from './TechStackPicker';
import { DeveloperSalesKitModal } from './DeveloperSalesKitModal';
import {
  SOLID_COLORS,
  BACKGROUND_CATEGORIES,
  FRAME_PRESETS,
  FramePresetOption,
  StudioTemplate,
} from '@/lib/shotsPresets';
import { SceneShadowOverlay } from './SceneShadowOverlay';
import { FrameSizePopover } from './FrameSizePopover';
import { TemplatesModal } from './TemplatesModal';
import { SceneOverlayPreset } from '@/types/analyzer';

interface SceneEditorProps {
  captureItem: CaptureItemResult;
  initialMockup?: MockupType;
  onClose?: () => void;
}

// Fonction d'extraction automatique des couleurs dominantes de la capture (Fonds Magiques - ultra rapide <1ms)
function extractMagicGradients(base64Image: string): Promise<{ name: string; value: string }[]> {
  return new Promise((resolve) => {
    if (!base64Image) return resolve([]);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve([]);

        canvas.width = 16;
        canvas.height = 16;
        ctx.drawImage(img, 0, 0, 16, 16);

        const imgData = ctx.getImageData(0, 0, 16, 16).data;
        const colorCounts: { [key: string]: number } = {};

        for (let i = 0; i < imgData.length; i += 12) {
          const r = Math.floor(imgData[i] / 32) * 32;
          const g = Math.floor(imgData[i + 1] / 32) * 32;
          const b = Math.floor(imgData[i + 2] / 32) * 32;
          const a = imgData[i + 3];
          if (a < 128) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max - min < 15 && (max > 220 || max < 35)) continue;

          const rgbKey = `${r},${g},${b}`;
          colorCounts[rgbKey] = (colorCounts[rgbKey] || 0) + 1;
        }

        const sortedColors = Object.keys(colorCounts).sort((a, b) => colorCounts[b] - colorCounts[a]);

        const primaryRgb = sortedColors[0] || '124,58,237';
        const secondaryRgb = sortedColors[1] || '79,70,229';
        const tertiaryRgb = sortedColors[2] || '219,39,119';

        const c1 = `rgb(${primaryRgb})`;
        const c2 = `rgb(${secondaryRgb})`;
        const c3 = `rgb(${tertiaryRgb})`;

        resolve([
          { name: '✨ Magique : Harmonieux', value: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` },
          { name: '✨ Magique : Éclatant', value: `linear-gradient(135deg, ${c2} 0%, ${c3} 50%, ${c1} 100%)` },
          { name: '✨ Magique : Ambiance', value: `radial-gradient(circle, ${c1} 0%, ${c3} 100%)` },
        ]);
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = base64Image;
  });
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

const RATIO_PRESETS: { id: SceneAspectRatio; label: string; ratioClass: string; desc: string }[] = [
  { id: '16:9', label: '16:9', ratioClass: 'aspect-[16/9]', desc: 'Product Hunt & Twitter (16:9)' },
  { id: '1:1', label: '1:1', ratioClass: 'aspect-square', desc: 'Instagram & LinkedIn (1:1)' },
  { id: '4:3', label: '4:3', ratioClass: 'aspect-[4/3]', desc: 'Dribbble & Portfolio (4:3)' },
  { id: '9:16', label: '9:16', ratioClass: 'aspect-[9/16]', desc: 'Stories, Reels & Mobile (9:16)' },
  { id: '1.91:1', label: '1.91:1', ratioClass: 'aspect-[191/100]', desc: 'Bannière LinkedIn Pro (1.91:1)' },
  { id: 'libre', label: '16:10', ratioClass: 'aspect-[16/10]', desc: 'Écran Web Libre (16:10)' },
];

export const SceneEditor: React.FC<SceneEditorProps> = ({
  captureItem,
  initialMockup = 'browser',
  onClose,
}) => {
  const { user, profile, signOut, isPremiumUser } = useUser();
  const userPlan = profile?.plan || 'free';
  const isFreePlan = userPlan === 'free';
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Configuration d'état de la scène
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
    layoutMode: 'single',
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
    filterType: 'none',
    filterIntensity: 40,
    customWatermarkUrl: undefined,
    texts: [],
    logos: [],
    callouts: [],
    socialBadges: [],
  });

  // Zoom du canvas central
  const [canvasZoom, setCanvasZoom] = useState<number>(100);

  // Fonds magiques auto-générés à partir de l'image
  const [autoGradients, setAutoGradients] = useState<{ name: string; value: string }[]>([]);
  useEffect(() => {
    if (captureItem.screenshotBase64) {
      extractMagicGradients(captureItem.screenshotBase64).then((grads) => {
        setAutoGradients(grads);
      });
    }
  }, [captureItem.screenshotBase64]);

  // Navigation dans les onglets du studio
  const [activeTab, setActiveTab] = useState<'mockup' | 'frame' | '3d' | 'content' | 'branding' | 'callouts'>('mockup');
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [selectedCalloutId, setSelectedCalloutId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExportingPack, setIsExportingPack] = useState(false);
  const [packProgress, setPackProgress] = useState<string>('');
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(true);

  // État du Kit Vente & Pitch IA
  const [salesKitOpen, setSalesKitOpen] = useState(false);

  // Badges Stack Technique Développeur
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>(['nextjs', 'react', 'tailwind']);
  const [techPosition, setTechPosition] = useState<'bottom' | 'top' | 'floating'>('bottom');
  const [techThemeStyle, setTechThemeStyle] = useState<'dark-glass' | 'light-glass' | 'neon'>('dark-glass');

  // État de l'exportation vidéo animée
  const [videoPreset] = useState<VideoAnimPreset>('zoomIn');
  const [isExportingVideo, setIsExportingVideo] = useState(false);

  // ══ NOUVELLES OPTIONS SHOTS.SO ══
  // Style du navigateur (Safari / Chrome / Arc — Light / Dark)
  const [browserStyle, setBrowserStyle] = useState<'safari-light' | 'safari-dark' | 'chrome-light' | 'chrome-dark' | 'arc-light' | 'arc-dark'>('safari-light');
  // Barre d'adresse personnalisée
  const [customAddressBar, setCustomAddressBar] = useState<string>('');
  // Type d'ombre
  const [shadowType, setShadowType] = useState<'none' | 'spread' | 'realistic' | 'adaptive'>('realistic');
  const [shadowOpacity, setShadowOpacity] = useState<number>(45);
  const [shadowLightAngle, setShadowLightAngle] = useState<number>(45);
  // Visibilité du mockup
  const [mockupHidden, setMockupHidden] = useState<boolean>(false);
  // Drawer des templates & Modal Shots.so
  const [showTemplatesDrawer, setShowTemplatesDrawer] = useState<boolean>(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState<boolean>(false);

  // ══ ONGLETS PRINCIPAUX DU STUDIO (MOCKUP vs FRAME style Shots.so) ══
  const [activeMainTab, setActiveMainTab] = useState<'mockup' | 'frame'>('mockup');
  const [showFrameSizePopover, setShowFrameSizePopover] = useState<boolean>(false);
  const [currentFramePreset, setCurrentFramePreset] = useState<FramePresetOption>(FRAME_PRESETS[2]); // Default 4:3
  const [showAllSolidColors, setShowAllSolidColors] = useState<boolean>(false);
  const [sceneOverlay, setSceneOverlay] = useState<SceneOverlayPreset>('none');
  const [portraitBlur, setPortraitBlur] = useState<boolean>(false);
  const [vfxGlow, setVfxGlow] = useState<boolean>(false);
  const [uiScale, setUiScale] = useState<number>(100);
  const [magicPresetIdx, setMagicPresetIdx] = useState<number>(0);

  // ══ MODE PRÉSENTATION & PANNEAU INSPECTEUR (STUDIO FIGMA/DAVINCI) ══
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [showRightPanel, setShowRightPanel] = useState<boolean>(true);

  // Raccourci clavier Échap pour sortir du mode Présentation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && presentationMode) {
        setPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [presentationMode]);

  // Application d'un template complet Shots.so
  const handleApplyTemplate = (tmpl: StudioTemplate) => {
    setConfig((prev) => ({
      ...prev,
      mockupType: tmpl.mockupType,
      layoutMode: tmpl.layoutMode || 'single',
      browserStyle: tmpl.browserStyle || prev.browserStyle,
      deviceTheme: tmpl.browserStyle ? (tmpl.browserStyle.endsWith('dark') ? 'dark' : 'light') : prev.deviceTheme,
      bgType: tmpl.bgType as SceneConfig['bgType'],
      bgValue: tmpl.bgValue,
      aspectRatio: tmpl.aspectRatio,
      mockupScale: tmpl.mockupScale,
      mockupTiltX: tmpl.mockupTiltX,
      mockupTiltY: tmpl.mockupTiltY,
      mockupRotation: tmpl.mockupRotation,
      mockupX: tmpl.mockupX,
      mockupY: tmpl.mockupY,
      sceneOverlay: tmpl.sceneOverlay || 'none',
    }));
    if (tmpl.browserStyle) {
      setBrowserStyle(tmpl.browserStyle);
    }
    if (tmpl.sceneOverlay) {
      setSceneOverlay(tmpl.sceneOverlay);
    }
    const matchingPreset = FRAME_PRESETS.find((p) => p.ratioId === tmpl.aspectRatio);
    if (matchingPreset) {
      setCurrentFramePreset(matchingPreset);
    }
  };

  // Naviguer dans les Magic Presets auto-extraits (< >)
  const handleCycleMagicPreset = (dir: 'prev' | 'next') => {
    if (autoGradients.length === 0) return;
    const newIdx =
      dir === 'next'
        ? (magicPresetIdx + 1) % autoGradients.length
        : (magicPresetIdx - 1 + autoGradients.length) % autoGradients.length;
    setMagicPresetIdx(newIdx);
    setConfig((p) => ({
      ...p,
      bgType: 'gradient',
      bgValue: autoGradients[newIdx].value,
      bgTransparent: false,
    }));
  };
  // Grille 3x3 d'alignement rapide
  const applyAlignment = (pos: string) => {
    const alignMap: Record<string, { x: number; y: number }> = {
      'tl': { x: -30, y: -30 }, 'tc': { x: 0, y: -30 }, 'tr': { x: 30, y: -30 },
      'ml': { x: -30, y: 0 },  'mc': { x: 0, y: 0 },   'mr': { x: 30, y: 0 },
      'bl': { x: -30, y: 30 }, 'bc': { x: 0, y: 30 },  'br': { x: 30, y: 30 },
    };
    const p = alignMap[pos];
    if (p) setConfig((prev) => ({ ...prev, mockupX: p.x, mockupY: p.y }));
  };

  // Références DOM
  const sceneRef = useRef<HTMLDivElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const replaceImgInputRef = useRef<HTMLInputElement>(null);
  const bgImgInputRef = useRef<HTMLInputElement>(null);

  // Image courante affichée (permet le remplacement à la volée)
  const [currentScreenshot, setCurrentScreenshot] = useState<string>(captureItem.screenshotBase64 || '');

  useEffect(() => {
    if (captureItem.screenshotBase64) {
      setCurrentScreenshot(captureItem.screenshotBase64);
    }
  }, [captureItem.screenshotBase64]);

  // Drag and drop tactile & souris
  const [draggingTarget, setDraggingTarget] = useState<
    | 'mockup'
    | { type: 'text'; id: string }
    | { type: 'logo'; id: string }
    | { type: 'callout'; id: string }
    | { type: 'socialBadge'; id: string }
    | null
  >(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; initialX: number; initialY: number }>({
    clientX: 0,
    clientY: 0,
    initialX: 0,
    initialY: 0,
  });

  const handlePointerDown = (
    e: React.PointerEvent,
    target:
      | 'mockup'
      | { type: 'text'; id: string }
      | { type: 'logo'; id: string }
      | { type: 'callout'; id: string }
      | { type: 'socialBadge'; id: string }
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
      setActiveTab('3d');
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
        setActiveTab('branding');
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
        setActiveTab('branding');
      }
    } else if (typeof target === 'object' && target.type === 'callout') {
      const c = (config.callouts || []).find((item) => item.id === target.id);
      if (c) {
        dragStartRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          initialX: c.x,
          initialY: c.y,
        };
        setSelectedCalloutId(target.id);
        setActiveTab('callouts');
      }
    } else if (typeof target === 'object' && target.type === 'socialBadge') {
      const b = (config.socialBadges || []).find((item) => item.id === target.id);
      if (b) {
        dragStartRef.current = {
          clientX: e.clientX,
          clientY: e.clientY,
          initialX: b.x,
          initialY: b.y,
        };
      }
    }
  };

  const rafMoveRef = useRef<number | null>(null);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!draggingTarget || !sceneRef.current) return;

    if (rafMoveRef.current) cancelAnimationFrame(rafMoveRef.current);

    rafMoveRef.current = requestAnimationFrame(() => {
      const sceneRect = sceneRef.current?.getBoundingClientRect();
      if (!sceneRect) return;

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
      } else if (typeof draggingTarget === 'object' && draggingTarget.type === 'callout') {
        const targetId = draggingTarget.id;
        const newX = Math.max(0, Math.min(100, dragStartRef.current.initialX + deltaXPercent));
        const newY = Math.max(0, Math.min(100, dragStartRef.current.initialY + deltaYPercent));
        setConfig((prev) => ({
          ...prev,
          callouts: (prev.callouts || []).map((c) => (c.id === targetId ? { ...c, x: Math.round(newX), y: Math.round(newY) } : c)),
        }));
      } else if (typeof draggingTarget === 'object' && draggingTarget.type === 'socialBadge') {
        const targetId = draggingTarget.id;
        const newX = Math.max(0, Math.min(100, dragStartRef.current.initialX + deltaXPercent));
        const newY = Math.max(0, Math.min(100, dragStartRef.current.initialY + deltaYPercent));
        setConfig((prev) => ({
          ...prev,
          socialBadges: (prev.socialBadges || []).map((b) => (b.id === targetId ? { ...b, x: Math.round(newX), y: Math.round(newY) } : b)),
        }));
      }
    });
  }, [draggingTarget]);

  const handlePointerUp = useCallback(() => {
    if (rafMoveRef.current) cancelAnimationFrame(rafMoveRef.current);
    setDraggingTarget(null);
  }, []);

  useEffect(() => {
    if (draggingTarget) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggingTarget, handlePointerMove, handlePointerUp]);

  // Réinitialiser la vue 3D
  const handleReset3D = () => {
    setUiScale(100);
    setConfig((prev) => ({
      ...prev,
      mockupX: 0,
      mockupY: 0,
      mockupScale: 85,
      mockupRotation: 0,
      mockupTiltX: 0,
      mockupTiltY: 0,
    }));
  };

  // Export Haute Définition PNG
  const handleExportPng = async () => {
    if (!sceneRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const dataUrl = await toPng(sceneRef.current, {
        cacheBust: true,
        pixelRatio: config.exportScale || 2,
      });

      const cleanName = (captureItem.domainName || 'omnimockup').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${cleanName}-${config.aspectRatio}-${config.exportScale || 2}x.png`;

      const link = document.createElement('a');
      link.download = filename;
      link.href = dataUrl;
      link.click();

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Erreur export image:', err);
      alert("Erreur lors de l'exportation de l'image. Veuillez réessayer.");
    } finally {
      setIsExporting(false);
    }
  };

  // Copie rapide dans le presse-papier
  const handleCopyToClipboard = async () => {
    if (!sceneRef.current) return;
    setIsCopying(true);
    setCopySuccess(false);

    try {
      const blob = await toBlob(sceneRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      if (!blob) throw new Error('Impossible de générer le blob');

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error('Erreur copie presse-papier:', err);
      alert('Impossible de copier dans le presse-papier sur ce navigateur.');
    } finally {
      setIsCopying(false);
    }
  };

  // Export Vidéo Animé 3s (.webm)
  const handleExportVideo = async () => {
    if (!sceneRef.current) return;
    setIsExportingVideo(true);

    try {
      const basePngUrl = await toPng(sceneRef.current, { pixelRatio: 1.5, cacheBust: true });
      const img = new Image();
      img.src = basePngUrl;
      await new Promise((r) => {
        img.onload = r;
      });

      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Contexte canvas 2D indisponible');

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mockup-animation-${videoPreset}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsExportingVideo(false);
      };

      recorder.start();

      const durationMs = 3000;
      const fps = 30;
      const totalFrames = (durationMs / 1000) * fps;
      let currentFrame = 0;

      const interval = setInterval(() => {
        currentFrame++;
        const progress = currentFrame / totalFrames;

        let scale = 1;
        let translateX = 0;

        if (videoPreset === 'zoomIn') {
          scale = 1 + progress * 0.12;
        } else if (videoPreset === 'zoomOut') {
          scale = 1.12 - progress * 0.12;
        } else if (videoPreset === 'panHorizontal') {
          translateX = (progress - 0.5) * 0.08 * canvas.width;
        }

        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width / 2 + translateX, canvas.height / 2);
        ctx.scale(scale, scale);
        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
        ctx.restore();

        if (currentFrame >= totalFrames) {
          clearInterval(interval);
          recorder.stop();
        }
      }, 1000 / fps);
    } catch (err) {
      console.error('Erreur export vidéo:', err);
      alert("L'exportation vidéo nécessite un navigateur supportant MediaRecorder.");
      setIsExportingVideo(false);
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
    setActiveTab('branding');
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

  // Ajout & gestion de Callouts de vente
  const handleAddCallout = (
    text = '✨ IA Intégrée',
    badge = 'IA',
    colorTheme: 'violet' | 'emerald' | 'amber' | 'rose' = 'violet'
  ) => {
    const newCallout: FeatureCallout = {
      id: `callout_${Date.now()}`,
      text,
      badge,
      x: 50,
      y: 40,
      colorTheme,
      pointerDirection: 'bottom-left',
    };
    setConfig((prev) => ({
      ...prev,
      callouts: [...(prev.callouts || []), newCallout],
    }));
    setSelectedCalloutId(newCallout.id);
  };

  const handleUpdateCallout = (id: string, updates: Partial<FeatureCallout>) => {
    setConfig((prev) => ({
      ...prev,
      callouts: (prev.callouts || []).map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  };

  const handleDeleteCallout = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      callouts: (prev.callouts || []).filter((c) => c.id !== id),
    }));
    if (selectedCalloutId === id) setSelectedCalloutId(null);
  };

  // Gestion des badges de preuve sociale
  const handleToggleSocialBadge = (type: SocialProofBadgeType) => {
    setConfig((prev) => {
      const current = prev.socialBadges || [];
      const exists = current.find((b) => b.type === type);
      if (exists) {
        return {
          ...prev,
          socialBadges: current.map((b) => (b.type === type ? { ...b, visible: !b.visible } : b)),
        };
      } else {
        const newBadge: SceneSocialBadge = {
          id: `badge_${Date.now()}`,
          type,
          x: type === 'product-hunt' ? 22 : type === 'stripe-mrr' ? 76 : 50,
          y: type === 'product-hunt' ? 14 : type === 'stripe-mrr' ? 84 : 86,
          visible: true,
          customText: type === 'stripe-mrr' ? '$24,500 MRR' : undefined,
        };
        return {
          ...prev,
          socialBadges: [...current, newBadge],
        };
      }
    });
  };

  // Export Pack Réseaux Sociaux 1-Click (5 formats consécutifs)
  const handleExportPack = async () => {
    if (!sceneRef.current || isExportingPack) return;
    setIsExportingPack(true);
    const originalRatio = config.aspectRatio;

    try {
      const PACK_FORMATS: { ratio: SceneAspectRatio; label: string }[] = [
        { ratio: '16:9', label: 'Twitter_ProductHunt_16-9' },
        { ratio: '1:1', label: 'Instagram_LinkedIn_1-1' },
        { ratio: '9:16', label: 'Stories_Reels_9-16' },
        { ratio: '1.91:1', label: 'LinkedIn_Banner_1.91-1' },
        { ratio: '4:3', label: 'Dribbble_Portfolio_4-3' },
      ];

      for (let i = 0; i < PACK_FORMATS.length; i++) {
        const item = PACK_FORMATS[i];
        setPackProgress(`${i + 1}/${PACK_FORMATS.length}`);

        setConfig((prev) => ({ ...prev, aspectRatio: item.ratio }));
        await new Promise((r) => setTimeout(r, 450));

        if (sceneRef.current) {
          const dataUrl = await toPng(sceneRef.current, {
            cacheBust: true,
            pixelRatio: 2,
          });
          const link = document.createElement('a');
          const cleanName = (captureItem.domainName || 'omnimockup').replace(/[^a-zA-Z0-9_-]/g, '_');
          link.download = `${cleanName}-${item.label}.png`;
          link.href = dataUrl;
          link.click();
          await new Promise((r) => setTimeout(r, 250));
        }
      }

      setConfig((prev) => ({ ...prev, aspectRatio: originalRatio }));
      setPackProgress('Fait !');
      setTimeout(() => setPackProgress(''), 3000);
    } catch (err) {
      console.error('Erreur export pack:', err);
      alert('Une erreur est survenue lors du téléchargement du pack.');
      setConfig((prev) => ({ ...prev, aspectRatio: originalRatio }));
    } finally {
      setIsExportingPack(false);
    }
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
        x: 12,
        y: 12,
        width: 80,
        opacity: 1,
      };
      setConfig((prev) => ({ ...prev, logos: [...prev.logos, newLogo] }));
      setSelectedLogoId(newLogo.id);
      setActiveTab('branding');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleDeleteLogo = (id: string) => {
    setConfig((prev) => ({
      ...prev,
      logos: prev.logos.filter((l) => l.id !== id),
    }));
    if (selectedLogoId === id) setSelectedLogoId(null);
  };

  // Remplacement manuel de l'image de capture
  const handleReplaceScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setCurrentScreenshot(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Import d'image de fond personnalisé
  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setConfig((p) => ({
        ...p,
        bgType: 'texture',
        bgValue: `url(${base64}) center/cover no-repeat`,
        bgTransparent: false,
      }));
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const activeRatioConfig = RATIO_PRESETS.find((r) => r.id === config.aspectRatio) || RATIO_PRESETS[0];
  const activeText = config.texts.find((t) => t.id === selectedTextId);

  // Calcul du drop shadow 3D en fonction du type, de l'opacité et de l'angle de lumière
  const lightRad = (shadowLightAngle * Math.PI) / 180;
  const shadowDist = shadowType === 'spread' ? 32 : shadowType === 'adaptive' ? 22 : 16;
  const shadowOffsetX = Math.round(Math.cos(lightRad) * shadowDist);
  const shadowOffsetY = Math.round(Math.sin(lightRad) * shadowDist);
  const effectiveAlpha = Math.min(1, Math.max(0, (shadowOpacity / 100) * (config.shadowIntensity / 50))).toFixed(2);

  const dynamicShadow =
    !config.shadowEnabled || shadowType === 'none'
      ? 'none'
      : shadowType === 'spread'
      ? `${shadowOffsetX}px ${shadowOffsetY}px 48px rgba(0, 0, 0, ${effectiveAlpha}), 0 10px 24px rgba(0, 0, 0, ${(Number(effectiveAlpha) * 0.6).toFixed(2)})`
      : shadowType === 'adaptive'
      ? `${shadowOffsetX}px ${shadowOffsetY}px 32px rgba(0, 0, 0, ${effectiveAlpha}), 0 4px 12px rgba(0, 0, 0, ${(Number(effectiveAlpha) * 0.45).toFixed(2)})`
      : /* realistic */
        `${shadowOffsetX}px ${shadowOffsetY}px 24px rgba(0, 0, 0, ${effectiveAlpha}), 0 2px 8px rgba(0, 0, 0, ${(Number(effectiveAlpha) * 0.35).toFixed(2)})`;

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0b0e] text-zinc-150 select-none overflow-hidden font-sans fixed inset-0 z-50">
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP BAR PRO (Shots.so / Rotato App Header)                         */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* TEMPLATES DRAWER (Shots.so style)                                   */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {showTemplatesDrawer && (
        <div className="fixed inset-0 z-[100] flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowTemplatesDrawer(false)}
          />
          {/* Drawer Panel */}
          <div className="relative z-10 w-[340px] h-full bg-[#141418] border-r border-zinc-800 flex flex-col shadow-2xl overflow-hidden animate-slideInLeft">
            {/* Header */}
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Layout className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-bold text-white">Templates</span>
              </div>
              <button
                type="button"
                onClick={() => setShowTemplatesDrawer(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Filtres */}
            <div className="px-4 pt-3 pb-2 flex items-center gap-2 shrink-0">
              {['Tous', 'Image', 'Animé'].map((f) => (
                <button
                  key={f}
                  type="button"
                  className="px-3 py-1 rounded-full text-[11px] font-semibold border border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-violet-600 hover:text-white hover:border-violet-500 transition-all"
                >
                  {f}
                </button>
              ))}
            </div>
            {/* Liste des catégories */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {[
                {
                  cat: 'Product Promotion',
                  items: [
                    { label: 'Solo Browser', device: 'browser' as MockupType, bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', ratio: '16:9' as SceneAspectRatio },
                    { label: 'Hero iPhone', device: 'iphone' as MockupType, bg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', ratio: '9:16' as SceneAspectRatio },
                  ],
                },
                {
                  cat: 'Realistic Desktop',
                  items: [
                    { label: 'MacBook Pro', device: 'macbook' as MockupType, bg: 'linear-gradient(135deg, #065f46 0%, #047857 100%)', ratio: '16:9' as SceneAspectRatio },
                    { label: 'iMac Display', device: 'imac' as MockupType, bg: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)', ratio: '4:3' as SceneAspectRatio },
                  ],
                },
                {
                  cat: 'Shadow Overlays',
                  items: [
                    { label: 'iPhone Dark', device: 'iphone' as MockupType, bg: 'linear-gradient(135deg, #09090b 0%, #18181b 100%)', ratio: '9:16' as SceneAspectRatio },
                    { label: 'iPad Ombre', device: 'ipad' as MockupType, bg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)', ratio: '4:3' as SceneAspectRatio },
                  ],
                },
                {
                  cat: 'UI Showcase',
                  items: [
                    { label: 'Flat Clair', device: 'flat' as MockupType, bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', ratio: '1:1' as SceneAspectRatio },
                    { label: 'Duo Mac+Phone', device: 'browser' as MockupType, bg: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', ratio: '16:9' as SceneAspectRatio },
                  ],
                },
                {
                  cat: 'Abstract Shapes',
                  items: [
                    { label: 'Aurora iPhone', device: 'iphone' as MockupType, bg: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)', ratio: '9:16' as SceneAspectRatio },
                    { label: 'Mesh Browser', device: 'browser' as MockupType, bg: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #8b5cf6 100%)', ratio: '1:1' as SceneAspectRatio },
                  ],
                },
                {
                  cat: 'Retro Futuristic',
                  items: [
                    { label: 'Cyberpunk Watch', device: 'watch' as MockupType, bg: 'linear-gradient(135deg, #064e3b 0%, #10b981 100%)', ratio: '1:1' as SceneAspectRatio },
                    { label: 'Neon MacBook', device: 'macbook' as MockupType, bg: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)', ratio: '16:9' as SceneAspectRatio },
                  ],
                },
              ].map(({ cat, items }) => (
                <div key={cat} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">{cat}</span>
                    <button type="button" className="text-[10px] text-violet-400 hover:text-violet-300">Voir tout</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {items.map((tpl) => (
                      <button
                        key={tpl.label}
                        type="button"
                        onClick={() => {
                          setConfig((p) => ({
                            ...p,
                            mockupType: tpl.device,
                            bgType: 'gradient',
                            bgValue: tpl.bg,
                            bgTransparent: false,
                            aspectRatio: tpl.ratio,
                          }));
                          setShowTemplatesDrawer(false);
                        }}
                        className="group relative h-20 rounded-xl border border-zinc-700 overflow-hidden hover:border-violet-500 hover:ring-2 hover:ring-violet-500/40 transition-all"
                        style={{ background: tpl.bg }}
                      >
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors" />
                        <span className="absolute bottom-1.5 left-2 text-[10px] font-semibold text-white drop-shadow-md">{tpl.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!presentationMode && (
        <header className="h-14 sm:h-16 px-3 sm:px-5 lg:px-6 border-b border-zinc-800/90 bg-[#08090e]/95 backdrop-blur-2xl flex items-center justify-between gap-2.5 z-30 shrink-0 relative select-none">
          {/* Ligne d'accentuation subtile en haut */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent pointer-events-none" />

          {/* ── GAUCHE : Quitter, Marque OmniMockup, Site Cible & Templates ── */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850/90 border border-zinc-800/80 hover:border-zinc-700 text-xs font-semibold transition-all active:scale-95 shrink-0"
                title="Quitter le studio et revenir à l'accueil"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Quitter</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 ring-1 ring-white/15 shrink-0">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                    Omni<span className="text-violet-400">Mockup</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-violet-500/15 text-violet-300 border border-violet-500/30 text-[9px] font-bold tracking-wider uppercase shrink-0">
                    Studio
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                  <span className="truncate max-w-[120px] sm:max-w-[200px] font-mono text-[10px] text-zinc-300">
                    {captureItem.domainName || captureItem.url}
                  </span>
                  {captureItem.url && (
                    <a
                      href={captureItem.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-zinc-500 hover:text-zinc-300 transition-colors shrink-0"
                      title="Ouvrir le site original"
                    >
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Bouton Templates avec badge */}
            <button
              type="button"
              onClick={() => setShowTemplatesModal(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-750 hover:border-zinc-650 text-zinc-200 hover:text-white text-xs font-semibold transition-all active:scale-95 shrink-0 shadow-xs"
              title="Ouvrir la bibliothèque de templates (T)"
            >
              <Layout className="w-3.5 h-3.5 text-violet-400" />
              <span>Templates</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono">18</span>
            </button>
          </div>

          {/* ── CENTRE : Sélecteur de Mode (Solo / Duo / Trio) & Résolution ── */}
          <div className="hidden xl:flex items-center gap-2.5">
            {/* Capsule Disposition */}
            <div className="flex items-center bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 shadow-inner">
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, layoutMode: 'single' }))}
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                  (config.layoutMode || 'single') === 'single'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Solo
              </button>
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, layoutMode: 'dual-stacked' }))}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  config.layoutMode === 'dual-stacked'
                    ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <span>Duo</span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </button>
              <button
                type="button"
                onClick={() => setConfig((p) => ({ ...p, layoutMode: 'trio-ecosystem' }))}
                className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  config.layoutMode === 'trio-ecosystem'
                    ? 'bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 text-white shadow-md shadow-violet-600/40 ring-1 ring-violet-400/40'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title="Trio Écosystème : MacBook + iPad + iPhone en 3D"
              >
                <span>Trio Pro</span>
                <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              </button>
            </div>

            {/* Capsule Résolution d'export */}
            <div className="flex items-center bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 shadow-inner">
              {([1, 2, 4] as const).map((scale) => (
                <button
                  key={scale}
                  type="button"
                  onClick={() => setConfig((p) => ({ ...p, exportScale: scale }))}
                  className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold transition-all ${
                    (config.exportScale || 2) === scale
                      ? 'bg-zinc-800 text-violet-300 border border-violet-500/40 shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={`Résolution d'export ${scale}x (${scale === 4 ? 'Ultra HD Retina' : scale === 2 ? 'HD' : 'Standard'})`}
                >
                  {scale}x
                </button>
              ))}
            </div>
          </div>

          {/* ── DROITE : Outils Créatifs, Export Hub & Profil Compte ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Pitch & Vente IA */}
            <button
              type="button"
              onClick={() => setSalesKitOpen(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-950/40 hover:bg-violet-900/60 border border-violet-500/40 hover:border-violet-400 text-violet-200 hover:text-white text-xs font-bold transition-all shadow-xs active:scale-95"
              title="Générer des arguments de vente et pitch client avec l'IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xl:inline">Pitch IA</span>
            </button>

            {/* Mode Plein Écran / Présentation */}
            <button
              type="button"
              onClick={() => setPresentationMode(true)}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 text-xs font-semibold transition-all active:scale-95"
              title="Passer en mode Présentation plein écran (Échap pour quitter)"
            >
              <Maximize2 className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden 2xl:inline">Présentation</span>
            </button>

            {/* Pack OmniExport 5 Formats 1-Click */}
            <button
              type="button"
              onClick={handleExportPack}
              disabled={isExportingPack}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/40 hover:border-emerald-400 text-emerald-200 hover:text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:opacity-50"
              title="Télécharger les 5 formats réseaux sociaux en 1 clic (Twitter, Insta, Stories, LinkedIn, Dribbble)"
            >
              {isExportingPack ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  <span>{packProgress}</span>
                </>
              ) : packProgress === 'Fait !' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" />
                  <span>Prêt !</span>
                </>
              ) : (
                <>
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden xl:inline">Pack OmniExport</span>
                  <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-mono">5</span>
                </>
              )}
            </button>

            {/* Copier dans le presse-papier */}
            <button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={isCopying}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              title="Copier l'image directement dans le presse-papier"
            >
              {isCopying ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
              ) : copySuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                  <span className="text-emerald-400 font-bold hidden sm:inline">Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Copier</span>
                </>
              )}
            </button>

            {/* Vidéo 3s */}
            <button
              type="button"
              onClick={handleExportVideo}
              disabled={isExportingVideo}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-amber-300 hover:text-amber-200 border border-zinc-750 text-xs font-semibold transition-all active:scale-95 disabled:opacity-50"
              title="Générer une vidéo d'animation 3s (.webm 60fps)"
            >
              {isExportingVideo ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
              ) : (
                <Video className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden xl:inline">Vidéo 3s</span>
            </button>

            {/* Bouton Télécharger PNG Principal (Primary CTA) */}
            <button
              type="button"
              onClick={handleExportPng}
              disabled={isExporting}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-violet-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-violet-600/30 ring-1 ring-white/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Rendu {config.exportScale || 2}x...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                  <span>Téléchargé !</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  <span>Télécharger</span>
                </>
              )}
            </button>

            {/* Toggle Panneau Inspecteur */}
            <button
              type="button"
              onClick={() => setShowRightPanel((p) => !p)}
              className="flex items-center justify-center p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-750 text-zinc-400 hover:text-white transition-all"
              title={showRightPanel ? "Masquer le panneau d'inspection" : "Afficher le panneau d'inspection"}
            >
              {showRightPanel ? (
                <PanelRightClose className="w-4 h-4 text-zinc-400" />
              ) : (
                <PanelRightOpen className="w-4 h-4 text-violet-400" />
              )}
            </button>

            {/* ── SECTION COMPTE UTILISATEUR ULTRA-SOIGNÉE ── */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((p) => !p)}
                className="flex items-center gap-1.5 sm:gap-2 pl-1.5 pr-2 py-1 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-750 hover:border-zinc-650 transition-all shadow-xs text-xs"
                title="Gestion de compte et abonnement"
              >
                {/* Avatar utilisateur */}
                <div className="relative">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white flex items-center justify-center font-bold text-[11px] shadow-sm uppercase">
                    {user?.email ? user.email.slice(0, 2) : <UserIcon className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-zinc-900 ${
                      user ? 'bg-emerald-400' : 'bg-zinc-500'
                    }`}
                  />
                </div>

                {/* Badge du forfait */}
                <span
                  className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    userPlan === 'studio'
                      ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                      : userPlan === 'pro'
                      ? 'bg-violet-500/20 text-violet-300 border-violet-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {userPlan === 'studio' ? (
                    <>
                      <Crown className="w-2.5 h-2.5 text-amber-300" />
                      <span>Agence</span>
                    </>
                  ) : userPlan === 'pro' ? (
                    <>
                      <Zap className="w-2.5 h-2.5 text-violet-400" />
                      <span>Pro</span>
                    </>
                  ) : (
                    <span>Gratuit</span>
                  )}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-zinc-400 transition-transform duration-200 ${
                    userDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {/* Menu Déroulant Profil & Compte */}
              {userDropdownOpen && (
                <div className="absolute right-0 mt-2.5 w-72 bg-[#0c0d14] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 py-2.5 z-50 animate-slide-up text-xs backdrop-blur-2xl">
                  {/* Header compte */}
                  <div className="px-4 py-3 border-b border-zinc-800/80">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                      {user ? 'Compte Connecté' : 'Mode Découverte'}
                    </p>
                    <p className="font-semibold text-white truncate text-sm mt-0.5">
                      {user?.email || 'Visiteur Anonyme'}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          userPlan === 'studio'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : userPlan === 'pro'
                            ? 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {userPlan === 'studio' ? <Crown className="w-3 h-3 text-amber-300" /> : userPlan === 'pro' ? <Zap className="w-3 h-3 text-violet-400" /> : <Shield className="w-3 h-3 text-zinc-400" />}
                        Plan {userPlan === 'studio' ? 'Studio Agence' : userPlan === 'pro' ? 'Pro Développeur' : 'Gratuit Découverte'}
                      </span>

                      <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Actif
                      </span>
                    </div>
                  </div>

                  {/* Quota & Statut des exports */}
                  <div className="p-3 mx-3 my-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-300 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Qualité Export PNG :</span>
                      <span className="font-mono font-bold text-white">
                        {userPlan === 'free' ? '1x (Filigrane)' : '2x & 4K Illimités'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Vidéos MP4 60fps :</span>
                      <span className="font-bold text-white">
                        {userPlan === 'free' ? 'Version démo' : 'Incluses'}
                      </span>
                    </div>

                    {isFreePlan && (
                      <div className="pt-2">
                        <Link
                          href="/pricing"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold text-[11px] transition-all shadow-md shadow-violet-600/30"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Passer au Pro (dès 4€/mois)</span>
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Liens de navigation */}
                  <div className="py-1">
                    {user ? (
                      <>
                        <Link
                          href="/account"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-850/80 transition-colors"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Mon Compte &amp; Facturation</span>
                        </Link>

                        <Link
                          href="/pricing"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-850/80 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Changer de Forfait &amp; Tarifs (€)</span>
                        </Link>

                        <div className="my-1 border-t border-zinc-800/80" />

                        <button
                          type="button"
                          onClick={async () => {
                            setUserDropdownOpen(false);
                            await signOut();
                          }}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Se déconnecter</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-850/80 transition-colors font-medium"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Se connecter</span>
                        </Link>

                        <Link
                          href="/signup"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-violet-400 hover:text-violet-300 hover:bg-zinc-850/80 transition-colors font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                          <span>Créer un compte gratuit</span>
                        </Link>

                        <Link
                          href="/pricing"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-zinc-300 hover:text-white hover:bg-zinc-850/80 transition-colors"
                        >
                          <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                          <span>Tarifs &amp; Formules (€)</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 2. ESPACE DE TRAVAIL PRINCIPAL (Toolbar Gauche + Canvas + Inspecteur)   */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      <div className="flex-1 w-full flex flex-row overflow-hidden relative">
        {/* ── BARRE D'OUTILS VERTICALE GAUCHE (FIGMA / PHOTOSHOP STYLE) ── */}
        {!presentationMode && (
          <aside className="w-14 sm:w-16 h-full bg-[#07080c] border-r border-zinc-850/80 flex flex-col items-center justify-between py-3.5 px-1.5 shrink-0 z-30 select-none">
            {/* Outils Supérieurs */}
            <div className="flex flex-col items-center gap-2 w-full">
              {/* Quitter */}
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-850/80 transition-all"
                  title="Quitter le studio"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <div className="w-6 h-px bg-zinc-850 my-0.5" />

              {/* Templates */}
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-violet-300 hover:bg-zinc-850/80 transition-all group"
                title="Templates de Scènes"
              >
                <Layout className="w-4 h-4" />
              </button>

              {/* Appareil & Modèle */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('mockup');
                  setActiveTab('mockup');
                  setShowRightPanel(true);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeMainTab === 'mockup' && activeTab === 'mockup' && showRightPanel
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850/80'
                }`}
                title="Choix de l'Appareil & Layout"
              >
                <Monitor className="w-4 h-4" />
              </button>

              {/* Studio 3D & Perspectives */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('mockup');
                  setActiveTab('3d');
                  setShowRightPanel(true);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeMainTab === 'mockup' && activeTab === '3d' && showRightPanel
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850/80'
                }`}
                title="3D Tilt & Orientation"
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Canvas & Wallpapers */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('frame');
                  setShowRightPanel(true);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeMainTab === 'frame' && showRightPanel
                    ? 'bg-gradient-to-tr from-pink-600 to-violet-600 text-white shadow-lg shadow-pink-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850/80'
                }`}
                title="Fonds & Wallpapers de Scène"
              >
                <Palette className="w-4 h-4" />
              </button>

              {/* Callouts Vente & Preuve Sociale */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('mockup');
                  setActiveTab('callouts');
                  setShowRightPanel(true);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeMainTab === 'mockup' && activeTab === 'callouts' && showRightPanel
                    ? 'bg-gradient-to-tr from-amber-500 to-violet-600 text-white shadow-lg shadow-amber-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850/80'
                }`}
                title="Callouts Vente & Preuve Sociale (Product Hunt, Stripe, Avis)"
              >
                <Tag className="w-4 h-4" />
              </button>

              {/* Textes & Logos */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('mockup');
                  setActiveTab('branding');
                  setShowRightPanel(true);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeMainTab === 'mockup' && activeTab === 'branding' && showRightPanel
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850/80'
                }`}
                title="Calques Textes & Logos"
              >
                <Layers className="w-4 h-4" />
              </button>

              {/* Stack Développeur */}
              <button
                type="button"
                onClick={() => {
                  setActiveMainTab('mockup');
                  setActiveTab('content');
                  setShowRightPanel(true);
                }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  activeMainTab === 'mockup' && activeTab === 'content' && showRightPanel
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-850/80'
                }`}
                title="Badges Stack Technique"
              >
                <Flame className="w-4 h-4" />
              </button>
            </div>

            {/* Outils Inférieurs */}
            <div className="flex flex-col items-center gap-2 w-full">
              {/* Pitch IA */}
              <button
                type="button"
                onClick={() => setSalesKitOpen(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-tr from-violet-600 to-indigo-600 text-amber-300 hover:scale-105 transition-all shadow-md shadow-violet-600/30"
                title="Générateur de Pitch Vente IA"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              {/* Plein Écran / Présentation */}
              <button
                type="button"
                onClick={() => setPresentationMode(true)}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:bg-zinc-850/80 transition-all"
                title="Mode Plein Écran / Présentation"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Toggle Panneau Droit */}
              <button
                type="button"
                onClick={() => setShowRightPanel((p) => !p)}
                className="hidden lg:flex w-10 h-10 rounded-xl items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-850/80 transition-all"
                title={showRightPanel ? "Masquer l'inspecteur" : "Afficher l'inspecteur"}
              >
                {showRightPanel ? (
                  <PanelRightClose className="w-4 h-4" />
                ) : (
                  <PanelRightOpen className="w-4 h-4 text-violet-400" />
                )}
              </button>
            </div>
          </aside>
        )}

        {/* ── ZONE DE PRÉVISUALISATION CENTRALE (CANVAS FLUIDE GÉANT) ── */}
        <main className="flex-1 h-full relative flex flex-col items-center justify-center p-4 sm:p-8 bg-[#090a0f] overflow-hidden select-none">
          {/* Mode Présentation: Flottant 'Quitter la présentation (Échap)' */}
          {presentationMode && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 rounded-full bg-[#07080c]/90 backdrop-blur-xl border border-zinc-800 text-white shadow-2xl animate-fade-in select-none">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-semibold text-zinc-200">Mode Présentation</span>
              <button
                type="button"
                onClick={() => setPresentationMode(false)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-mono transition-all active:scale-95 border border-zinc-700"
              >
                <Minimize2 className="w-3 h-3" />
                <span>Quitter (Échap)</span>
              </button>
            </div>
          )}

          {/* Grille d'établi design professionnelle (Dot Matrix) */}
          <div
            className="absolute inset-0 opacity-[0.045] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle, #ffffff 1.2px, transparent 1.2px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Halo d'ambiance lumineux d'arrière-plan */}
          <div className="absolute w-[640px] h-[420px] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none studio-ambient-glow" />

          {/* CONTENEUR DE ZOOM DU CANVAS */}
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${canvasZoom / 100})` }}
          >
            {/* CANVAS DE LA SCÈNE RENDU */}
            <div
              ref={sceneRef}
              className={`w-full max-w-5xl max-h-[76vh] relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.6)] transition-all duration-300 flex items-center justify-center touch-none ${activeRatioConfig.ratioClass}`}
              style={{
                aspectRatio: `${currentFramePreset.width} / ${currentFramePreset.height}`,
                background: config.bgTransparent
                  ? 'transparent'
                  : config.bgType === 'blurred-image'
                  ? '#121214'
                  : config.bgValue,
                backgroundImage: config.bgTransparent
                  ? `linear-gradient(45deg, #27272a 25%, transparent 25%), linear-gradient(-45deg, #27272a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #27272a 75%), linear-gradient(-45deg, transparent 75%, #27272a 75%)`
                  : undefined,
                backgroundSize: config.bgTransparent ? '16px 16px' : undefined,
                backgroundPosition: config.bgTransparent ? '0 0, 0 8px, 8px -8px, -8px 0px' : undefined,
              }}
              onClick={() => {
                setSelectedTextId(null);
                setSelectedLogoId(null);
              }}
            >
              {/* FOND WALLPAPER FLOUTÉ (Style Shots.so / Pika) */}
              {config.bgType === 'blurred-image' && currentScreenshot && !config.bgTransparent && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentScreenshot}
                    alt="Blurred Background Wallpaper"
                    className="w-full h-full object-cover filter blur-3xl brightness-75 saturate-150 scale-125 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-black/35" />
                </div>
              )}

              {/* OVERLAY MOTIF DE FOND (Grille / Points / Noise / Mesh) */}
              {config.bgPattern === 'grid' && !config.bgTransparent && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-20 z-5"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                    backgroundSize: '28px 28px',
                  }}
                />
              )}

              {config.bgPattern === 'dots' && !config.bgTransparent && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-25 z-5"
                  style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1.5px, transparent 1.5px)`,
                    backgroundSize: '24px 24px',
                  }}
                />
              )}

              {config.bgPattern === 'mesh' && !config.bgTransparent && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-35 mix-blend-soft-light z-5"
                  style={{
                    backgroundImage: `radial-gradient(at 20% 20%, rgba(168, 85, 247, 0.4) 0px, transparent 50%), radial-gradient(at 80% 80%, rgba(59, 130, 246, 0.4) 0px, transparent 50%), radial-gradient(at 50% 50%, rgba(236, 72, 153, 0.3) 0px, transparent 50%)`,
                  }}
                />
              )}

              {(config.bgNoise || config.bgPattern === 'noise') && !config.bgTransparent && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay z-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  }}
                />
              )}

              {/* FILTRES CINÉMATIQUES EN OVERLAY */}
              {config.filterType === 'grain' && (
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-overlay z-15"
                  style={{
                    opacity: ((config.filterIntensity || 40) / 100) * 0.5,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  }}
                />
              )}

              {config.filterType === 'vhs' && (
                <div
                  className="absolute inset-0 pointer-events-none z-15"
                  style={{
                    opacity: ((config.filterIntensity || 40) / 100) * 0.6,
                    background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px), linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.02), rgba(0,0,255,0.04))`,
                  }}
                />
              )}

              {config.filterType === 'glitch' && (
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-screen z-15 overflow-hidden"
                  style={{
                    opacity: ((config.filterIntensity || 40) / 100) * 0.5,
                    backgroundImage: `repeating-linear-gradient(90deg, rgba(255,0,80,0.1) 0px, rgba(0,255,255,0.1) 4px, transparent 4px, transparent 12px)`,
                  }}
                />
              )}

              {/* EFFET PORTRAIT (Flou de profondeur de champ) */}
              {portraitBlur && (
                <div
                  className="absolute inset-0 pointer-events-none z-15 backdrop-blur-[5px]"
                  style={{
                    maskImage: 'radial-gradient(ellipse at center, transparent 38%, black 82%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 38%, black 82%)',
                  }}
                />
              )}

              {/* ── MOCKUPS 3D DANS LA SCÈNE (MODE SOLO OU MODE DUO) ── */}
              {!mockupHidden && (
                config.layoutMode === 'dual-stacked' ? (
                  /* ── MODE DUO : MACBOOK/BROWSER + IPHONE 16 EN SUPERPOSITION (SIGNATURE SHOTS.SO) ── */
                  /* FIX: conteneur 80%×76% pour que l'iPhone reste TOUJOURS dans la scène */
                  <div
                    className="absolute cursor-move transition-all duration-150 touch-none z-20"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '82%',
                      height: '76%',
                      perspective: '1200px',
                      transform: `translate(-50%, -50%) translate(${config.mockupX}%, ${config.mockupY}%) scale(${
                        config.mockupScale / 100
                      }) rotateX(${config.mockupTiltX || 0}deg) rotateY(${config.mockupTiltY || 0}deg) rotateZ(${
                        config.mockupRotation || 0
                      }deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'mockup')}
                  >
                    {/* Appareil 1 : Ordinateur / Web — occupe 68% de la largeur du conteneur Duo */}
                    <div
                      className="absolute z-10 transition-transform"
                      style={{
                        width: '68%',
                        left: '4%',
                        top: '8%',
                        filter: config.shadowEnabled ? `drop-shadow(${dynamicShadow})` : undefined,
                      }}
                    >
                      <MockupFrame
                        type={config.mockupType === 'iphone' || config.mockupType === 'watch' ? 'macbook' : config.mockupType}
                        screenshotBase64={currentScreenshot}
                        url={customAddressBar.trim() ? (customAddressBar.startsWith('http') ? customAddressBar : 'https://' + customAddressBar) : captureItem.url}
                        title={captureItem.title}
                        domainName={customAddressBar.trim() || captureItem.domainName}
                        faviconUrl={captureItem.faviconUrl}
                        theme={config.deviceTheme}
                        styleVariant={config.deviceStyle}
                        browserStyle={config.browserStyle || browserStyle}
                        cornerRadius={config.cornerRadius}
                        cropOffsetY={config.cropOffsetY}
                      />
                    </div>

                    {/* Appareil 2 : iPhone — 26% de la largeur, ancré en bas-droite DANS le conteneur */}
                    <div
                      className="absolute z-20 transition-transform"
                      style={{
                        width: '26%',
                        right: '2%',
                        bottom: '2%',
                        filter: config.shadowEnabled ? 'drop-shadow(0 20px 35px rgba(0,0,0,0.60))' : undefined,
                        transform: 'rotateZ(3deg)',
                      }}
                    >
                      <MockupFrame
                        type="iphone"
                        screenshotBase64={currentScreenshot}
                        url={captureItem.url}
                        title={captureItem.title}
                        domainName={captureItem.domainName}
                        faviconUrl={captureItem.faviconUrl}
                        theme={config.deviceTheme}
                        styleVariant={config.deviceStyle}
                        cornerRadius="round"
                        cropOffsetY={config.cropOffsetY}
                      />
                    </div>
                  </div>
                ) : config.layoutMode === 'trio-ecosystem' ? (
                  /* ── MODE TRIO ÉCOSYSTÈME (MACBOOK + IPAD + IPHONE) ── */
                  <div
                    className="absolute cursor-move transition-all duration-150 touch-none z-20"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '88%',
                      height: '80%',
                      perspective: '1200px',
                      transform: `translate(-50%, -50%) translate(${config.mockupX}%, ${config.mockupY}%) scale(${
                        config.mockupScale / 100
                      }) rotateX(${config.mockupTiltX || 0}deg) rotateY(${config.mockupTiltY || 0}deg) rotateZ(${
                        config.mockupRotation || 0
                      }deg)`,
                      transformStyle: 'preserve-3d',
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'mockup')}
                  >
                    {/* Appareil 1 : MacBook Pro (Centre / Arrière-plan) */}
                    <div
                      className="absolute z-10 transition-transform"
                      style={{
                        width: '58%',
                        left: '21%',
                        top: '4%',
                        filter: config.shadowEnabled ? `drop-shadow(${dynamicShadow})` : undefined,
                      }}
                    >
                      <MockupFrame
                        type="macbook"
                        screenshotBase64={currentScreenshot}
                        url={customAddressBar.trim() ? (customAddressBar.startsWith('http') ? customAddressBar : 'https://' + customAddressBar) : captureItem.url}
                        title={captureItem.title}
                        domainName={customAddressBar.trim() || captureItem.domainName}
                        faviconUrl={captureItem.faviconUrl}
                        theme={config.deviceTheme}
                        styleVariant={config.deviceStyle}
                        browserStyle={config.browserStyle || browserStyle}
                        cornerRadius={config.cornerRadius}
                        cropOffsetY={config.cropOffsetY}
                      />
                    </div>

                    {/* Appareil 2 : iPad Pro (Gauche / Premier plan intermédiaire) */}
                    <div
                      className="absolute z-20 transition-transform"
                      style={{
                        width: '32%',
                        left: '2%',
                        bottom: '2%',
                        filter: config.shadowEnabled ? 'drop-shadow(0 20px 35px rgba(0,0,0,0.65))' : undefined,
                        transform: 'rotateZ(-3deg)',
                      }}
                    >
                      <MockupFrame
                        type="ipad"
                        screenshotBase64={currentScreenshot}
                        url={captureItem.url}
                        title={captureItem.title}
                        domainName={captureItem.domainName}
                        faviconUrl={captureItem.faviconUrl}
                        theme={config.deviceTheme}
                        styleVariant={config.deviceStyle}
                        cornerRadius="round"
                        cropOffsetY={config.cropOffsetY}
                      />
                    </div>

                    {/* Appareil 3 : iPhone (Droite / Premier plan avant-garde) */}
                    <div
                      className="absolute z-30 transition-transform"
                      style={{
                        width: '24%',
                        right: '3%',
                        bottom: '0%',
                        filter: config.shadowEnabled ? 'drop-shadow(0 25px 40px rgba(0,0,0,0.70))' : undefined,
                        transform: 'rotateZ(3deg)',
                      }}
                    >
                      <MockupFrame
                        type="iphone"
                        screenshotBase64={currentScreenshot}
                        url={captureItem.url}
                        title={captureItem.title}
                        domainName={captureItem.domainName}
                        faviconUrl={captureItem.faviconUrl}
                        theme={config.deviceTheme}
                        styleVariant={config.deviceStyle}
                        cornerRadius="round"
                        cropOffsetY={config.cropOffsetY}
                      />
                    </div>
                  </div>
                ) : (
                  /* ── MODE SOLO : APPAREIL UNIQUE CENTRÉ ── */
                  <div
                    className={`absolute cursor-move transition-all duration-150 touch-none z-20 ${
                      config.mockupType === 'iphone'
                        ? 'w-[42%]'
                        : config.mockupType === 'watch'
                        ? 'w-[34%]'
                        : config.mockupType === 'ipad'
                        ? 'w-[68%]'
                        : 'w-[82%]'
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
                    {currentScreenshot && (
                      <MockupFrame
                        type={config.mockupType}
                        screenshotBase64={currentScreenshot}
                        url={customAddressBar.trim() ? (customAddressBar.startsWith('http') ? customAddressBar : 'https://' + customAddressBar) : captureItem.url}
                        title={captureItem.title}
                        domainName={customAddressBar.trim() || captureItem.domainName}
                        faviconUrl={captureItem.faviconUrl}
                        theme={config.deviceTheme}
                        styleVariant={config.deviceStyle}
                        browserStyle={config.browserStyle || browserStyle}
                        cornerRadius={config.cornerRadius}
                        cropOffsetY={config.cropOffsetY}
                      />
                    )}
                  </div>
                )
              )}

              {/* CALQUES DE TEXTES */}
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
                    <span className="whitespace-pre-wrap leading-tight block drop-shadow-md">{txt.text}</span>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteText(txt.id);
                        }}
                        className="absolute -top-3 -right-3 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* CALQUES DE LOGOS */}
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
                    <img src={lg.src} alt="Logo" className="w-full h-auto object-contain pointer-events-none drop-shadow-md" />
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLogo(lg.id);
                        }}
                        className="absolute -top-3 -right-3 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* BULLES D'ANNOTATIONS DE VENTE / FEATURE CALLOUTS */}
              {(config.callouts || []).map((callout) => {
                const isSelected = selectedCalloutId === callout.id;
                return (
                  <div
                    key={callout.id}
                    onPointerDown={(e) => handlePointerDown(e, { type: 'callout', id: callout.id })}
                    className={`absolute cursor-move select-none transition-all group touch-none z-40 ${
                      isSelected ? 'ring-2 ring-violet-400' : ''
                    }`}
                    style={{
                      left: `${callout.x}%`,
                      top: `${callout.y}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div
                      className={`px-3 py-1.5 rounded-full backdrop-blur-xl border flex items-center gap-2 shadow-2xl ${
                        callout.colorTheme === 'emerald'
                          ? 'bg-emerald-950/85 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
                          : callout.colorTheme === 'amber'
                          ? 'bg-amber-950/85 border-amber-500/40 text-amber-200 shadow-amber-950/50'
                          : callout.colorTheme === 'rose'
                          ? 'bg-rose-950/85 border-rose-500/40 text-rose-200 shadow-rose-950/50'
                          : 'bg-zinc-950/85 border-violet-500/40 text-white shadow-violet-950/40'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                      {callout.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-violet-600 text-white">
                          {callout.badge}
                        </span>
                      )}
                      <span className="text-xs font-bold whitespace-nowrap drop-shadow-sm">
                        {callout.text}
                      </span>
                    </div>
                    {/* Pointer pin tail */}
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-zinc-900 mx-auto -mt-0.5 filter drop-shadow-md" />
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCallout(callout.id);
                        }}
                        className="absolute -top-3 -right-3 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}

              {/* STICKERS DE PREUVE SOCIALE */}
              {(config.socialBadges || []).filter((b) => b.visible).map((badge) => (
                <div
                  key={badge.id}
                  onPointerDown={(e) => handlePointerDown(e, { type: 'socialBadge', id: badge.id })}
                  className="absolute cursor-move select-none z-35 touch-none hover:ring-1 hover:ring-white/40 rounded-2xl p-0.5"
                  style={{
                    left: `${badge.x}%`,
                    top: `${badge.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {badge.type === 'product-hunt' && (
                    <div className="px-3 py-1.5 rounded-2xl bg-gradient-to-r from-[#da552f] to-[#ea532b] text-white flex items-center gap-2 shadow-xl border border-white/20">
                      <span className="w-5 h-5 rounded-full bg-white text-[#da552f] flex items-center justify-center font-black text-xs">P</span>
                      <div>
                        <div className="text-[9px] font-semibold uppercase tracking-wider text-white/80">Product Hunt</div>
                        <div className="text-xs font-black">#1 Product of the Day</div>
                      </div>
                    </div>
                  )}
                  {badge.type === 'stripe-mrr' && (
                    <div className="px-3.5 py-2 rounded-2xl bg-[#0a2540] text-white flex items-center gap-2.5 shadow-xl border border-[#635bff]/40">
                      <div className="w-5 h-5 rounded-lg bg-[#635bff] flex items-center justify-center font-bold text-xs text-white">S</div>
                      <div>
                        <div className="text-[9px] font-medium text-emerald-400 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Verified Revenue
                        </div>
                        <div className="text-xs font-mono font-bold">{badge.customText || '$24,500 MRR'}</div>
                      </div>
                    </div>
                  )}
                  {badge.type === 'trustpilot' && (
                    <div className="px-3.5 py-1.5 rounded-2xl bg-zinc-950/90 text-white flex items-center gap-2 shadow-xl border border-emerald-500/30">
                      <span className="text-emerald-400 font-bold text-sm">★ ★ ★ ★ ★</span>
                      <span className="text-xs font-bold text-zinc-200">4.9/5 Trustpilot</span>
                    </div>
                  )}
                  {badge.type === 'uptime' && (
                    <div className="px-3 py-1.5 rounded-2xl bg-emerald-950/80 text-emerald-200 flex items-center gap-2 shadow-xl border border-emerald-500/30 text-xs font-mono font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>99.99% Uptime SLA</span>
                    </div>
                  )}
                </div>
              ))}

              {/* BADGES TECH STACK DÉVELOPPEUR SUR LA SCÈNE */}
              {selectedTechIds.length > 0 && (
                <div
                  className={`absolute z-35 transition-all duration-300 pointer-events-none select-none flex items-center ${
                    techPosition === 'top'
                      ? 'top-4 left-1/2 -translate-x-1/2'
                      : techPosition === 'bottom'
                      ? 'bottom-4 left-1/2 -translate-x-1/2'
                      : 'bottom-6 left-6'
                  }`}
                >
                  <div
                    className={`px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-xl backdrop-blur-md border ${
                      techThemeStyle === 'dark-glass'
                        ? 'bg-black/75 border-white/20 text-white shadow-black/50'
                        : techThemeStyle === 'light-glass'
                        ? 'bg-white/85 border-white/60 text-stone-900 shadow-stone-950/20'
                        : 'bg-stone-950/95 border-violet-500/50 text-violet-300 ring-2 ring-violet-500/30'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {selectedTechIds.map((id) => {
                        const tech = AVAILABLE_TECHS.find((t) => t.id === id);
                        if (!tech) return null;
                        return (
                          <span
                            key={id}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-tight border flex items-center gap-1 ${
                              techThemeStyle === 'dark-glass'
                                ? 'bg-white/10 border-white/15 text-white'
                                : techThemeStyle === 'light-glass'
                                ? 'bg-black/5 border-black/10 text-stone-900'
                                : `${tech.color} ${tech.textColor} ${tech.borderColor}`
                            }`}
                          >
                            {tech.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* WATERMARK : FREE vs PRO (Marque blanche) */}
              {isFreePlan ? (
                <Link
                  href="/pricing"
                  className="absolute bottom-3 right-3 z-40 px-2.5 py-1 rounded-lg bg-black/65 hover:bg-violet-950/80 backdrop-blur-md text-white/90 hover:text-white text-[10px] font-mono font-semibold flex items-center gap-1.5 shadow-sm border border-white/20 hover:border-violet-400 transition-all select-none group"
                  title="Créé avec OmniMockup. Débloquez le plan Pro pour supprimer le filigrane."
                >
                  <Layers className="w-3 h-3 text-violet-400 group-hover:scale-110 transition-transform" />
                  <span>Made with OmniMockup</span>
                  <span className="text-[9px] bg-violet-600/60 px-1 py-0.5 rounded text-violet-200 group-hover:bg-violet-600 font-sans">
                    Pro
                  </span>
                </Link>
              ) : config.customWatermarkUrl ? (
                <div className="absolute bottom-3 right-3 z-40 max-w-[120px] max-h-[40px] opacity-90 select-none pointer-events-none">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.customWatermarkUrl} alt="Watermark" className="w-full h-auto object-contain" />
                </div>
              ) : null}

              {/* EFFET VFX HALO LUMINEUX */}
              {vfxGlow && (
                <div className="absolute inset-0 pointer-events-none z-15 flex items-center justify-center">
                  <div className="w-[82%] h-[75%] rounded-full bg-violet-600/30 blur-3xl animate-pulse" />
                </div>
              )}

              {/* SHADOW OVERLAY DE SCÈNE (Stores vénitiens, Feuilles, Palmier, Fenêtre) */}
              <SceneShadowOverlay type={sceneOverlay || config.sceneOverlay || 'none'} opacity={shadowOpacity / 100} />
            </div>
          </div>

          {/* ── BARRE DE CONTRÔLES FLOTTANTE AU BAS DU CANVAS (STYLE SHOTS.SO) ── */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-40 bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-3 text-xs select-none">
            {/* Sélecteur de Ratios */}
            <div className="flex items-center gap-1">
              {RATIO_PRESETS.slice(0, 5).map((rp) => (
                <button
                  key={rp.id}
                  type="button"
                  onClick={() => {
                    setConfig((p) => ({ ...p, aspectRatio: rp.id }));
                    const found = FRAME_PRESETS.find((fp) => fp.ratioId === rp.id);
                    if (found) setCurrentFramePreset(found);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                    config.aspectRatio === rp.id
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  title={rp.desc}
                >
                  {rp.label}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-zinc-750" />

            {/* Contrôles de Zoom */}
            <div className="flex items-center gap-1 text-zinc-400">
              <button
                type="button"
                onClick={() => setCanvasZoom((z) => Math.max(50, z - 10))}
                className="p-1 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                title="Zoom arrière"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-mono font-medium px-1 text-zinc-300 min-w-[36px] text-center">
                {canvasZoom}%
              </span>
              <button
                type="button"
                onClick={() => setCanvasZoom((z) => Math.min(150, z + 10))}
                className="p-1 hover:text-white hover:bg-zinc-800 rounded-md transition-colors"
                title="Zoom avant"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCanvasZoom(100)}
                className="px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
                title="Ajuster (100%)"
              >
                Fit
              </button>
            </div>

            <div className="w-px h-4 bg-zinc-750" />

            {/* Recentrer 3D */}
            <button
              type="button"
              onClick={handleReset3D}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors font-medium"
              title="Réinitialiser l'orientation 3D (0°)"
            >
              <RotateCcw className="w-3 h-3 text-violet-400" />
              <span>0°</span>
            </button>

            <div className="w-px h-4 bg-zinc-750" />

            {/* Mode Plein Écran HUD */}
            <button
              type="button"
              onClick={() => setPresentationMode(!presentationMode)}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-lg transition-all font-medium ${
                presentationMode
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-800'
              }`}
              title={presentationMode ? 'Quitter la présentation' : 'Mode Plein Écran'}
            >
              {presentationMode ? (
                <Minimize2 className="w-3 h-3 text-emerald-400" />
              ) : (
                <Maximize2 className="w-3 h-3 text-emerald-400" />
              )}
              <span className="hidden sm:inline">Plein Écran</span>
            </button>
          </div>
        </main>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 3. PANNEAU LATÉRAL D'INSPECTION (STYLE DAVINCI / RESOLVE / FIGMA) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {showRightPanel && !presentationMode && (
          <aside className="w-full lg:w-[380px] xl:w-[410px] h-full bg-[#0a0b10] border-t lg:border-t-0 lg:border-l border-zinc-850/80 flex flex-col shrink-0 z-20 overflow-hidden shadow-2xl">
          {/* Header Mobile Déplier / Replier */}
          <button
            type="button"
            onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
            className="lg:hidden w-full px-4 py-3 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-zinc-200"
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold font-mono">
                {mobileSheetOpen ? 'Réduire les réglages' : 'Ouvrir les réglages du studio'}
              </span>
            </div>
            {mobileSheetOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          {/* BARRE SUPÉRIEURE DE NAVIGATION NETWAVE & TEMPLATES */}
          <div className="px-4 py-2.5 border-b border-zinc-850/80 bg-[#08090d] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
              <span className="text-xs font-bold text-zinc-200 tracking-tight uppercase font-mono">
                {activeMainTab === 'mockup' ? 'Propriétés Mockup' : 'Propriétés Frame'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowTemplatesModal(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-[11px] font-semibold transition-all"
                title="Choisir un template"
              >
                <Layout className="w-3 h-3 text-violet-400" />
                <span>Templates</span>
              </button>

              <button
                type="button"
                onClick={() => setShowRightPanel(false)}
                className="p-1 rounded-lg hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors"
                title="Masquer le volet"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SÉLECTEUR DES 2 ONGLETS MAJEURS DU STUDIO */}
          <div className="p-3 border-b border-zinc-850/80 bg-[#090a0f] shrink-0">
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveMainTab('mockup')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeMainTab === 'mockup'
                    ? 'bg-zinc-800 text-white shadow-md ring-1 ring-white/10 font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Monitor className="w-4 h-4 text-violet-400" />
                <span>Mockup</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveMainTab('frame')}
                className={`py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-2 ${
                  activeMainTab === 'frame'
                    ? 'bg-zinc-800 text-white shadow-md ring-1 ring-white/10 font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4 text-pink-400" />
                <span>Frame</span>
              </button>
            </div>
          </div>

          {/* CONTENU DE L'INSPECTEUR DÉFILABLE */}
          <div
            className={`${
              mobileSheetOpen ? 'flex' : 'hidden lg:flex'
            } flex-col flex-1 p-4 sm:p-5 space-y-6 overflow-y-auto studio-scrollbar max-h-[calc(100vh-120px)]`}
          >
            {/* ══════════ ONGLET PRINCIPAL MOCKUP ══════════ */}
            {activeMainTab === 'mockup' && (
              <div className="space-y-0 animate-fade-in">
                {/* Sous-onglets : Appareil | 3D | Contenu | Branding | Callouts Vente ✨ */}
                <div className="flex gap-1 mb-4 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
                  {([
                    { id: 'mockup', label: 'Appareil' },
                    { id: '3d', label: '3D' },
                    { id: 'content', label: 'Contenu' },
                    { id: 'branding', label: 'Branding' },
                    { id: 'callouts', label: 'Callouts ✨' },
                  ] as const).map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all ${
                        activeTab === t.id
                          ? 'bg-zinc-700 text-white'
                          : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

            {/* ══════════ ONGLET 1 : APPAREIL & MODÈLES ══════════ */}
            {activeTab === 'mockup' && (

              <div className="space-y-5 animate-fade-in">
                {/* Disposition Solo vs Duo vs Trio */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      Mode de Disposition (Layout)
                    </label>
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Multi-Device Ready
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, layoutMode: 'single' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        (config.layoutMode || 'single') === 'single'
                          ? 'bg-violet-600/20 border-violet-500 text-white ring-1 ring-violet-500/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">Solo</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">1 Appareil</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, layoutMode: 'dual-stacked' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all relative ${
                        config.layoutMode === 'dual-stacked'
                          ? 'bg-violet-600/20 border-violet-500 text-white ring-1 ring-violet-500/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[8px] font-bold">
                        DUO
                      </span>
                      <div className="font-bold text-xs text-white">Duo</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Mac + iPhone</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, layoutMode: 'trio-ecosystem' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all relative ${
                        config.layoutMode === 'trio-ecosystem'
                          ? 'bg-violet-600/20 border-violet-500 text-white ring-1 ring-violet-500/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <span className="absolute top-1.5 right-1.5 px-1 py-0.2 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[8px] font-bold">
                        TRIO ✨
                      </span>
                      <div className="font-bold text-xs text-white">Trio Pro</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Mac+iPad+Phone</div>
                    </button>
                  </div>
                </div>

                {/* Modèle d'appareil (7 options) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Modèle d&apos;Appareil
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { type: 'browser' as MockupType, label: 'Web', icon: Monitor },
                      { type: 'macbook' as MockupType, label: 'MacBook', icon: Laptop },
                      { type: 'imac' as MockupType, label: 'iMac', icon: Tv },
                      { type: 'ipad' as MockupType, label: 'iPad', icon: Tablet },
                      { type: 'iphone' as MockupType, label: 'iPhone', icon: Smartphone },
                      { type: 'watch' as MockupType, label: 'Watch', icon: Watch },
                      { type: 'flat' as MockupType, label: 'Flat', icon: Layers },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = config.mockupType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, mockupType: item.type }))}
                          className={`py-2 px-1.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-violet-600 text-white border-violet-500 shadow-md font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[10px] truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Finition du Cadre */}
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Thème</span>
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, deviceTheme: 'light' }))}
                          className={`flex-1 py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                            config.deviceTheme === 'light' ? 'bg-violet-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Sun className="w-3 h-3" />
                          <span>Clair</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, deviceTheme: 'dark' }))}
                          className={`flex-1 py-1 rounded text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                            config.deviceTheme === 'dark' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Moon className="w-3 h-3" />
                          <span>Sombre</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Style</span>
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        {(['default', 'glass'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setConfig((p) => ({ ...p, deviceStyle: st }))}
                            className={`flex-1 py-1 rounded text-[11px] font-medium capitalize transition-all ${
                              config.deviceStyle === st ? 'bg-violet-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {st === 'default' ? 'Standard' : 'Glass'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rayon d'angle */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Rayon d&apos;angle</span>
                    <div className="grid grid-cols-3 gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                      {[
                        { id: 'sharp', label: 'Droit (0px)' },
                        { id: 'curved', label: 'Courbé (16px)' },
                        { id: 'round', label: 'Rond (28px)' },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, cornerRadius: r.id as CornerRadius }))}
                          className={`py-1 text-[10px] font-medium rounded transition-all ${
                            config.cornerRadius === r.id ? 'bg-violet-600 text-white font-bold' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ── STYLE NAVIGATEUR (Shots.so) ── */}
                {(config.mockupType === 'browser' || config.mockupType === 'macbook' || config.mockupType === 'imac') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Style Navigateur</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'safari-light' as const, label: 'Safari', sub: 'Clair', dot: 'bg-red-500' },
                        { id: 'chrome-light' as const, label: 'Chrome', sub: 'Clair', dot: 'bg-blue-500' },
                        { id: 'arc-light' as const, label: 'Arc', sub: 'Clair', dot: 'bg-purple-500' },
                        { id: 'safari-dark' as const, label: 'Safari', sub: 'Sombre', dot: 'bg-red-700' },
                        { id: 'chrome-dark' as const, label: 'Chrome', sub: 'Sombre', dot: 'bg-blue-700' },
                        { id: 'arc-dark' as const, label: 'Arc', sub: 'Sombre', dot: 'bg-purple-700' },
                      ].map((bs) => {
                        const isCurrent = (config.browserStyle || browserStyle) === bs.id;
                        return (
                          <button
                            key={bs.id}
                            type="button"
                            onClick={() => {
                              setBrowserStyle(bs.id);
                              const theme = bs.id.endsWith('dark') ? 'dark' : 'light';
                              setConfig((p) => ({ ...p, browserStyle: bs.id, deviceTheme: theme }));
                            }}
                            className={`p-2 rounded-xl border text-left transition-all ${
                              isCurrent
                                ? 'bg-violet-600/25 border-violet-500 ring-1 ring-violet-500/40'
                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-2 h-2 rounded-full ${bs.dot}`} />
                              <span className="text-[10px] font-bold text-white">{bs.label}</span>
                            </div>
                            <span className={`text-[9px] ${isCurrent ? 'text-violet-300' : 'text-zinc-500'}`}>{bs.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── BARRE D'ADRESSE PERSONNALISÉE ── */}
                {(config.mockupType === 'browser' || config.mockupType === 'macbook' || config.mockupType === 'imac') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Barre d&apos;Adresse</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-violet-500/60 transition-colors">
                      <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <input
                        type="text"
                        value={customAddressBar}
                        onChange={(e) => setCustomAddressBar(e.target.value)}
                        placeholder={captureItem.domainName || 'example.com'}
                        className="flex-1 bg-transparent text-xs text-white placeholder:text-zinc-600 outline-none"
                      />
                      {customAddressBar && (
                        <button type="button" onClick={() => setCustomAddressBar('')} className="text-zinc-500 hover:text-zinc-300">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* ── GRILLE D'ALIGNEMENT 3×3 ── */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">Position Rapide</label>
                  <div className="flex items-center gap-3">
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { pos: 'tl', title: 'Haut gauche' }, { pos: 'tc', title: 'Haut centre' }, { pos: 'tr', title: 'Haut droite' },
                        { pos: 'ml', title: 'Milieu gauche' }, { pos: 'mc', title: 'Centre' }, { pos: 'mr', title: 'Milieu droite' },
                        { pos: 'bl', title: 'Bas gauche' }, { pos: 'bc', title: 'Bas centre' }, { pos: 'br', title: 'Bas droite' },
                      ].map(({ pos, title }) => (
                        <button
                          key={pos}
                          type="button"
                          onClick={() => applyAlignment(pos)}
                          title={title}
                          className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
                            pos === 'mc'
                              ? 'bg-violet-600/20 border-violet-500/40 hover:bg-violet-600/40'
                              : 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-600'
                          }`}
                        >
                          <div className="w-2 h-2 rounded-sm bg-zinc-400" />
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => applyAlignment('mc')}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-semibold"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {/* ── SYSTÈME D'OMBRES AVANCÉ (Shots.so) ── */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                    Ombres
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'none' as const, label: 'Aucune' },
                      { id: 'spread' as const, label: 'Spread' },
                      { id: 'realistic' as const, label: 'Réelle' },
                      { id: 'adaptive' as const, label: 'Adaptive' },
                    ].map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setShadowType(sh.id)}
                        className={`py-2 px-1 rounded-xl border text-[10px] font-semibold transition-all ${
                          shadowType === sh.id
                            ? 'bg-violet-600 text-white border-violet-500'
                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                  {shadowType !== 'none' && (
                    <>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-zinc-400">Opacité</span>
                          <span className="text-violet-400 font-bold">{shadowOpacity}%</span>
                        </div>
                        <input
                          type="range" min="0" max="100" value={shadowOpacity}
                          onChange={(e) => setShadowOpacity(Number(e.target.value))}
                          className="w-full accent-violet-600 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono">
                          <span className="text-zinc-400">Angle de Lumière</span>
                          <span className="text-amber-400 font-bold">{shadowLightAngle}°</span>
                        </div>
                        <input
                          type="range" min="0" max="360" value={shadowLightAngle}
                          onChange={(e) => setShadowLightAngle(Number(e.target.value))}
                          className="w-full accent-amber-500 h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* ── BANNIÈRE MAGIC PRESET (Shots.so) ── */}
                {autoGradients.length > 0 && (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900 border border-zinc-800">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-xl bg-violet-600/20 text-violet-400">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Magic Preset</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleCycleMagicPreset('prev')}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Preset précédent"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-[10px] font-mono text-zinc-400 min-w-[28px] text-center">
                        {magicPresetIdx + 1}/{autoGradients.length}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCycleMagicPreset('next')}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                        title="Preset suivant"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* ── ZONE DE DROP MEDIA (MokupCapture.PNG) ── */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Média
                  </label>
                  <button
                    type="button"
                    onClick={() => replaceImgInputRef.current?.click()}
                    className="w-full h-24 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-violet-500/60 bg-zinc-900/60 hover:bg-zinc-900 transition-all flex flex-col items-center justify-center gap-1.5 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 group-hover:bg-violet-600/20 group-hover:text-violet-400 flex items-center justify-center text-zinc-400 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] text-zinc-400 group-hover:text-zinc-200">
                      Remplacer l&apos;image ou déposer un fichier
                    </span>
                  </button>
                </div>

                {/* ── FENÊTRE & ÉCHELLE UI (MokupCapture.PNG) ── */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      Échelle UI
                    </label>
                    <span className="text-xs font-mono font-bold text-violet-400">{uiScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={uiScale}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setUiScale(val);
                      setConfig((p) => ({ ...p, mockupScale: Math.round(val * 0.85) }));
                    }}
                    className="w-full accent-violet-600 h-1.5 rounded-lg cursor-pointer"
                  />
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {[
                      { id: 'auto', label: 'AUTO' },
                      { id: '16:9', label: '16:9' },
                      { id: 'square', label: '1:1' },
                      { id: 'full', label: 'FULL' },
                    ].map((fmt) => {
                      const isActive =
                        (fmt.id === '16:9' && config.aspectRatio === '16:9') ||
                        (fmt.id === 'square' && config.aspectRatio === '1:1') ||
                        (fmt.id === 'full' && config.aspectRatio === '4:3');
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => {
                            if (fmt.id === 'auto') {
                              setUiScale(100);
                              setConfig((p) => ({
                                ...p,
                                mockupScale: 85,
                                mockupTiltX: 0,
                                mockupTiltY: 0,
                                mockupRotation: 0,
                                mockupX: 0,
                                mockupY: 0,
                                aspectRatio: '16:9',
                              }));
                              const found = FRAME_PRESETS.find((fp) => fp.ratioId === '16:9');
                              if (found) setCurrentFramePreset(found);
                            } else if (fmt.id === '16:9') {
                              setConfig((p) => ({ ...p, aspectRatio: '16:9' }));
                              const found = FRAME_PRESETS.find((fp) => fp.ratioId === '16:9');
                              if (found) setCurrentFramePreset(found);
                            } else if (fmt.id === 'square') {
                              setConfig((p) => ({ ...p, aspectRatio: '1:1' }));
                              const found = FRAME_PRESETS.find((fp) => fp.ratioId === '1:1');
                              if (found) setCurrentFramePreset(found);
                            } else if (fmt.id === 'full') {
                              setConfig((p) => ({ ...p, aspectRatio: '4:3' }));
                              const found = FRAME_PRESETS.find((fp) => fp.ratioId === '4:3');
                              if (found) setCurrentFramePreset(found);
                            }
                          }}
                          className={`py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all text-center ${
                            isActive
                              ? 'bg-violet-600 text-white border-violet-500 shadow-xs'
                              : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                          }`}
                        >
                          {fmt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ── VISIBILITÉ DU MOCKUP ── */}
                <button
                  type="button"
                  onClick={() => setMockupHidden((v) => !v)}
                  className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    mockupHidden
                      ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 hover:bg-rose-600/30'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {mockupHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {mockupHidden ? 'Afficher le Mockup' : 'Masquer le Mockup'}
                </button>
              </div>
            )}

            {/* ══════════ ONGLET 3 : 3D, CAMÉRA & OMBRES ══════════ */}
            {activeTab === '3d' && (
              <div className="space-y-5 animate-fade-in">
                {/* Poses 3D Rapides en 1 Clic */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                      Poses 3D Rapides (1 Clic)
                    </label>
                    <button
                      type="button"
                      onClick={handleReset3D}
                      className="text-[11px] font-mono text-violet-400 hover:text-violet-300 font-bold"
                    >
                      Reset (0°)
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'À Plat', tx: 0, ty: 0, rot: 0 },
                      { label: 'Iso G.', tx: 14, ty: -18, rot: -6 },
                      { label: 'Iso D.', tx: 14, ty: 18, rot: 6 },
                      { label: 'Hero 3D', tx: -12, ty: 0, rot: 4 },
                    ].map((pose, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() =>
                          setConfig((p) => ({
                            ...p,
                            mockupTiltX: pose.tx,
                            mockupTiltY: pose.ty,
                            mockupRotation: pose.rot,
                          }))
                        }
                        className={`py-2 px-1 rounded-xl border text-xs font-semibold text-center transition-all ${
                          config.mockupTiltX === pose.tx &&
                          config.mockupTiltY === pose.ty &&
                          config.mockupRotation === pose.rot
                            ? 'bg-violet-600 text-white border-violet-500 font-bold shadow-md'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                        }`}
                      >
                        {pose.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sliders de Perspective 3D */}
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>Tilt Vertical (Haut / Bas)</span>
                      <span className="font-bold text-violet-400">{config.mockupTiltX || 0}°</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={config.mockupTiltX || 0}
                      onChange={(e) => setConfig((p) => ({ ...p, mockupTiltX: Number(e.target.value) }))}
                      className="w-full accent-violet-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>Tilt Horizontal (Gauche / Droite)</span>
                      <span className="font-bold text-violet-400">{config.mockupTiltY || 0}°</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={config.mockupTiltY || 0}
                      onChange={(e) => setConfig((p) => ({ ...p, mockupTiltY: Number(e.target.value) }))}
                      className="w-full accent-violet-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>Rotation Angulaire (Angle Z)</span>
                      <span className="font-bold text-violet-400">{config.mockupRotation || 0}°</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={config.mockupRotation || 0}
                      onChange={(e) => setConfig((p) => ({ ...p, mockupRotation: Number(e.target.value) }))}
                      className="w-full accent-violet-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>
                </div>

                {/* Échelle / Taille */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-zinc-300 uppercase">Échelle & Taille du Mockup</span>
                    <span className="text-violet-400 font-bold">{config.mockupScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    value={config.mockupScale}
                    onChange={(e) => setConfig((p) => ({ ...p, mockupScale: Number(e.target.value) }))}
                    className="w-full accent-violet-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                </div>

                {/* Ombre portée 3D */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300 uppercase font-mono">Ombre Portée Réaliste</span>
                    <input
                      type="checkbox"
                      checked={config.shadowEnabled}
                      onChange={(e) => setConfig((p) => ({ ...p, shadowEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-violet-600 rounded cursor-pointer"
                    />
                  </div>
                  {config.shadowEnabled && (
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={config.shadowIntensity}
                      onChange={(e) => setConfig((p) => ({ ...p, shadowIntensity: Number(e.target.value) }))}
                      className="w-full accent-violet-600 cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  )}
                </div>
              </div>
            )}

            {/* ══════════ ONGLET 4 : DÉFILEMENT DE PAGE & IMAGE ══════════ */}
            {activeTab === 'content' && (
              <div className="space-y-5 animate-fade-in">
                {/* Défilement vertical de la capture */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white uppercase flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-violet-400" />
                      <span>Défilement Web (Haut ↕ Bas)</span>
                    </span>
                    <span className="text-violet-400 font-bold">{config.cropOffsetY || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.cropOffsetY || 0}
                    onChange={(e) => setConfig((p) => ({ ...p, cropOffsetY: Number(e.target.value) }))}
                    className="w-full accent-violet-600 cursor-pointer h-2 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[11px] text-zinc-400 font-mono">
                    <span>▲ Haut de page</span>
                    <span>Tarifs / Features</span>
                    <span>Footer ▼</span>
                  </div>
                </div>

                {/* Remplacement manuel de l'image */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold text-white uppercase font-mono">Remplacer la capture</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Vous souhaitez utiliser une capture locale spécifique ou un mockup personnalisé ?
                  </p>
                  <input
                    ref={replaceImgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleReplaceScreenshot}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => replaceImgInputRef.current?.click()}
                    className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-semibold border border-zinc-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <ImageIcon className="w-4 h-4 text-zinc-400" />
                    <span>Choisir un fichier PNG/JPG</span>
                  </button>
                </div>
              </div>
            )}

            {/* ══════════ ONGLET 5 : TEXTES, LOGOS & TECH STACK ══════════ */}
            {activeTab === 'branding' && (
              <div className="space-y-5 animate-fade-in">
                {/* Calques de textes */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase font-mono">Titres & Textes</span>
                    <button
                      type="button"
                      onClick={handleAddText}
                      className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {config.texts.length === 0 ? (
                    <p className="text-[11px] text-zinc-400">Aucun titre ajouté sur la composition.</p>
                  ) : (
                    <div className="space-y-2">
                      {config.texts.map((txt) => (
                        <div
                          key={txt.id}
                          onClick={() => setSelectedTextId(txt.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                            selectedTextId === txt.id ? 'bg-violet-950/40 border-violet-500 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <span className="truncate max-w-[200px] font-medium">{txt.text}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteText(txt.id);
                            }}
                            className="text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeText && (
                    <div className="pt-2 border-t border-zinc-800 space-y-2">
                      <input
                        type="text"
                        value={activeText.text}
                        onChange={(e) => handleUpdateText(activeText.id, { text: e.target.value })}
                        className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-white"
                        placeholder="Texte..."
                      />
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={activeText.color}
                          onChange={(e) => handleUpdateText(activeText.id, { color: e.target.value })}
                          className="w-8 h-8 rounded border border-zinc-800 bg-transparent cursor-pointer"
                        />
                        <input
                          type="range"
                          min="16"
                          max="64"
                          value={activeText.fontSize}
                          onChange={(e) => handleUpdateText(activeText.id, { fontSize: Number(e.target.value) })}
                          className="flex-1 accent-violet-600"
                        />
                        <span className="text-xs font-mono text-zinc-400">{activeText.fontSize}px</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Badges Tech Stack Développeur */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase font-mono">Tech Stack Développeur</span>
                    <span className="text-[10px] text-zinc-400">{selectedTechIds.length} sélectionnés</span>
                  </div>
                  <TechStackPicker
                    selectedTechIds={selectedTechIds}
                    onChange={setSelectedTechIds}
                    position={techPosition}
                    onPositionChange={setTechPosition}
                    themeStyle={techThemeStyle}
                    onThemeStyleChange={setTechThemeStyle}
                  />
                </div>

                {/* Logo Client / Watermark */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase font-mono">Logo Personnalisé</span>
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ajouter Logo</span>
                    </button>
                  </div>
                  {config.logos.length > 0 && (
                    <div className="flex gap-2 flex-wrap">
                      {config.logos.map((lg) => (
                        <div key={lg.id} className="relative p-1 rounded-lg bg-zinc-950 border border-zinc-800 group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={lg.src} alt="Logo" className="w-10 h-10 object-contain" />
                          <button
                            type="button"
                            onClick={() => handleDeleteLogo(lg.id)}
                            className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-rose-600 text-white hover:bg-rose-500"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ══════════ ONGLET 5 : CALLOUTS DE VENTE & PREUVE SOCIALE ✨ ══════════ */}
            {activeTab === 'callouts' && (
              <div className="space-y-6 animate-fade-in">
                {/* 1. Badges de Preuve Sociale */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>Badges de Preuve Sociale</span>
                    </label>
                    <span className="text-[10px] text-zinc-400 font-mono">Glisser-déposer libre</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Ajoutez ces stickers de confiance directement sur votre maquette pour rassurer vos prospects et booster la conversion.
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {/* Badge Product Hunt */}
                    {(() => {
                      const isActive = (config.socialBadges || []).some((b) => b.type === 'producthunt');
                      return (
                        <button
                          type="button"
                          onClick={() => handleToggleSocialBadge('producthunt')}
                          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                            isActive
                              ? 'bg-amber-500/15 border-amber-500/60 ring-1 ring-amber-500/30'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                              😸 Product Hunt
                            </span>
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-amber-400 animate-pulse' : 'bg-zinc-700'}`} />
                          </div>
                          <div className="text-[11px] font-bold text-white">#1 Product of Day</div>
                          <div className="text-[9px] text-zinc-400 font-mono">{isActive ? '✓ Affiché sur scène' : '+ Cliquer pour ajouter'}</div>
                        </button>
                      );
                    })()}

                    {/* Badge Stripe MRR */}
                    {(() => {
                      const isActive = (config.socialBadges || []).some((b) => b.type === 'stripe-mrr');
                      return (
                        <button
                          type="button"
                          onClick={() => handleToggleSocialBadge('stripe-mrr')}
                          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                            isActive
                              ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/30'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                              💳 Stripe Verified
                            </span>
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
                          </div>
                          <div className="text-[11px] font-bold text-white">$48,200 MRR</div>
                          <div className="text-[9px] text-zinc-400 font-mono">{isActive ? '✓ Affiché sur scène' : '+ Cliquer pour ajouter'}</div>
                        </button>
                      );
                    })()}

                    {/* Badge Trustpilot */}
                    {(() => {
                      const isActive = (config.socialBadges || []).some((b) => b.type === 'trustpilot');
                      return (
                        <button
                          type="button"
                          onClick={() => handleToggleSocialBadge('trustpilot')}
                          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                            isActive
                              ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/30'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-300 flex items-center gap-1">
                              ★ Trustpilot
                            </span>
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'}`} />
                          </div>
                          <div className="text-[11px] font-bold text-white">4.9 / 5 (1,200+)</div>
                          <div className="text-[9px] text-zinc-400 font-mono">{isActive ? '✓ Affiché sur scène' : '+ Cliquer pour ajouter'}</div>
                        </button>
                      );
                    })()}

                    {/* Badge SLA Enterprise */}
                    {(() => {
                      const isActive = (config.socialBadges || []).some((b) => b.type === 'sla-enterprise');
                      return (
                        <button
                          type="button"
                          onClick={() => handleToggleSocialBadge('sla-enterprise')}
                          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                            isActive
                              ? 'bg-blue-500/15 border-blue-500/60 ring-1 ring-blue-500/30'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-400 flex items-center gap-1">
                              ⚡ SLA Garanti
                            </span>
                            <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-400 animate-pulse' : 'bg-zinc-700'}`} />
                          </div>
                          <div className="text-[11px] font-bold text-white">99.99% Uptime</div>
                          <div className="text-[9px] text-zinc-400 font-mono">{isActive ? '✓ Affiché sur scène' : '+ Cliquer pour ajouter'}</div>
                        </button>
                      );
                    })()}
                  </div>
                </div>

                {/* 2. Bulles d'annotations / Callouts de vente */}
                <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-violet-400" />
                      <span>Bulles Callouts de Vente</span>
                    </label>
                    <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20">
                      Flèches Pointées
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Pointez les fonctionnalités clés de votre produit (IA, Vitesse, Checkout, ROI) directement sur l&apos;écran pour capter l&apos;attention de l&apos;acheteur.
                  </p>

                  {/* Presets rapides en 1 clic */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-zinc-400">Ajout rapide en 1 clic :</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddCallout('⚡ +300% de Conversion', 'emerald')}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-medium text-emerald-400 hover:border-emerald-500/50 transition-all flex items-center gap-1.5"
                      >
                        <span>⚡</span>
                        <span className="truncate">+300% Conversion</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCallout('🤖 IA Native Générative', 'violet')}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-medium text-violet-400 hover:border-violet-500/50 transition-all flex items-center gap-1.5"
                      >
                        <span>🤖</span>
                        <span className="truncate">IA Native Instantanée</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCallout('💳 Paiement 1-Clic Sans Friction', 'amber')}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-medium text-amber-400 hover:border-amber-500/50 transition-all flex items-center gap-1.5"
                      >
                        <span>💳</span>
                        <span className="truncate">Paiement 1-Clic</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCallout('🔒 Sécurité Bancaire 256-bit', 'blue')}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-medium text-blue-400 hover:border-blue-500/50 transition-all flex items-center gap-1.5"
                      >
                        <span>🔒</span>
                        <span className="truncate">Sécurité Bancaire</span>
                      </button>
                    </div>
                  </div>

                  {/* Bouton création d'un callout personnalisé */}
                  <button
                    type="button"
                    onClick={() => handleAddCallout('Nouvel argument clé ✨', 'violet')}
                    className="w-full py-2.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Créer un callout personnalisé</span>
                  </button>

                  {/* Liste des callouts actifs pour édition */}
                  {(config.callouts || []).length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-mono uppercase text-zinc-400">
                        Callouts sur la maquette ({(config.callouts || []).length}) :
                      </span>
                      <div className="space-y-2">
                        {(config.callouts || []).map((c) => (
                          <div
                            key={c.id}
                            className={`p-3 rounded-xl border bg-zinc-900 space-y-2.5 transition-all ${
                              selectedCalloutId === c.id
                                ? 'border-violet-500 ring-1 ring-violet-500/30'
                                : 'border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={c.text}
                                onChange={(e) => handleUpdateCallout(c.id, { text: e.target.value })}
                                onFocus={() => setSelectedCalloutId(c.id)}
                                className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white focus:outline-none focus:border-violet-500 font-medium"
                                placeholder="Texte de l'argument..."
                              />
                              <button
                                type="button"
                                onClick={() => handleDeleteCallout(c.id)}
                                className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                                title="Supprimer ce callout"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                              <span className="flex items-center gap-1.5">
                                <span>Couleur :</span>
                                <div className="flex gap-1">
                                  {(['violet', 'emerald', 'amber', 'blue', 'rose', 'dark'] as const).map((color) => {
                                    const colorMap: Record<string, string> = {
                                      violet: 'bg-violet-500',
                                      emerald: 'bg-emerald-500',
                                      amber: 'bg-amber-500',
                                      blue: 'bg-blue-500',
                                      rose: 'bg-rose-500',
                                      dark: 'bg-zinc-700',
                                    };
                                    return (
                                      <button
                                        key={color}
                                        type="button"
                                        onClick={() => handleUpdateCallout(c.id, { color })}
                                        className={`w-3.5 h-3.5 rounded-full ${colorMap[color]} transition-transform ${
                                          (c.color || 'violet') === color ? 'scale-125 ring-2 ring-white/60' : 'opacity-60 hover:opacity-100'
                                        }`}
                                      />
                                    );
                                  })}
                                </div>
                              </span>

                              <span className="flex items-center gap-1.5">
                                <span>Pointeur :</span>
                                <select
                                  value={c.tailPosition || 'bottom-left'}
                                  onChange={(e) =>
                                    handleUpdateCallout(c.id, {
                                      tailPosition: e.target.value as any,
                                    })
                                  }
                                  className="bg-zinc-950 text-white border border-zinc-800 rounded px-1.5 py-0.5 text-[10px] focus:outline-none"
                                >
                                  <option value="bottom-left">Bas Gauche</option>
                                  <option value="bottom-right">Bas Droite</option>
                                  <option value="top-left">Haut Gauche</option>
                                  <option value="top-right">Haut Droite</option>
                                </select>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-[11px] text-violet-300 leading-relaxed flex items-start gap-2">
                    <span className="text-base leading-none">💡</span>
                    <span>
                      <strong>Astuce Pro :</strong> Cliquez et faites glisser n&apos;importe quelle bulle ou badge directement sur le canevas central pour la placer au pixel près !
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/* /activeMainTab==='mockup' wrapper close */}
              </div>
            )}

            {/* ══════════ ONGLET PRINCIPAL 2 : FRAME & ARRIÈRE-PLANS (SHOTS.SO) ══════════ */}
            {activeMainTab === 'frame' && (
              <div className="space-y-6 animate-fade-in">
                {/* 1. Format & Résolution du Canvas (Bouton Popover) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Format & Dimensions du Canvas
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFrameSizePopover(true)}
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-violet-500/60 flex items-center justify-between transition-all group shadow-sm hover:bg-zinc-850"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-7 rounded-lg bg-zinc-950 border border-zinc-750 flex items-center justify-center text-[10px] font-mono font-bold text-violet-400 group-hover:border-violet-500">
                        {currentFramePreset.ratioLabel}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                          {currentFramePreset.name}
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          {currentFramePreset.width} × {currentFramePreset.height} • {currentFramePreset.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-white">
                      <span className="text-[10px] font-medium hidden sm:inline">Changer</span>
                      <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                    </div>
                  </button>
                </div>

                {/* 2. Effets & Watermark (FrameCapture.PNG) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Effets & Filigrane
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Portrait Blur */}
                    <button
                      type="button"
                      onClick={() => setPortraitBlur((v) => !v)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        portraitBlur
                          ? 'bg-violet-600/20 border-violet-500 text-white ring-1 ring-violet-500/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${portraitBlur ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Portrait</div>
                        <div className="text-[10px] text-zinc-500">{portraitBlur ? 'Activé' : 'Flou de champ'}</div>
                      </div>
                    </button>

                    {/* Watermark */}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMainTab('mockup');
                        setActiveTab('branding');
                      }}
                      className="p-3 rounded-2xl border bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850 text-left flex items-center gap-2.5 transition-all"
                    >
                      <div className="p-2 rounded-xl bg-zinc-800 text-zinc-300">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Watermark</div>
                        <div className="text-[10px] text-zinc-500">Logo de marque</div>
                      </div>
                    </button>

                    {/* Bg Effects */}
                    <button
                      type="button"
                      onClick={() => {
                        const patterns: ('none' | 'grid' | 'dots' | 'mesh' | 'noise')[] = ['none', 'grid', 'dots', 'mesh', 'noise'];
                        const currentIdx = patterns.indexOf(config.bgPattern || 'none');
                        const nextPat = patterns[(currentIdx + 1) % patterns.length];
                        setConfig((p) => ({ ...p, bgPattern: nextPat }));
                      }}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        (config.bgPattern || 'none') !== 'none'
                          ? 'bg-violet-600/20 border-violet-500 text-white ring-1 ring-violet-500/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${(config.bgPattern || 'none') !== 'none' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                        <Grid className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Bg Effects</div>
                        <div className="text-[10px] text-zinc-500 capitalize">{config.bgPattern || 'Aucun'}</div>
                      </div>
                    </button>

                    {/* VFX Glow */}
                    <button
                      type="button"
                      onClick={() => setVfxGlow((v) => !v)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        vfxGlow
                          ? 'bg-violet-600/20 border-violet-500 text-white ring-1 ring-violet-500/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${vfxGlow ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">VFX Glow</div>
                        <div className="text-[10px] text-zinc-500">{vfxGlow ? 'Activé' : 'Halo doux'}</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Scène & Ombres (Overlays Feuilles / Stores / Palmiers / Formes 3D) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Scène & Ombres Portées (Overlays)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSceneOverlay('none');
                        setConfig((p) => ({ ...p, sceneOverlay: 'none' }));
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        (sceneOverlay === 'none' || !sceneOverlay)
                          ? 'bg-violet-600 text-white border-violet-500 font-bold shadow-md'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <EyeOff className="w-4 h-4 mx-auto mb-1 opacity-70" />
                      <span className="text-[11px] font-medium">Aucun</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const overlays: SceneOverlayPreset[] = ['blinds', 'leaves', 'palm', 'window'];
                        const next = sceneOverlay === 'none' ? 'palm' : overlays[(overlays.indexOf(sceneOverlay) + 1) % overlays.length] || 'blinds';
                        setSceneOverlay(next);
                        setConfig((p) => ({ ...p, sceneOverlay: next }));
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        sceneOverlay !== 'none' && sceneOverlay !== 'shapes'
                          ? 'bg-violet-600 text-white border-violet-500 font-bold shadow-md'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sun className="w-4 h-4 mx-auto mb-1 text-amber-300" />
                      <span className="text-[11px] font-medium capitalize">
                        {sceneOverlay === 'blinds' ? 'Stores' : sceneOverlay === 'leaves' ? 'Feuilles' : sceneOverlay === 'palm' ? 'Palmier' : sceneOverlay === 'window' ? 'Fenêtre' : 'Ombre'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const next = sceneOverlay === 'shapes' ? 'none' : 'shapes';
                        setSceneOverlay(next);
                        setConfig((p) => ({ ...p, sceneOverlay: next }));
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        sceneOverlay === 'shapes'
                          ? 'bg-violet-600 text-white border-violet-500 font-bold shadow-md'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-4 h-4 mx-auto mb-1 text-violet-300" />
                      <span className="text-[11px] font-medium">Formes 3D</span>
                    </button>
                  </div>
                </div>

                {/* 4. Arrière-Plans (FrameCapture.PNG, Frame1.PNG, Frame2.PNG) */}
                <div className="space-y-4 pt-1">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                    Arrière-Plan
                  </label>

                  {/* 4 Boutons Rapides : Transparent, Couleur, Image, Flouté */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {/* Transparent */}
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, bgTransparent: !p.bgTransparent }))}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        config.bgTransparent
                          ? 'bg-violet-600 text-white border-violet-500 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-4 h-4 mx-auto mb-1 border border-zinc-600 rounded-xs bg-[linear-gradient(45deg,#444_25%,transparent_25%),linear-gradient(-45deg,#444_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#444_75%)] bg-[size:6px_6px]" />
                      <span className="text-[10px] block truncate">Transp.</span>
                    </button>

                    {/* Couleur Unie */}
                    <label className="p-2 rounded-xl border text-center transition-all bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white cursor-pointer relative">
                      <Pipette className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                      <span className="text-[10px] block truncate">Couleur</span>
                      <input
                        type="color"
                        value={config.bgType === 'solid' ? config.bgValue : '#ffffff'}
                        onChange={(e) =>
                          setConfig((p) => ({
                            ...p,
                            bgType: 'solid',
                            bgValue: e.target.value,
                            bgTransparent: false,
                          }))
                        }
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                      />
                    </label>

                    {/* Image personnalisée */}
                    <button
                      type="button"
                      onClick={() => bgImgInputRef.current?.click()}
                      className="p-2 rounded-xl border text-center transition-all bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                    >
                      <ImageUp className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                      <span className="text-[10px] block truncate">Image</span>
                    </button>

                    {/* Flouté Web */}
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, bgType: 'blurred-image', bgTransparent: false }))}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        config.bgType === 'blurred-image' && !config.bgTransparent
                          ? 'bg-violet-600 text-white border-violet-500 font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Flame className="w-4 h-4 mx-auto mb-1 text-pink-400" />
                      <span className="text-[10px] block truncate">Flou Web</span>
                    </button>
                  </div>

                  {/* ── MAGIC ✨ (Généré par les couleurs réelles de la capture) ── */}
                  {autoGradients.length > 0 && !config.bgTransparent && (
                    <div className="p-3.5 rounded-2xl bg-gradient-to-br from-violet-950/40 via-zinc-900 to-zinc-900 border border-violet-500/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                          <span className="text-xs font-bold text-white">Magic ✨</span>
                        </div>
                        <span className="text-[10px] text-violet-300 font-mono">Auto IA</span>
                      </div>
                      <p className="text-[10px] text-zinc-400">
                        Extrait les teintes dominantes de votre capture pour un accord parfait.
                      </p>
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        {autoGradients.map((grad, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setConfig((p) => ({
                                ...p,
                                bgType: 'gradient',
                                bgValue: grad.value,
                                bgTransparent: false,
                              }))
                            }
                            className={`h-11 rounded-xl border transition-all transform hover:scale-105 ${
                              config.bgValue === grad.value ? 'ring-2 ring-violet-400 border-white' : 'border-zinc-700'
                            }`}
                            style={{ background: grad.value }}
                            title={grad.name}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── COULEURS UNIES (32 nuances de Frame1.PNG) ── */}
                  {!config.bgTransparent && (
                    <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono">
                          Couleurs Unies
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAllSolidColors((v) => !v)}
                          className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-0.5"
                        >
                          <span>{showAllSolidColors ? 'Réduire' : 'Voir tout'}</span>
                          {showAllSolidColors ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>

                      <div className="grid grid-cols-8 gap-1.5 pt-1">
                        {(showAllSolidColors ? SOLID_COLORS : SOLID_COLORS.slice(0, 16)).map((c, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() =>
                              setConfig((p) => ({
                                ...p,
                                bgType: 'solid',
                                bgValue: c,
                                bgTransparent: false,
                              }))
                            }
                            className={`w-7 h-7 rounded-lg border transition-all transform hover:scale-110 ${
                              config.bgType === 'solid' && config.bgValue === c
                                ? 'ring-2 ring-violet-500 border-white scale-105'
                                : 'border-zinc-750'
                            }`}
                            style={{ backgroundColor: c }}
                            title={c}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── CATÉGORIES DE WALLPAPERS (Frame1.PNG & Frame2.PNG) ── */}
                  {!config.bgTransparent && (
                    <div className="space-y-4">
                      {BACKGROUND_CATEGORIES.map((cat) => (
                        <div key={cat.id} className="space-y-2 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white capitalize">{cat.name}</span>
                              {cat.badge && (
                                <span className="px-1.5 py-0.2 rounded-md bg-violet-600/30 border border-violet-500/40 text-violet-300 text-[9px] font-bold">
                                  {cat.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {cat.presets.length} presets
                            </span>
                          </div>

                          <div className="grid grid-cols-4 gap-2 pt-1">
                            {cat.presets.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() =>
                                  setConfig((p) => ({
                                    ...p,
                                    bgType: preset.type as SceneConfig['bgType'],
                                    bgValue: preset.value,
                                    bgTransparent: false,
                                  }))
                                }
                                className={`h-12 rounded-xl border transition-all transform hover:scale-105 relative overflow-hidden group flex items-end p-1 ${
                                  config.bgValue === preset.value
                                    ? 'ring-2 ring-violet-400 border-white shadow-lg'
                                    : 'border-zinc-750 hover:border-zinc-600'
                                }`}
                                style={{ background: preset.value }}
                                title={preset.name}
                              >
                                <span className="text-[8px] font-bold text-white/90 drop-shadow-md truncate max-w-full opacity-80 group-hover:opacity-100">
                                  {preset.name.split(' ')[0]}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Inputs fichiers cachés pour l'upload d'image et de fond */}
            <input
              ref={replaceImgInputRef}
              type="file"
              accept="image/*"
              onChange={handleReplaceScreenshot}
              className="hidden"
            />
            <input
              ref={bgImgInputRef}
              type="file"
              accept="image/*"
              onChange={handleBgImageUpload}
              className="hidden"
            />

          </div>
        </aside>
      )}
      </div>

      {/* MODALE DU KIT DE VENTE DÉVELOPPEUR IA */}
      <DeveloperSalesKitModal
        isOpen={salesKitOpen}
        onClose={() => setSalesKitOpen(false)}
        defaultProjectUrl={captureItem.url}
        defaultProjectTitle={captureItem.title}
        selectedTechIds={selectedTechIds}
      />

      {/* POPOVER FORMAT DE FRAME */}
      {showFrameSizePopover && (
        <FrameSizePopover
          currentAspectRatio={config.aspectRatio}
          currentWidth={currentFramePreset.width}
          currentHeight={currentFramePreset.height}
          onSelectPreset={(p) => {
            setCurrentFramePreset(p);
            setConfig((prev) => ({ ...prev, aspectRatio: p.ratioId }));
            setShowFrameSizePopover(false);
          }}
          onCustomSize={(w, h) => {
            const customPreset: FramePresetOption = {
              id: `custom-${w}x${h}`,
              name: `Personnalisé (${w}×${h})`,
              category: 'Custom',
              ratioId: 'libre',
              ratioLabel: `${w}:${h}`,
              width: w,
              height: h,
              ratioClass: 'aspect-auto',
            };
            setCurrentFramePreset(customPreset);
            setConfig((prev) => ({ ...prev, aspectRatio: 'libre' }));
            setShowFrameSizePopover(false);
          }}
          onClose={() => setShowFrameSizePopover(false)}
        />
      )}

      {/* MODALE TEMPLATES */}
      {showTemplatesModal && (
        <TemplatesModal
          onSelectTemplate={(tmpl) => {
            handleApplyTemplate(tmpl);
            setShowTemplatesModal(false);
          }}
          onClose={() => setShowTemplatesModal(false)}
        />
      )}
    </div>
  );
};
