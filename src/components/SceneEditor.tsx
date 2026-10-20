'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import Link from 'next/link';
import { toCanvas } from 'html-to-image';
import { captureOne } from '@/lib/captureCache';
import { trackEvent } from '@/lib/tracking';
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
  DeviceColor,
  SceneAnnotation,
} from '@/types/analyzer';
import { MockupFrame } from './MockupFrame';
import { useUser } from '@/context/UserContext';
import {
  Download,
  Sparkles,
  Palette,
  Image as ImageIcon,
  Move,
  Trash2,
  Plus,
  RefreshCw,
  AlertTriangle,
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
  FileText,
  Link2,
  FilePlus,
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
  TrendingUp,
  Bot,
  Undo2,
  Redo2,
  Lock,
  SlidersHorizontal,
  PenLine,
  MoveUpRight,
  Square,
  Circle,
  Hash,
  EyeOff as BlurIcon,
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
import { ExportCrossSellBanner } from './ExportCrossSellBanner';
import { PlanUpsellModal, UpsellMode } from './PlanUpsellModal';
import { saveProject, makeThumbnail, newProjectId } from '@/lib/studioDraft';
import { SceneAnnotationsLayer } from './SceneAnnotationsLayer';
import { BrandKitPanel } from './BrandKitPanel';
import { SavedStylesPanel } from './SavedStylesPanel';
import { StudioTour } from './StudioTour';
import { AiDirectorPanel } from './AiDirectorPanel';
import { PresentationDialog, MAX_PRESENTATION_SLIDES, type PresentationOutput } from './PresentationDialog';
import { renderCarouselPages, buildLinkedInCarouselPdf } from '@/lib/carousel';
import { SitePagesPanel, type SitePage } from './SitePagesPanel';
import { PhotoBackgroundsPanel } from './PhotoBackgroundsPanel';
import { PhotoScenesPanel } from './PhotoScenesPanel';
import { ShareDialog } from './ShareDialog';
import { renderPhotoScene, type PhotoScene } from '@/lib/photoScenes';
import { buildPresentationPdf, type PresentationMeta, type PresentationSlide } from '@/lib/presentationPdf';
import type { BrandKit } from '@/lib/brandKit';
import { STUDIO_FONTS, STUDIO_FONT_VARIABLES, studioFontFamily } from '@/lib/studioFonts';

interface SceneEditorProps {
  captureItem: CaptureItemResult;
  initialMockup?: MockupType;
  onClose?: () => void;
  /** Réglages d'un brouillon sauvegardé à restaurer à l'ouverture */
  initialSnapshot?: unknown;
  /** Version mobile déjà capturée (brouillon) */
  initialMobileScreenshot?: string;
  /** Avant / Après : ancien site (brouillon) */
  initialBeforeScreenshot?: string;
  initialBeforeUrl?: string;
  /** Projet enregistré sur cet appareil (Mes projets) */
  projectId?: string;
  /** Mode « Captures pour les stores » : les écrans d'une appli mobile (images), un visuel par écran */
  initialStoreScreens?: string[];
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
          { name: 'Magique : Harmonieux', value: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` },
          { name: 'Magique : Éclatant', value: `linear-gradient(135deg, ${c2} 0%, ${c3} 50%, ${c1} 100%)` },
          { name: 'Magique : Ambiance', value: `radial-gradient(circle, ${c1} 0%, ${c3} 100%)` },
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
    name: 'Vagues claires',
    value: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 25%, #db2777 50%, #f97316 75%, #06b6d4 100%)',
  },
  {
    name: 'Couchant chaud',
    value: 'linear-gradient(135deg, #f97316 0%, #ea580c 30%, #c2410c 60%, #7c2d12 100%)',
  },
  {
    name: 'Pacifique',
    value: 'linear-gradient(135deg, #0284c7 0%, #0369a1 40%, #0f172a 100%)',
  },
  {
    name: 'Ambre doux',
    value: 'linear-gradient(135deg, #f59e0b 0%, #d97706 40%, #b45309 70%, #78350f 100%)',
  },
  {
    name: 'Aurore boréale',
    value: 'linear-gradient(135deg, #047857 0%, #0d9488 40%, #0e7490 70%, #1e1b4b 100%)',
  },
  {
    name: 'Studio sombre',
    value: 'linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)',
  },
  {
    name: 'Sable',
    value: 'linear-gradient(135deg, #fdfbf7 0%, #f4efe6 50%, #eae3d2 100%)',
  },
  {
    name: 'Quartz rose',
    value: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #6366f1 100%)',
  },
  {
    name: 'Néon',
    value: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #3b82f6 100%)',
  },
];

type ExportFormat = 'png' | 'jpg' | 'webp';
type ExportQuality = 'standard' | 'hd' | '4k';

/** Dimensions réelles du fichier exporté pour un format de canevas et une qualité. */
function getExportSize(preset: FramePresetOption, quality: ExportQuality): { width: number; height: number } {
  const longSide = Math.max(preset.width, preset.height);
  const factor = quality === '4k' ? 2 : quality === 'hd' ? 1 : Math.min(1, 1280 / longSide);
  return { width: Math.round(preset.width * factor), height: Math.round(preset.height * factor) };
}

// Formats du pack réseaux sociaux (un fichier par format, dimensions officielles)
const SOCIAL_PACK_PRESET_IDS = ['geo-16-9', 'li-post', 'ig-post', 'ig-portrait', 'ig-story'];
// Packs magasins d'applications : tailles exactes exigées, en JPG (Apple et Google refusent la transparence)
const APP_STORE_PACK_PRESET_IDS = ['app-iphone-63', 'app-iphone-69', 'app-ipad-129'];
const PLAY_STORE_PACK_PRESET_IDS = ['play-phone', 'play-tablet', 'play-feature'];

// Badges de confiance : aucun chiffre pré-rempli, l'utilisateur saisit SES vraies données
const TRUST_BADGES: { type: SocialProofBadgeType; label: string; icon: string; placeholder: string; hint: string }[] = [
  { type: 'trustpilot', label: 'Note clients', icon: '★', placeholder: 'Votre note (ex. 4,8/5)', hint: 'Note moyenne réelle de vos avis' },
  { type: 'stripe-mrr', label: 'Chiffre clé', icon: '📈', placeholder: 'Votre chiffre clé', hint: 'Un résultat vérifiable du projet' },
  { type: 'product-hunt', label: 'Distinction', icon: '🏆', placeholder: 'Votre distinction', hint: 'Prix ou classement réellement obtenu' },
  { type: 'uptime', label: 'Disponibilité', icon: '🟢', placeholder: 'Votre disponibilité', hint: 'Taux mesuré par votre outil de suivi' },
];

// Image transparente utilisée si une image de la scène ne peut pas être chargée pendant l'export
const EXPORT_IMAGE_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

/** Format vidéo enregistrable par ce navigateur : MP4 si possible, sinon WebM. */
/** Animations proposées pour l'export vidéo */
const VIDEO_ANIMATIONS: { id: VideoAnimPreset; label: string; hint: string }[] = [
  { id: 'zoomIn', label: 'Zoom lent', hint: 'Zoom lent sur la scène, 3 s' },
  { id: 'rotate3d', label: 'Rotation 3D', hint: "L'appareil pivote en 3D, 3 s" },
  { id: 'riseIn', label: 'Entrée', hint: "L'appareil glisse vers le haut, 3 s" },
  { id: 'scroll', label: 'Défilement', hint: 'La page entière défile dans l\'écran, 5 à 13 s' },
];

function getVideoFormat(): { mimeType: string; extension: 'mp4' | 'webm' } {
  if (typeof MediaRecorder !== 'undefined') {
    for (const t of ['video/mp4;codecs=avc1.42E01E', 'video/mp4;codecs=avc1', 'video/mp4']) {
      if (MediaRecorder.isTypeSupported(t)) return { mimeType: t, extension: 'mp4' };
    }
  }
  return { mimeType: 'video/webm', extension: 'webm' };
}

const EXPERT_MODE_STORAGE_KEY = 'omnimockup_studio_expert';

/**
 * Attend que l'écran ait affiché la dernière mise à jour. Si l'onglet passe en arrière-plan
 * (le client change d'application pendant l'export), le navigateur n'affiche plus d'images :
 * on n'attend alors pas plus de 80 ms, sinon l'export restait bloqué sur « Rendu… ».
 */
const nextFrame = () =>
  new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        resolve();
      }
    };
    requestAnimationFrame(() => finish());
    setTimeout(finish, 80);
  });
const HISTORY_LIMIT = 60;

export const SceneEditor: React.FC<SceneEditorProps> = ({
  captureItem,
  initialMockup = 'browser',
  onClose,
  initialSnapshot,
  initialMobileScreenshot,
  initialBeforeScreenshot,
  initialBeforeUrl,
  projectId,
  initialStoreScreens,
}) => {
  const { user, profile, signOut, isPremiumUser, refreshProfile } = useUser();
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
    // Fond par défaut sobre (gris clair uni) : le mockup ressort sans effet « dégradé violet »
    bgType: 'solid',
    bgValue: '#E9E9EB',
    bgTransparent: false,
    bgNoise: false,
    mockupType: initialMockup,
    deviceTheme: 'light',
    deviceStyle: 'default',
    cornerRadius: 'curved',
    layoutMode: 'single',
    deviceColor: 'graphite',
    phoneModel: 'iphone',
    phoneScreen: 'mobile',
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
  const [activeTab, setActiveTab] = useState<'mockup' | 'frame' | '3d' | 'content' | 'branding' | 'callouts' | 'annotate'>('mockup');
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
  const [selectedLogoId, setSelectedLogoId] = useState<string | null>(null);
  const [selectedCalloutId, setSelectedCalloutId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [isExportingPack, setIsExportingPack] = useState(false);
  // Bandeau d'export : étape en cours, fin ou erreur (remplace les fenêtres d'alerte)
  const [exportStep, setExportStep] = useState('');
  const [exportNotice, setExportNotice] = useState<{ kind: 'done' | 'error'; text: string } | null>(null);
  const exportNoticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showExportNotice = (kind: 'done' | 'error', text: string) => {
    if (exportNoticeTimer.current) clearTimeout(exportNoticeTimer.current);
    setExportNotice({ kind, text });
    exportNoticeTimer.current = setTimeout(() => setExportNotice(null), kind === 'error' ? 8000 : 3000);
  };
  const showExportDone = (text: string) => showExportNotice('done', text);
  const showExportError = (text: string) => showExportNotice('error', text);
  const [packProgress, setPackProgress] = useState<string>('');
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  // Confirmation avant de quitter : évite les sorties accidentelles (surtout sur téléphone)
  const [confirmQuit, setConfirmQuit] = useState(false);

  // État du Kit Vente & Pitch IA
  const [salesKitOpen, setSalesKitOpen] = useState(false);

  // Badges Stack Technique Développeur
  // Aucun badge par défaut : la technologie du site n'est pas connue, l'utilisateur ajoute les siens
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [techPosition, setTechPosition] = useState<'bottom' | 'top' | 'floating'>('bottom');
  const [techThemeStyle, setTechThemeStyle] = useState<'dark-glass' | 'light-glass' | 'neon'>('dark-glass');

  // État de l'exportation vidéo animée
  const [videoPreset, setVideoPreset] = useState<VideoAnimPreset>('zoomIn');
  const [videoAsGif, setVideoAsGif] = useState(false);
  // Rendu image par image d'une animation : l'historique « annuler » est mis en pause
  const videoAnimatingRef = useRef(false);
  const [videoProgress, setVideoProgress] = useState('');
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
  const [showCrossSellBanner, setShowCrossSellBanner] = useState<boolean>(false);
  const [upsellModal, setUpsellModal] = useState<{ open: boolean; mode: UpsellMode }>({
    open: false,
    mode: 'free_quota_reached',
  });

  // ══ ONGLETS PRINCIPAUX DU STUDIO (MOCKUP vs FRAME style Shots.so) ══
  const [activeMainTab, setActiveMainTab] = useState<'mockup' | 'frame'>('mockup');
  // Changer d'onglet ramène les réglages en haut : sinon on arrive au milieu de la liste sans savoir où l'on est
  const inspectorScrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const content = inspectorScrollRef.current;
    if (!content) return;
    content.scrollTo({ top: 0 });
    // Téléphone : c'est la page qui défile. On la remonte juste au début des réglages (sous l'aperçu et les onglets).
    const page = document.getElementById('studio-scroll');
    const tabs = document.querySelector<HTMLElement>('[data-tour="panel"]');
    if (!page || !tabs || window.innerWidth >= 1024) return;
    // Après l'affichage du nouvel onglet : on aligne le début des réglages juste sous les onglets
    const raf = requestAnimationFrame(() => {
      const gap = content.getBoundingClientRect().top - tabs.getBoundingClientRect().bottom;
      if (gap < 0) page.scrollBy({ top: gap });
    });
    return () => cancelAnimationFrame(raf);
  }, [activeTab, activeMainTab]);
  const [showFrameSizePopover, setShowFrameSizePopover] = useState<boolean>(false);
  const [currentFramePreset, setCurrentFramePreset] = useState<FramePresetOption>(FRAME_PRESETS[0]); // 16:9 1920 × 1080

  // ══ MODE « CAPTURES POUR LES STORES » ══
  // Un visuel par écran de l'appli : l'écran dans un iPhone, une accroche au-dessus, un fond uni,
  // exporté aux tailles exactes de l'App Store et de Google Play.
  const [storeScreens, setStoreScreens] = useState<{ id: string; src: string; caption: string }[]>(() =>
    (initialStoreScreens || []).map((src, i) => ({ id: `ecran_${i}_${src.length}`, src, caption: '' }))
  );
  const [activeStoreId, setActiveStoreId] = useState<string>(() => (initialStoreScreens?.length ? `ecran_0_${initialStoreScreens[0].length}` : ''));
  const storeMode = storeScreens.length > 0;
  const activeStore = storeScreens.find((sc) => sc.id === activeStoreId) || storeScreens[0];
  const storeFileInputRef = useRef<HTMLInputElement>(null);
  const [showAllSolidColors, setShowAllSolidColors] = useState<boolean>(false);
  const [sceneOverlay, setSceneOverlay] = useState<SceneOverlayPreset>('none');
  const [portraitBlur, setPortraitBlur] = useState<boolean>(false);
  const [vfxGlow, setVfxGlow] = useState<boolean>(false);
  const [uiScale, setUiScale] = useState<number>(100);
  const [magicPresetIdx, setMagicPresetIdx] = useState<number>(0);

  // ══ FORMAT UNIQUE DU CANEVAS ══
  // Source unique : currentFramePreset (dimensions réelles). config.aspectRatio suit toujours.
  const selectFramePreset = useCallback((preset: FramePresetOption) => {
    setCurrentFramePreset(preset);
    setConfig((p) => ({ ...p, aspectRatio: preset.ratioId }));
  }, []);

  // Mode stores : iPhone seul, format App Store, fond uni sombre, appareil un peu plus bas pour laisser la place à l'accroche
  const storeSetupDone = useRef(false);
  useEffect(() => {
    if (!storeMode || storeSetupDone.current) return;
    storeSetupDone.current = true;
    const appStore = FRAME_PRESETS.find((fp) => fp.id === 'app-iphone-69');
    if (appStore) selectFramePreset(appStore);
    setConfig((p) => ({
      ...p,
      mockupType: 'iphone',
      phoneModel: 'iphone',
      layoutMode: 'single',
      phoneScreen: 'desktop',
      bgType: 'solid',
      bgValue: '#111111',
      bgTransparent: false,
      mockupScale: 125,
      mockupX: 0,
      mockupY: 11,
    }));
    if (storeScreens[0]) setCurrentScreenshot(storeScreens[0].src);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeMode]);

  // ══ EXPORT ══
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('png');
  const [exportQuality, setExportQualityState] = useState<ExportQuality>('standard');
  // Qualité par défaut = la meilleure incluse dans le forfait ; une qualité supérieure
  // n'est demandée que si l'utilisateur la choisit lui-même (crédits ou forfait supérieur).
  const qualityChosenRef = useRef(false);
  const setExportQuality = (q: ExportQuality) => {
    qualityChosenRef.current = true;
    setExportQualityState(q);
  };
  const exportMenuRef = useRef<HTMLDivElement | null>(null);
  // Qualités incluses dans le forfait (affichage). Le serveur décide au moment de l'export :
  // inclus, payable en crédits, ou refusé (/api/exports/authorize).
  const canExportHd = userPlan !== 'free';
  const canExport4k = userPlan === 'pro' || userPlan === 'agence';
  const effectiveQuality: ExportQuality = exportQuality;
  useEffect(() => {
    if (qualityChosenRef.current) return;
    setExportQualityState(canExport4k ? 'hd' : canExportHd ? 'hd' : 'standard');
  }, [canExportHd, canExport4k]);
  // Filigrane affiché selon le forfait ; retiré du fichier pour un export payé en crédits
  const planWatermark = userPlan === 'free' || userPlan === 'solo';

  // ══ AUTORISATION SERVEUR ET CRÉDITS ══
  type ExportAuth = {
    allowed: boolean;
    quality: ExportQuality;
    watermark: boolean;
    reason?: string | null;
    cost?: number;
    balance?: number;
    credits_used?: number;
  };
  const [creditOffer, setCreditOffer] = useState<{
    kind: 'image' | 'pack' | 'video';
    cost: number;
    balance: number;
    resolve: (accepted: boolean) => void;
  } | null>(null);

  const authorizeExport = async (kind: 'image' | 'pack' | 'video', quality: ExportQuality): Promise<ExportAuth | null> => {
    const call = async (useCredits: boolean): Promise<ExportAuth | 'busy' | null> => {
      try {
        const res = await fetch('/api/exports/authorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kind,
            quality,
            useCredits,
            // Session de démonstration locale : ignorée par le serveur en production
            demoPlan: user?.id === 'test-user-id-999' ? userPlan : undefined,
          }),
        });
        if (res.status === 429) {
          showExportNotice('error', 'Trop de demandes d’export d’un coup. Patientez une minute, puis réessayez.');
          return 'busy';
        }
        if (!res.ok && res.status !== 403) return null;
        return (await res.json()) as ExportAuth;
      } catch {
        return null;
      }
    };

    const first = await call(false);
    if (first === 'busy') return null;
    if (!first) {
      // Serveur injoignable : une formule payante n'est pas bloquée (filigrane selon la formule) ;
      // la formule gratuite attend la réponse du serveur (sinon son quota se contournerait facilement)
      if (userPlan !== 'free') return { allowed: true, quality, watermark: planWatermark };
      showExportNotice('error', 'Connexion au serveur impossible pour le moment. Vérifiez votre connexion internet, puis réessayez.');
      return null;
    }
    if (first.allowed) return first;

    // Hors forfait mais payable en crédits : on demande l'accord
    if (user && first.cost && (first.balance ?? 0) >= first.cost) {
      const accepted = await new Promise<boolean>((resolve) =>
        setCreditOffer({ kind, cost: first.cost as number, balance: first.balance as number, resolve })
      );
      setCreditOffer(null);
      if (!accepted) return null;
      const paid = await call(true);
      if (paid && paid !== 'busy' && paid.allowed) {
        refreshProfile();
        if ((paid.balance ?? 0) <= 2) setUpsellModal({ open: true, mode: 'low_credits' });
        return paid;
      }
      return null;
    }

    setShowExportMenu(false);
    if (first.reason === 'quota_reached') trackEvent('quota_reached', { kind, plan: userPlan });
    setUpsellModal({
      open: true,
      mode:
        first.reason === 'quota_reached' && kind === 'video'
          ? 'video_quota_reached'
          : first.reason === 'quota_reached'
          ? userPlan === 'solo'
            ? 'solo_quota_approaching'
            : 'free_quota_reached'
          : 'feature_locked',
    });
    return null;
  };

  useEffect(() => {
    if (!showExportMenu) return;
    const close = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) setShowExportMenu(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [showExportMenu]);

  // ══ MODE SIMPLE / EXPERT (mémorisé dans le navigateur) ══
  const [expertMode, setExpertMode] = useState<boolean>(false);
  useEffect(() => {
    try {
      setExpertMode(localStorage.getItem(EXPERT_MODE_STORAGE_KEY) === '1');
    } catch {
      // stockage indisponible : mode Simple
    }
  }, []);
  useEffect(() => {
    if (!expertMode && (activeTab === 'callouts' || activeTab === 'content')) setActiveTab('mockup');
  }, [expertMode, activeTab]);

  const toggleExpertMode = () => {
    setExpertMode((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(EXPERT_MODE_STORAGE_KEY, next ? '1' : '0');
      } catch {
        // ignorer
      }
      return next;
    });
  };

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
    trackEvent('template_applied', { template: tmpl.id });
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
    // Format exact du réseau visé (ex. LinkedIn 1200 × 627), sinon le premier format du même ratio
    const matchingPreset =
      FRAME_PRESETS.find((p) => p.id === tmpl.framePresetId) || FRAME_PRESETS.find((p) => p.ratioId === tmpl.aspectRatio);
    if (matchingPreset) {
      setCurrentFramePreset(matchingPreset);
    }
    setShowTemplatesModal(false);
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
  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const [canvasArea, setCanvasArea] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  useEffect(() => {
    const el = canvasAreaRef.current;
    if (!el) return;
    const update = () => setCanvasArea({ w: el.clientWidth, h: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
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

  // ══ CAPTURE MOBILE RÉELLE ══
  // Dès qu'un téléphone apparaît sur la scène, la version téléphone du site est capturée une fois.
  const [mobileScreenshot, setMobileScreenshot] = useState<string>(initialMobileScreenshot || '');
  const [mobileCaptureState, setMobileCaptureState] = useState<'idle' | 'loading' | 'done' | 'error'>(
    initialMobileScreenshot ? 'done' : 'idle'
  );
  // Scène photo réaliste active (la capture est placée dans l'écran d'une vraie photo)
  const [photoScene, setPhotoScene] = useState<PhotoScene | null>(null);
  const [photoSceneLoading, setPhotoSceneLoading] = useState<string | null>(null);
  const [photoSceneError, setPhotoSceneError] = useState('');
  // Scène téléphone choisie avant que la version mobile du site soit prête : composée dès son arrivée
  const [pendingPhotoScene, setPendingPhotoScene] = useState<PhotoScene | null>(null);
  const phoneVisible =
    photoScene?.kind === 'phone' ||
    pendingPhotoScene?.kind === 'phone' ||
    config.mockupType === 'iphone' ||
    config.mockupType === 'android' ||
    config.layoutMode === 'dual-stacked' ||
    config.layoutMode === 'trio-ecosystem';
  const canCaptureMobile = !!captureItem.url && /^https?:\/\//.test(captureItem.url);

  const mobileCaptureRequested = useRef(false);
  const studioUnmountedRef = useRef(false);
  useEffect(() => {
    studioUnmountedRef.current = false; // remontage (mode strict de React)
    return () => {
      studioUnmountedRef.current = true;
    };
  }, []);
  useEffect(() => {
    if (mobileCaptureState === 'idle') mobileCaptureRequested.current = false; // « Réessayer »
  }, [mobileCaptureState]);
  useEffect(() => {
    if (
      !phoneVisible ||
      !canCaptureMobile ||
      config.phoneScreen === 'desktop' ||
      mobileCaptureRequested.current ||
      mobileCaptureState === 'done' // déjà disponible (brouillon repris)
    )
      return;
    // Verrou hors état React : relancer l'effet ne doit pas annuler la capture en cours
    mobileCaptureRequested.current = true;
    setMobileCaptureState('loading');
    // Mémoire courte : rouvrir le même site ne relance pas la capture téléphone (jusqu'à 40 s)
    captureOne({ targets: [captureItem.url], mobile: true, fullPage: true })
      .then((item) => {
        if (studioUnmountedRef.current) return;
        if (item.success && item.screenshotBase64) {
          setMobileScreenshot(item.screenshotBase64);
          setMobileCaptureState('done');
        } else {
          setMobileCaptureState('error');
        }
      })
      .catch(() => !studioUnmountedRef.current && setMobileCaptureState('error'));
  }, [phoneVisible, canCaptureMobile, config.phoneScreen, mobileCaptureState, captureItem.url]);

  // ══ AVANT / APRÈS ══
  // La capture actuelle est l'« Après » (la refonte) ; l'« Avant » est capturé ou importé ici.
  const [beforeScreenshot, setBeforeScreenshot] = useState<string>(initialBeforeScreenshot || '');
  const [beforeUrl, setBeforeUrl] = useState<string>(initialBeforeUrl || '');
  const [beforeCaptureState, setBeforeCaptureState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [beforeError, setBeforeError] = useState<string>('');
  const beforeFileRef = useRef<HTMLInputElement>(null);

  const captureBeforeSite = async () => {
    const raw = beforeUrl.trim();
    if (!raw) return;
    const target = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    setBeforeCaptureState('loading');
    setBeforeError('');
    try {
      const item = await captureOne({ targets: [target], fullPage: true });
      if (!item.success || !item.screenshotBase64) {
        throw new Error(item.error || 'Capture impossible.');
      }
      setBeforeScreenshot(item.screenshotBase64);
      setBeforeCaptureState('idle');
    } catch (err) {
      setBeforeCaptureState('error');
      setBeforeError((err as Error).message || 'Capture impossible.');
    }
  };

  const handleBeforeImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBeforeScreenshot(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Image affichée dans les téléphones (et la montre)
  const phoneScreenshot =
    config.phoneScreen !== 'desktop' && mobileScreenshot ? mobileScreenshot : currentScreenshot;
  const phoneModel = config.phoneModel || 'iphone';

  // Tableau de bord : dispositions choisies (Solo, Duo, Trio, Avant / Après)
  const trackedLayout = useRef(config.layoutMode);
  useEffect(() => {
    if (config.layoutMode && config.layoutMode !== trackedLayout.current) {
      trackedLayout.current = config.layoutMode;
      trackEvent('layout_selected', { layout: config.layoutMode });
    }
  }, [config.layoutMode]);

  // ══ REPÈRES D'ALIGNEMENT (magnétisme au centre de la scène) ══
  const SNAP_TOLERANCE = 1.5; // en % de la scène
  const [snapGuides, setSnapGuides] = useState<{ v: boolean; h: boolean }>({ v: false, h: false });
  const snapToCenter = useCallback((x: number, y: number) => {
    const v = Math.abs(x - 50) < SNAP_TOLERANCE;
    const h = Math.abs(y - 50) < SNAP_TOLERANCE;
    setSnapGuides((g) => (g.v === v && g.h === h ? g : { v, h }));
    return { x: v ? 50 : x, y: h ? 50 : y };
  }, []);
  const clearSnapGuides = useCallback(() => setSnapGuides({ v: false, h: false }), []);

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
    // Téléphone et tablette : le doigt sur l'appareil fait défiler la page (il ne déplace plus le mockup
    // et n'ouvre plus l'onglet Angle). On le place avec la grille de placement des réglages.
    if (target === 'mockup' && e.pointerType === 'touch' && window.innerWidth < 1024) return;
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
        const rawX = Math.max(-50, Math.min(50, dragStartRef.current.initialX + deltaXPercent));
        const rawY = Math.max(-50, Math.min(50, dragStartRef.current.initialY + deltaYPercent));
        // 0 = centre de la scène : même aimantation que les calques (centre = 50 %)
        const snapped = snapToCenter(rawX + 50, rawY + 50);
        setConfig((prev) => ({ ...prev, mockupX: Math.round(snapped.x - 50), mockupY: Math.round(snapped.y - 50) }));
      } else if (typeof draggingTarget === 'object' && draggingTarget.type === 'text') {
        const targetId = draggingTarget.id;
        const { x: newX, y: newY } = snapToCenter(
          Math.max(0, Math.min(95, dragStartRef.current.initialX + deltaXPercent)),
          Math.max(0, Math.min(95, dragStartRef.current.initialY + deltaYPercent))
        );
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
  }, [draggingTarget, snapToCenter]);

  const handlePointerUp = useCallback(() => {
    if (rafMoveRef.current) cancelAnimationFrame(rafMoveRef.current);
    setDraggingTarget(null);
    setSnapGuides({ v: false, h: false });
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

  // ══ ANNULER / RÉTABLIR ══
  // Instantané de tout ce qui change le rendu ; les glissements de curseur sont regroupés (400 ms).
  type SceneSnapshot = {
    config: SceneConfig;
    browserStyle: typeof browserStyle;
    customAddressBar: string;
    shadowType: typeof shadowType;
    shadowOpacity: number;
    shadowLightAngle: number;
    sceneOverlay: SceneOverlayPreset;
    portraitBlur: boolean;
    vfxGlow: boolean;
    uiScale: number;
    framePresetId: string;
    selectedTechIds: string[];
    techPosition: typeof techPosition;
    techThemeStyle: typeof techThemeStyle;
    mockupHidden: boolean;
  };
  const snapshot: SceneSnapshot = {
    config,
    browserStyle,
    customAddressBar,
    shadowType,
    shadowOpacity,
    shadowLightAngle,
    sceneOverlay,
    portraitBlur,
    vfxGlow,
    uiScale,
    framePresetId: currentFramePreset.id,
    selectedTechIds,
    techPosition,
    techThemeStyle,
    mockupHidden,
  };
  const snapshotKey = JSON.stringify(snapshot);
  const historyRef = useRef<{ past: SceneSnapshot[]; future: SceneSnapshot[]; last: SceneSnapshot | null; lastKey: string }>({
    past: [],
    future: [],
    last: null,
    lastKey: '',
  });
  const restoringRef = useRef(false);
  const [historyVersion, setHistoryVersion] = useState(0);

  useEffect(() => {
    const h = historyRef.current;
    if (videoAnimatingRef.current) return;
    if (restoringRef.current) {
      restoringRef.current = false;
      h.last = snapshot;
      h.lastKey = snapshotKey;
      return;
    }
    if (!h.last) {
      h.last = snapshot;
      h.lastKey = snapshotKey;
      return;
    }
    if (snapshotKey === h.lastKey || draggingTarget) return;
    const t = setTimeout(() => {
      if (h.last && snapshotKey !== h.lastKey) {
        h.past.push(h.last);
        if (h.past.length > HISTORY_LIMIT) h.past.shift();
        h.future = [];
        h.last = JSON.parse(snapshotKey) as SceneSnapshot;
        h.lastKey = snapshotKey;
        setHistoryVersion((v) => v + 1);
      }
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotKey, draggingTarget]);

  const applySnapshot = (snap: SceneSnapshot) => {
    restoringRef.current = true;
    setConfig(snap.config);
    setBrowserStyle(snap.browserStyle);
    setCustomAddressBar(snap.customAddressBar);
    setShadowType(snap.shadowType);
    setShadowOpacity(snap.shadowOpacity);
    setShadowLightAngle(snap.shadowLightAngle);
    setSceneOverlay(snap.sceneOverlay);
    setPortraitBlur(snap.portraitBlur);
    setVfxGlow(snap.vfxGlow);
    setUiScale(snap.uiScale);
    const preset = FRAME_PRESETS.find((fp) => fp.id === snap.framePresetId);
    if (preset) setCurrentFramePreset(preset);
    setSelectedTechIds(snap.selectedTechIds);
    setTechPosition(snap.techPosition);
    setTechThemeStyle(snap.techThemeStyle);
    setMockupHidden(snap.mockupHidden);
  };

  const canUndo = historyRef.current.past.length > 0;
  const canRedo = historyRef.current.future.length > 0;
  void historyVersion; // force le rafraîchissement des boutons

  const handleUndo = () => {
    const h = historyRef.current;
    const prev = h.past.pop();
    if (!prev || !h.last) return;
    h.future.push(h.last);
    applySnapshot(prev);
    setHistoryVersion((v) => v + 1);
  };

  const handleRedo = () => {
    const h = historyRef.current;
    const next = h.future.pop();
    if (!next || !h.last) return;
    h.past.push(h.last);
    applySnapshot(next);
    setHistoryVersion((v) => v + 1);
  };

  // ══ BROUILLON : restauration à l'ouverture puis sauvegarde automatique ══
  const draftRestoredRef = useRef(false);
  useEffect(() => {
    if (draftRestoredRef.current || !initialSnapshot) return;
    draftRestoredRef.current = true;
    try {
      // Réglages incomplets (ancien format, sauvegarde interrompue) : on complète avec les réglages
      // actuels au lieu de planter ; sans réglages de scène valides, on garde les réglages par défaut.
      const saved = initialSnapshot as Partial<SceneSnapshot>;
      if (!saved || typeof saved !== 'object' || !saved.config || typeof saved.config !== 'object') return;
      applySnapshot({ ...snapshot, ...saved, config: { ...config, ...saved.config } } as SceneSnapshot);
    } catch {
      // brouillon d'un ancien format : on garde les réglages par défaut
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const projectIdRef = useRef<string>(projectId || newProjectId());
  const thumbRef = useRef<{ src: string; thumb?: string }>({ src: '' });
  useEffect(() => {
    if (!currentScreenshot) return;
    const t = setTimeout(async () => {
      const now = Date.now();
      // Miniature recalculée seulement quand l'image change
      if (thumbRef.current.src !== currentScreenshot) {
        thumbRef.current = { src: currentScreenshot, thumb: await makeThumbnail(currentScreenshot) };
      }
      await saveProject(
        projectIdRef.current,
        {
          captureItem: { ...captureItem, screenshotBase64: currentScreenshot },
          mobileScreenshot: mobileScreenshot || undefined,
          beforeScreenshot: beforeScreenshot || undefined,
          beforeUrl: beforeUrl || undefined,
          snapshot: JSON.parse(snapshotKey),
          updatedAt: now,
        },
        { thumbnail: thumbRef.current.thumb }
      );
      setDraftSavedAt(now);
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshotKey, currentScreenshot, mobileScreenshot, beforeScreenshot]);

  // Raccourcis clavier : Ctrl+Z, Ctrl+Y / Ctrl+Maj+Z, E (exporter), T (modèles)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      const mod = e.ctrlKey || e.metaKey;
      if (mod && !typing && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (mod && !typing && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (!mod && !typing && !e.altKey && e.key.toLowerCase() === 'e') {
        setShowExportMenu((v) => !v);
      } else if (!mod && !typing && !e.altKey && e.key.toLowerCase() === 't') {
        setShowTemplatesModal(true);
      } else if (!typing && (e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        e.preventDefault();
        handleDeleteAnnotation(selectedAnnotationId);
      } else if (e.key === 'Escape' && selectedAnnotationId) {
        setSelectedAnnotationId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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

  /**
   * Rend la scène sur un canvas aux dimensions demandées :
   * - les éléments d'interface (poignées, repères, sélection) sont exclus ;
   * - les zones floutées sont floutées sur l'image elle-même (le flou d'affichage ne s'exporte pas).
   */
  const renderSceneCanvas = async (width: number, height: number, hideWatermark = false): Promise<HTMLCanvasElement> => {
    const node = sceneRef.current;
    if (!node) throw new Error('Scène introuvable');
    // Retirer la sélection à l'écran AVANT la copie de la scène (rendu React immédiat)
    flushSync(() => {
      setSelectedTextId(null);
      setSelectedLogoId(null);
      setSelectedCalloutId(null);
      setSelectedAnnotationId(null);
    });
    // Les contours de sélection portent data-export-hide : une image suffit pour finir le rendu
    await nextFrame();

    const canvas = await toCanvas(node, {
      cacheBust: true,
      pixelRatio: 1,
      canvasWidth: width,
      canvasHeight: height,
      imagePlaceholder: EXPORT_IMAGE_PLACEHOLDER,
      // Fond transparent : le damier n'est qu'un aperçu à l'écran, il ne doit pas être exporté
      style: config.bgTransparent
        ? { transform: 'none', backgroundImage: 'none', backgroundColor: 'transparent' }
        : { transform: 'none' },
      filter: (el) =>
        !(el instanceof Element && (el.hasAttribute('data-export-hide') || (hideWatermark && el.hasAttribute('data-watermark')))),
    });

    const blurs = (config.annotations || []).filter((a) => a.kind === 'blur');
    const ctx = canvas.getContext('2d');
    if (ctx && blurs.length) {
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      const cctx = copy.getContext('2d');
      const radius = Math.max(8, Math.round(canvas.width * 0.012));
      for (const b of blurs) {
        const x = Math.round(((b.x || 0) / 100) * canvas.width);
        const y = Math.round(((b.y || 0) / 100) * canvas.height);
        const w = Math.round(((b.w || 0) / 100) * canvas.width);
        const h = Math.round(((b.h || 0) / 100) * canvas.height);
        if (!cctx || w <= 0 || h <= 0) continue;
        // Deux passes de flou fort : le texte d'origine devient illisible
        for (let pass = 0; pass < 2; pass++) {
          cctx.clearRect(0, 0, copy.width, copy.height);
          cctx.drawImage(canvas, 0, 0);
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y, w, h);
          ctx.clip();
          ctx.filter = `blur(${radius}px)`;
          ctx.drawImage(copy, 0, 0);
          ctx.restore();
        }
      }
    }
    return canvas;
  };

  /** JPG : fond blanc sous les zones transparentes (le JPG n'a pas de transparence) */
  const flattenOnWhite = (canvas: HTMLCanvasElement) => {
    const flat = document.createElement('canvas');
    flat.width = canvas.width;
    flat.height = canvas.height;
    const fctx = flat.getContext('2d');
    if (fctx) {
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, flat.width, flat.height);
      fctx.drawImage(canvas, 0, 0);
    }
    return flat;
  };

  /** Encodage du fichier image en tâche de fond (toBlob) : l'écran ne se fige pas, même en 4K */
  const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality?: number) =>
    new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Image vide'))), type, quality)
    );

  /** Rend la scène aux dimensions exactes du format choisi. */
  const renderScene = async (
    format: ExportFormat,
    preset: FramePresetOption,
    quality: ExportQuality,
    hideWatermark = false
  ): Promise<Blob> => {
    const { width, height } = getExportSize(preset, quality);
    const canvas = await renderSceneCanvas(width, height, hideWatermark);
    setExportStep('Enregistrement du fichier…');
    if (format === 'jpg') return canvasToBlob(flattenOnWhite(canvas), 'image/jpeg', 0.92);
    return canvasToBlob(canvas, format === 'webp' ? 'image/webp' : 'image/png', 0.9);
  };

  /** Même rendu, en texte data: (pages de présentation et liens de partage, qui gardent l'image) */
  const renderSceneDataUrl = async (...args: Parameters<typeof renderScene>) => {
    const blob = await renderScene(...args);
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  };

  const downloadDataUrl = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const closeCrossSellBanner = useCallback(() => setShowCrossSellBanner(false), []);

  const [videoExtension, setVideoExtension] = useState<'mp4' | 'webm'>('webm');
  useEffect(() => setVideoExtension(getVideoFormat().extension), []);

  const fileBaseName = (captureItem.domainName || 'pitchmysite').replace(/[^a-zA-Z0-9_-]/g, '_');

  // Export d'une image (format et qualité choisis dans le menu Exporter)
  const handleExportImage = async () => {
    if (!sceneRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);
    setExportStep('Création de l’image…');

    try {
      const auth = await authorizeExport('image', exportQuality);
      if (!auth) return;
      const blob = await renderScene(exportFormat, currentFramePreset, auth.quality, !auth.watermark);
      const { width, height } = getExportSize(currentFramePreset, auth.quality);
      downloadBlob(blob, `${fileBaseName}-${width}x${height}.${exportFormat}`);
      showExportDone('Image téléchargée');

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
      setShowExportMenu(false);

      // Cross-sell discret après export réussi
      setShowCrossSellBanner(true);

    } catch (err) {
      console.error('Erreur export image:', err);
      showExportError("L'image n'a pas pu être créée. Réessayez ; si le problème continue, choisissez une qualité plus basse.");
    } finally {
      setIsExporting(false);
      setExportStep('');
    }
  };

  // ══ WHATSAPP ET PARTAGE ══
  // Partage natif (WhatsApp, Telegram, e-mail…) disponible surtout sur téléphone
  const [canShareFiles, setCanShareFiles] = useState(false);
  useEffect(() => {
    try {
      const probe = new File([new Blob(['x'], { type: 'image/jpeg' })], 'test.jpg', { type: 'image/jpeg' });
      setCanShareFiles(typeof navigator.canShare === 'function' && navigator.canShare({ files: [probe] }));
    } catch {
      setCanShareFiles(false);
    }
  }, []);

  const blobToFile = (blob: Blob, filename: string) => new File([blob], filename, { type: blob.type });

  /** Statut WhatsApp : image 9:16 en JPG léger (le format du canevas est rétabli ensuite) */
  const handleExportWhatsAppStatus = async () => {
    if (!sceneRef.current) return;
    const story = FRAME_PRESETS.find((fp) => fp.id === 'ig-story');
    if (!story) return;
    setIsExporting(true);
    setExportStep('Création du statut WhatsApp…');
    const originalPreset = currentFramePreset;
    try {
      const auth = await authorizeExport('image', exportQuality === '4k' ? 'hd' : exportQuality);
      if (!auth) return;
      selectFramePreset(story);
      await new Promise((r) => setTimeout(r, 500));
      const { width, height } = getExportSize(story, auth.quality);
      const canvas = await renderSceneCanvas(width, height, !auth.watermark);
      setExportStep('Enregistrement du fichier…');
      // Qualité 0,85 : fichier léger, rapide à envoyer même avec une connexion faible
      const blob = await canvasToBlob(flattenOnWhite(canvas), 'image/jpeg', 0.85);
      const filename = `${fileBaseName}-statut-whatsapp-${width}x${height}.jpg`;
      if (canShareFiles) {
        await navigator.share({ files: [blobToFile(blob, filename)], title: 'Mockup' }).catch(() => downloadBlob(blob, filename));
      } else {
        downloadBlob(blob, filename);
      }
      showExportDone('Statut WhatsApp prêt');
      trackEvent('whatsapp_status', {});
      setShowExportMenu(false);
    } catch (err) {
      console.error('Erreur export WhatsApp:', err);
      showExportError("Le statut WhatsApp n'a pas pu être créé. Réessayez.");
    } finally {
      selectFramePreset(originalPreset);
      setIsExporting(false);
      setExportStep('');
    }
  };

  /** Partage natif de l'image au format actuel */
  const handleShareImage = async () => {
    if (!sceneRef.current) return;
    setIsExporting(true);
    try {
      const auth = await authorizeExport('image', exportQuality);
      if (!auth) return;
      const format: ExportFormat = exportFormat === 'png' ? 'jpg' : exportFormat; // plus léger à partager
      setExportStep('Préparation du partage…');
      const blob = await renderScene(format, currentFramePreset, auth.quality, !auth.watermark);
      const { width, height } = getExportSize(currentFramePreset, auth.quality);
      await navigator.share({ files: [blobToFile(blob, `${fileBaseName}-${width}x${height}.${format}`)], title: 'Mockup' });
      setShowExportMenu(false);
    } catch (err) {
      // Partage annulé par l'utilisateur : rien à signaler
      if ((err as Error)?.name !== 'AbortError') console.error('Erreur partage:', err);
    } finally {
      setIsExporting(false);
      setExportStep('');
    }
  };

  // Copie rapide dans le presse-papier
  const handleCopyToClipboard = async () => {
    if (!sceneRef.current) return;
    setIsCopying(true);
    setCopySuccess(false);

    try {
      const auth = await authorizeExport('image', exportQuality);
      if (!auth) return;
      const size = getExportSize(currentFramePreset, auth.quality);
      const copyCanvas = await renderSceneCanvas(size.width, size.height, !auth.watermark);
      const blob = await new Promise<Blob | null>((resolve) => copyCanvas.toBlob(resolve, 'image/png'));

      if (!blob) throw new Error('Impossible de générer le blob');

      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);

      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2500);
    } catch (err) {
      console.error('Erreur copie presse-papier:', err);
      showExportError('Ce navigateur ne permet pas de copier une image. Utilisez « Télécharger l’image ».');
    } finally {
      setIsCopying(false);
    }
  };

  // Export Vidéo Animé 3s (.webm)
  /** Enregistre une vidéo en dessinant chaque image dans un canevas (temps réel, 30 i/s). */
  const recordCanvasVideo = async (
    width: number,
    height: number,
    totalFrames: number,
    draw: (ctx: CanvasRenderingContext2D, frame: number) => void,
    filename: string
  ) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Contexte canvas 2D indisponible');
    if (videoAsGif) {
      await encodeGif(canvas, ctx, totalFrames, draw, filename);
      return;
    }
    const fps = 30;
    draw(ctx, 0);
    const stream = canvas.captureStream(fps);
    // MP4 quand le navigateur sait l'enregistrer (Chrome, Edge, Safari récents), sinon WebM
    const { mimeType, extension } = getVideoFormat();
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8_000_000 });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const stopped = new Promise<void>((resolve) => (recorder.onstop = () => resolve()));
    recorder.start();
    const t0 = performance.now();
    for (let f = 0; f < totalFrames; f++) {
      draw(ctx, f);
      // Cadence régulière même si un dessin prend du retard
      const wait = t0 + ((f + 1) * 1000) / fps - performance.now();
      await new Promise((r) => setTimeout(r, Math.max(0, wait)));
    }
    recorder.stop();
    await stopped;
    const blob = new Blob(chunks, { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extension}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  /**
   * GIF animé : mêmes images que la vidéo, réduites à 720 px de large et à 12 images par seconde
   * (un GIF reste ainsi léger à envoyer par e-mail ou WhatsApp).
   */
  const encodeGif = async (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    totalFrames: number,
    draw: (ctx: CanvasRenderingContext2D, frame: number) => void,
    filename: string
  ) => {
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    const k = Math.min(1, 720 / canvas.width);
    const gw = Math.round(canvas.width * k);
    const gh = Math.round(canvas.height * k);
    const small = document.createElement('canvas');
    small.width = gw;
    small.height = gh;
    const sctx = small.getContext('2d', { willReadFrequently: true }) as CanvasRenderingContext2D;
    const gif = GIFEncoder();
    const step = 30 / 12;
    const count = Math.max(1, Math.floor((totalFrames - 1) / step) + 1);
    const grab = (f: number) => {
      draw(ctx, f);
      sctx.fillStyle = '#ffffff';
      sctx.fillRect(0, 0, gw, gh);
      sctx.drawImage(canvas, 0, 0, gw, gh);
      return sctx.getImageData(0, 0, gw, gh).data;
    };
    // Une seule palette, calculée sur le début, le milieu et la fin de l'animation : bien plus rapide
    const samples = [0, Math.floor(totalFrames / 2), totalFrames - 1].map(grab);
    const pool = new Uint8Array(Math.ceil(samples[0].length / 16) * 4 * samples.length);
    let o = 0;
    for (const d of samples) {
      for (let i = 0; i < d.length; i += 16) {
        pool[o++] = d[i];
        pool[o++] = d[i + 1];
        pool[o++] = d[i + 2];
        pool[o++] = 255;
      }
    }
    const palette = quantize(pool.subarray(0, o), 256);
    for (let i = 0; i < count; i++) {
      const data = grab(Math.min(totalFrames - 1, Math.round(i * step)));
      gif.writeFrame(applyPalette(data, palette), gw, gh, { palette, delay: Math.round(1000 / 12) });
      // Laisser respirer la page pendant l'encodage
      if (i % 4 === 3) {
        setVideoProgress(`${Math.round((i / count) * 100)} %`);
        await new Promise((r) => setTimeout(r, 0));
      }
    }
    gif.finish();
    const blob = new Blob([gif.bytes() as BlobPart], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace('-video-', '-gif-')}.gif`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  /**
   * Rend la scène plusieurs fois en changeant ses réglages (angle, position…) : vraie 3D,
   * identique à l'aperçu. Les réglages d'origine sont restaurés ensuite.
   */
  const renderSceneKeyframes = async (
    count: number,
    at: (t: number, base: SceneConfig) => Partial<SceneConfig>,
    width: number,
    height: number,
    hideWatermark: boolean
  ): Promise<ImageBitmap[]> => {
    const original = config;
    const frames: ImageBitmap[] = [];
    videoAnimatingRef.current = true;
    sceneRef.current?.setAttribute('data-video-render', '');
    try {
      for (let k = 0; k < count; k++) {
        setVideoProgress(`${Math.round((k / count) * 100)} %`);
        flushSync(() => setConfig({ ...original, ...at(k / (count - 1), original) }));
        await nextFrame();
        const c = await renderSceneCanvas(width, height, hideWatermark);
        frames.push(await createImageBitmap(c));
      }
    } finally {
      sceneRef.current?.removeAttribute('data-video-render');
      videoAnimatingRef.current = false;
      restoringRef.current = true;
      setConfig(original);
      setVideoProgress('');
    }
    return frames;
  };

  /** Défilement de la page entière dans l'écran de l'appareil (appareil présenté de face). */
  const renderScrollVideo = async (width: number, height: number, hideWatermark: boolean, filename: string) => {
    const scene = sceneRef.current;
    if (!scene) return;
    const original = config;
    const flat = { mockupTiltX: 0, mockupTiltY: 0, mockupRotation: 0, cropOffsetY: 0 };
    videoAnimatingRef.current = true;
    scene.setAttribute('data-video-render', '');
    let base: HTMLCanvasElement;
    let chroma: HTMLCanvasElement;
    const content = new Image();
    let rect: { x: number; y: number; w: number; h: number };
    try {
      flushSync(() => setConfig({ ...original, ...flat }));
      await nextFrame();
      // L'écran principal : la plus grande capture affichée dans un appareil
      const shots = new Set([currentScreenshot, phoneScreenshot].filter(Boolean));
      const screens = Array.from(scene.querySelectorAll('img')).filter((i) => shots.has(i.getAttribute('src') || ''));
      const screen = screens.sort((a, b) => b.clientWidth * b.clientHeight - a.clientWidth * a.clientHeight)[0];
      if (!screen) throw new Error('écran introuvable');
      const sRect = scene.getBoundingClientRect();
      const iRect = screen.getBoundingClientRect();
      const kx = width / sRect.width;
      const ky = height / sRect.height;
      rect = { x: (iRect.left - sRect.left) * kx, y: (iRect.top - sRect.top) * ky, w: iRect.width * kx, h: iRect.height * ky };
      content.src = screen.getAttribute('src') || '';
      await content.decode();

      base = await renderSceneCanvas(width, height, hideWatermark);
      // Écran rempli d'une couleur témoin : indique exactement la partie visible de l'écran
      const parent = screen.parentElement as HTMLElement;
      const prevVis = screen.style.visibility;
      const prevBg = parent.style.background;
      screen.style.visibility = 'hidden';
      parent.style.background = '#ff00ff';
      try {
        chroma = await renderSceneCanvas(width, height, hideWatermark);
      } finally {
        screen.style.visibility = prevVis;
        parent.style.background = prevBg;
      }
    } finally {
      scene.removeAttribute('data-video-render');
      videoAnimatingRef.current = false;
      restoringRef.current = true;
      setConfig(original);
    }

    // Seule la zone de l'écran change d'une image à l'autre : tout le reste est dessiné une fois
    const bx = Math.max(0, Math.floor(rect.x));
    const by = Math.max(0, Math.floor(rect.y));
    const bw = Math.min(width, Math.ceil(rect.x + rect.w)) - bx;
    const bh = Math.min(height, Math.ceil(rect.y + rect.h)) - by;

    // Zone de la scène autour de l'écran, percée là où l'écran est visible (pixels magenta du rendu témoin) :
    // coins arrondis et éléments posés sur l'écran (badges, textes) restent au-dessus de la page qui défile.
    const hole = document.createElement('canvas');
    hole.width = bw;
    hole.height = bh;
    const hctx = hole.getContext('2d') as CanvasRenderingContext2D;
    hctx.drawImage(base, bx, by, bw, bh, 0, 0, bw, bh);
    const hdata = hctx.getImageData(0, 0, bw, bh);
    const cdata = (chroma.getContext('2d') as CanvasRenderingContext2D).getImageData(bx, by, bw, bh);
    for (let i = 0; i < cdata.data.length; i += 4) {
      if (cdata.data[i] > 190 && cdata.data[i + 2] > 190 && cdata.data[i + 1] < 90) hdata.data[i + 3] = 0;
    }
    hctx.putImageData(hdata, 0, 0);

    // La capture est mise une fois à la largeur de l'écran ; ensuite chaque image n'est qu'une copie
    const dw = Math.max(1, Math.round(rect.w));
    const dh = Math.max(1, Math.round(rect.h));
    const fullH = Math.min(32000, Math.round((content.naturalHeight * dw) / content.naturalWidth));
    const strip = document.createElement('canvas');
    strip.width = dw;
    strip.height = fullH;
    (strip.getContext('2d') as CanvasRenderingContext2D).drawImage(content, 0, 0, dw, fullH);
    const travel = Math.max(0, fullH - dh);
    const seconds = Math.min(12, Math.max(4, travel / (dh * 1.2)));
    const fps = 30;
    const pause = 0.6;
    const total = Math.round((seconds + pause * 2) * fps);
    const rx = Math.round(rect.x);
    const ry = Math.round(rect.y);

    await recordCanvasVideo(
      width,
      height,
      total,
      (ctx, f) => {
        const t = Math.min(1, Math.max(0, (f / fps - pause) / seconds));
        const sy = Math.round(travel * easeInOut(t));
        if (f === 0) ctx.drawImage(base, 0, 0);
        ctx.drawImage(strip, 0, sy, dw, Math.min(dh, fullH - sy), rx, ry, dw, Math.min(dh, fullH - sy));
        ctx.drawImage(hole, bx, by);
        if (f % 30 === 0) setVideoProgress(`${Math.round((f / total) * 100)} %`);
      },
      filename
    );
  };

  const handleExportVideo = async () => {
    if (!sceneRef.current || isExportingVideo) return;
    setIsExportingVideo(true);

    try {
      const auth = await authorizeExport('video', exportQuality === '4k' ? 'hd' : exportQuality);
      if (!auth) return;
      trackEvent('video_exported', { preset: videoPreset, gif: videoAsGif });
      const videoBase = getExportSize(currentFramePreset, auth.quality);
      const hideWm = !auth.watermark;

      if (videoPreset === 'scroll') {
        await renderScrollVideo(videoBase.width, videoBase.height, hideWm, `${fileBaseName}-video-defilement`);
        return;
      }

      if (videoPreset === 'rotate3d' || videoPreset === 'riseIn') {
        // Rendu image par image : limité à 1280 px de large pour rester rapide et léger en mémoire
        const k = Math.min(1, 1280 / videoBase.width);
        const w = Math.round(videoBase.width * k);
        const h = Math.round(videoBase.height * k);
        const count = 36;
        const frames = await renderSceneKeyframes(
          count,
          (t, b) =>
            videoPreset === 'rotate3d'
              ? { mockupTiltY: (b.mockupTiltY || 0) + Math.sin(t * Math.PI * 2) * 18, mockupTiltX: (b.mockupTiltX || 0) + 6 }
              : { mockupY: b.mockupY + (1 - easeOut(t)) * 60, mockupScale: b.mockupScale * (0.88 + 0.12 * easeOut(t)) },
          w,
          h,
          hideWm
        );
        const total = 90;
        await recordCanvasVideo(
          w,
          h,
          total,
          (ctx, f) => {
            // Fondu entre deux images voisines : mouvement fluide à 30 i/s
            const pos = (f / (total - 1)) * (count - 1);
            const i = Math.floor(pos);
            const a = pos - i;
            ctx.globalAlpha = 1;
            ctx.drawImage(frames[i], 0, 0, w, h);
            if (a > 0 && frames[i + 1]) {
              ctx.globalAlpha = a;
              ctx.drawImage(frames[i + 1], 0, 0, w, h);
              ctx.globalAlpha = 1;
            }
          },
          `${fileBaseName}-video-${videoPreset === 'rotate3d' ? 'rotation' : 'entree'}`
        );
        frames.forEach((fr) => fr.close());
        return;
      }

      // Zoom ou glissement d'une image fixe
      const still = await renderSceneCanvas(videoBase.width, videoBase.height, hideWm);
      await recordCanvasVideo(
        still.width,
        still.height,
        90,
        (ctx, f) => {
          const progress = f / 89;
          let scale = 1;
          let translateX = 0;
          if (videoPreset === 'zoomIn') scale = 1 + progress * 0.12;
          else if (videoPreset === 'zoomOut') scale = 1.12 - progress * 0.12;
          else if (videoPreset === 'panHorizontal') {
            scale = 1.1;
            translateX = (progress - 0.5) * 0.08 * still.width;
          }
          ctx.save();
          ctx.clearRect(0, 0, still.width, still.height);
          ctx.translate(still.width / 2 + translateX, still.height / 2);
          ctx.scale(scale, scale);
          ctx.drawImage(still, -still.width / 2, -still.height / 2, still.width, still.height);
          ctx.restore();
        },
        `${fileBaseName}-video-3s`
      );
    } catch (err) {
      console.error('Erreur export vidéo:', err);
      showExportError('La vidéo n’a pas pu être créée. Il faut un navigateur récent (Chrome, Edge, Firefox ou Safari), et garder cet onglet ouvert pendant la création.');
    } finally {
      setIsExportingVideo(false);
      setVideoProgress('');
    }
  };

  // Police des nouveaux textes (celle du kit de marque une fois appliqué)
  const [defaultTextFont, setDefaultTextFont] = useState<string>('inter');

  // ══ KIT DE MARQUE : logo, fond aux couleurs de l'agence, police, signature ══
  const handleApplyBrandKit = (kit: BrandKit) => {
    const colors = kit.colors.filter(Boolean);
    setConfig((prev) => {
      const logos = prev.logos.filter((l) => l.id !== 'brand_logo');
      if (kit.logo) logos.push({ id: 'brand_logo', src: kit.logo, x: 10, y: 10, width: 90, opacity: 1 });
      let texts = prev.texts.filter((t) => t.id !== 'brand_signature');
      if (kit.font) texts = texts.map((t) => ({ ...t, fontFamily: kit.font as string }));
      if (kit.signature) {
        texts.push({
          id: 'brand_signature',
          text: kit.signature,
          // En bas à droite : le centre est occupé par les badges de technologies
          x: 82,
          y: 93,
          fontSize: 16,
          fontFamily: kit.font || 'inter',
          color: '#ffffff',
          fontWeight: 'medium',
          align: 'center',
        });
      }
      return {
        ...prev,
        logos,
        texts,
        ...(colors.length >= 2
          ? { bgType: 'gradient' as const, bgValue: `linear-gradient(135deg, ${colors.join(', ')})`, bgTransparent: false }
          : colors.length === 1
          ? { bgType: 'solid' as const, bgValue: colors[0], bgTransparent: false }
          : {}),
      };
    });
    if (kit.font) setDefaultTextFont(kit.font);
  };

  // ══ MES STYLES : réglages de mise en scène réutilisables ══
  const STYLE_CONFIG_KEYS = [
    'mockupType', 'layoutMode', 'deviceTheme', 'deviceStyle', 'cornerRadius', 'deviceColor', 'phoneModel',
    'bgType', 'bgValue', 'bgTransparent', 'bgPattern', 'mockupX', 'mockupY', 'mockupScale', 'mockupRotation',
    'mockupTiltX', 'mockupTiltY', 'shadowEnabled', 'shadowIntensity',
  ] as const;
  const getCurrentStyle = () => {
    const values: Record<string, unknown> = {
      browserStyle,
      shadowType,
      shadowOpacity,
      shadowLightAngle,
      sceneOverlay,
      portraitBlur,
      vfxGlow,
      framePresetId: currentFramePreset.id,
    };
    for (const k of STYLE_CONFIG_KEYS) values[k] = config[k];
    return { preview: config.bgTransparent ? '#27272a' : config.bgValue, values };
  };
  const applySavedStyle = (v: Record<string, unknown>) => {
    setConfig((prev) => {
      const next = { ...prev } as Record<string, unknown>;
      for (const k of STYLE_CONFIG_KEYS) if (k in v) next[k] = v[k];
      return next as unknown as SceneConfig;
    });
    if (v.browserStyle) setBrowserStyle(v.browserStyle as typeof browserStyle);
    if (v.shadowType) setShadowType(v.shadowType as typeof shadowType);
    if (typeof v.shadowOpacity === 'number') setShadowOpacity(v.shadowOpacity);
    if (typeof v.shadowLightAngle === 'number') setShadowLightAngle(v.shadowLightAngle);
    if (v.sceneOverlay) setSceneOverlay(v.sceneOverlay as SceneOverlayPreset);
    if (typeof v.portraitBlur === 'boolean') setPortraitBlur(v.portraitBlur);
    if (typeof v.vfxGlow === 'boolean') setVfxGlow(v.vfxGlow);
    const preset = FRAME_PRESETS.find((fp) => fp.id === v.framePresetId);
    if (preset) selectFramePreset(preset);
  };

  // Ajout & gestion de texte
  const handleAddText = () => {
    const newText: SceneTextLayer = {
      id: `text_${Date.now()}`,
      text: 'Titre de votre visuel marketing',
      x: 50,
      y: 15,
      fontSize: 26,
      fontFamily: defaultTextFont,
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

  // ══ ANNOTATIONS ══
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [annotationColor, setAnnotationColor] = useState<string>('#ef4444');

  const handleAddAnnotation = (kind: SceneAnnotation['kind']) => {
    const id = `annot_${Date.now()}`;
    const existingSteps = (config.annotations || []).filter((a) => a.kind === 'number').length;
    const base: SceneAnnotation =
      kind === 'arrow'
        ? { id, kind, x: 35, y: 60, x2: 55, y2: 42, color: annotationColor }
        : kind === 'number'
        ? { id, kind, x: 30 + ((existingSteps * 12) % 50), y: 30, color: annotationColor, label: String(existingSteps + 1) }
        : kind === 'blur'
        ? { id, kind, x: 38, y: 40, w: 24, h: 12, color: '#000000' }
        : kind === 'loupe'
        ? { id, kind, x: 66, y: 12, w: 18, h: Math.round(((18 * sceneLogicalW) / sceneLogicalH) * 10) / 10, color: '#ffffff', srcX: 30, srcY: 4, zoom: 2 }
        : { id, kind, x: 36, y: 36, w: 28, h: 18, color: annotationColor };
    setConfig((prev) => ({ ...prev, annotations: [...(prev.annotations || []), base] }));
    setSelectedAnnotationId(id);
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<SceneAnnotation>) => {
    setConfig((prev) => ({
      ...prev,
      annotations: (prev.annotations || []).map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
  };

  const handleDeleteAnnotation = (id: string) => {
    setConfig((prev) => ({ ...prev, annotations: (prev.annotations || []).filter((a) => a.id !== id) }));
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  };

  // Ajout & gestion de Callouts de vente
  const handleAddCallout = (
    text = 'Votre argument clé',
    colorTheme: NonNullable<FeatureCallout['colorTheme']> = 'violet'
  ) => {
    const newCallout: FeatureCallout = {
      id: `callout_${Date.now()}`,
      text,
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

  const handleUpdateSocialBadge = (id: string, updates: Partial<SceneSocialBadge>) => {
    setConfig((prev) => ({
      ...prev,
      socialBadges: (prev.socialBadges || []).map((b) => (b.id === id ? { ...b, ...updates } : b)),
    }));
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
          x: type === 'product-hunt' ? 22 : type === 'stripe-mrr' ? 76 : type === 'uptime' ? 24 : 50,
          y: type === 'product-hunt' ? 14 : type === 'stripe-mrr' ? 84 : type === 'uptime' ? 86 : 86,
          visible: true,
          customText: TRUST_BADGES.find((b) => b.type === type)?.placeholder,
        };
        return {
          ...prev,
          socialBadges: [...current, newBadge],
        };
      }
    });
  };

  // Pack réseaux sociaux : 5 fichiers aux dimensions officielles de chaque réseau
  // ── Présentation client (PDF) ──────────────────────────────────────────
  const [showShare, setShowShare] = useState(false);
  const [presentationSlides, setPresentationSlides] = useState<PresentationSlide[]>([]);
  const [showPresentation, setShowPresentation] = useState(false);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [isBuildingPdf, setIsBuildingPdf] = useState(false);
  const [slideAddedNote, setSlideAddedNote] = useState('');

  /** Rend la scène actuelle comme une page de la présentation. */
  const renderSlide = async (caption = ''): Promise<PresentationSlide> => {
    const quality = canExportHd ? 'hd' : 'standard';
    const { width, height } = getExportSize(currentFramePreset, quality);
    const image = await renderSceneDataUrl('jpg', currentFramePreset, quality, false);
    // Version sans filigrane gardée pour un export payé en crédits
    const cleanImage = planWatermark ? await renderSceneDataUrl('jpg', currentFramePreset, quality, true) : undefined;
    return { id: `slide_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, image, clean: cleanImage, width, height, quality, caption };
  };

  const handleAddToPresentation = async () => {
    if (!sceneRef.current || isAddingSlide) return;
    if (presentationSlides.length >= MAX_PRESENTATION_SLIDES) {
      setShowPresentation(true);
      return;
    }
    setIsAddingSlide(true);
    try {
      const slide = await renderSlide();
      setPresentationSlides((prev) => [...prev, slide]);
      setSlideAddedNote(`Page ${presentationSlides.length + 1} ajoutée`);
      setTimeout(() => setSlideAddedNote(''), 2500);
    } catch (err) {
      console.error('Erreur ajout présentation:', err);
      showExportError("Impossible d'ajouter cette scène à la présentation. Réessayez.");
    } finally {
      setIsAddingSlide(false);
    }
  };

  // ── Pages du site (accueil, tarifs, contact…) ──────────────────────────
  const [sitePages, setSitePages] = useState<SitePage[]>([]);
  const [isAddingAllPages, setIsAddingAllPages] = useState(false);

  const handleAddPagesToPresentation = async () => {
    if (isAddingAllPages || !sceneRef.current) return;
    setIsAddingAllPages(true);
    const original = currentScreenshot;
    const list = [{ label: 'Accueil', screenshot: captureItem.screenshotBase64 || '' }, ...sitePages].filter((p) => p.screenshot);
    try {
      const slides: PresentationSlide[] = [];
      for (const page of list.slice(0, MAX_PRESENTATION_SLIDES - presentationSlides.length)) {
        flushSync(() => setCurrentScreenshot(page.screenshot));
        // Laisser l'image se décoder dans le cadre avant le rendu
        await new Promise((r) => setTimeout(r, 400));
        slides.push(await renderSlide(page.label));
      }
      setPresentationSlides((prev) => [...prev, ...slides].slice(0, MAX_PRESENTATION_SLIDES));
      setShowPresentation(true);
    } catch (err) {
      console.error('Erreur ajout des pages:', err);
      showExportError("Impossible d'ajouter les pages à la présentation. Réessayez.");
    } finally {
      setCurrentScreenshot(original);
      setIsAddingAllPages(false);
    }
  };

  const moveSlide = (id: string, direction: -1 | 1) =>
    setPresentationSlides((prev) => {
      const i = prev.findIndex((s) => s.id === id);
      const j = i + direction;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const handleGeneratePdf = async (meta: PresentationMeta, output: PresentationOutput = 'pdf') => {
    if (!presentationSlides.length || isBuildingPdf) return;
    setIsBuildingPdf(true);
    try {
      const quality = presentationSlides.some((s) => s.quality === 'hd') ? 'hd' : 'standard';
      const auth = await authorizeExport('pack', quality);
      if (!auth) {
        // L'offre s'affiche sous cette fenêtre : on la ferme, les pages restent gardées
        setShowPresentation(false);
        return;
      }
      const saveBlob = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 10000);
      };
      if (output === 'pdf') {
        saveBlob(await buildPresentationPdf(meta, presentationSlides, auth.watermark), `${fileBaseName}-presentation.pdf`);
      } else {
        const pages = await renderCarouselPages(meta, presentationSlides, auth.watermark);
        if (output === 'linkedin') {
          saveBlob(await buildLinkedInCarouselPdf(pages), `${fileBaseName}-carrousel-linkedin.pdf`);
        } else {
          for (let i = 0; i < pages.length; i++) {
            downloadDataUrl(pages[i], `${fileBaseName}-carrousel-${String(i + 1).padStart(2, '0')}.jpg`);
            await new Promise((r) => setTimeout(r, 300));
          }
        }
      }
      trackEvent(output === 'pdf' ? 'pdf_generated' : 'carousel_generated', { output, pages: presentationSlides.length });
    } catch (err) {
      console.error('Erreur PDF:', err);
      showExportError('Le PDF n’a pas pu être créé. Réessayez.');
    } finally {
      setIsBuildingPdf(false);
    }
  };

  /**
   * Pack de plusieurs formats (un fichier par format). Les packs magasins sortent toujours
   * à la taille exacte exigée (qualité HD) et en JPG.
   */
  const handleExportPack = async (pack: 'social' | 'appstore' | 'play' = 'social') => {
    if (!sceneRef.current || isExportingPack) return;
    setIsExportingPack(true);
    const originalPreset = currentFramePreset;
    const store = pack !== 'social';
    const ids = pack === 'appstore' ? APP_STORE_PACK_PRESET_IDS : pack === 'play' ? PLAY_STORE_PACK_PRESET_IDS : SOCIAL_PACK_PRESET_IDS;
    const packPresets = ids
      .map((id) => FRAME_PRESETS.find((fp) => fp.id === id))
      .filter((fp): fp is FramePresetOption => !!fp);

    try {
      const auth = await authorizeExport('pack', store ? 'hd' : exportQuality === '4k' ? 'hd' : exportQuality);
      if (!auth) return;
      // Un magasin refuse une image plus petite que la taille officielle
      if (store && auth.quality !== 'hd') return;
      const format: ExportFormat = store ? 'jpg' : exportFormat;
      for (let i = 0; i < packPresets.length; i++) {
        const preset = packPresets[i];
        setPackProgress(`${i + 1}/${packPresets.length}`);
        selectFramePreset(preset);
        // Laisser le canevas prendre sa nouvelle forme avant le rendu
        await new Promise((r) => setTimeout(r, 500));
        const quality: ExportQuality = auth.quality;
        const blob = await renderScene(format, preset, quality, !auth.watermark);
        const { width, height } = getExportSize(preset, quality);
        const label = `${preset.category}-${preset.name}`.replace(/[^a-zA-Z0-9_-]+/g, '_');
        downloadBlob(blob, `${fileBaseName}-${label}-${width}x${height}.${format}`);
        await new Promise((r) => setTimeout(r, 250));
      }
      setPackProgress('Fait !');
      setTimeout(() => setPackProgress(''), 3000);
      showExportDone(`${packPresets.length} fichiers téléchargés`);
    } catch (err) {
      console.error('Erreur export pack:', err);
      showExportError('Le pack n’a pas pu être téléchargé en entier. Réessayez.');
    } finally {
      selectFramePreset(originalPreset);
      setIsExportingPack(false);
    }
  };

  // Mode stores : chaque écran aux tailles App Store (iPhone 6,9") et Google Play (téléphone)
  const handleExportStoreScreens = async () => {
    if (!sceneRef.current || isExportingPack || !storeMode) return;
    setIsExportingPack(true);
    setShowExportMenu(false);
    const originalPreset = currentFramePreset;
    const originalActive = activeStore?.id;
    const presets = ['app-iphone-69', 'play-phone']
      .map((id) => FRAME_PRESETS.find((fp) => fp.id === id))
      .filter((fp): fp is FramePresetOption => !!fp);
    try {
      const auth = await authorizeExport('pack', 'hd');
      if (!auth) return;
      // Les stores refusent une image plus petite que la taille officielle
      if (auth.quality !== 'hd') return;
      const total = storeScreens.length * presets.length;
      let n = 0;
      for (let i = 0; i < storeScreens.length; i++) {
        const screen = storeScreens[i];
        setActiveStoreId(screen.id);
        setCurrentScreenshot(screen.src);
        for (const preset of presets) {
          n++;
          setPackProgress(`${n}/${total}`);
          selectFramePreset(preset);
          await new Promise((r) => setTimeout(r, 600));
          const blob = await renderScene('jpg', preset, auth.quality, !auth.watermark);
          const { width, height } = getExportSize(preset, auth.quality);
          const store = preset.id === 'play-phone' ? 'google-play' : 'app-store';
          downloadBlob(blob, `${fileBaseName}-ecran-${i + 1}-${store}-${width}x${height}.jpg`);
          await new Promise((r) => setTimeout(r, 250));
        }
      }
      setPackProgress('Fait !');
      setTimeout(() => setPackProgress(''), 3000);
      showExportDone(`${total} fichiers téléchargés`);
    } catch (err) {
      console.error('Erreur export des écrans :', err);
      showExportError('Les captures n’ont pas pu être toutes téléchargées. Réessayez.');
    } finally {
      selectFramePreset(originalPreset);
      const back = storeScreens.find((sc) => sc.id === originalActive);
      if (back) {
        setActiveStoreId(back.id);
        setCurrentScreenshot(back.src);
      }
      setIsExportingPack(false);
    }
  };

  const handleAddStoreScreens = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter((f) => f.type.startsWith('image/')).slice(0, 8);
    e.target.value = '';
    files.forEach((file, k) => {
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        const id = `ecran_${Date.now()}_${k}`;
        setStoreScreens((list) => (list.length >= 10 ? list : [...list, { id, src, caption: '' }]));
      };
      reader.readAsDataURL(file);
    });
  };

  const selectStoreScreen = (id: string) => {
    const sc = storeScreens.find((x) => x.id === id);
    if (!sc) return;
    setActiveStoreId(id);
    setCurrentScreenshot(sc.src);
  };

  const removeStoreScreen = (id: string) => {
    const rest = storeScreens.filter((x) => x.id !== id);
    if (!rest.length) return;
    setStoreScreens(rest);
    if (activeStore?.id === id) selectStoreScreen(rest[0].id);
  };

  // Couleur de l'accroche selon le fond (clair ou sombre)
  const storeCaptionColor = (() => {
    const v = (config.bgValue || '').trim();
    if (!/^#[0-9a-f]{6}$/i.test(v)) return '#ffffff';
    const r = parseInt(v.slice(1, 3), 16), g = parseInt(v.slice(3, 5), 16), b = parseInt(v.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#111111' : '#ffffff';
  })();

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
      // L'image importée remplace aussi l'écran des téléphones
      setMobileScreenshot('');
      setConfig((p) => ({ ...p, phoneScreen: 'desktop' }));
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

  // ══ SCÈNES PHOTO RÉALISTES ══
  const photoScenePrevRef = useRef<{
    bgType: SceneConfig['bgType'];
    bgValue: string;
    bgTransparent: boolean;
    mockupHidden: boolean;
    preset: FramePresetOption;
  } | null>(null);
  const lastSceneShotRef = useRef('');
  const sceneBgRef = useRef('');

  const applyPhotoScene = async (scene: PhotoScene) => {
    trackEvent('photo_scene_used', { scene: scene.id });
    if (
      scene.kind === 'phone' &&
      !mobileScreenshot &&
      canCaptureMobile &&
      config.phoneScreen !== 'desktop' &&
      mobileCaptureState !== 'error'
    ) {
      // Attendre la vraie version téléphone du site (10 à 20 s) plutôt que d'y mettre la version ordinateur
      setPendingPhotoScene(scene);
      setPhotoSceneLoading(scene.id);
      setPhotoSceneError('');
      return;
    }
    const shot = scene.kind === 'phone' ? mobileScreenshot || currentScreenshot : currentScreenshot;
    if (!shot) return;
    setPhotoSceneLoading(scene.id);
    setPhotoSceneError('');
    try {
      const img = await renderPhotoScene(scene, shot);
      lastSceneShotRef.current = shot;
      if (!photoScenePrevRef.current) {
        photoScenePrevRef.current = {
          bgType: config.bgType,
          bgValue: config.bgValue,
          bgTransparent: !!config.bgTransparent,
          mockupHidden,
          preset: currentFramePreset,
        };
      }
      // Le canevas prend exactement le format de la photo
      setCurrentFramePreset({
        id: `scene-${scene.id}`,
        name: `Scène photo (${scene.width}×${scene.height})`,
        category: 'Custom',
        ratioId: 'libre',
        ratioLabel: `${scene.width}:${scene.height}`,
        width: scene.width,
        height: scene.height,
        ratioClass: 'aspect-auto',
      });
      sceneBgRef.current = `url(${img}) center/cover no-repeat`;
      setConfig((p) => ({
        ...p,
        aspectRatio: 'libre',
        bgType: 'texture',
        bgValue: sceneBgRef.current,
        bgTransparent: false,
      }));
      setMockupHidden(true);
      setPhotoScene(scene);
    } catch {
      setPhotoSceneError('Photo indisponible pour le moment. Vérifiez la connexion et réessayez.');
    } finally {
      setPhotoSceneLoading(null);
    }
  };

  const exitPhotoScene = () => {
    const prev = photoScenePrevRef.current;
    if (prev) {
      setConfig((p) => ({
        ...p,
        bgType: prev.bgType,
        bgValue: prev.bgValue,
        bgTransparent: prev.bgTransparent,
        aspectRatio: prev.preset.ratioId,
      }));
      setMockupHidden(prev.mockupHidden);
      setCurrentFramePreset(prev.preset);
    }
    photoScenePrevRef.current = null;
    lastSceneShotRef.current = '';
    sceneBgRef.current = '';
    setPhotoScene(null);
  };

  // Un fond choisi pendant une scène photo ne doit jamais cacher le site : on quitte la scène
  // (l'appareil réapparaît, le format d'avant revient) en gardant le nouveau fond.
  useEffect(() => {
    if (!photoScene || !sceneBgRef.current || config.bgValue === sceneBgRef.current) return;
    const prev = photoScenePrevRef.current;
    if (prev) {
      setMockupHidden(prev.mockupHidden);
      setCurrentFramePreset(prev.preset);
      setConfig((p) => ({ ...p, aspectRatio: prev.preset.ratioId }));
    } else {
      setMockupHidden(false);
    }
    photoScenePrevRef.current = null;
    lastSceneShotRef.current = '';
    sceneBgRef.current = '';
    setPhotoScene(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.bgValue]);

  useEffect(() => {
    if (!pendingPhotoScene || (!mobileScreenshot && mobileCaptureState !== 'error')) return;
    const scene = pendingPhotoScene;
    setPendingPhotoScene(null);
    setPhotoSceneLoading(null);
    applyPhotoScene(scene);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPhotoScene, mobileScreenshot, mobileCaptureState]);

  // La scène est recomposée quand la capture change (version mobile reçue, autre page du site…)
  useEffect(() => {
    if (!photoScene || photoSceneLoading) return;
    const shot = photoScene.kind === 'phone' ? mobileScreenshot || currentScreenshot : currentScreenshot;
    if (!shot || shot === lastSceneShotRef.current) return;
    applyPhotoScene(photoScene);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoScene, mobileScreenshot, currentScreenshot]);

  // Taille affichée du canevas : la plus grande possible dans la zone, en gardant la proportion exacte
  const presetRatio = currentFramePreset.width / currentFramePreset.height;
  const maxCanvasW = Math.max(160, Math.min(1024, canvasArea.w));
  const maxCanvasH = Math.max(160, canvasArea.h - 72); // place pour la barre du bas
  const canvasDisplayW = canvasArea.w ? Math.round(Math.min(maxCanvasW, maxCanvasH * presetRatio)) : undefined;
  const canvasDisplayH = canvasDisplayW ? Math.round(canvasDisplayW / presetRatio) : undefined;
  // Largeur de l'appareil seul : plus grand dans un format vertical, et jamais plus haut que l'image
  // (proportions hauteur / largeur mesurées sur chaque cadre d'appareil)
  const SOLO_DEVICE_ASPECT: Record<string, number> = {
    browser: 0.72, macbook: 0.68, laptop: 0.64, imac: 0.77, ipad: 0.79, iphone: 2.09, android: 2.23, watch: 1.47, flat: 0.63,
  };
  const portraitScene = currentFramePreset.height > currentFramePreset.width * 1.15;
  const soloBasePct =
    config.mockupType === 'iphone' || config.mockupType === 'android'
      ? portraitScene ? 62 : 42
      : config.mockupType === 'watch'
      ? portraitScene ? 46 : 25
      : config.mockupType === 'ipad'
      ? portraitScene ? 82 : 56
      : 82;
  const soloFitPct =
    (98 * currentFramePreset.height) / ((SOLO_DEVICE_ASPECT[config.mockupType] || 0.7) * currentFramePreset.width);
  const soloDeviceWidthPct = Math.round(Math.min(soloBasePct, soloFitPct) * 10) / 10;

  // La scène est toujours dessinée à la même taille de référence (côté long = 1000 px) puis réduite :
  // le rendu et l'export sont identiques quel que soit l'écran (téléphone, portable, grand écran).
  const SCENE_LONG_SIDE = 1000;
  const sceneLogicalW = presetRatio >= 1 ? SCENE_LONG_SIDE : Math.round(SCENE_LONG_SIDE * presetRatio);
  const sceneLogicalH = presetRatio >= 1 ? Math.round(SCENE_LONG_SIDE / presetRatio) : SCENE_LONG_SIDE;
  const sceneDisplayScale = canvasDisplayW ? canvasDisplayW / sceneLogicalW : 1;
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
    <div className={`w-screen min-h-[100dvh] lg:h-[100dvh] flex flex-col bg-[#0b0b0e] text-zinc-150 select-none overflow-x-clip lg:overflow-hidden font-sans relative lg:fixed lg:inset-0 z-50 ${STUDIO_FONT_VARIABLES}`}>
      {confirmQuit && onClose && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setConfirmQuit(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="quit-title"
            className="w-full max-w-sm p-5 rounded-2xl bg-zinc-900 border border-zinc-750 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="quit-title" className="text-base font-bold text-white">
              Quitter le studio ?
            </h2>
            <p className="mt-2 text-sm text-zinc-300 leading-relaxed">
              Votre mockup est enregistré dans ce navigateur. Vous le retrouverez sur l&apos;accueil avec le bouton
              « Reprendre ».
            </p>
            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 border border-zinc-750 transition-colors"
              >
                Quitter
              </button>
              <button
                type="button"
                autoFocus
                onClick={() => setConfirmQuit(false)}
                className="min-h-[44px] px-4 rounded-xl text-sm font-bold text-white bg-pms-accent hover:bg-pms-accent transition-colors"
              >
                Rester dans le studio
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP BAR PRO (Shots.so / Rotato App Header)                         */}
      {/* ═════════════════════════════════════════════════════════════════════ */}
      {!presentationMode && (
        <header className="h-14 sm:h-16 px-2 sm:px-5 lg:px-6 border-b border-zinc-800/90 bg-[#08090e]/95 backdrop-blur-2xl flex items-center justify-between gap-2.5 z-[45] shrink-0 sticky top-0 lg:relative select-none">
          {/* Ligne d'accentuation subtile en haut */}
          <div className="absolute top-0 inset-x-0 h-px bg-pms-accent pointer-events-none" />

          {/* ── GAUCHE : Quitter, Marque PitchMySite, Site Cible & Templates ── */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">
            {onClose && (
              <button
                type="button"
                onClick={() => setConfirmQuit(true)}
                className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 px-2.5 py-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-850/90 border border-zinc-800/80 hover:border-zinc-700 text-xs font-semibold transition-all active:scale-95 shrink-0"
                title="Quitter le studio et revenir à l'accueil"
                aria-label="Quitter le studio"
              >
                <ArrowLeft className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                <span className="hidden lg:inline">Quitter</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 min-w-0">
              <div className="hidden sm:flex w-8 h-8 rounded-xl bg-pms-accent text-white items-center justify-center shadow-lg ring-1 ring-white/15 shrink-0">
                <Sparkles className="w-4 h-4 text-amber-200" />
              </div>
              <div className="min-w-0 hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs sm:text-sm font-black tracking-tight text-white truncate">
                    Pitch<span className="text-pms-accent-soft">MySite</span>
                  </span>
                  <span className="px-1.5 py-0.2 rounded-md bg-pms-accent/15 text-pms-accent-soft border border-pms-accent/30 text-[9px] font-bold tracking-wider uppercase shrink-0">
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
              className="hidden md:flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 px-3 py-1.5 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-750 hover:border-zinc-650 text-zinc-200 hover:text-white text-xs font-semibold transition-all active:scale-95 shrink-0 shadow-xs"
              title="Modèles de mise en scène prêts à l'emploi (raccourci : T)"
              aria-label="Modèles"
            >
              <Layout className="w-3.5 h-3.5 text-pms-accent-soft" />
              <span className="hidden lg:inline">Modèles</span>
            </button>
          </div>

          {/* ── CENTRE : Disposition (Solo / Duo / Trio) ── */}
          <div className="hidden lg:flex items-center bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 shadow-inner" role="group" aria-label="Disposition">
            {([
              { id: 'single', label: 'Solo', title: 'Un seul appareil' },
              { id: 'dual-stacked', label: 'Duo', title: 'Ordinateur + téléphone' },
              { id: 'trio-ecosystem', label: 'Trio', title: 'Ordinateur + tablette + téléphone' },
            ] as const).map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setConfig((p) => ({ ...p, layoutMode: l.id }))}
                aria-pressed={(config.layoutMode || 'single') === l.id}
                className={`px-3.5 py-1 rounded-xl text-xs font-semibold transition-all ${
                  (config.layoutMode || 'single') === l.id
                    ? 'bg-pms-accent text-white shadow-md'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={l.title}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* ── DROITE : Annuler/Rétablir, outils, Exporter, compte ── */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Annuler / Rétablir */}
            <div className="flex items-center bg-zinc-900/90 rounded-xl border border-zinc-750">
              <button
                type="button"
                onClick={handleUndo}
                disabled={!canUndo}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 p-2 rounded-l-xl text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                title="Annuler (Ctrl+Z)"
                aria-label="Annuler"
              >
                <Undo2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
              <div className="w-px h-4 bg-zinc-750" />
              <button
                type="button"
                onClick={handleRedo}
                disabled={!canRedo}
                className="flex items-center justify-center min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 p-2 rounded-r-xl text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                title="Rétablir (Ctrl+Y)"
                aria-label="Rétablir"
              >
                <Redo2 className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
              </button>
            </div>

            {/* Pitch IA */}
            <button
              type="button"
              onClick={() => setSalesKitOpen(true)}
              aria-label="Pitch IA"
              className="flex items-center justify-center gap-1.5 min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 px-3 py-1.5 rounded-xl bg-pms-accent-hover/40 hover:bg-pms-accent-hover/60 border border-pms-accent/40 hover:border-pms-accent text-pms-accent-soft hover:text-white text-xs font-bold transition-all shadow-xs active:scale-95"
              title="Rédiger un post LinkedIn, une proposition commerciale et une étude de cas avec l'IA"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden xl:inline">Pitch IA</span>
            </button>

            {/* Présentation plein écran */}
            <button
              type="button"
              onClick={() => setPresentationMode(true)}
              className="hidden lg:flex items-center justify-center p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 transition-all active:scale-95"
              title="Présentation plein écran (Échap pour quitter)"
              aria-label="Présentation plein écran"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            {/* Exporter : un seul bouton, toutes les options dans le menu */}
            <div className="relative" ref={exportMenuRef} data-tour="export">
              <button
                type="button"
                onClick={() => setShowExportMenu((v) => !v)}
                disabled={isExporting || isExportingPack}
                aria-expanded={showExportMenu}
                className="flex items-center justify-center gap-1.5 sm:gap-2 min-w-[44px] min-h-[44px] lg:min-h-0 px-3 sm:px-4 py-1.5 rounded-xl bg-pms-accent hover:bg-pms-accent-hover text-white font-bold text-xs sm:text-sm shadow-lg ring-1 ring-white/20 transition-all active:scale-95 disabled:opacity-60"
                title="Exporter l'image, la vidéo ou le pack réseaux sociaux (raccourci : E)"
                aria-label="Exporter"
              >
                {isExporting || isExportingPack ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{isExportingPack ? `Pack ${packProgress}` : 'Rendu…'}</span>
                  </>
                ) : exportSuccess || packProgress === 'Fait !' ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Téléchargé</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {/* Sur téléphone, l'icône seule : la barre du haut tient sur une ligne */}
                    <span className="hidden sm:inline">Exporter</span>
                    <ChevronDown className={`hidden sm:block w-3.5 h-3.5 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {showExportMenu && (
                <div className="absolute right-0 mt-2.5 w-[min(20rem,calc(100vw-1.5rem))] max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain bg-[#0c0d14] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/80 p-4 z-50 animate-slide-up text-xs space-y-4">
                  {/* Téléphone : les 3 actions les plus utilisées d'abord, en gros boutons */}
                  <div className="lg:hidden space-y-2">
                    <button
                      type="button"
                      onClick={handleExportImage}
                      disabled={isExporting}
                      className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-pms-accent hover:bg-pms-accent-hover text-white text-[15px] font-bold disabled:opacity-50"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger l&apos;image
                    </button>
                    <button
                      type="button"
                      onClick={handleExportWhatsAppStatus}
                      disabled={isExporting}
                      className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-[15px] font-semibold disabled:opacity-50"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      Statut WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowShare(true);
                        setShowExportMenu(false);
                      }}
                      className="w-full min-h-[48px] flex items-center justify-center gap-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-[15px] font-semibold"
                    >
                      <Link2 className="w-4 h-4 text-pms-accent-soft" />
                      Lien de partage pour le client
                    </button>
                    <p className="pt-2 text-[13px] font-semibold text-zinc-400">Toutes les options</p>
                  </div>

                  {/* Format de fichier */}
                  <div className="space-y-1.5">
                    <span className="text-[12px] lg:text-[10px] font-bold uppercase tracking-wider text-zinc-500">Format du fichier</span>
                    <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                      {([
                        { id: 'png', label: 'PNG', hint: 'Qualité maximale, fond transparent possible' },
                        { id: 'jpg', label: 'JPG', hint: 'Fichier léger, idéal pour WhatsApp et e-mail' },
                        { id: 'webp', label: 'WebP', hint: 'Très léger, idéal pour un site web' },
                      ] as const).map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setExportFormat(f.id)}
                          aria-pressed={exportFormat === f.id}
                          title={f.hint}
                          className={`min-h-[40px] lg:min-h-0 py-1.5 rounded-lg font-bold transition-all ${
                            exportFormat === f.id ? 'bg-pms-accent text-white' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Qualité (dimensions réelles du fichier) */}
                  <div className="space-y-1.5">
                    <span className="text-[12px] lg:text-[10px] font-bold uppercase tracking-wider text-zinc-500">Qualité</span>
                    <div className="space-y-1">
                      {([
                        { id: 'standard', label: 'Standard', allowed: true, plan: '' },
                        { id: 'hd', label: 'HD', allowed: canExportHd, plan: 'Solo' },
                        { id: '4k', label: '4K', allowed: canExport4k, plan: 'Pro' },
                      ] as const).map((q) => {
                        const size = getExportSize(currentFramePreset, q.id);
                        const active = effectiveQuality === q.id;
                        return (
                          <button
                            key={q.id}
                            type="button"
                            onClick={() => setExportQuality(q.id)}
                            aria-pressed={active}
                            className={`w-full min-h-[44px] lg:min-h-0 flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${
                              active
                                ? 'bg-pms-accent/15 border-pms-accent/60 text-white'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                            }`}
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              {!q.allowed && <Lock className="w-3 h-3 text-amber-400" />}
                              {q.label}
                            </span>
                            <span className="font-mono text-[12px] lg:text-[10px] text-zinc-400">
                              {size.width} × {size.height}
                              {!q.allowed && (
                                <span className="ml-1.5 text-amber-400 font-sans font-bold">
                                  Plan {q.plan} ou {q.id === '4k' ? 2 : 1} crédit{q.id === '4k' ? 's' : ''}
                                </span>
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[12px] lg:text-[10px] text-zinc-500">
                      Format du canevas : {currentFramePreset.name} ({currentFramePreset.ratioLabel}). Modifiable en bas de l&apos;écran.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleExportImage}
                    disabled={isExporting}
                    className="w-full py-2.5 rounded-xl bg-pms-accent hover:bg-pms-accent-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
                  >
                    {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    <span>Télécharger l&apos;image</span>
                  </button>

                  {/* Autres exports */}
                  <div className="pt-3 border-t border-zinc-800 space-y-1">
                    <span className="text-[12px] lg:text-[10px] font-bold uppercase tracking-wider text-zinc-500">Autres exports</span>
                    {canShareFiles && (
                      <button
                        type="button"
                        onClick={handleShareImage}
                        disabled={isExporting}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-zinc-900 text-left disabled:opacity-50"
                      >
                        <ExternalLink className="w-4 h-4 text-sky-400" />
                        <span className="flex-1">
                          <span className="font-semibold block">Partager…</span>
                          <span className="text-[12px] lg:text-[10px] text-zinc-500">WhatsApp, Telegram, e-mail… avec l&apos;image jointe</span>
                        </span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleExportWhatsAppStatus}
                      disabled={isExporting}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-zinc-900 text-left disabled:opacity-50"
                    >
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      <span className="flex-1">
                        <span className="font-semibold block">Statut WhatsApp</span>
                        <span className="text-[12px] lg:text-[10px] text-zinc-500">Format vertical 9:16, JPG léger</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCopyToClipboard();
                        setShowExportMenu(false);
                      }}
                      disabled={isCopying}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-zinc-900 text-left disabled:opacity-50"
                    >
                      {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
                      <span className="flex-1">
                        <span className="font-semibold block">{copySuccess ? 'Copié !' : 'Copier l\'image'}</span>
                        <span className="text-[12px] lg:text-[10px] text-zinc-500">À coller dans un e-mail, Slack, WhatsApp Web…</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleExportPack();
                        setShowExportMenu(false);
                      }}
                      disabled={isExportingPack}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-zinc-900 text-left disabled:opacity-50"
                    >
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span className="flex-1">
                        <span className="font-semibold block">Pack réseaux sociaux (5 fichiers)</span>
                        <span className="text-[12px] lg:text-[10px] text-zinc-500">16:9, LinkedIn, Instagram carré et portrait, Story / statut WhatsApp</span>
                      </span>
                    </button>
                    {([
                      { id: 'appstore', label: 'Pack App Store (3 fichiers)', hint: 'iPhone 6,3" et 6,9", iPad 13" : tailles exactes, JPG' },
                      { id: 'play', label: 'Pack Google Play (3 fichiers)', hint: 'Téléphone, tablette et bannière 1024 × 500, JPG' },
                    ] as const).map((pk) => (
                      <button
                        key={pk.id}
                        type="button"
                        onClick={() => {
                          handleExportPack(pk.id);
                          setShowExportMenu(false);
                        }}
                        disabled={isExportingPack}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-zinc-900 text-left disabled:opacity-50"
                      >
                        <Smartphone className="w-4 h-4 text-sky-400" />
                        <span className="flex-1">
                          <span className="font-semibold block">{pk.label}</span>
                          <span className="text-[12px] lg:text-[10px] text-zinc-500">{pk.hint}</span>
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setShowShare(true);
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-zinc-900 text-left"
                    >
                      <Link2 className="w-4 h-4 text-pms-accent-soft" />
                      <span className="flex-1">
                        <span className="font-semibold block">Lien de partage</span>
                        <span className="text-[12px] lg:text-[10px] text-zinc-500">Une page pour que votre client voie et télécharge le mockup</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAddToPresentation}
                      disabled={isAddingSlide}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-zinc-900 text-left disabled:opacity-50"
                    >
                      {isAddingSlide ? <RefreshCw className="w-4 h-4 animate-spin text-pms-accent-soft" /> : <FilePlus className="w-4 h-4 text-pms-accent-soft" />}
                      <span className="flex-1">
                        <span className="font-semibold block">{slideAddedNote || 'Ajouter à la présentation'}</span>
                        <span className="text-[12px] lg:text-[10px] text-zinc-500">Garde cette scène comme une page du PDF client</span>
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPresentation(true);
                        setShowExportMenu(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-200 hover:bg-zinc-900 text-left"
                    >
                      <FileText className="w-4 h-4 text-pms-accent-soft" />
                      <span className="flex-1">
                        <span className="font-semibold block">
                          Présentation client / carrousel
                          {presentationSlides.length > 0 && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-pms-accent text-white text-[12px] lg:text-[10px]">{presentationSlides.length}</span>
                          )}
                        </span>
                        <span className="text-[12px] lg:text-[10px] text-zinc-500">PDF pour un devis, carrousel LinkedIn ou Instagram</span>
                      </span>
                    </button>
                    <div className="px-3 py-2 rounded-xl space-y-2">
                      <div className="flex items-center gap-2.5 text-zinc-200">
                        <Video className="w-4 h-4 text-amber-400 shrink-0" />
                        <span className="flex-1">
                          <span className="font-semibold block">Vidéo animée</span>
                          <span className="text-[12px] lg:text-[10px] text-zinc-500">
                            {VIDEO_ANIMATIONS.find((v) => v.id === videoPreset)?.hint}
                            {videoAsGif
                              ? ', GIF 720 px'
                              : `, format ${videoExtension.toUpperCase()}${videoExtension === 'webm' ? ' (MP4 avec Chrome, Edge ou Safari)' : ''}`}
                          </span>
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-zinc-950 border border-zinc-800" role="radiogroup" aria-label="Format de l'animation">
                        {([
                          { gif: false, label: `Vidéo ${videoExtension.toUpperCase()}` },
                          { gif: true, label: 'GIF animé' },
                        ] as const).map((o) => (
                          <button
                            key={o.label}
                            type="button"
                            role="radio"
                            aria-checked={videoAsGif === o.gif}
                            onClick={() => setVideoAsGif(o.gif)}
                            disabled={isExportingVideo}
                            className={`py-1 rounded-md text-[12px] lg:text-[11px] font-bold ${videoAsGif === o.gif ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-white'}`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-1" role="radiogroup" aria-label="Animation de la vidéo">
                        {VIDEO_ANIMATIONS.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            role="radio"
                            aria-checked={videoPreset === v.id}
                            onClick={() => setVideoPreset(v.id)}
                            disabled={isExportingVideo}
                            className={`py-1.5 rounded-lg text-[12px] lg:text-[11px] font-semibold border transition-all ${
                              videoPreset === v.id
                                ? 'bg-amber-500/15 border-amber-500/50 text-amber-200'
                                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {v.label}
                          </button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={handleExportVideo}
                        disabled={isExportingVideo}
                        className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
                      >
                        {isExportingVideo ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                        {isExportingVideo
                          ? `Création ${videoAsGif ? 'du GIF' : 'de la vidéo'}… ${videoProgress}`
                          : videoAsGif
                          ? 'Créer le GIF'
                          : 'Créer la vidéo'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Afficher / masquer le panneau de réglages */}
            <button
              type="button"
              onClick={() => setShowRightPanel((p) => !p)}
              className="hidden sm:flex items-center justify-center min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 p-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-750 text-zinc-400 hover:text-white transition-all"
              title={showRightPanel ? 'Masquer les réglages' : 'Afficher les réglages'}
              aria-label={showRightPanel ? 'Masquer les réglages' : 'Afficher les réglages'}
            >
              {showRightPanel ? (
                <PanelRightClose className="w-4 h-4 text-zinc-400" />
              ) : (
                <PanelRightOpen className="w-4 h-4 text-pms-accent-soft" />
              )}
            </button>

            {/* ── SECTION COMPTE UTILISATEUR ULTRA-SOIGNÉE ── */}
            <div className="relative" ref={userDropdownRef}>
              <button
                type="button"
                onClick={() => setUserDropdownOpen((p) => !p)}
                className="flex items-center gap-1.5 sm:gap-2 min-h-[44px] lg:min-h-0 pl-1.5 pr-2 py-1 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-750 hover:border-zinc-650 transition-all shadow-xs text-xs"
                title="Gestion de compte et abonnement"
              >
                {/* Avatar utilisateur */}
                <div className="relative">
                  <div className="w-7 h-7 rounded-lg bg-pms-accent text-white flex items-center justify-center font-bold text-[11px] shadow-sm uppercase">
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
                  className={`hidden lg:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                    userPlan === 'agence'
                      ? 'bg-amber-400/15 text-amber-300 border-amber-400/30'
                      : userPlan === 'pro'
                      ? 'bg-pms-accent/20 text-pms-accent-soft border-pms-accent/40'
                      : userPlan === 'solo'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}
                >
                  {userPlan === 'agence' ? (
                    <>
                      <Crown className="w-2.5 h-2.5 text-amber-300" />
                      <span>Agence</span>
                    </>
                  ) : userPlan === 'pro' ? (
                    <>
                      <Zap className="w-2.5 h-2.5 text-pms-accent-soft" />
                      <span>Pro</span>
                    </>
                  ) : userPlan === 'solo' ? (
                    <span>Solo</span>
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
                          userPlan === 'agence'
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                            : userPlan === 'pro'
                            ? 'bg-pms-accent/20 text-pms-accent-soft border border-pms-accent/30'
                            : userPlan === 'solo'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                        }`}
                      >
                        {userPlan === 'agence' ? (
                          <Crown className="w-3 h-3 text-amber-300" />
                        ) : userPlan === 'pro' ? (
                          <Zap className="w-3 h-3 text-pms-accent-soft" />
                        ) : (
                          <Shield className="w-3 h-3 text-zinc-400" />
                        )}
                        Plan {userPlan === 'agence' ? 'Agence' : userPlan === 'pro' ? 'Pro' : userPlan === 'solo' ? 'Solo' : 'Gratuit'}
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
                      <span className="text-zinc-400">Qualité d&apos;export :</span>
                      <span className="font-mono font-bold text-white">
                        {userPlan === 'free' ? 'Standard (filigrane)' : userPlan === 'solo' ? 'HD' : 'HD et 4K'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-zinc-400">Filigrane :</span>
                      <span className="font-bold text-white">
                        {userPlan === 'free' || userPlan === 'solo' ? 'Oui' : 'Non'}
                      </span>
                    </div>

                    {isFreePlan && (
                      <div className="pt-2">
                        <Link
                          href="/pricing"
                          onClick={() => setUserDropdownOpen(false)}
                          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-pms-accent hover:bg-pms-accent-hover text-white font-bold text-[11px] transition-all shadow-md"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>Passer au Pro</span>
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
                          <span>Changer de forfait &amp; tarifs</span>
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
                          className="flex items-center gap-2.5 px-4 py-2 text-pms-accent-soft hover:text-pms-accent-soft hover:bg-zinc-850/80 transition-colors font-bold"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-pms-accent-soft" />
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
      <div className="flex-1 lg:min-h-0 w-full flex flex-col lg:flex-row lg:overflow-hidden relative">
        {/* ── ZONE DE PRÉVISUALISATION CENTRALE (CANVAS FLUIDE GÉANT) ── */}
        <main className="sticky top-14 sm:top-16 z-30 h-[44svh] shrink-0 lg:static lg:z-auto lg:shrink lg:flex-1 lg:h-full lg:min-h-0 flex flex-col items-center justify-center p-3 sm:p-8 bg-[#090a0f] overflow-hidden select-none">
          {/* Mode Présentation: Flottant 'Quitter la présentation (Échap)' */}
          {presentationMode && (
            <div className="absolute top-5 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-2 py-2 rounded-full bg-[#07080c]/90 border border-zinc-800 text-white animate-fade-in select-none">
              <button
                type="button"
                onClick={() => setPresentationMode(false)}
                className="flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white text-zinc-900 text-[14px] font-semibold transition-all active:scale-95"
              >
                <Minimize2 className="w-4 h-4" />
                <span>Fermer l&apos;aperçu</span>
              </button>
            </div>
          )}

          {/* Téléphone : voir le mockup en plein écran d'un toucher */}
          {!presentationMode && (
            <button
              type="button"
              onClick={() => setPresentationMode(true)}
              className="lg:hidden absolute top-2 right-2 z-40 flex items-center gap-1.5 min-h-[44px] px-3 rounded-full bg-black/70 text-white text-[13px] font-semibold active:scale-95 transition-all"
            >
              <Maximize2 className="w-4 h-4" />
              Voir en grand
            </button>
          )}

          {/* Scène photo : retour bien visible au mockup d'avant */}
          {photoScene && !presentationMode && (
            <button
              type="button"
              onClick={exitPhotoScene}
              className="absolute top-3 left-3 z-40 flex items-center gap-2 min-h-[44px] px-4 rounded-full bg-white text-zinc-900 text-sm font-bold shadow-xl hover:bg-zinc-100 active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Revenir à mon mockup
            </button>
          )}


          {/* CONTENEUR DE ZOOM DU CANVAS */}
          <div
            ref={canvasAreaRef}
            className="w-full flex-1 min-h-0 flex items-center justify-center transition-transform duration-200"
            style={{ transform: `scale(${canvasZoom / 100})` }}
          >
            {/* CADRE D'AFFICHAGE (taille à l'écran) */}
            <div
              data-studio-canvas
              className="relative shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.6)] transition-[width,height] duration-300"
              style={{ width: canvasDisplayW, height: canvasDisplayH }}
            >
            {/* CANVAS DE LA SCÈNE RENDU (taille de référence, réduite par transform) */}
            <div
              ref={sceneRef}
              className="absolute top-0 left-0 overflow-hidden flex items-center justify-center touch-pan-y lg:touch-none"
              style={{
                width: sceneLogicalW,
                height: sceneLogicalH,
                transform: `scale(${sceneDisplayScale})`,
                transformOrigin: 'top left',
                // Ne jamais mélanger « background » et des propriétés de fond vides : React les remettrait
                // à zéro et effacerait le dégradé (le fond restait noir).
                ...(config.bgTransparent
                  ? {
                      backgroundImage: `linear-gradient(45deg, #27272a 25%, transparent 25%), linear-gradient(-45deg, #27272a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #27272a 75%), linear-gradient(-45deg, transparent 75%, #27272a 75%)`,
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
                    }
                  : { background: config.bgType === 'blurred-image' ? '#121214' : config.bgValue }),
              }}
              onClick={() => {
                setSelectedTextId(null);
                setSelectedLogoId(null);
                setSelectedAnnotationId(null);
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
                  className="absolute inset-0 pointer-events-none opacity-20 z-[5]"
                  style={{
                    backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.4) 1px, transparent 1px)`,
                    backgroundSize: '28px 28px',
                  }}
                />
              )}

              {config.bgPattern === 'dots' && !config.bgTransparent && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-25 z-[5]"
                  style={{
                    backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1.5px, transparent 1.5px)`,
                    backgroundSize: '24px 24px',
                  }}
                />
              )}

              {config.bgPattern === 'mesh' && !config.bgTransparent && (
                <div
                  className="absolute inset-0 pointer-events-none opacity-35 mix-blend-soft-light z-[5]"
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
                  className="absolute inset-0 pointer-events-none mix-blend-overlay z-[15]"
                  style={{
                    opacity: ((config.filterIntensity || 40) / 100) * 0.5,
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  }}
                />
              )}

              {config.filterType === 'vhs' && (
                <div
                  className="absolute inset-0 pointer-events-none z-[15]"
                  style={{
                    opacity: ((config.filterIntensity || 40) / 100) * 0.6,
                    background: `repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 1px, transparent 3px), linear-gradient(90deg, rgba(255,0,0,0.04), rgba(0,255,0,0.02), rgba(0,0,255,0.04))`,
                  }}
                />
              )}

              {config.filterType === 'glitch' && (
                <div
                  className="absolute inset-0 pointer-events-none mix-blend-screen z-[15] overflow-hidden"
                  style={{
                    opacity: ((config.filterIntensity || 40) / 100) * 0.5,
                    backgroundImage: `repeating-linear-gradient(90deg, rgba(255,0,80,0.1) 0px, rgba(0,255,255,0.1) 4px, transparent 4px, transparent 12px)`,
                  }}
                />
              )}

              {/* EFFET PORTRAIT (Flou de profondeur de champ) */}
              {portraitBlur && (
                <div
                  className="absolute inset-0 pointer-events-none z-[15] backdrop-blur-[5px]"
                  style={{
                    maskImage: 'radial-gradient(ellipse at center, transparent 38%, black 82%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 38%, black 82%)',
                  }}
                />
              )}

              {/* ── MOCKUPS 3D DANS LA SCÈNE (MODE SOLO OU MODE DUO) ── */}
              {!mockupHidden && (
                config.layoutMode === 'before-after' ? (
                  /* ── AVANT / APRÈS : ancien site et refonte côte à côte ── */
                  <div
                    className="absolute lg:cursor-move touch-pan-y lg:touch-none z-20 flex items-center justify-center gap-[3%]"
                    style={{
                      left: '50%',
                      top: '50%',
                      width: '92%',
                      height: '84%',
                      transform: `translate(-50%, -50%) translate(${config.mockupX}%, ${config.mockupY}%) scale(${config.mockupScale / 100})`,
                    }}
                    onPointerDown={(e) => handlePointerDown(e, 'mockup')}
                  >
                    {([
                      { key: 'before', label: config.beforeLabel ?? 'Avant', shot: beforeScreenshot, accent: 'bg-zinc-900/85 text-zinc-100' },
                      { key: 'after', label: config.afterLabel ?? 'Après', shot: currentScreenshot, accent: 'bg-pms-accent text-white' },
                    ] as const).map((side) => (
                      <div key={side.key} className="relative w-[48.5%] flex flex-col items-center gap-[4%]">
                        <span className={`px-4 py-1.5 rounded-full text-[18px] font-extrabold tracking-wide shadow-lg ${side.accent}`}>
                          {side.label}
                        </span>
                        <div className="w-full" style={{ filter: config.shadowEnabled ? `drop-shadow(${dynamicShadow})` : undefined }}>
                          {side.shot ? (
                            <MockupFrame
                              type="browser"
                              screenshotBase64={side.shot}
                              domainName={side.key === 'before' ? beforeUrl.replace(/^https?:\/\//, '').split('/')[0] || 'ancien site' : customAddressBar.trim() || captureItem.domainName}
                              faviconUrl={side.key === 'after' ? captureItem.faviconUrl : undefined}
                        url={captureItem.url}
                        title={captureItem.title}
                        theme={config.deviceTheme}
                        styleVariant={config.deviceStyle}
                        browserStyle={config.browserStyle || browserStyle}
                        cornerRadius={config.cornerRadius}
                        cropOffsetY={config.cropOffsetY}
                            />
                          ) : (
                            <div data-export-hide className="w-full aspect-[16/10] rounded-2xl border-2 border-dashed border-white/40 bg-black/30 flex flex-col items-center justify-center gap-2 text-white text-center p-6">
                              <span className="text-lg font-bold">Ancien site</span>
                              <span className="text-sm text-white/70">Capturez son adresse ou importez une image dans le panneau « Appareil ».</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : config.layoutMode === 'dual-stacked' ? (
                  /* ── MODE DUO : MACBOOK/BROWSER + IPHONE 16 EN SUPERPOSITION (SIGNATURE SHOTS.SO) ── */
                  /* FIX: conteneur 80%×76% pour que l'iPhone reste TOUJOURS dans la scène */
                  <div
                    className="absolute lg:cursor-move transition-all duration-150 touch-pan-y lg:touch-none z-20"
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
                        type={config.mockupType === 'iphone' || config.mockupType === 'android' || config.mockupType === 'watch' ? 'macbook' : config.mockupType}
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
                        screenshotBase64={phoneScreenshot}
                        url={captureItem.url}
                        title={captureItem.title}
                        domainName={captureItem.domainName}
                        faviconUrl={captureItem.faviconUrl}
                        theme={config.deviceTheme}
                        styleVariant={config.deviceStyle}
                        cornerRadius="round"
                        cropOffsetY={config.cropOffsetY}
                        deviceColor={config.deviceColor}
                      />
                    </div>
                  </div>
                ) : config.layoutMode === 'trio-ecosystem' ? (
                  /* ── MODE TRIO ÉCOSYSTÈME (MACBOOK + IPAD + IPHONE) ── */
                  <div
                    className="absolute lg:cursor-move transition-all duration-150 touch-pan-y lg:touch-none z-20"
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
                        width: '62%',
                        left: '19%',
                        top: '2%',
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
                        width: '34%',
                        left: '0%',
                        bottom: '6%',
                        filter: config.shadowEnabled ? 'drop-shadow(0 20px 35px rgba(0,0,0,0.55))' : undefined,
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
                        deviceColor={config.deviceColor}
                      />
                    </div>

                    {/* Appareil 3 : iPhone (Droite / Premier plan avant-garde) */}
                    <div
                      className="absolute z-30 transition-transform"
                      style={{
                        width: '14%',
                        right: '6%',
                        bottom: '4%',
                        filter: config.shadowEnabled ? 'drop-shadow(0 25px 40px rgba(0,0,0,0.60))' : undefined,
                      }}
                    >
                      <MockupFrame
                        type="iphone"
                        screenshotBase64={phoneScreenshot}
                        url={captureItem.url}
                        title={captureItem.title}
                        domainName={captureItem.domainName}
                        faviconUrl={captureItem.faviconUrl}
                        theme={config.deviceTheme}
                        styleVariant={config.deviceStyle}
                        cornerRadius="round"
                        cropOffsetY={config.cropOffsetY}
                        deviceColor={config.deviceColor}
                      />
                    </div>
                  </div>
                ) : (
                  /* ── MODE SOLO : APPAREIL UNIQUE CENTRÉ ── */
                  <div
                    className="absolute lg:cursor-move transition-all duration-150 touch-pan-y lg:touch-none z-20"
                    style={{
                      width: `${soloDeviceWidthPct}%`,
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
                        fill
                        screenshotBase64={
                          config.mockupType === 'iphone' || config.mockupType === 'android' || config.mockupType === 'watch'
                            ? phoneScreenshot
                            : currentScreenshot
                        }
                        deviceColor={config.deviceColor}
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

              {/* MODE STORES : accroche de l'écran, au-dessus de l'appareil */}
              {storeMode && activeStore?.caption && (
                <div
                  className="absolute inset-x-[7%] top-[4.5%] z-30 text-center pointer-events-none"
                  style={{ color: storeCaptionColor, fontSize: Math.round(sceneLogicalW * 0.075), fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em' }}
                >
                  {activeStore.caption}
                </div>
              )}

              {/* CALQUES DE TEXTES */}
              {config.texts.map((txt) => {
                const isSelected = selectedTextId === txt.id;
                return (
                  <div
                    key={txt.id}
                    onPointerDown={(e) => handlePointerDown(e, { type: 'text', id: txt.id })}
                    className={`absolute cursor-move select-none p-2 rounded-lg transition-all group touch-none z-30 ${
                      isSelected ? '' : 'hover:ring-1 hover:ring-white/50'
                    }`}
                    style={{
                      left: `${txt.x}%`,
                      top: `${txt.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: txt.color,
                      fontFamily: studioFontFamily(txt.fontFamily),
                      fontSize: `${txt.fontSize}px`,
                      fontWeight: txt.fontWeight === '900' ? 900 : txt.fontWeight === 'bold' ? 700 : txt.fontWeight === 'medium' ? 500 : 400,
                      textAlign: txt.align,
                    }}
                  >
                    <span className="whitespace-pre-wrap leading-tight block drop-shadow-md">{txt.text}</span>
                    {isSelected && (
                      <span data-export-hide className="absolute inset-0 rounded-lg ring-2 ring-pms-accent pointer-events-none" />
                    )}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteText(txt.id);
                        }}
                        data-export-hide
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
                      isSelected ? '' : 'hover:ring-1 hover:ring-white/50'
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
                      <span data-export-hide className="absolute inset-0 rounded-lg ring-2 ring-pms-accent pointer-events-none" />
                    )}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLogo(lg.id);
                        }}
                        data-export-hide
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
                      ''
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
                          : 'bg-zinc-950/85 border-pms-accent/40 text-white'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full bg-pms-accent animate-ping" />
                      {callout.badge && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider bg-pms-accent text-white">
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
                      <span data-export-hide className="absolute inset-0 rounded-lg ring-2 ring-pms-accent pointer-events-none" />
                    )}
                    {isSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCallout(callout.id);
                        }}
                        data-export-hide
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
                  className="absolute cursor-move select-none z-[35] touch-none hover:ring-1 hover:ring-white/40 rounded-2xl p-0.5"
                  style={{
                    left: `${badge.x}%`,
                    top: `${badge.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {(() => {
                    const tb = TRUST_BADGES.find((t) => t.type === badge.type || (badge.type === 'producthunt' && t.type === 'product-hunt') || (badge.type === 'sla-enterprise' && t.type === 'uptime'));
                    if (!tb) return null;
                    const text = (badge.customText ?? '').trim() || tb.placeholder;
                    return (
                      <div className="px-3.5 py-2 rounded-2xl bg-zinc-950/90 text-white flex items-center gap-2 shadow-xl border border-white/15 backdrop-blur-md">
                        <span className={tb.type === 'trustpilot' ? 'text-amber-300 text-sm' : 'text-sm'} aria-hidden>
                          {tb.type === 'trustpilot' ? '★' : tb.icon}
                        </span>
                        <div className="leading-tight">
                          <div className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400">{tb.label}</div>
                          <div className="text-xs font-bold">{text}</div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ))}

              {/* BADGES TECH STACK DÉVELOPPEUR SUR LA SCÈNE */}
              {selectedTechIds.length > 0 && (
                <div
                  className={`absolute z-[35] transition-all duration-300 pointer-events-none select-none flex items-center ${
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
                        : 'bg-stone-950/95 border-pms-accent/50 text-pms-accent-soft ring-2 ring-pms-accent/30'
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

              {/* ANNOTATIONS */}
              {(config.annotations || []).length > 0 && (
                <SceneAnnotationsLayer
                  annotations={config.annotations || []}
                  selectedId={selectedAnnotationId}
                  onSelect={(id) => {
                    setSelectedAnnotationId(id);
                    if (id) {
                      setActiveMainTab('mockup');
                      setActiveTab('annotate');
                    }
                  }}
                  onChange={handleUpdateAnnotation}
                  width={sceneLogicalW}
                  height={sceneLogicalH}
                  sceneRef={sceneRef}
                  snap={snapToCenter}
                  onDragEnd={clearSnapGuides}
                  loupeImage={currentScreenshot}
                />
              )}

              {/* REPÈRES D'ALIGNEMENT (jamais exportés) */}
              {snapGuides.v && (
                <div data-export-hide data-snap-guide="v" className="absolute top-0 bottom-0 left-1/2 w-px bg-pms-accent/90 z-[60] pointer-events-none" />
              )}
              {snapGuides.h && (
                <div data-export-hide data-snap-guide="h" className="absolute left-0 right-0 top-1/2 h-px bg-pms-accent/90 z-[60] pointer-events-none" />
              )}

              {/* WATERMARK : FREE vs PRO (Marque blanche) */}
              {planWatermark ? (
                <Link
                  data-watermark
                  href="/pricing"
                  onClick={(e) => {
                    // Rester dans le studio : on ouvre la fenêtre des formules au lieu de quitter la page
                    e.preventDefault();
                    setUpsellModal({ open: true, mode: 'feature_locked' });
                  }}
                  className="absolute bottom-3 right-3 z-40 px-2.5 py-1 rounded-lg bg-black/65 hover:bg-pms-accent-hover/80 backdrop-blur-md text-white/90 hover:text-white text-[10px] font-mono font-semibold flex items-center gap-1.5 shadow-sm border border-white/20 hover:border-pms-accent transition-all select-none group"
                  title="Créé avec PitchMySite. Débloquez le plan Pro pour supprimer le filigrane."
                >
                  <Layers className="w-3 h-3 text-pms-accent-soft group-hover:scale-110 transition-transform" />
                  <span>Réalisé avec PitchMySite</span>
                  <span data-export-hide className="text-[9px] bg-pms-accent/60 px-1 py-0.5 rounded text-pms-accent-soft group-hover:bg-pms-accent font-sans">
                    Retirer
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
                <div className="absolute inset-0 pointer-events-none z-[15] flex items-center justify-center">
                  <div className="w-[82%] h-[75%] rounded-full bg-pms-accent/30 blur-3xl animate-pulse" />
                </div>
              )}

              {/* SHADOW OVERLAY DE SCÈNE (Stores vénitiens, Feuilles, Palmier, Fenêtre) */}
              <SceneShadowOverlay type={sceneOverlay || config.sceneOverlay || 'none'} opacity={shadowOpacity / 100} />
            </div>
            </div>
          </div>

          {/* ── BARRE DE CONTRÔLES FLOTTANTE AU BAS DU CANVAS (STYLE SHOTS.SO) ── */}
          <div data-tour="formats" className="relative shrink-0 mt-2 lg:mt-0 lg:absolute lg:bottom-5 lg:left-1/2 lg:-translate-x-1/2 z-40 max-w-full lg:max-w-[calc(100%-1rem)] overflow-x-auto no-scrollbar bg-zinc-900/90 backdrop-blur-xl border border-zinc-800 rounded-2xl px-3 py-1 lg:py-1.5 shadow-2xl [&_button]:min-h-[44px] [&_button]:min-w-[40px] lg:[&_button]:min-h-0 lg:[&_button]:min-w-0 [&_button]:text-[13px] [&_span]:text-[13px] lg:[&_button]:text-[11px] lg:[&_span]:text-[11px] flex items-center gap-3 text-xs select-none whitespace-nowrap">
            {/* Formats rapides (même réglage que « Format du canevas ») */}
            <div className="flex items-center gap-1">
              {(['geo-16-9', 'geo-4-3', 'geo-1-1', 'ig-portrait', 'geo-9-16'] as const).map((id) => {
                const fp = FRAME_PRESETS.find((p) => p.id === id);
                if (!fp) return null;
                const active = currentFramePreset.id === fp.id;
                return (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => selectFramePreset(fp)}
                    aria-pressed={active}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                      active ? 'bg-pms-accent text-white shadow-xs' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                    title={`${fp.desc} — ${fp.width} × ${fp.height}`}
                  >
                    {fp.ratioLabel}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setShowFrameSizePopover(true)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  !['geo-16-9', 'geo-4-3', 'geo-1-1', 'ig-portrait', 'geo-9-16'].includes(currentFramePreset.id)
                    ? 'bg-pms-accent text-white'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
                title="Tous les formats : Instagram, LinkedIn, YouTube, Pinterest, App Store…"
              >
                {['geo-16-9', 'geo-4-3', 'geo-1-1', 'ig-portrait', 'geo-9-16'].includes(currentFramePreset.id)
                  ? 'Plus…'
                  : currentFramePreset.name}
              </button>
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
              title="Remettre l'appareil droit et centré"
            >
              <RotateCcw className="w-3 h-3 text-pms-accent-soft" />
              <span>Recentrer</span>
            </button>

          </div>
        </main>

        {/* ═════════════════════════════════════════════════════════════════ */}
        {/* 3. PANNEAU LATÉRAL D'INSPECTION (STYLE DAVINCI / RESOLVE / FIGMA) */}
        {/* ═════════════════════════════════════════════════════════════════ */}
        {showRightPanel && !presentationMode && (
          <aside className="w-full lg:w-[380px] xl:w-[410px] lg:h-full bg-[#0a0b10] border-t lg:border-t-0 lg:border-l border-zinc-850/80 flex flex-col shrink-0 z-20 lg:overflow-hidden lg:shadow-2xl">
          {/* EN-TÊTE : déplier / replier (téléphone) + mode Simple / Expert */}
          <div className="flex px-2 lg:px-4 py-1 lg:py-2.5 border-b border-zinc-850/80 bg-[#08090d] items-center justify-between gap-2 shrink-0">
            <span className="hidden lg:flex text-xs font-bold text-zinc-200 items-center gap-2">
              Réglages
              {draftSavedAt && (
                <span className="text-[12px] lg:text-[10px] font-medium text-zinc-500" title="Votre travail est enregistré dans ce navigateur">
                  · Enregistré
                </span>
              )}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={toggleExpertMode}
                aria-pressed={expertMode}
                className={`flex items-center gap-1.5 min-h-[44px] lg:min-h-0 px-2.5 py-1 rounded-lg border text-[12px] lg:text-[11px] font-semibold transition-all ${
                  expertMode
                    ? 'bg-pms-accent/20 border-pms-accent/50 text-pms-accent-soft'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white'
                }`}
                title={expertMode ? 'Revenir aux réglages essentiels' : 'Afficher tous les réglages avancés'}
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span>{expertMode ? 'Moins de réglages' : 'Plus de réglages'}</span>
              </button>
              <button
                type="button"
                onClick={() => setShowRightPanel(false)}
                className="hidden lg:block p-1 rounded-lg hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors"
                title="Masquer les réglages"
                aria-label="Masquer les réglages"
              >
                <PanelRightClose className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ONGLETS (un seul niveau) */}
          <div data-tour="panel" className="sticky top-[calc(3.5rem+44svh)] sm:top-[calc(4rem+44svh)] z-20 lg:static px-3 py-2 lg:py-2.5 border-b border-zinc-850/80 bg-[#090a0f] shrink-0">
            <div className={`grid ${expertMode ? 'grid-cols-7' : 'grid-cols-5'} gap-1 p-1 rounded-xl bg-zinc-900/90 border border-zinc-800`} role="tablist">
              {([
                { key: 'mockup', main: 'mockup', label: 'Appareil', icon: Monitor, expert: false },
                { key: '3d', main: 'mockup', label: 'Angle', icon: Box, expert: false },
                { key: 'frame', main: 'frame', label: 'Fond', icon: Palette, expert: false },
                { key: 'branding', main: 'mockup', label: 'Textes', icon: Type, expert: false },
                { key: 'annotate', main: 'mockup', label: 'Annoter', icon: PenLine, expert: false },
                { key: 'callouts', main: 'mockup', label: 'Badges', icon: Tag, expert: true },
                { key: 'content', main: 'mockup', label: 'Image', icon: ImageIcon, expert: true },
              ] as const)
                .filter((t) => expertMode || !t.expert)
                .map((t) => {
                  const active = t.main === 'frame' ? activeMainTab === 'frame' : activeMainTab === 'mockup' && activeTab === t.key;
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        if (t.main === 'frame') {
                          setActiveMainTab('frame');
                        } else {
                          setActiveMainTab('mockup');
                          setActiveTab(t.key);
                        }
                      }}
                      className={`flex flex-col items-center justify-center gap-1 min-h-[44px] lg:min-h-0 py-1.5 rounded-lg text-[12px] lg:text-[10px] font-bold transition-all ${
                        active ? 'bg-zinc-700 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* CONTENU DE L'INSPECTEUR DÉFILABLE */}
          <div
            ref={inspectorScrollRef}
            className="flex flex-col lg:flex-1 lg:min-h-0 p-4 sm:p-5 pb-16 lg:pb-5 space-y-6 lg:overflow-y-auto lg:overscroll-contain studio-scrollbar lg:max-h-[calc(100vh-120px)]"
          >
            {/* ══════════ ONGLET PRINCIPAL MOCKUP ══════════ */}
            {activeMainTab === 'mockup' && (
              <div className="space-y-0 animate-fade-in">
            {/* ══════════ ONGLET 1 : APPAREIL & MODÈLES ══════════ */}
            {activeTab === 'mockup' && (

              <div className="space-y-5 animate-fade-in">
                {/* Ordre pensé pour le téléphone : l'essentiel d'abord (appareil, disposition), les outils avancés ensuite */}
                {storeMode && (
                  <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                    <div>
                      <p className="text-[15px] font-semibold text-white">Écrans de l&apos;appli ({storeScreens.length})</p>
                      <p className="mt-1 text-[13px] text-zinc-400">Un visuel par écran, aux tailles de l&apos;App Store et de Google Play.</p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {storeScreens.map((sc, i) => (
                        <button
                          key={sc.id}
                          type="button"
                          onClick={() => selectStoreScreen(sc.id)}
                          aria-label={`Écran ${i + 1}`}
                          aria-pressed={activeStore?.id === sc.id}
                          className={`shrink-0 w-14 h-24 rounded-lg overflow-hidden border-2 ${activeStore?.id === sc.id ? 'border-pms-accent' : 'border-zinc-700'}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={sc.src} alt="" className="w-full h-full object-cover object-top" />
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => storeFileInputRef.current?.click()}
                        className="shrink-0 w-14 h-24 rounded-lg border-2 border-dashed border-zinc-600 text-zinc-300 text-[12px] font-semibold flex flex-col items-center justify-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Ajouter
                      </button>
                      <input ref={storeFileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleAddStoreScreens} />
                    </div>
                    {activeStore && (
                      <div className="space-y-2">
                        <label htmlFor="store-caption" className="text-[13px] font-semibold text-zinc-300">
                          Accroche de cet écran
                        </label>
                        <input
                          id="store-caption"
                          type="text"
                          value={activeStore.caption}
                          maxLength={60}
                          placeholder="Ex. : Payez en un geste"
                          onChange={(e) =>
                            setStoreScreens((list) => list.map((x) => (x.id === activeStore.id ? { ...x, caption: e.target.value } : x)))
                          }
                          className="w-full min-h-[44px] px-3 rounded-xl bg-zinc-950 border border-zinc-700 text-white text-[15px] focus:outline-none focus:border-pms-accent"
                        />
                        {storeScreens.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeStoreScreen(activeStore.id)}
                            className="min-h-[44px] text-[13px] font-semibold text-zinc-400 hover:text-white"
                          >
                            Retirer cet écran
                          </button>
                        )}
                      </div>
                    )}
                    <div className="space-y-2">
                      <p className="text-[13px] font-semibold text-zinc-300">Fond</p>
                      <div className="flex gap-3">
                        {[
                          { c: '#111111', n: 'Noir' },
                          { c: '#FFFFFF', n: 'Blanc' },
                          { c: '#E9E9EB', n: 'Gris clair' },
                          { c: '#1A4BE0', n: 'Bleu' },
                          { c: '#E2A93B', n: 'Or' },
                        ].map(({ c, n }) => (
                          <button
                            key={c}
                            type="button"
                            aria-label={`Fond ${n}`}
                            aria-pressed={config.bgValue === c}
                            onClick={() => setConfig((p) => ({ ...p, bgType: 'solid', bgValue: c, bgTransparent: false }))}
                            className={`w-10 h-10 rounded-full border-2 ${config.bgValue === c ? 'border-pms-accent scale-110' : 'border-zinc-600'}`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleExportStoreScreens}
                      disabled={isExportingPack}
                      className="w-full min-h-[48px] rounded-xl bg-pms-accent hover:bg-pms-accent-hover text-white text-[15px] font-bold disabled:opacity-50"
                    >
                      {isExportingPack ? `Export ${packProgress}` : `Exporter les ${storeScreens.length * 2} captures (App Store + Google Play)`}
                    </button>
                  </div>
                )}
                {/* Modèle d'appareil (9 options) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    Modèle d&apos;Appareil
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { type: 'browser' as MockupType, label: 'Web', icon: Monitor },
                      { type: 'macbook' as MockupType, label: 'MacBook', icon: Laptop },
                      { type: 'laptop' as MockupType, label: 'PC portable', icon: Laptop },
                      { type: 'imac' as MockupType, label: 'iMac', icon: Tv },
                      { type: 'ipad' as MockupType, label: 'iPad', icon: Tablet },
                      { type: 'iphone' as MockupType, label: 'iPhone', icon: Smartphone },
                      { type: 'android' as MockupType, label: 'Android', icon: Smartphone },
                      { type: 'watch' as MockupType, label: 'Watch', icon: Watch },
                      { type: 'flat' as MockupType, label: 'Sans appareil', icon: Layers },
                    ].map((item) => {
                      const Icon = item.icon;
                      const isSelected = config.mockupType === item.type;
                      return (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => {
                            if (photoScene) exitPhotoScene();
                            setConfig((p) => ({
                              ...p,
                              mockupType: item.type,
                              // Le téléphone choisi est aussi utilisé en Duo et en Trio
                              phoneModel: item.type === 'android' ? 'android' : item.type === 'iphone' ? 'iphone' : p.phoneModel,
                            }));
                          }}
                          className={`min-h-[44px] lg:min-h-0 py-2 px-1.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-pms-accent text-white border-pms-accent shadow-md font-bold'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-[12px] lg:text-[10px] truncate">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Disposition Solo vs Duo vs Trio */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    Disposition
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, layoutMode: 'single' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        (config.layoutMode || 'single') === 'single'
                          ? 'bg-pms-accent/20 border-pms-accent text-white ring-1 ring-pms-accent/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">Solo</div>
                      <div className="text-[12px] lg:text-[10px] text-zinc-400 mt-0.5">1 appareil</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, layoutMode: 'dual-stacked' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all relative ${
                        config.layoutMode === 'dual-stacked'
                          ? 'bg-pms-accent/20 border-pms-accent text-white ring-1 ring-pms-accent/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">Duo</div>
                      <div className="text-[12px] lg:text-[10px] text-zinc-400 mt-0.5">Ordinateur + téléphone</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, layoutMode: 'trio-ecosystem' }))}
                      className={`p-2.5 rounded-xl border text-left transition-all relative ${
                        config.layoutMode === 'trio-ecosystem'
                          ? 'bg-pms-accent/20 border-pms-accent text-white ring-1 ring-pms-accent/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">Trio</div>
                      <div className="text-[12px] lg:text-[10px] text-zinc-400 mt-0.5">+ tablette</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, layoutMode: 'before-after' }))}
                      aria-pressed={config.layoutMode === 'before-after'}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        config.layoutMode === 'before-after'
                          ? 'bg-pms-accent/20 border-pms-accent text-white ring-1 ring-pms-accent/50'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="font-bold text-xs text-white">Avant / Après</div>
                      <div className="text-[12px] lg:text-[10px] text-zinc-400 mt-0.5">Refonte d&apos;un site</div>
                    </button>
                  </div>

                  {config.layoutMode === 'before-after' && (
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                      <p className="text-[12px] lg:text-[11px] text-zinc-400 leading-relaxed">
                        « Après » = le site capturé ({captureItem.domainName || 'votre image'}). Ajoutez l&apos;ancien site pour « Avant ».
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="url"
                          inputMode="url"
                          value={beforeUrl}
                          onChange={(e) => setBeforeUrl(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && captureBeforeSite()}
                          placeholder="ancien-site.com ou web.archive.org/…"
                          aria-label="Adresse de l'ancien site"
                          className="flex-1 min-w-0 px-2.5 py-2 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white focus:outline-none focus:border-pms-accent"
                        />
                        <button
                          type="button"
                          onClick={captureBeforeSite}
                          disabled={beforeCaptureState === 'loading' || !beforeUrl.trim()}
                          className="min-h-[44px] lg:min-h-0 px-3 py-2 rounded-lg bg-pms-accent hover:bg-pms-accent text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5"
                        >
                          {beforeCaptureState === 'loading' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                          Capturer
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => beforeFileRef.current?.click()}
                        className="min-h-[44px] lg:min-h-0 w-full py-2 rounded-lg border border-zinc-800 text-zinc-300 hover:text-white hover:border-zinc-700 text-xs font-semibold"
                      >
                        …ou importer une capture de l&apos;ancien site
                      </button>
                      <input ref={beforeFileRef} type="file" accept="image/*" className="hidden" aria-label="Importer une capture de l'ancien site" onChange={handleBeforeImageUpload} />
                      {beforeCaptureState === 'error' && (
                        <p className="text-[12px] lg:text-[11px] text-rose-400" role="alert">{beforeError}</p>
                      )}
                      <p className="text-[12px] lg:text-[10px] text-zinc-500">
                        L&apos;ancien site n&apos;est plus en ligne ? Cherchez-le sur web.archive.org et collez l&apos;adresse de l&apos;archive.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={config.beforeLabel ?? 'Avant'}
                          onChange={(e) => setConfig((p) => ({ ...p, beforeLabel: e.target.value }))}
                          maxLength={24}
                          aria-label="Libellé de gauche"
                          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white"
                        />
                        <input
                          type="text"
                          value={config.afterLabel ?? 'Après'}
                          onChange={(e) => setConfig((p) => ({ ...p, afterLabel: e.target.value }))}
                          maxLength={24}
                          aria-label="Libellé de droite"
                          className="px-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Téléphone (Duo / Trio), couleur de l'appareil et écran du téléphone */}
                {(phoneVisible || ['ipad', 'watch'].includes(config.mockupType)) && (
                  <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                    {(config.layoutMode === 'dual-stacked' || config.layoutMode === 'trio-ecosystem') && (
                      <p className="text-[12px] lg:text-[11px] text-zinc-400">
                        Téléphone : <span className="font-semibold text-zinc-200">iPhone 18 Pro</span>
                      </p>
                    )}

                    <div className="space-y-1.5">
                      <span className="text-[12px] lg:text-[10px] font-mono font-bold text-zinc-400 uppercase">Couleur de l&apos;appareil</span>
                      <div className="flex flex-wrap items-center gap-2">
                        {([
                          // Les 4 coloris de l'iPhone 18 Pro d'abord, puis les teintes classiques
                          { id: 'deep-black', label: 'Noir profond (iPhone 18 Pro)', swatch: 'bg-neutral-900' },
                          { id: 'silver', label: 'Argent (iPhone 18 Pro)', swatch: 'bg-zinc-300' },
                          { id: 'glacier', label: 'Bleu glacier (iPhone 18 Pro)', swatch: 'bg-sky-200' },
                          { id: 'burgundy', label: 'Bordeaux (iPhone 18 Pro)', swatch: 'bg-rose-900' },
                          { id: 'graphite', label: 'Graphite', swatch: 'bg-stone-800' },
                          { id: 'titanium', label: 'Titane', swatch: 'bg-stone-500' },
                          { id: 'midnight', label: 'Bleu nuit', swatch: 'bg-slate-800' },
                          { id: 'gold', label: 'Or', swatch: 'bg-amber-200' },
                        ] as { id: DeviceColor; label: string; swatch: string }[]).map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setConfig((p) => ({ ...p, deviceColor: c.id }))}
                            aria-pressed={(config.deviceColor || 'graphite') === c.id}
                            aria-label={c.label}
                            title={c.label}
                            className={`w-7 h-7 rounded-full border-2 transition-transform ${c.swatch} ${
                              (config.deviceColor || 'graphite') === c.id ? 'border-pms-accent scale-110' : 'border-zinc-700 hover:scale-105'
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    {phoneVisible && canCaptureMobile && (
                      <div className="space-y-1.5">
                        <span className="text-[12px] lg:text-[10px] font-mono font-bold text-zinc-400 uppercase">Écran du téléphone</span>
                        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800">
                          {([
                            { id: 'mobile', label: 'Version mobile' },
                            { id: 'desktop', label: 'Même image' },
                          ] as const).map((o) => (
                            <button
                              key={o.id}
                              type="button"
                              onClick={() => setConfig((p) => ({ ...p, phoneScreen: o.id }))}
                              aria-pressed={(config.phoneScreen || 'mobile') === o.id}
                              className={`min-h-[44px] lg:min-h-0 py-1.5 rounded-lg text-[12px] lg:text-[11px] font-bold transition-all ${
                                (config.phoneScreen || 'mobile') === o.id ? 'bg-pms-accent text-white' : 'text-zinc-400 hover:text-white'
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                        {(config.phoneScreen || 'mobile') === 'mobile' && (
                          <p className="text-[12px] lg:text-[10px] text-zinc-500 flex items-center gap-1.5" role="status">
                            {mobileCaptureState === 'loading' && (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin text-pms-accent-soft" />
                                Capture de la version mobile du site…
                              </>
                            )}
                            {mobileCaptureState === 'done' && <>✓ Le téléphone affiche la vraie version mobile du site.</>}
                            {mobileCaptureState === 'error' && (
                              <>
                                Version mobile indisponible : le téléphone affiche l&apos;image de l&apos;ordinateur.{' '}
                                <button type="button" onClick={() => setMobileCaptureState('idle')} className="text-pms-accent-soft font-semibold">
                                  Réessayer
                                </button>
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Directeur artistique IA : choisir la meilleure section de la page */}
                {canCaptureMobile && (
                  <AiDirectorPanel
                    url={captureItem.url}
                    onUseSection={(img) => {
                      setCurrentScreenshot(img);
                      setConfig((p) => ({ ...p, cropOffsetY: 0, phoneScreen: 'desktop' }));
                    }}
                  />
                )}

                {canCaptureMobile && (
                  <SitePagesPanel
                    siteUrl={captureItem.url}
                    homeScreenshot={captureItem.screenshotBase64 || ''}
                    activeScreenshot={currentScreenshot}
                    pages={sitePages}
                    setPages={setSitePages}
                    onShow={(img) => {
                      setCurrentScreenshot(img);
                      setConfig((p) => ({ ...p, cropOffsetY: 0, phoneScreen: 'desktop' }));
                    }}
                    onAddAllToPresentation={handleAddPagesToPresentation}
                    addingAll={isAddingAllPages}
                  />
                )}

                <PhotoScenesPanel
                  activeId={photoScene?.id || null}
                  loadingId={photoSceneLoading}
                  error={photoSceneError}
                  onPick={applyPhotoScene}
                  onExit={exitPhotoScene}
                />

                {/* Finition du Cadre */}
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="text-[12px] lg:text-[10px] font-mono font-bold text-zinc-400 uppercase">Thème</span>
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, deviceTheme: 'light' }))}
                          className={`min-h-[44px] lg:min-h-0 flex-1 py-1 rounded text-[12px] lg:text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                            config.deviceTheme === 'light' ? 'bg-pms-accent text-white font-bold' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Sun className="w-3 h-3" />
                          <span>Clair</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfig((p) => ({ ...p, deviceTheme: 'dark' }))}
                          className={`min-h-[44px] lg:min-h-0 flex-1 py-1 rounded text-[12px] lg:text-[11px] font-medium flex items-center justify-center gap-1 transition-all ${
                            config.deviceTheme === 'dark' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          <Moon className="w-3 h-3" />
                          <span>Sombre</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[12px] lg:text-[10px] font-mono font-bold text-zinc-400 uppercase">Style</span>
                      <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
                        {(['default', 'glass'] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => setConfig((p) => ({ ...p, deviceStyle: st }))}
                            className={`min-h-[44px] lg:min-h-0 flex-1 py-1 rounded text-[12px] lg:text-[11px] font-medium capitalize transition-all ${
                              config.deviceStyle === st ? 'bg-pms-accent text-white font-bold' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {st === 'default' ? 'Standard' : 'Verre'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rayon d'angle */}
                  <div className="space-y-1.5">
                    <span className="text-[12px] lg:text-[10px] font-mono font-bold text-zinc-400 uppercase">Rayon d&apos;angle</span>
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
                          className={`min-h-[44px] lg:min-h-0 py-1 text-[12px] lg:text-[10px] font-medium rounded transition-all ${
                            config.cornerRadius === r.id ? 'bg-pms-accent text-white font-bold' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {expertMode && (<>
                {/* ── STYLE NAVIGATEUR (Shots.so) ── */}
                {(config.mockupType === 'browser' || config.mockupType === 'macbook' || config.mockupType === 'laptop' || config.mockupType === 'imac') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300">Style Navigateur</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'safari-light' as const, label: 'Safari', sub: 'Clair', dot: 'bg-red-500' },
                        { id: 'chrome-light' as const, label: 'Chrome', sub: 'Clair', dot: 'bg-blue-500' },
                        { id: 'arc-light' as const, label: 'Arc', sub: 'Clair', dot: 'bg-pms-accent' },
                        { id: 'safari-dark' as const, label: 'Safari', sub: 'Sombre', dot: 'bg-red-700' },
                        { id: 'chrome-dark' as const, label: 'Chrome', sub: 'Sombre', dot: 'bg-blue-700' },
                        { id: 'arc-dark' as const, label: 'Arc', sub: 'Sombre', dot: 'bg-pms-accent' },
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
                                ? 'bg-pms-accent/25 border-pms-accent ring-1 ring-pms-accent/40'
                                : 'bg-zinc-900 border-zinc-800 hover:border-zinc-600'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-2 h-2 rounded-full ${bs.dot}`} />
                              <span className="text-[12px] lg:text-[10px] font-bold text-white">{bs.label}</span>
                            </div>
                            <span className={`text-[12px] lg:text-[9px] ${isCurrent ? 'text-pms-accent-soft' : 'text-zinc-500'}`}>{bs.sub}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── BARRE D'ADRESSE PERSONNALISÉE ── */}
                {(config.mockupType === 'browser' || config.mockupType === 'macbook' || config.mockupType === 'laptop' || config.mockupType === 'imac') && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300">Barre d&apos;Adresse</label>
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-pms-accent/60 transition-colors">
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
                  <label className="text-xs font-bold text-zinc-300">Position Rapide</label>
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
                              ? 'bg-pms-accent/20 border-pms-accent/40 hover:bg-pms-accent/40'
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
                      className="min-h-[44px] lg:min-h-0 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[12px] lg:text-[10px] text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-semibold"
                    >
                      Auto
                    </button>
                  </div>
                </div>

                {/* ── SYSTÈME D'OMBRES AVANCÉ (Shots.so) ── */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
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
                        className={`min-h-[44px] lg:min-h-0 py-2 px-1 rounded-xl border text-[12px] lg:text-[10px] font-semibold transition-all ${
                          shadowType === sh.id
                            ? 'bg-pms-accent text-white border-pms-accent'
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
                        <div className="flex items-center justify-between text-[12px] lg:text-[10px] font-mono">
                          <span className="text-zinc-400">Opacité</span>
                          <span className="text-pms-accent-soft font-bold">{shadowOpacity}%</span>
                        </div>
                        <input
                          type="range" min="0" max="100" value={shadowOpacity}
                          onChange={(e) => setShadowOpacity(Number(e.target.value))}
                          className="w-full accent-pms-accent h-1.5 rounded-lg cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[12px] lg:text-[10px] font-mono">
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
                      <div className="p-1.5 rounded-xl bg-pms-accent/20 text-pms-accent-soft">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-white">Couleurs tirées du site</span>
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
                      <span className="text-[12px] lg:text-[10px] font-mono text-zinc-400 min-w-[28px] text-center">
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
                  <label className="text-xs font-bold text-zinc-300">
                    Média
                  </label>
                  <button
                    type="button"
                    onClick={() => replaceImgInputRef.current?.click()}
                    className="w-full h-24 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-pms-accent/60 bg-zinc-900/60 hover:bg-zinc-900 transition-all flex flex-col items-center justify-center gap-1.5 group"
                  >
                    <div className="w-8 h-8 rounded-xl bg-zinc-800 group-hover:bg-pms-accent/20 group-hover:text-pms-accent-soft flex items-center justify-center text-zinc-400 transition-colors">
                      <Plus className="w-4 h-4" />
                    </div>
                    <span className="text-[12px] lg:text-[11px] text-zinc-400 group-hover:text-zinc-200">
                      Remplacer l&apos;image ou déposer un fichier
                    </span>
                  </button>
                </div>

                {/* ── FENÊTRE & ÉCHELLE UI (MokupCapture.PNG) ── */}
                <div className="space-y-3 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">
                      Échelle UI
                    </label>
                    <span className="text-xs font-mono font-bold text-pms-accent-soft">{uiScale}%</span>
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
                    className="w-full accent-pms-accent h-1.5 rounded-lg cursor-pointer"
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
                          className={`py-1.5 rounded-lg border text-[12px] lg:text-[10px] font-mono font-bold transition-all text-center ${
                            isActive
                              ? 'bg-pms-accent text-white border-pms-accent shadow-xs'
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
                  className={`min-h-[44px] lg:min-h-0 w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    mockupHidden
                      ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 hover:bg-rose-600/30'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  {mockupHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {mockupHidden ? 'Afficher le Mockup' : 'Masquer le Mockup'}
                </button>
                </>)}
              </div>
            )}

            {/* ══════════ ONGLET 3 : 3D, CAMÉRA & OMBRES ══════════ */}
            {activeTab === '3d' && photoScene && (
              <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-100 leading-relaxed">
                Les angles ne s&apos;appliquent pas à une scène photo : le site y est déjà placé dans la photo.
                <button
                  type="button"
                  onClick={exitPhotoScene}
                  className="mt-2 flex items-center gap-1.5 min-h-[44px] px-3 rounded-xl bg-white text-zinc-900 font-bold"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Revenir à mon mockup
                </button>
              </div>
            )}
            {activeTab === '3d' && (
              <div
                className={`space-y-5 animate-fade-in ${photoScene ? 'opacity-40 pointer-events-none' : ''}`}
                aria-disabled={!!photoScene}
              >
                {/* Poses 3D Rapides en 1 Clic */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300">
                      Angles prêts à l’emploi
                    </label>
                    <button
                      type="button"
                      onClick={handleReset3D}
                      className="min-h-[44px] lg:min-h-0 px-2 text-[12px] lg:text-[11px] text-pms-accent-soft hover:text-white font-bold"
                    >
                      Remettre droit
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: 'À Plat', tx: 0, ty: 0, rot: 0 },
                      { label: 'Incliné à gauche', tx: 14, ty: -18, rot: -6 },
                      { label: 'Incliné à droite', tx: 14, ty: 18, rot: 6 },
                      { label: 'Perspective', tx: -12, ty: 0, rot: 4 },
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
                        className={`min-h-[44px] lg:min-h-0 py-2 px-1 rounded-xl border text-xs font-semibold text-center transition-all ${
                          config.mockupTiltX === pose.tx &&
                          config.mockupTiltY === pose.ty &&
                          config.mockupRotation === pose.rot
                            ? 'bg-pms-accent text-white border-pms-accent font-bold shadow-md'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                        }`}
                      >
                        {pose.label}
                      </button>
                    ))}
                  </div>
                </div>

                {expertMode && (<>
                {/* Sliders de Perspective 3D */}
                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>Tilt Vertical (Haut / Bas)</span>
                      <span className="font-bold text-pms-accent-soft">{config.mockupTiltX || 0}°</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={config.mockupTiltX || 0}
                      onChange={(e) => setConfig((p) => ({ ...p, mockupTiltX: Number(e.target.value) }))}
                      className="w-full accent-pms-accent cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>Tilt Horizontal (Gauche / Droite)</span>
                      <span className="font-bold text-pms-accent-soft">{config.mockupTiltY || 0}°</span>
                    </div>
                    <input
                      type="range"
                      min="-30"
                      max="30"
                      value={config.mockupTiltY || 0}
                      onChange={(e) => setConfig((p) => ({ ...p, mockupTiltY: Number(e.target.value) }))}
                      className="w-full accent-pms-accent cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
                      <span>Rotation Angulaire (Angle Z)</span>
                      <span className="font-bold text-pms-accent-soft">{config.mockupRotation || 0}°</span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={config.mockupRotation || 0}
                      onChange={(e) => setConfig((p) => ({ ...p, mockupRotation: Number(e.target.value) }))}
                      className="w-full accent-pms-accent cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  </div>
                </div>

                </>)}
                {/* Échelle / Taille */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-zinc-300 uppercase">Échelle & Taille du Mockup</span>
                    <span className="text-pms-accent-soft font-bold">{config.mockupScale}%</span>
                  </div>
                  <input
                    type="range"
                    min="40"
                    max="140"
                    value={config.mockupScale}
                    onChange={(e) => setConfig((p) => ({ ...p, mockupScale: Number(e.target.value) }))}
                    className="w-full accent-pms-accent cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                  />
                </div>

                {expertMode && (<>
                {/* Ombre portée 3D */}
                <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-300">Ombre Portée Réaliste</span>
                    <input
                      type="checkbox"
                      checked={config.shadowEnabled}
                      onChange={(e) => setConfig((p) => ({ ...p, shadowEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-pms-accent rounded cursor-pointer"
                    />
                  </div>
                  {config.shadowEnabled && (
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={config.shadowIntensity}
                      onChange={(e) => setConfig((p) => ({ ...p, shadowIntensity: Number(e.target.value) }))}
                      className="w-full accent-pms-accent cursor-pointer h-1.5 bg-zinc-800 rounded-lg"
                    />
                  )}
                </div>
                </>)}
              </div>
            )}

            {/* ══════════ ONGLET ANNOTER ══════════ */}
            {activeTab === 'annotate' && (
              <div className="space-y-5 animate-fade-in">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Ajouter</label>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                    {([
                      { kind: 'arrow', label: 'Flèche', icon: MoveUpRight },
                      { kind: 'rect', label: 'Cadre', icon: Square },
                      { kind: 'ellipse', label: 'Cercle', icon: Circle },
                      { kind: 'number', label: 'Étape', icon: Hash },
                      { kind: 'blur', label: 'Flouter', icon: BlurIcon },
                      { kind: 'loupe', label: 'Loupe', icon: ZoomIn },
                    ] as const).map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <button
                          key={tool.kind}
                          type="button"
                          onClick={() => handleAddAnnotation(tool.kind)}
                          className="min-h-[44px] lg:min-h-0 py-2 rounded-xl border bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:border-pms-accent/60 text-[12px] lg:text-[10px] font-semibold flex flex-col items-center gap-1 transition-all"
                          title={tool.kind === 'blur' ? 'Cacher une information sensible (e-mail, nom, chiffre…)' : tool.kind === 'loupe' ? 'Agrandir un détail de la page dans un cercle' : `Ajouter : ${tool.label}`}
                        >
                          <Icon className="w-4 h-4" />
                          {tool.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">Couleur</label>
                  <div className="flex flex-wrap items-center gap-3 lg:gap-2">
                    {[
                      { c: '#ef4444', n: 'Rouge' },
                      { c: '#f59e0b', n: 'Orange' },
                      { c: '#22c55e', n: 'Vert' },
                      { c: '#3b82f6', n: 'Bleu' },
                      { c: '#7c3aed', n: 'Violet' },
                      { c: '#ffffff', n: 'Blanc' },
                      { c: '#111827', n: 'Noir' },
                    ].map(({ c, n }) => {
                      const sel = (config.annotations || []).find((a) => a.id === selectedAnnotationId);
                      const active = sel && sel.kind !== 'blur' ? sel.color === c : annotationColor === c;
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setAnnotationColor(c);
                            if (sel && sel.kind !== 'blur') handleUpdateAnnotation(sel.id, { color: c });
                          }}
                          aria-label={n}
                          aria-pressed={active}
                          title={n}
                          className={`w-10 h-10 lg:w-7 lg:h-7 shrink-0 rounded-full border-2 transition-transform ${active ? 'border-pms-accent scale-110' : 'border-zinc-700 hover:scale-105'}`}
                          style={{ background: c }}
                        />
                      );
                    })}
                  </div>
                </div>

                {(() => {
                  const loupe = (config.annotations || []).find((a) => a.id === selectedAnnotationId && a.kind === 'loupe');
                  if (!loupe || !currentScreenshot) return null;
                  return (
                    <div className="space-y-2 p-3 rounded-xl bg-zinc-900 border border-zinc-800">
                      <label className="text-xs font-bold text-zinc-300">Loupe : détail à agrandir</label>
                      <p className="text-[12px] lg:text-[11px] text-zinc-500">Cliquez sur la page à l&apos;endroit à montrer.</p>
                      <div className="max-h-56 overflow-y-auto rounded-lg border border-zinc-800">
                        <div
                          className="relative cursor-crosshair"
                          role="button"
                          aria-label="Choisir le détail à agrandir"
                          onClick={(e) => {
                            const r = e.currentTarget.getBoundingClientRect();
                            handleUpdateAnnotation(loupe.id, {
                              srcX: Math.round(((e.clientX - r.left) / r.width) * 1000) / 10,
                              srcY: Math.round(((e.clientY - r.top) / r.height) * 1000) / 10,
                            });
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={currentScreenshot} alt="" className="w-full block select-none pointer-events-none" />
                          <span
                            className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full border-2 border-pms-accent bg-pms-accent/30 pointer-events-none"
                            style={{ left: `${loupe.srcX ?? 50}%`, top: `${loupe.srcY ?? 10}%` }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-zinc-950 border border-zinc-800" role="radiogroup" aria-label="Niveau de zoom">
                        {[2, 3, 4].map((z) => (
                          <button
                            key={z}
                            type="button"
                            role="radio"
                            aria-checked={(loupe.zoom ?? 2) === z}
                            onClick={() => handleUpdateAnnotation(loupe.id, { zoom: z })}
                            className={`min-h-[44px] lg:min-h-0 py-1.5 rounded-lg text-xs font-bold ${(loupe.zoom ?? 2) === z ? 'bg-pms-accent text-white' : 'text-zinc-400 hover:text-white'}`}
                          >
                            ×{z}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {(config.annotations || []).length > 0 ? (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-300">
                      Sur l&apos;image ({(config.annotations || []).length})
                    </label>
                    <div className="space-y-1.5">
                      {(config.annotations || []).map((a) => (
                        <div
                          key={a.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                            selectedAnnotationId === a.id ? 'border-pms-accent bg-pms-accent/10' : 'border-zinc-800 bg-zinc-900'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedAnnotationId(a.id)}
                            className="flex-1 flex items-center gap-2 text-left text-xs text-zinc-200"
                          >
                            <span className="w-3 h-3 rounded-full border border-white/30 shrink-0" style={{ background: a.kind === 'blur' ? 'transparent' : a.color }} />
                            {a.kind === 'arrow' ? 'Flèche' : a.kind === 'rect' ? 'Cadre' : a.kind === 'ellipse' ? 'Cercle' : a.kind === 'blur' ? 'Zone floutée' : a.kind === 'loupe' ? 'Loupe' : `Étape ${a.label}`}
                          </button>
                          {a.kind === 'number' && (
                            <input
                              type="text"
                              value={a.label || ''}
                              maxLength={2}
                              onChange={(e) => handleUpdateAnnotation(a.id, { label: e.target.value })}
                              aria-label="Numéro de l'étape"
                              className="w-10 px-1.5 py-1 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white text-center"
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteAnnotation(a.id)}
                            className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                            title="Supprimer (touche Suppr)"
                            aria-label="Supprimer l'annotation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[12px] lg:text-[11px] text-zinc-500 leading-relaxed">
                    Ajoutez une flèche ou un cadre pour montrer une fonctionnalité à votre client, ou floutez une information
                    privée avant d&apos;envoyer l&apos;image.
                  </p>
                )}

                <p className="text-[12px] lg:text-[11px] text-zinc-500 leading-relaxed">
                  Faites glisser une annotation sur l&apos;image pour la placer ; les poignées bleues la redimensionnent.
                  Le flou est appliqué sur l&apos;image exportée : l&apos;information cachée n&apos;est pas récupérable.
                </p>
              </div>
            )}

            {/* ══════════ ONGLET 4 : DÉFILEMENT DE PAGE & IMAGE ══════════ */}
            {activeTab === 'content' && (
              <div className="space-y-5 animate-fade-in">
                {/* Défilement vertical de la capture */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-white uppercase flex items-center gap-1.5">
                      <Move className="w-3.5 h-3.5 text-pms-accent-soft" />
                      <span>Défilement Web (Haut ↕ Bas)</span>
                    </span>
                    <span className="text-pms-accent-soft font-bold">{config.cropOffsetY || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={config.cropOffsetY || 0}
                    onChange={(e) => setConfig((p) => ({ ...p, cropOffsetY: Number(e.target.value) }))}
                    className="w-full accent-pms-accent cursor-pointer h-2 bg-zinc-800 rounded-lg"
                  />
                  <div className="flex justify-between text-[12px] lg:text-[11px] text-zinc-400 font-mono">
                    <span>▲ Haut de page</span>
                    <span>Tarifs / Features</span>
                    <span>Footer ▼</span>
                  </div>
                </div>

                {/* Remplacement manuel de l'image */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-pms-accent-soft" />
                    <span className="text-xs font-bold text-white">Remplacer la capture</span>
                  </div>
                  <p className="text-[12px] lg:text-[11px] text-zinc-400">
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
                    className="min-h-[44px] lg:min-h-0 w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-750 text-white text-xs font-semibold border border-zinc-700 transition-colors flex items-center justify-center gap-2"
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
                    <span className="text-xs font-bold text-white">Titres & Textes</span>
                    <button
                      type="button"
                      onClick={handleAddText}
                      className="min-h-[44px] lg:min-h-0 px-2.5 py-1 rounded-lg bg-pms-accent hover:bg-pms-accent text-white text-[12px] lg:text-[11px] font-bold flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Ajouter</span>
                    </button>
                  </div>

                  {config.texts.length === 0 ? (
                    <p className="text-[12px] lg:text-[11px] text-zinc-400">Aucun titre ajouté sur la composition.</p>
                  ) : (
                    <div className="space-y-2">
                      {config.texts.map((txt) => (
                        <div
                          key={txt.id}
                          onClick={() => setSelectedTextId(txt.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between ${
                            selectedTextId === txt.id ? 'bg-pms-accent-hover/40 border-pms-accent text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-300'
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
                      <div className="flex flex-wrap gap-1" role="group" aria-label="Police du texte">
                        {STUDIO_FONTS.map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => handleUpdateText(activeText.id, { fontFamily: f.id })}
                            aria-pressed={studioFontFamily(activeText.fontFamily) === f.family}
                            className={`min-h-[44px] lg:min-h-0 px-2 py-1 rounded-lg border text-[12px] lg:text-[11px] ${
                              studioFontFamily(activeText.fontFamily) === f.family
                                ? 'bg-pms-accent border-pms-accent text-white'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:text-white'
                            }`}
                            style={{ fontFamily: f.family }}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-zinc-950 border border-zinc-800" role="group" aria-label="Graisse">
                        {([
                          { id: 'medium', label: 'Normal' },
                          { id: 'bold', label: 'Gras' },
                          { id: '900', label: 'Très gras' },
                        ] as const).map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => handleUpdateText(activeText.id, { fontWeight: w.id })}
                            aria-pressed={activeText.fontWeight === w.id}
                            className={`min-h-[44px] lg:min-h-0 py-1 rounded-md text-[12px] lg:text-[11px] font-semibold ${
                              activeText.fontWeight === w.id ? 'bg-zinc-700 text-white' : 'text-zinc-400 hover:text-white'
                            }`}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
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
                          className="flex-1 accent-pms-accent"
                        />
                        <span className="text-xs font-mono text-zinc-400">{activeText.fontSize}px</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Logo Client / Watermark */}
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Logo Personnalisé</span>
                    <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="min-h-[44px] lg:min-h-0 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[12px] lg:text-[11px] font-bold flex items-center gap-1 transition-all"
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
                {/* Kit de marque de l'agence */}
                <BrandKitPanel userId={user?.id} onApply={handleApplyBrandKit} />

                {/* Technologies du site : utile aux développeurs seulement, donc rangé dans « Plus de réglages » */}
                {expertMode && (
                <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">Technologies du site</span>
                    <span className="text-[12px] lg:text-[10px] text-zinc-400">{selectedTechIds.length} sélectionnés</span>
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
                )}

              </div>
            )}

            {/* ══════════ ONGLET 5 : CALLOUTS DE VENTE & PREUVE SOCIALE ✨ ══════════ */}
            {activeTab === 'callouts' && (
              <div className="space-y-6 animate-fade-in">
                {/* 1. Badges de confiance (données réelles saisies par l'utilisateur) */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Badges de confiance</span>
                  </label>
                  <p className="text-[12px] lg:text-[11px] text-zinc-400 leading-relaxed">
                    Mettez en avant un résultat <strong className="text-zinc-200">réel</strong> du projet. Ajoutez un badge, puis remplacez le texte par vos vraies données. Faites-le glisser sur l&apos;image pour le placer.
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    {TRUST_BADGES.map((tb) => {
                      const existing = (config.socialBadges || []).find((b) => b.type === tb.type);
                      const isActive = !!existing?.visible;
                      return (
                        <button
                          key={tb.type}
                          type="button"
                          onClick={() => handleToggleSocialBadge(tb.type)}
                          aria-pressed={isActive}
                          className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                            isActive
                              ? 'bg-emerald-500/15 border-emerald-500/60 ring-1 ring-emerald-500/30'
                              : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
                          }`}
                          title={tb.hint}
                        >
                          <span className="text-[12px] lg:text-[11px] font-bold text-white flex items-center gap-1.5">
                            <span>{tb.icon}</span>
                            {tb.label}
                          </span>
                          <span className="text-[12px] lg:text-[9px] text-zinc-400 font-mono">{isActive ? '✓ Sur l\'image (cliquer pour retirer)' : '+ Ajouter'}</span>
                        </button>
                      );
                    })}
                  </div>

                  {(config.socialBadges || []).filter((b) => b.visible).length > 0 && (
                    <div className="space-y-2">
                      {(config.socialBadges || []).filter((b) => b.visible).map((b) => {
                        const tb = TRUST_BADGES.find((t) => t.type === b.type);
                        if (!tb) return null;
                        return (
                          <div key={b.id} className="flex items-center gap-2">
                            <span className="w-6 text-center text-sm" aria-hidden>{tb.icon}</span>
                            <input
                              type="text"
                              value={b.customText ?? ''}
                              onChange={(e) => handleUpdateSocialBadge(b.id, { customText: e.target.value })}
                              placeholder={tb.placeholder}
                              aria-label={`Texte du badge ${tb.label}`}
                              maxLength={48}
                              className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                            <button
                              type="button"
                              onClick={() => handleToggleSocialBadge(b.type)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                              title="Retirer ce badge"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Bulles d'annotations / Callouts de vente */}
                <div className="space-y-3 pt-4 border-t border-zinc-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Tag className="w-4 h-4 text-pms-accent-soft" />
                      <span>Bulles d&apos;explication</span>
                    </label>
                  </div>
                  <p className="text-[12px] lg:text-[11px] text-zinc-400 leading-relaxed">
                    Pointez une fonctionnalité du site directement sur l&apos;image pour l&apos;expliquer à votre client.
                  </p>

                  {/* Presets rapides en 1 clic */}
                  <div className="space-y-1.5">
                    <span className="text-[12px] lg:text-[10px] font-mono uppercase text-zinc-400">Exemples (modifiables) :</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddCallout('📱 Adapté au mobile', 'emerald')}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-medium text-emerald-400 hover:border-emerald-500/50 transition-all flex items-center gap-1.5"
                      >
                        <span>📱</span>
                        <span className="truncate">Adapté au mobile</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCallout('⚡ Chargement rapide', 'violet')}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-medium text-pms-accent-soft hover:border-pms-accent/50 transition-all flex items-center gap-1.5"
                      >
                        <span>⚡</span>
                        <span className="truncate">Chargement rapide</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCallout('💳 Paiement en ligne', 'amber')}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-medium text-amber-400 hover:border-amber-500/50 transition-all flex items-center gap-1.5"
                      >
                        <span>💳</span>
                        <span className="truncate">Paiement en ligne</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddCallout('🔒 Espace client sécurisé', 'blue')}
                        className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-left text-xs font-medium text-blue-400 hover:border-blue-500/50 transition-all flex items-center gap-1.5"
                      >
                        <span>🔒</span>
                        <span className="truncate">Espace sécurisé</span>
                      </button>
                    </div>
                  </div>

                  {/* Bouton création d'un callout personnalisé */}
                  <button
                    type="button"
                    onClick={() => handleAddCallout('Votre texte', 'violet')}
                    className="min-h-[44px] lg:min-h-0 w-full py-2.5 px-3 rounded-xl bg-pms-accent hover:bg-pms-accent text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Ajouter une bulle</span>
                  </button>

                  {/* Liste des callouts actifs pour édition */}
                  {(config.callouts || []).length > 0 && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[12px] lg:text-[10px] font-mono uppercase text-zinc-400">
                        Bulles sur l&apos;image ({(config.callouts || []).length}) :
                      </span>
                      <div className="space-y-2">
                        {(config.callouts || []).map((c) => (
                          <div
                            key={c.id}
                            className={`p-3 rounded-xl border bg-zinc-900 space-y-2.5 transition-all ${
                              selectedCalloutId === c.id
                                ? 'border-pms-accent ring-1 ring-pms-accent/30'
                                : 'border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={c.text}
                                onChange={(e) => handleUpdateCallout(c.id, { text: e.target.value })}
                                onFocus={() => setSelectedCalloutId(c.id)}
                                className="flex-1 px-2.5 py-1.5 bg-zinc-950 border border-zinc-750 rounded-lg text-xs text-white focus:outline-none focus:border-pms-accent font-medium"
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

                            <div className="flex items-center justify-between text-[12px] lg:text-[10px] font-mono text-zinc-400">
                              <span className="flex items-center gap-1.5">
                                <span>Couleur :</span>
                                <div className="flex gap-1">
                                  {(['violet', 'emerald', 'amber', 'blue', 'rose', 'dark'] as const).map((color) => {
                                    const colorMap: Record<string, string> = {
                                      violet: 'bg-pms-accent',
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
                                        onClick={() => handleUpdateCallout(c.id, { colorTheme: color })}
                                        className={`w-3.5 h-3.5 rounded-full ${colorMap[color]} transition-transform ${
                                          (c.colorTheme || c.color || 'violet') === color ? 'scale-125 ring-2 ring-white/60' : 'opacity-60 hover:opacity-100'
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
                                  className="bg-zinc-950 text-white border border-zinc-800 rounded px-1.5 py-0.5 text-[12px] lg:text-[10px] focus:outline-none"
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

                  <div className="p-3 rounded-xl bg-pms-accent/10 border border-pms-accent/20 text-[12px] lg:text-[11px] text-pms-accent-soft leading-relaxed flex items-start gap-2">
                    <span className="text-base leading-none">💡</span>
                    <span>
                      <strong>Astuce :</strong> faites glisser une bulle ou un badge directement sur l&apos;image pour le placer.
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
                {/* Les fonds d'abord : c'est ce qu'on vient chercher dans cet onglet */}
                {/* 4. Arrière-Plans (FrameCapture.PNG, Frame1.PNG, Frame2.PNG) */}
                <div className="space-y-4 pt-1">
                  <label className="text-xs font-bold text-zinc-300">
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
                          ? 'bg-pms-accent text-white border-pms-accent font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <div className="w-4 h-4 mx-auto mb-1 border border-zinc-600 rounded-xs bg-[linear-gradient(45deg,#444_25%,transparent_25%),linear-gradient(-45deg,#444_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#444_75%)] bg-[size:6px_6px]" />
                      <span className="text-[12px] lg:text-[10px] block truncate">Transp.</span>
                    </button>

                    {/* Couleur Unie */}
                    <label className="p-2 rounded-xl border text-center transition-all bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white cursor-pointer relative">
                      <Pipette className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                      <span className="text-[12px] lg:text-[10px] block truncate">Couleur</span>
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
                      <span className="text-[12px] lg:text-[10px] block truncate">Image</span>
                    </button>

                    {/* Flouté Web */}
                    <button
                      type="button"
                      onClick={() => setConfig((p) => ({ ...p, bgType: 'blurred-image', bgTransparent: false }))}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        config.bgType === 'blurred-image' && !config.bgTransparent
                          ? 'bg-pms-accent text-white border-pms-accent font-bold'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Flame className="w-4 h-4 mx-auto mb-1 text-pink-400" />
                      <span className="text-[12px] lg:text-[10px] block truncate">Flou Web</span>
                    </button>
                  </div>

                  <PhotoBackgroundsPanel
                    onApply={(bg) => setConfig((p) => ({ ...p, bgType: 'texture', bgValue: bg, bgTransparent: false }))}
                  />

                  {/* ── MAGIC ✨ (Généré par les couleurs réelles de la capture) ── */}
                  {autoGradients.length > 0 && !config.bgTransparent && (
                    <div className="p-3.5 rounded-2xl bg-zinc-900 border border-pms-accent/30 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-pms-accent-soft" />
                          <span className="text-xs font-bold text-white">Couleurs tirées du site</span>
                        </div>
                        <span className="text-[12px] lg:text-[10px] text-pms-accent-soft font-mono">Auto IA</span>
                      </div>
                      <p className="text-[12px] lg:text-[10px] text-zinc-400">
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
                              config.bgValue === grad.value ? 'ring-2 ring-pms-accent border-white' : 'border-zinc-700'
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
                        <span className="text-xs font-bold text-zinc-300">
                          Couleurs Unies
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAllSolidColors((v) => !v)}
                          className="text-[12px] lg:text-[10px] text-zinc-400 hover:text-white flex items-center gap-0.5"
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
                                ? 'ring-2 ring-pms-accent border-white scale-105'
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
                                <span className="px-1.5 py-0.2 rounded-md bg-pms-accent/30 border border-pms-accent/40 text-pms-accent-soft text-[12px] lg:text-[9px] font-bold">
                                  {cat.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[12px] lg:text-[10px] text-zinc-500 font-mono">
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
                                    ? 'ring-2 ring-pms-accent border-white shadow-lg'
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
                {/* Mes styles */}
                <SavedStylesPanel getCurrent={getCurrentStyle} onApply={applySavedStyle} />

                {/* 1. Format & Résolution du Canvas (Bouton Popover) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    Format & Dimensions du Canvas
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFrameSizePopover(true)}
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-800 hover:border-pms-accent/60 flex items-center justify-between transition-all group shadow-sm hover:bg-zinc-850"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-7 rounded-lg bg-zinc-950 border border-zinc-750 flex items-center justify-center text-[12px] lg:text-[10px] font-mono font-bold text-pms-accent-soft group-hover:border-pms-accent">
                        {currentFramePreset.ratioLabel}
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold text-white group-hover:text-pms-accent-soft transition-colors">
                          {currentFramePreset.name}
                        </div>
                        <div className="text-[12px] lg:text-[10px] text-zinc-500 font-mono">
                          {currentFramePreset.width} × {currentFramePreset.height} • {currentFramePreset.category}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400 group-hover:text-white">
                      <span className="text-[12px] lg:text-[10px] font-medium hidden sm:inline">Changer</span>
                      <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                    </div>
                  </button>
                </div>

                {expertMode && (<>
                {/* 2. Effets & Watermark (FrameCapture.PNG) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
                    Effets & Filigrane
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Portrait Blur */}
                    <button
                      type="button"
                      onClick={() => setPortraitBlur((v) => !v)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        portraitBlur
                          ? 'bg-pms-accent/20 border-pms-accent text-white ring-1 ring-pms-accent/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${portraitBlur ? 'bg-pms-accent text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                        <Camera className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Portrait</div>
                        <div className="text-[12px] lg:text-[10px] text-zinc-500">{portraitBlur ? 'Activé' : 'Flou de champ'}</div>
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
                        <div className="text-xs font-bold text-white">Filigrane</div>
                        <div className="text-[12px] lg:text-[10px] text-zinc-500">Logo de marque</div>
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
                          ? 'bg-pms-accent/20 border-pms-accent text-white ring-1 ring-pms-accent/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${(config.bgPattern || 'none') !== 'none' ? 'bg-pms-accent text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                        <Grid className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Effets de fond</div>
                        <div className="text-[12px] lg:text-[10px] text-zinc-500 capitalize">{config.bgPattern || 'Aucun'}</div>
                      </div>
                    </button>

                    {/* VFX Glow */}
                    <button
                      type="button"
                      onClick={() => setVfxGlow((v) => !v)}
                      className={`p-3 rounded-2xl border text-left flex items-center gap-2.5 transition-all ${
                        vfxGlow
                          ? 'bg-pms-accent/20 border-pms-accent text-white ring-1 ring-pms-accent/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-850'
                      }`}
                    >
                      <div className={`p-2 rounded-xl ${vfxGlow ? 'bg-pms-accent text-white' : 'bg-zinc-800 text-zinc-300'}`}>
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">Lueur</div>
                        <div className="text-[12px] lg:text-[10px] text-zinc-500">{vfxGlow ? 'Activé' : 'Halo doux'}</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 3. Scène & Ombres (Overlays Feuilles / Stores / Palmiers / Formes 3D) */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-300">
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
                          ? 'bg-pms-accent text-white border-pms-accent font-bold shadow-md'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <EyeOff className="w-4 h-4 mx-auto mb-1 opacity-70" />
                      <span className="text-[12px] lg:text-[11px] font-medium">Aucun</span>
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
                          ? 'bg-pms-accent text-white border-pms-accent font-bold shadow-md'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Sun className="w-4 h-4 mx-auto mb-1 text-amber-300" />
                      <span className="text-[12px] lg:text-[11px] font-medium capitalize">
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
                          ? 'bg-pms-accent text-white border-pms-accent font-bold shadow-md'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Layers className="w-4 h-4 mx-auto mb-1 text-pms-accent-soft" />
                      <span className="text-[12px] lg:text-[11px] font-medium">Formes 3D</span>
                    </button>
                  </div>
                </div>

                </>)}
              </div>
            )}

            {!expertMode && (
              <button
                type="button"
                onClick={toggleExpertMode}
                className="w-full min-h-[44px] p-3 rounded-xl border border-dashed border-zinc-700 text-[13px] text-zinc-300 hover:text-white hover:border-zinc-600 transition-colors"
              >
                Besoin de plus de réglages (ombres, style du navigateur, effets, badges…) ? <span className="font-bold text-pms-accent-soft">Afficher plus de réglages</span>
              </button>
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
        demo={user?.id === 'test-user-id-999'}
        screenshot={currentScreenshot}
      />

      {/* BANDEAU D'EXPORT : progression, fin ou erreur (la scène reste visible et utilisable) */}
      {(() => {
        const progress = isExportingVideo
          ? `Création ${videoAsGif ? 'du GIF' : 'de la vidéo'}… ${videoProgress}`
          : isExportingPack
            ? packProgress && packProgress !== 'Fait !' ? `Pack : fichier ${packProgress}` : 'Pack : préparation…'
            : isBuildingPdf
              ? 'Création du PDF…'
              : isExporting
                ? exportStep || 'Création de l’image…'
                : isCopying
                  ? 'Copie de l’image…'
                  : '';
        if (!progress && !exportNotice) return null;
        const tone = progress
          ? 'bg-zinc-900/95 border-pms-accent/40 text-zinc-100'
          : exportNotice?.kind === 'error'
            ? 'bg-rose-950/95 border-rose-500/50 text-rose-100'
            : 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100';
        return (
          <div
            role={exportNotice?.kind === 'error' && !progress ? 'alert' : 'status'}
            aria-live="polite"
            className={`fixed z-[140] left-1/2 -translate-x-1/2 bottom-4 sm:bottom-6 w-[calc(100%-2rem)] max-w-md px-4 py-3 rounded-2xl border shadow-2xl backdrop-blur-md flex items-start gap-3 text-sm ${tone}`}
          >
            {progress ? (
              <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 animate-spin text-pms-accent-soft" />
            ) : exportNotice?.kind === 'error' ? (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-rose-300" />
            ) : (
              <Check className="w-4 h-4 mt-0.5 shrink-0 text-emerald-300" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{progress || exportNotice?.text}</p>
              {progress && (
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isExportingVideo
                    ? 'Gardez cet onglet ouvert jusqu’à la fin de la création.'
                    : 'Le fichier se télécharge automatiquement à la fin.'}
                </p>
              )}
            </div>
            {!progress && (
              <button
                type="button"
                onClick={() => setExportNotice(null)}
                aria-label="Fermer le message"
                className="p-1 -m-1 rounded-lg opacity-70 hover:opacity-100"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        );
      })()}

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
          screenshot={currentScreenshot}
        />
      )}

      {/* BANNIÈRE CROSS-SELL POST-EXPORT */}
      {showCrossSellBanner && (
        <ExportCrossSellBanner
          onClose={closeCrossSellBanner}
          showUpgrade={isFreePlan}
          onOpenVideoExport={() => {
            setShowCrossSellBanner(false);
            handleExportVideo();
          }}
          onOpenOmniExport={() => {
            setShowCrossSellBanner(false);
            handleExportPack();
          }}
        />
      )}

      {/* VISITE GUIDÉE (premier lancement) */}
      {!presentationMode && <StudioTour />}

      {/* ACCORD POUR PAYER UN EXPORT EN CRÉDITS */}
      {creditOffer && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="credit-offer-title">
          <div className="w-full max-w-sm bg-[#0c0d14] border border-zinc-800 rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 id="credit-offer-title" className="text-sm font-bold text-white">
              Utiliser {creditOffer.cost} crédit{creditOffer.cost > 1 ? 's' : ''} ?
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {creditOffer.kind === 'video'
                ? 'La vidéo n\'est pas incluse dans votre forfait.'
                : creditOffer.kind === 'pack'
                ? 'Ce pack dépasse votre forfait.'
                : 'Cet export dépasse votre forfait.'}{' '}
              Il peut être payé avec vos crédits : il sera <strong className="text-zinc-200">sans filigrane</strong>.
              Solde actuel : <strong className="text-zinc-200">{creditOffer.balance}</strong>, après :{' '}
              <strong className="text-zinc-200">{creditOffer.balance - creditOffer.cost}</strong>.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => creditOffer.resolve(true)}
                className="flex-1 py-2 rounded-xl bg-pms-accent hover:bg-pms-accent text-white text-xs font-bold"
              >
                Utiliser mes crédits
              </button>
              <button
                type="button"
                onClick={() => creditOffer.resolve(false)}
                className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {showShare && (
        <ShareDialog
          loggedIn={!!user}
          demo={user?.id === 'test-user-id-999'}
          defaultTitle={captureItem.title || captureItem.domainName || 'Aperçu du site'}
          renderImage={async () => {
            // Même qualité et même filigrane qu'un export inclus dans le forfait
            const quality = canExportHd ? 'hd' : 'standard';
            const { width, height } = getExportSize(currentFramePreset, quality);
            const image = await renderSceneDataUrl('jpg', currentFramePreset, quality, !planWatermark);
            return { image, width, height };
          }}
          onClose={() => setShowShare(false)}
        />
      )}

      {showPresentation && (
        <PresentationDialog
          slides={presentationSlides}
          defaultTitle={`Proposition : ${captureItem.domainName || 'votre site'}`}
          userId={user?.id}
          generating={isBuildingPdf}
          onClose={() => setShowPresentation(false)}
          onRemove={(id) => setPresentationSlides((prev) => prev.filter((s) => s.id !== id))}
          onMove={moveSlide}
          onCaption={(id, caption) => setPresentationSlides((prev) => prev.map((s) => (s.id === id ? { ...s, caption } : s)))}
          onGenerate={handleGeneratePdf}
        />
      )}

      {/* MODALE UPSELL SELON LES QUOTAS */}
      <PlanUpsellModal
        isOpen={upsellModal.open}
        mode={upsellModal.mode}
        onClose={() => setUpsellModal((prev) => ({ ...prev, open: false }))}
        onAdRewarded={() => {
          // Bonus accordé par le serveur : le menu Exporter se rouvre pour relancer l'export
          setUpsellModal((prev) => ({ ...prev, open: false }));
          setShowExportMenu(true);
        }}
      />
    </div>
  );
};
