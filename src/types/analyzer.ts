export type MockupType = 'browser' | 'macbook' | 'iphone' | 'android' | 'ipad' | 'flat' | 'watch' | 'imac' | 'laptop';
/** Couleur du châssis des téléphones, tablettes et montres */
export type DeviceColor = 'graphite' | 'silver' | 'titanium' | 'midnight' | 'gold';
export type DeviceTheme = 'light' | 'dark';
export type DeviceStyle = 'default' | 'glass' | 'inset';
export type CornerRadius = 'sharp' | 'curved' | 'round';
export type ExportScale = 1 | 2 | 4;
export type SceneFilterType = 'none' | 'grain' | 'vhs' | 'glitch';
export type VideoAnimPreset = 'zoomIn' | 'zoomOut' | 'panHorizontal' | 'rotate3d' | 'riseIn' | 'scroll';

export type BrowserStylePreset = 'safari-light' | 'safari-dark' | 'chrome-light' | 'chrome-dark' | 'arc-light' | 'arc-dark';
export type ShadowPreset = 'none' | 'spread' | 'realistic' | 'adaptive';

export type SceneOverlayPreset = 'none' | 'blinds' | 'leaves' | 'palm' | 'window' | 'shapes';

export interface FeatureCallout {
  id: string;
  text: string;
  badge?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  pointerDirection?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  tailPosition?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  colorTheme?: 'violet' | 'emerald' | 'amber' | 'rose' | 'dark' | 'blue';
  color?: 'violet' | 'emerald' | 'amber' | 'rose' | 'dark' | 'blue';
}

export type SocialProofBadgeType =
  | 'product-hunt'
  | 'producthunt'
  | 'trustpilot'
  | 'stripe-mrr'
  | 'rating-stars'
  | 'uptime'
  | 'sla-enterprise';

export interface SceneSocialBadge {
  id: string;
  type: SocialProofBadgeType;
  customText?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  visible: boolean;
}

/** Annotation dessinée sur la scène (coordonnées en % de la scène) */
export interface SceneAnnotation {
  id: string;
  kind: 'arrow' | 'rect' | 'ellipse' | 'number' | 'blur' | 'loupe';
  x: number;
  y: number;
  /** Flèche : point d'arrivée */
  x2?: number;
  y2?: number;
  /** Cadre, cercle, flou : taille */
  w?: number;
  h?: number;
  color: string;
  /** Étape numérotée */
  label?: string;
  /** Loupe : point agrandi (en % de la capture) et niveau de zoom */
  srcX?: number;
  srcY?: number;
  zoom?: number;
}

export interface SceneConfig {
  aspectRatio: SceneAspectRatio;
  customWidth?: number;
  customHeight?: number;
  bgType: 'solid' | 'gradient' | 'blurred-image' | 'texture' | 'glass';
  bgValue: string;
  bgPattern?: 'none' | 'grid' | 'dots' | 'mesh' | 'noise';
  bgTransparent?: boolean;
  bgNoise?: boolean;
  sceneOverlay?: SceneOverlayPreset;
  portraitBlur?: boolean;
  vfxGlow?: boolean;
  uiScale?: number; // 50 to 150%
  windowFormat?: 'auto' | '16:9' | 'square' | 'fullscreen';
  mockupType: MockupType;
  deviceTheme?: DeviceTheme;
  deviceStyle?: DeviceStyle;
  browserStyle?: BrowserStylePreset;
  cornerRadius?: CornerRadius;
  cropOffsetY?: number; // Défilement vertical de la capture (0% = Haut, 100% = Bas)
  layoutMode?: 'single' | 'dual-stacked' | 'trio-ecosystem' | 'before-after';
  /** Avant / Après : libellés affichés au-dessus des deux écrans */
  beforeLabel?: string;
  afterLabel?: string;
  /** Couleur du châssis des téléphones, tablettes et montres */
  deviceColor?: DeviceColor;
  /** Téléphone utilisé en Duo / Trio */
  phoneModel?: 'iphone' | 'android';
  /** Écran des téléphones : version mobile capturée ou même image que l'ordinateur */
  phoneScreen?: 'mobile' | 'desktop';
  /** Annotations : flèches, cadres, étapes, zones floutées */
  annotations?: SceneAnnotation[];
  mockupX: number; // percentage offset -50 to 50
  mockupY: number; // percentage offset -50 to 50
  mockupScale: number; // 40 - 150
  mockupRotation: number; // Z-axis rotation -45 to +45
  mockupTiltX: number; // X-axis pitch -35 to +35
  mockupTiltY: number; // Y-axis yaw -35 to +35
  framePadding: number; // Padding percentage 0 to 60
  shadowEnabled: boolean;
  shadowType?: ShadowPreset;
  shadowIntensity: number; // 0 - 100
  lightAngle?: number; // 0 to 360 degrees
  exportScale?: ExportScale;
  filterType?: SceneFilterType;
  filterIntensity?: number; // 0 to 100
  customWatermarkUrl?: string; // Pour le plan Agence (marque blanche)
  texts: SceneTextLayer[];
  logos: SceneLogoLayer[];
  callouts?: FeatureCallout[];
  socialBadges?: SceneSocialBadge[];
}


export interface DiscoveredPage {
  id: string;
  url: string;
  path: string;
  title: string;
  source: 'sitemap' | 'html_crawl';
  badge?: string;
  depth?: number;
}

export interface AnalyzeResponse {
  success: boolean;
  targetUrl: string;
  domain: string;
  source: 'sitemap' | 'html_crawl';
  total: number;
  pages: DiscoveredPage[];
  executionTimeMs: number;
  error?: string;
}

export type ScanStatus = 'idle' | 'analyzing' | 'success' | 'error';

export interface SectionCoordinates {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DetectedSection {
  id: string;
  label: string;
  description?: string;
  visualAnalysis?: string;
  verdict?: 'excellent' | 'bon' | 'moyen' | 'faible';
  justification?: string;
  marketingScore?: number;
  coordinates: SectionCoordinates;
  qualityScore: number;
}

export interface SectionRecommendations {
  mobile: string[];
  desktop: string[];
  social: string[];
}

export interface SmartAnalyzeResponse {
  success: boolean;
  url: string;
  fullPageScreenshot: string; // Base64 PNG/JPEG
  screenshotWidth: number;
  screenshotHeight: number;
  sections: DetectedSection[];
  recommendations: SectionRecommendations;
  isFallback: boolean;
  fallbackMessage?: string;
  executionTimeMs: number;
  error?: string;
  quotaExceeded?: boolean;
  usageCount?: number;
  usageLimit?: number;
}

export interface CaptureTargetItem {
  url: string;
  clip?: SectionCoordinates;
  label?: string;
}

export interface CaptureItemResult {
  url: string;
  title?: string;
  domainName?: string;
  faviconUrl?: string;
  success: boolean;
  screenshotBase64?: string;
  error?: string;
  capturedAt: string;
  durationMs: number;
  mockup?: MockupType;
  clip?: SectionCoordinates;
}

export interface CaptureSettings {
  fullPage: boolean;
  hideBanners: boolean;
  viewportWidth: number;
  viewportHeight: number;
  deviceScaleFactor?: number;
  /** Attente avant la capture, en secondes */
  delaySeconds?: number;
  /** Capturer la version sombre du site */
  darkMode?: boolean;
}

export interface CaptureResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: CaptureItemResult[];
  totalExecutionTimeMs: number;
}

export type SceneAspectRatio =
  | '1:1'
  | '16:9'
  | 'libre'
  | '9:16'
  | '4:3'
  | '2:3'
  | '3:2'
  | '5:4'
  | '4:5'
  | '3:4'
  | '1.91:1'
  | '3:1'
  | '10:21'
  | 'custom';

export interface SceneTextLayer {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize: number; // px
  fontFamily: string;
  color: string;
  fontWeight: 'normal' | 'medium' | 'bold' | '900';
  align: 'left' | 'center' | 'right';
}

export interface SceneLogoLayer {
  id: string;
  src: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  width: number; // px
  opacity: number; // 0 to 1
}

