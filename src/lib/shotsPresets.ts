/**
 * Presets, Backgrounds, Ratios et Templates inspirés de Shots.so pour OmniMockup
 */

import { SceneAspectRatio, BrowserStylePreset, MockupType, SceneOverlayPreset } from '@/types/analyzer';

// ══ 1. COULEURS UNIES (32 nuances de Frame1.PNG) ══
export const SOLID_COLORS = [
  // Ligne 1: Nuances neutres claires à sombres
  '#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b', '#3f3f46',
  '#27272a', '#18181b', '#09090b', '#000000',
  // Ligne 2: Couleurs vives chaudes
  '#ff4d4f', '#ff7a45', '#ffa940', '#ffc53d', '#ffec3d', '#bae637', '#73d13d', '#52c41a',
  // Ligne 3: Pastels doux & terre
  '#ffccc7', '#ffe7ba', '#fff1b8', '#ffffb8', '#f6ffed', '#e6fffb', '#e6f7ff', '#f0f5ff',
  // Ligne 4: Teintes froides et profondes
  '#13c2c2', '#1890ff', '#2f54eb', '#722ed1', '#eb2f96', '#fa541c', '#fa8c16', '#faad14',
  // Ligne 5: Douceurs modernes (Lilas, rose poudré, menthe, lavande)
  '#d3adf7', '#ffadd2', '#b5f5ec', '#91caff', '#adc6ff', '#d3f261', '#ffd591', '#ffa39e',
];

// ══ 2. CATÉGORIES DE FONDS (Frame1.PNG & Frame2.PNG) ══
export interface BackgroundPreset {
  id: string;
  name: string;
  type: 'gradient' | 'glass' | 'cosmic' | 'mystic' | 'desktop' | 'abstract' | 'earth' | 'radiant' | 'texture';
  value: string;
  previewClass?: string;
  hasNoise?: boolean;
}

export const BACKGROUND_CATEGORIES: {
  id: string;
  name: string;
  badge?: string;
  presets: BackgroundPreset[];
}[] = [
  {
    id: 'gradient',
    name: 'Gradient',
    presets: [
      { id: 'grad-sonoma', name: 'Sonoma Sunset', type: 'gradient', value: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)' },
      { id: 'grad-violet-neon', name: 'Violet Pulse', type: 'gradient', value: 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)' },
      { id: 'grad-cotton', name: 'Cotton Candy', type: 'gradient', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
      { id: 'grad-ocean-dark', name: 'Ocean Twilight', type: 'gradient', value: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)' },
      { id: 'grad-aurora', name: 'Aurora Borealis', type: 'gradient', value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
      { id: 'grad-emerald', name: 'Lush Emerald', type: 'gradient', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
      { id: 'grad-amber', name: 'Amber Glow', type: 'gradient', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
      { id: 'grad-midnight', name: 'Midnight Deep', type: 'gradient', value: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)' },
    ],
  },
  {
    id: 'glass',
    name: 'Glass',
    badge: 'New',
    presets: [
      { id: 'glass-prism', name: 'Prismatic Blue', type: 'glass', value: 'radial-gradient(ellipse at top left, #3b82f6 0%, #1e1b4b 60%, #09090b 100%)' },
      { id: 'glass-amber', name: 'Refracted Gold', type: 'glass', value: 'radial-gradient(ellipse at bottom right, #f59e0b 0%, #b45309 40%, #1c1917 100%)' },
      { id: 'glass-fire', name: 'Iris Flame', type: 'glass', value: 'radial-gradient(circle at 50% 50%, #ef4444 0%, #f97316 40%, #450a0a 100%)' },
      { id: 'glass-cyan', name: 'Deep Specular', type: 'glass', value: 'radial-gradient(ellipse at 80% 20%, #06b6d4 0%, #0e7490 40%, #020617 100%)' },
    ],
  },
  {
    id: 'cosmic',
    name: 'Cosmic',
    presets: [
      { id: 'cosmic-nebula', name: 'Orion Nebula', type: 'cosmic', value: 'radial-gradient(ellipse at 50% 30%, #6366f1 0%, #3b0764 50%, #030712 100%)' },
      { id: 'cosmic-magenta', name: 'Deep Space Magenta', type: 'cosmic', value: 'radial-gradient(circle at 70% 70%, #ec4899 0%, #4c0519 45%, #050505 100%)' },
      { id: 'cosmic-eclipse', name: 'Solar Eclipse', type: 'cosmic', value: 'radial-gradient(circle at 50% 120%, #38bdf8 0%, #0f172a 50%, #020617 100%)' },
      { id: 'cosmic-void', name: 'Cosmic Violet Void', type: 'cosmic', value: 'radial-gradient(ellipse at 30% 20%, #a855f7 0%, #2e1065 50%, #09090b 100%)' },
    ],
  },
  {
    id: 'mystic',
    name: 'Mystic',
    presets: [
      { id: 'mystic-cloud-blue', name: 'Halo Azure', type: 'mystic', value: 'radial-gradient(circle at 50% 80%, #3b82f6 0%, #dbeafe 60%, #ffffff 100%)' },
      { id: 'mystic-sunset-haze', name: 'Velvet Haze', type: 'mystic', value: 'radial-gradient(circle at 50% 70%, #8b5cf6 0%, #fce7f3 65%, #ffffff 100%)' },
      { id: 'mystic-purple-rings', name: 'Ether Ripples', type: 'mystic', value: 'radial-gradient(circle at 50% 70%, #6366f1 0%, #e0e7ff 50%, #ffffff 100%)' },
      { id: 'mystic-shadow-aura', name: 'Obsidian Aura', type: 'mystic', value: 'radial-gradient(ellipse at 50% 80%, #4338ca 0%, #1e1b4b 60%, #0f172a 100%)' },
    ],
  },
  {
    id: 'desktop',
    name: 'Desktop Wallpapers',
    presets: [
      { id: 'dt-monterey', name: 'macOS Monterey Flow', type: 'desktop', value: 'linear-gradient(135deg, #2563eb 0%, #4338ca 35%, #6d28d9 70%, #0f172a 100%)' },
      { id: 'dt-sonoma-dark', name: 'macOS Sonoma Dark', type: 'desktop', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 70%, #030712 100%)' },
      { id: 'dt-lake-tahoe', name: 'Lake Emerald Horizon', type: 'desktop', value: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 40%, #0f766e 70%, #134e4a 100%)' },
      { id: 'dt-nordic-dusk', name: 'Nordic Coast Sunset', type: 'desktop', value: 'linear-gradient(180deg, #fda4af 0%, #fb7185 30%, #475569 70%, #0f172a 100%)' },
    ],
  },
  {
    id: 'abstract',
    name: 'Abstract',
    presets: [
      { id: 'abs-wave-purple', name: 'Liquid Silk Purple', type: 'abstract', value: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #2e1065 100%)' },
      { id: 'abs-dune-orange', name: 'Desert Wave Indigo', type: 'abstract', value: 'linear-gradient(135deg, #1e3a8a 0%, #ea580c 60%, #c2410c 100%)' },
      { id: 'abs-lava-flow', name: 'Lava Flow Dark', type: 'abstract', value: 'linear-gradient(135deg, #b91c1c 0%, #ea580c 40%, #78350f 70%, #0a0a0a 100%)' },
      { id: 'abs-dark-gold', name: 'Golden Ribbon Dark', type: 'abstract', value: 'linear-gradient(135deg, #d97706 0%, #78350f 50%, #1c1917 100%)' },
    ],
  },
  {
    id: 'earth',
    name: 'Earth & Nature',
    presets: [
      { id: 'earth-dune-white', name: 'White Sands Sky', type: 'earth', value: 'linear-gradient(180deg, #0284c7 0%, #38bdf8 45%, #f1f5f9 55%, #e2e8f0 100%)' },
      { id: 'earth-pastel-pink', name: 'Salton Pastel Dusk', type: 'earth', value: 'linear-gradient(180deg, #fbcfe8 0%, #f472b6 40%, #cbd5e1 70%, #e2e8f0 100%)' },
      { id: 'earth-sahara-gold', name: 'Sahara Sand Dunes', type: 'earth', value: 'linear-gradient(180deg, #bae6fd 0%, #fed7aa 40%, #f97316 75%, #9a3412 100%)' },
      { id: 'earth-desert-soft', name: 'Gobi Desert Soft', type: 'earth', value: 'linear-gradient(180deg, #e0f2fe 0%, #fef3c7 40%, #d97706 80%, #78350f 100%)' },
    ],
  },
  {
    id: 'radiant',
    name: 'Radiant Mesh',
    presets: [
      { id: 'rad-amethyst', name: 'Soft Amethyst Diffuse', type: 'radiant', value: 'radial-gradient(circle at 30% 30%, #ec4899 0%, #8b5cf6 50%, #ffffff 100%)' },
      { id: 'rad-ultramarine', name: 'Ultramarine Glow', type: 'radiant', value: 'radial-gradient(circle at 60% 40%, #3b82f6 0%, #6366f1 45%, #ffffff 100%)' },
      { id: 'rad-warm-coral', name: 'Warm Coral Light', type: 'radiant', value: 'radial-gradient(circle at 80% 40%, #f43f5e 0%, #fda4af 50%, #ffffff 100%)' },
      { id: 'rad-terracotta', name: 'Terracotta Diffusion', type: 'radiant', value: 'radial-gradient(circle at 40% 70%, #c2410c 0%, #fdba74 60%, #fafaf9 100%)' },
    ],
  },
  {
    id: 'texture',
    name: 'Texture & Materials',
    presets: [
      { id: 'tex-scandi-wood', name: 'Nordic Light Pine', type: 'texture', value: 'linear-gradient(135deg, #f5efe6 0%, #e8dfd3 50%, #dcd1c2 100%)' },
      { id: 'tex-birch', name: 'Bleached Wood Beam', type: 'texture', value: 'linear-gradient(90deg, #eae5dc 0%, #f7f4ee 40%, #e2dad0 100%)' },
      { id: 'tex-walnut', name: 'Dark Walnut Plank', type: 'texture', value: 'linear-gradient(180deg, #3f2e23 0%, #523e31 50%, #2e2017 100%)' },
      { id: 'tex-leather', name: 'Warm Saddle Leather', type: 'texture', value: 'radial-gradient(circle at 50% 50%, #78350f 0%, #451a03 70%, #290e02 100%)' },
    ],
  },
];

// ══ 3. FORMATS DE FRAME & RATIOS (Frame2Capture, Frame3Capture, Frame5Capture, Frame6Capture) ══
export interface FramePresetOption {
  id: string;
  category: 'Geometric' | 'Instagram' | 'Twitter' | 'YouTube' | 'Pinterest' | 'Dribbble' | 'App Store' | 'Custom';
  name: string;
  ratioLabel: string;
  ratioId: SceneAspectRatio;
  width: number;
  height: number;
  ratioClass: string;
  desc?: string;
}

export const FRAME_PRESETS: FramePresetOption[] = [
  // GÉOMÉTRIQUES
  { id: 'geo-16-9', category: 'Geometric', name: '16:9', ratioLabel: '16:9', ratioId: '16:9', width: 1920, height: 1080, ratioClass: 'aspect-[16/9]', desc: 'Écran large standard' },
  { id: 'geo-3-2', category: 'Geometric', name: '3:2', ratioLabel: '3:2', ratioId: '3:2', width: 1800, height: 1200, ratioClass: 'aspect-[3/2]', desc: 'Format photo reflex' },
  { id: 'geo-4-3', category: 'Geometric', name: 'Default 4:3', ratioLabel: '4:3', ratioId: '4:3', width: 1920, height: 1440, ratioClass: 'aspect-[4/3]', desc: 'Shots.so Default (1920 × 1440)' },
  { id: 'geo-5-4', category: 'Geometric', name: '5:4', ratioLabel: '5:4', ratioId: '5:4', width: 1500, height: 1200, ratioClass: 'aspect-[5/4]', desc: 'Format moniteur & print' },
  { id: 'geo-1-1', category: 'Geometric', name: '1:1', ratioLabel: '1:1', ratioId: '1:1', width: 1440, height: 1440, ratioClass: 'aspect-square', desc: 'Carré parfait' },
  { id: 'geo-4-5', category: 'Geometric', name: '4:5', ratioLabel: '4:5', ratioId: '4:5', width: 1200, height: 1500, ratioClass: 'aspect-[4/5]', desc: 'Portrait vertical équilibré' },
  { id: 'geo-3-4', category: 'Geometric', name: '3:4', ratioLabel: '3:4', ratioId: '3:4', width: 1200, height: 1600, ratioClass: 'aspect-[3/4]', desc: 'Format tablette & affiche' },
  { id: 'geo-2-3', category: 'Geometric', name: '2:3', ratioLabel: '2:3', ratioId: '2:3', width: 1200, height: 1800, ratioClass: 'aspect-[2/3]', desc: 'Portrait photo vertical' },
  { id: 'geo-9-16', category: 'Geometric', name: '9:16', ratioLabel: '9:16', ratioId: '9:16', width: 1080, height: 1920, ratioClass: 'aspect-[9/16]', desc: 'Mobile plein écran' },

  // INSTAGRAM
  { id: 'ig-post', category: 'Instagram', name: 'Post', ratioLabel: '1:1', ratioId: '1:1', width: 1080, height: 1080, ratioClass: 'aspect-square', desc: 'Feed carré Instagram' },
  { id: 'ig-portrait', category: 'Instagram', name: 'Portrait', ratioLabel: '4:5', ratioId: '4:5', width: 1080, height: 1350, ratioClass: 'aspect-[4/5]', desc: 'Feed vertical optimal Instagram' },
  { id: 'ig-story', category: 'Instagram', name: 'Story / Reel', ratioLabel: '9:16', ratioId: '9:16', width: 1080, height: 1920, ratioClass: 'aspect-[9/16]', desc: 'Stories & Reels plein écran' },

  // TWITTER / X
  { id: 'tw-tweet', category: 'Twitter', name: 'Tweet Image', ratioLabel: '16:9', ratioId: '16:9', width: 1200, height: 675, ratioClass: 'aspect-[16/9]', desc: 'Partage de post sur X / Twitter' },
  { id: 'tw-cover', category: 'Twitter', name: 'Header Cover', ratioLabel: '3:1', ratioId: '3:1', width: 1500, height: 500, ratioClass: 'aspect-[3/1]', desc: 'Bannière de profil X' },

  // YOUTUBE
  { id: 'yt-banner', category: 'YouTube', name: 'Banner', ratioLabel: '16:9', ratioId: '16:9', width: 2560, height: 1440, ratioClass: 'aspect-[16/9]', desc: 'Bannière de chaîne YouTube' },
  { id: 'yt-thumb', category: 'YouTube', name: 'Thumbnail', ratioLabel: '16:9', ratioId: '16:9', width: 1280, height: 720, ratioClass: 'aspect-[16/9]', desc: 'Miniature de vidéo 720p' },
  { id: 'yt-video', category: 'YouTube', name: 'Video 1080p', ratioLabel: '16:9', ratioId: '16:9', width: 1920, height: 1080, ratioClass: 'aspect-[16/9]', desc: 'Format vidéo Full HD standard' },

  // PINTEREST
  { id: 'pin-long', category: 'Pinterest', name: 'Long Pin', ratioLabel: '10:21', ratioId: '10:21', width: 1000, height: 2100, ratioClass: 'aspect-[10/21]', desc: 'Épingle longue Pinterest' },
  { id: 'pin-optimal', category: 'Pinterest', name: 'Optimal Pin', ratioLabel: '2:3', ratioId: '2:3', width: 1000, height: 1500, ratioClass: 'aspect-[2/3]', desc: 'Format recommandé Pinterest' },
  { id: 'pin-square', category: 'Pinterest', name: 'Square Pin', ratioLabel: '1:1', ratioId: '1:1', width: 1000, height: 1000, ratioClass: 'aspect-square', desc: 'Épingle carrée' },

  // DRIBBBLE
  { id: 'dribbble-shot', category: 'Dribbble', name: 'Dribbble Shot', ratioLabel: '4:3', ratioId: '4:3', width: 1600, height: 1200, ratioClass: 'aspect-[4/3]', desc: 'Format officiel Dribbble Pro' },

  // APP STORE
  { id: 'app-iphone-65', category: 'App Store', name: 'iPhone 6.5"', ratioLabel: '1284:2778', ratioId: '9:16', width: 1284, height: 2778, ratioClass: 'aspect-[1284/2778]', desc: 'iPhone Pro Max officiel App Store' },
  { id: 'app-iphone-55', category: 'App Store', name: 'iPhone 5.5"', ratioLabel: '1242:2208', ratioId: '9:16', width: 1242, height: 2208, ratioClass: 'aspect-[1242/2208]', desc: 'iPhone 8 Plus officiel' },
  { id: 'app-ipad-129', category: 'App Store', name: 'iPad Pro 12.9"', ratioLabel: '2048:2732', ratioId: '3:4', width: 2048, height: 2732, ratioClass: 'aspect-[2048/2732]', desc: 'iPad Pro officiel App Store' },
  { id: 'app-mac', category: 'App Store', name: 'MacBook', ratioLabel: '16:10', ratioId: 'libre', width: 1920, height: 1200, ratioClass: 'aspect-[16/10]', desc: 'Écran Mac 16:10 officiel' },
];

// ══ 4. TEMPLATES PRÉDÉFINIS INSPIRÉS DES CAPTURES ══
export interface StudioTemplate {
  id: string;
  category: 'promotion' | 'desktop' | 'shadow' | 'showcase';
  title: string;
  deviceLabel: string;
  mockupType: MockupType;
  layoutMode?: 'single' | 'dual-stacked';
  browserStyle?: BrowserStylePreset;
  bgType: 'solid' | 'gradient' | 'glass' | 'texture';
  bgValue: string;
  sceneOverlay?: SceneOverlayPreset;
  aspectRatio: SceneAspectRatio;
  mockupScale: number;
  mockupTiltX: number;
  mockupTiltY: number;
  mockupRotation: number;
  mockupX: number;
  mockupY: number;
  badge?: string;
  description: string;
}

export const TEMPLATES_CATALOG: StudioTemplate[] = [
  // ── PRODUCT PROMOTION (TemplateCapture.PNG) ──
  {
    id: 'tmpl-product-3d-framer',
    category: 'promotion',
    title: 'Framer 3D Perspective',
    deviceLabel: 'Screenshot',
    mockupType: 'flat',
    bgType: 'gradient',
    bgValue: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 60%, #3b82f6 100%)',
    aspectRatio: '16:9',
    mockupScale: 105,
    mockupTiltX: 18,
    mockupTiltY: -22,
    mockupRotation: 6,
    mockupX: -10,
    mockupY: 5,
    description: 'Perspective 3D dynamique et énergique avec dégradé bleu nuit',
  },
  {
    id: 'tmpl-product-ipad-halo',
    category: 'promotion',
    title: 'iPad Pro Studio Halo',
    deviceLabel: 'iPad Pro 13"',
    mockupType: 'ipad',
    bgType: 'gradient',
    bgValue: 'radial-gradient(circle at 75% 25%, #0284c7 0%, #0369a1 40%, #030712 100%)',
    aspectRatio: '16:9',
    mockupScale: 85,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'iPad Pro centré avec halo bleu royal et ombre de profondeur',
  },

  // ── REALISTIC DESKTOP (TemplateCapture.PNG) ──
  {
    id: 'tmpl-desktop-safari-dark',
    category: 'desktop',
    title: 'macOS Safari Dark Desert',
    deviceLabel: 'Browser Dark',
    mockupType: 'browser',
    browserStyle: 'safari-dark',
    bgType: 'gradient',
    bgValue: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)',
    aspectRatio: '4:3',
    mockupScale: 88,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Navigateur Safari sombre posé sur fond de dunes nocturnes',
  },
  {
    id: 'tmpl-desktop-safari-light',
    category: 'desktop',
    title: 'macOS Safari Light Horizon',
    deviceLabel: 'Browser Light',
    mockupType: 'browser',
    browserStyle: 'safari-light',
    bgType: 'gradient',
    bgValue: 'linear-gradient(135deg, #38bdf8 0%, #60a5fa 40%, #fdba74 80%, #fb923c 100%)',
    aspectRatio: '4:3',
    mockupScale: 88,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Safari clair et épuré avec dégradé chaud inspiré de Sonoma',
  },

  // ── SHADOW OVERLAYS (Templates1Capture.PNG & Template2Capture.PNG) ──
  {
    id: 'tmpl-shadow-iphone16-plus',
    category: 'shadow',
    title: 'iPhone 16 Plus Leaves',
    deviceLabel: 'iPhone 16 Plus',
    mockupType: 'iphone',
    bgType: 'solid',
    bgValue: '#d6cfc7',
    sceneOverlay: 'leaves',
    aspectRatio: '4:3',
    mockupScale: 80,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: -8,
    mockupX: -8,
    mockupY: 0,
    badge: 'Popular',
    description: 'Ombre naturelle de feuilles tropicales sur fond béton chaud',
  },
  {
    id: 'tmpl-shadow-iphone16-blinds',
    category: 'shadow',
    title: 'iPhone 16 Blinds Horizon',
    deviceLabel: 'iPhone 16',
    mockupType: 'iphone',
    bgType: 'solid',
    bgValue: '#e5e5e5',
    sceneOverlay: 'blinds',
    aspectRatio: '4:3',
    mockupScale: 80,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Ombre portée géométrique de stores vénitiens en plein soleil',
  },
  {
    id: 'tmpl-shadow-iphone-trio',
    category: 'shadow',
    title: 'iPhone 16 Trio Showcase',
    deviceLabel: 'iPhone 16 Pro Max (Trio)',
    mockupType: 'iphone',
    bgType: 'solid',
    bgValue: '#dcdcdc',
    sceneOverlay: 'palm',
    aspectRatio: '16:9',
    mockupScale: 75,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Scène de 3 écrans alignés sous des ombres de palmiers',
  },
  {
    id: 'tmpl-shadow-ipad-sunlight',
    category: 'shadow',
    title: 'iPad Pro 13 Window Light',
    deviceLabel: 'iPad Pro 13"',
    mockupType: 'ipad',
    bgType: 'solid',
    bgValue: '#cbbfae',
    sceneOverlay: 'window',
    aspectRatio: '4:3',
    mockupScale: 82,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Tablette posée sur une table sous la lumière d’une verrière',
  },

  // ── UI SHOWCASE (Templare3Capture.PNG & Template4Capture.PNG) ──
  {
    id: 'tmpl-ui-duo-clean-white',
    category: 'showcase',
    title: 'Clean Minimal Duo White',
    deviceLabel: 'iPhone 16 Duo',
    mockupType: 'iphone',
    layoutMode: 'dual-stacked',
    bgType: 'solid',
    bgValue: '#ffffff',
    aspectRatio: '4:3',
    mockupScale: 78,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    badge: 'Clean',
    description: 'Duo d’écrans mobiles épurés sur fond blanc immaculé',
  },
  {
    id: 'tmpl-ui-duo-floating-dark',
    category: 'showcase',
    title: 'Floating Perspective Duo',
    deviceLabel: 'iPhone 16 Duo 3D',
    mockupType: 'iphone',
    layoutMode: 'dual-stacked',
    bgType: 'solid',
    bgValue: '#09090b',
    aspectRatio: '4:3',
    mockupScale: 75,
    mockupTiltX: 20,
    mockupTiltY: -15,
    mockupRotation: 8,
    mockupX: 0,
    mockupY: 0,
    description: 'Deux téléphones flottant dans l’obscurité avec éclairage subtil',
  },
  {
    id: 'tmpl-ui-screenshot-minimal',
    category: 'showcase',
    title: 'Minimal Studio Card',
    deviceLabel: 'Screenshot',
    mockupType: 'flat',
    bgType: 'solid',
    bgValue: '#f4f4f5',
    aspectRatio: '4:3',
    mockupScale: 85,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Présentation épurée sur carte neutre avec ombres douces',
  },
];
