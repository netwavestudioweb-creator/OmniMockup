export type MockupType = 'browser' | 'macbook' | 'iphone' | 'ipad' | 'flat' | 'watch' | 'imac';

export type DeviceTheme = 'light' | 'dark';
export type DeviceStyle = 'default' | 'glass' | 'inset';
export type CornerRadius = 'sharp' | 'curved' | 'round';
export type ExportScale = 1 | 2 | 4;
export type SceneFilterType = 'none' | 'grain' | 'vhs' | 'glitch';
export type VideoAnimPreset = 'zoomIn' | 'zoomOut' | 'panHorizontal';

export interface SceneConfig {
  aspectRatio: SceneAspectRatio;
  bgType: 'solid' | 'gradient' | 'blurred-image';
  bgValue: string;
  bgPattern?: 'none' | 'grid' | 'dots' | 'mesh' | 'noise';
  bgTransparent?: boolean;
  bgNoise?: boolean;
  mockupType: MockupType;
  deviceTheme?: DeviceTheme;
  deviceStyle?: DeviceStyle;
  cornerRadius?: CornerRadius;
  layoutMode?: 'single' | 'dual-stacked';
  mockupX: number; // percentage offset -50 to 50
  mockupY: number; // percentage offset -50 to 50
  mockupScale: number; // 40 - 150
  mockupRotation: number; // Z-axis rotation -45 to +45
  mockupTiltX: number; // X-axis pitch -35 to +35
  mockupTiltY: number; // Y-axis yaw -35 to +35
  framePadding: number; // Padding percentage 0 to 60
  shadowEnabled: boolean;
  shadowIntensity: number; // 0 - 100
  exportScale?: ExportScale;
  filterType?: SceneFilterType;
  filterIntensity?: number; // 0 to 100
  customWatermarkUrl?: string; // Pour le plan Agence (marque blanche)
  texts: SceneTextLayer[];
  logos: SceneLogoLayer[];
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

export interface CaptureResponse {
  success: boolean;
  total: number;
  successful: number;
  failed: number;
  results: CaptureItemResult[];
  totalExecutionTimeMs: number;
}

export type SceneAspectRatio = '1:1' | '16:9' | 'libre' | '9:16' | '4:3' | '2:3' | '1.91:1';

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

