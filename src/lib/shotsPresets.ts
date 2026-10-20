/**
 * Presets, Backgrounds, Ratios et Templates inspirés de Shots.so pour PitchMySite
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
    name: 'Dégradés',
    presets: [
      { id: 'grad-sonoma', name: 'Coucher de soleil', type: 'gradient', value: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)' },
      { id: 'grad-violet-neon', name: 'Violet vif', type: 'gradient', value: 'linear-gradient(135deg, #7928ca 0%, #ff0080 100%)' },
      { id: 'grad-cotton', name: 'Barbe à papa', type: 'gradient', value: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)' },
      { id: 'grad-ocean-dark', name: 'Océan au crépuscule', type: 'gradient', value: 'linear-gradient(135deg, #13547a 0%, #80d0c7 100%)' },
      { id: 'grad-aurora', name: 'Aurore boréale', type: 'gradient', value: 'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)' },
      { id: 'grad-emerald', name: 'Émeraude', type: 'gradient', value: 'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)' },
      { id: 'grad-amber', name: 'Ambre', type: 'gradient', value: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)' },
      { id: 'grad-midnight', name: 'Nuit profonde', type: 'gradient', value: 'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)' },
    ],
  },
  {
    id: 'glass',
    name: 'Verre',
    badge: 'New',
    presets: [
      { id: 'glass-prism', name: 'Bleu prisme', type: 'glass', value: 'radial-gradient(ellipse at top left, #3b82f6 0%, #1e1b4b 60%, #09090b 100%)' },
      { id: 'glass-amber', name: 'Or', type: 'glass', value: 'radial-gradient(ellipse at bottom right, #f59e0b 0%, #b45309 40%, #1c1917 100%)' },
      { id: 'glass-fire', name: 'Iris', type: 'glass', value: 'radial-gradient(circle at 50% 50%, #ef4444 0%, #f97316 40%, #450a0a 100%)' },
      { id: 'glass-cyan', name: 'Reflet sombre', type: 'glass', value: 'radial-gradient(ellipse at 80% 20%, #06b6d4 0%, #0e7490 40%, #020617 100%)' },
    ],
  },
  {
    id: 'cosmic',
    name: 'Cosmos',
    presets: [
      { id: 'cosmic-nebula', name: 'Nébuleuse', type: 'cosmic', value: 'radial-gradient(ellipse at 50% 30%, #6366f1 0%, #3b0764 50%, #030712 100%)' },
      { id: 'cosmic-magenta', name: 'Espace magenta', type: 'cosmic', value: 'radial-gradient(circle at 70% 70%, #ec4899 0%, #4c0519 45%, #050505 100%)' },
      { id: 'cosmic-eclipse', name: 'Éclipse', type: 'cosmic', value: 'radial-gradient(circle at 50% 120%, #38bdf8 0%, #0f172a 50%, #020617 100%)' },
      { id: 'cosmic-void', name: 'Espace violet', type: 'cosmic', value: 'radial-gradient(ellipse at 30% 20%, #a855f7 0%, #2e1065 50%, #09090b 100%)' },
    ],
  },
  {
    id: 'mystic',
    name: 'Mystère',
    presets: [
      { id: 'mystic-cloud-blue', name: 'Halo bleu', type: 'mystic', value: 'radial-gradient(circle at 50% 80%, #3b82f6 0%, #dbeafe 60%, #ffffff 100%)' },
      { id: 'mystic-sunset-haze', name: 'Brume de velours', type: 'mystic', value: 'radial-gradient(circle at 50% 70%, #8b5cf6 0%, #fce7f3 65%, #ffffff 100%)' },
      { id: 'mystic-purple-rings', name: 'Ondulations', type: 'mystic', value: 'radial-gradient(circle at 50% 70%, #6366f1 0%, #e0e7ff 50%, #ffffff 100%)' },
      { id: 'mystic-shadow-aura', name: 'Obsidienne', type: 'mystic', value: 'radial-gradient(ellipse at 50% 80%, #4338ca 0%, #1e1b4b 60%, #0f172a 100%)' },
    ],
  },
  {
    id: 'desktop',
    name: "Fonds d'écran",
    presets: [
      { id: 'dt-monterey', name: 'Vagues claires', type: 'desktop', value: 'linear-gradient(135deg, #2563eb 0%, #4338ca 35%, #6d28d9 70%, #0f172a 100%)' },
      { id: 'dt-sonoma-dark', name: 'Vagues sombres', type: 'desktop', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 30%, #4c1d95 70%, #030712 100%)' },
      { id: 'dt-lake-tahoe', name: 'Lac émeraude', type: 'desktop', value: 'linear-gradient(180deg, #38bdf8 0%, #0284c7 40%, #0f766e 70%, #134e4a 100%)' },
      { id: 'dt-nordic-dusk', name: 'Côte au couchant', type: 'desktop', value: 'linear-gradient(180deg, #fda4af 0%, #fb7185 30%, #475569 70%, #0f172a 100%)' },
    ],
  },
  {
    id: 'abstract',
    name: 'Abstraits',
    presets: [
      { id: 'abs-wave-purple', name: 'Soie violette', type: 'abstract', value: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 40%, #2e1065 100%)' },
      { id: 'abs-dune-orange', name: 'Dune indigo', type: 'abstract', value: 'linear-gradient(135deg, #1e3a8a 0%, #ea580c 60%, #c2410c 100%)' },
      { id: 'abs-lava-flow', name: 'Lave', type: 'abstract', value: 'linear-gradient(135deg, #b91c1c 0%, #ea580c 40%, #78350f 70%, #0a0a0a 100%)' },
      { id: 'abs-dark-gold', name: 'Ruban doré', type: 'abstract', value: 'linear-gradient(135deg, #d97706 0%, #78350f 50%, #1c1917 100%)' },
    ],
  },
  {
    id: 'earth',
    name: 'Terre et nature',
    presets: [
      { id: 'earth-dune-white', name: 'Sable blanc', type: 'earth', value: 'linear-gradient(180deg, #0284c7 0%, #38bdf8 45%, #f1f5f9 55%, #e2e8f0 100%)' },
      { id: 'earth-pastel-pink', name: 'Crépuscule pastel', type: 'earth', value: 'linear-gradient(180deg, #fbcfe8 0%, #f472b6 40%, #cbd5e1 70%, #e2e8f0 100%)' },
      { id: 'earth-sahara-gold', name: 'Dunes du Sahara', type: 'earth', value: 'linear-gradient(180deg, #bae6fd 0%, #fed7aa 40%, #f97316 75%, #9a3412 100%)' },
      { id: 'earth-desert-soft', name: 'Désert doux', type: 'earth', value: 'linear-gradient(180deg, #e0f2fe 0%, #fef3c7 40%, #d97706 80%, #78350f 100%)' },
    ],
  },
  {
    id: 'radiant',
    name: 'Halos de couleur',
    presets: [
      { id: 'rad-amethyst', name: 'Améthyste', type: 'radiant', value: 'radial-gradient(circle at 30% 30%, #ec4899 0%, #8b5cf6 50%, #ffffff 100%)' },
      { id: 'rad-ultramarine', name: 'Outremer', type: 'radiant', value: 'radial-gradient(circle at 60% 40%, #3b82f6 0%, #6366f1 45%, #ffffff 100%)' },
      { id: 'rad-warm-coral', name: 'Corail', type: 'radiant', value: 'radial-gradient(circle at 80% 40%, #f43f5e 0%, #fda4af 50%, #ffffff 100%)' },
      { id: 'rad-terracotta', name: 'Terre cuite', type: 'radiant', value: 'radial-gradient(circle at 40% 70%, #c2410c 0%, #fdba74 60%, #fafaf9 100%)' },
    ],
  },
  {
    id: 'texture',
    name: 'Matières',
    presets: [
      { id: 'tex-scandi-wood', name: 'Pin clair', type: 'texture', value: 'linear-gradient(135deg, #f5efe6 0%, #e8dfd3 50%, #dcd1c2 100%)' },
      { id: 'tex-birch', name: 'Bois blanchi', type: 'texture', value: 'linear-gradient(90deg, #eae5dc 0%, #f7f4ee 40%, #e2dad0 100%)' },
      { id: 'tex-walnut', name: 'Noyer', type: 'texture', value: 'linear-gradient(180deg, #3f2e23 0%, #523e31 50%, #2e2017 100%)' },
      { id: 'tex-leather', name: 'Cuir', type: 'texture', value: 'radial-gradient(circle at 50% 50%, #78350f 0%, #451a03 70%, #290e02 100%)' },
    ],
  },
];

// ══ 3. FORMATS DE FRAME & RATIOS (Frame2Capture, Frame3Capture, Frame5Capture, Frame6Capture) ══
export interface FramePresetOption {
  id: string;
  category: 'Geometric' | 'Instagram' | 'LinkedIn' | 'Twitter' | 'YouTube' | 'Pinterest' | 'Dribbble' | 'App Store' | 'Custom';
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
  { id: 'geo-4-3', category: 'Geometric', name: '4:3', ratioLabel: '4:3', ratioId: '4:3', width: 1920, height: 1440, ratioClass: 'aspect-[4/3]', desc: 'Shots.so Default (1920 × 1440)' },
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

  // LINKEDIN
  { id: 'li-post', category: 'LinkedIn', name: 'Post lien', ratioLabel: '1.91:1', ratioId: '1.91:1', width: 1200, height: 627, ratioClass: 'aspect-[1200/627]', desc: 'Image de partage LinkedIn' },
  { id: 'li-square', category: 'LinkedIn', name: 'Post carré', ratioLabel: '1:1', ratioId: '1:1', width: 1200, height: 1200, ratioClass: 'aspect-square', desc: 'Publication carrée LinkedIn' },

  // TWITTER / X
  { id: 'tw-tweet', category: 'Twitter', name: 'Image de tweet', ratioLabel: '16:9', ratioId: '16:9', width: 1200, height: 675, ratioClass: 'aspect-[16/9]', desc: 'Partage de post sur X / Twitter' },
  { id: 'tw-cover', category: 'Twitter', name: 'Bannière de profil', ratioLabel: '3:1', ratioId: '3:1', width: 1500, height: 500, ratioClass: 'aspect-[3/1]', desc: 'Bannière de profil X' },

  // YOUTUBE
  { id: 'yt-banner', category: 'YouTube', name: 'Bannière', ratioLabel: '16:9', ratioId: '16:9', width: 2560, height: 1440, ratioClass: 'aspect-[16/9]', desc: 'Bannière de chaîne YouTube' },
  { id: 'yt-thumb', category: 'YouTube', name: 'Miniature', ratioLabel: '16:9', ratioId: '16:9', width: 1280, height: 720, ratioClass: 'aspect-[16/9]', desc: 'Miniature de vidéo 720p' },
  { id: 'yt-video', category: 'YouTube', name: 'Vidéo 1080p', ratioLabel: '16:9', ratioId: '16:9', width: 1920, height: 1080, ratioClass: 'aspect-[16/9]', desc: 'Format vidéo Full HD standard' },

  // PINTEREST
  { id: 'pin-long', category: 'Pinterest', name: 'Épingle longue', ratioLabel: '10:21', ratioId: '10:21', width: 1000, height: 2100, ratioClass: 'aspect-[10/21]', desc: 'Épingle longue Pinterest' },
  { id: 'pin-optimal', category: 'Pinterest', name: 'Épingle conseillée', ratioLabel: '2:3', ratioId: '2:3', width: 1000, height: 1500, ratioClass: 'aspect-[2/3]', desc: 'Format recommandé Pinterest' },
  { id: 'pin-square', category: 'Pinterest', name: 'Épingle carrée', ratioLabel: '1:1', ratioId: '1:1', width: 1000, height: 1000, ratioClass: 'aspect-square', desc: 'Épingle carrée' },

  // DRIBBBLE
  { id: 'dribbble-shot', category: 'Dribbble', name: 'Visuel Dribbble', ratioLabel: '4:3', ratioId: '4:3', width: 1600, height: 1200, ratioClass: 'aspect-[4/3]', desc: 'Format officiel Dribbble Pro' },

  // APP STORE & GOOGLE PLAY — tailles officielles (vérifiées le 10/10/2026 sur les pages d'Apple et de Google)
  { id: 'app-iphone-63', category: 'App Store', name: 'iPhone 6,3"', ratioLabel: '1206:2622', ratioId: '9:16', width: 1206, height: 2622, ratioClass: 'aspect-[1206/2622]', desc: 'iPhone 14 Pro à 17 : taille obligatoire sur l’App Store' },
  { id: 'app-iphone-69', category: 'App Store', name: 'iPhone 6,9"', ratioLabel: '1320:2868', ratioId: '9:16', width: 1320, height: 2868, ratioClass: 'aspect-[1320/2868]', desc: 'iPhone Pro Max récents (App Store)' },
  { id: 'app-iphone-65', category: 'App Store', name: 'iPhone 6,5"', ratioLabel: '1284:2778', ratioId: '9:16', width: 1284, height: 2778, ratioClass: 'aspect-[1284/2778]', desc: 'iPhone 11 Pro Max à 14 Plus (App Store)' },
  { id: 'app-ipad-129', category: 'App Store', name: 'iPad 13"', ratioLabel: '2048:2732', ratioId: '3:4', width: 2048, height: 2732, ratioClass: 'aspect-[2048/2732]', desc: 'iPad 13 pouces (App Store, obligatoire pour les apps iPad)' },
  { id: 'app-mac', category: 'App Store', name: 'Mac', ratioLabel: '16:10', ratioId: 'libre', width: 2880, height: 1800, ratioClass: 'aspect-[16/10]', desc: 'Mac App Store (2880 × 1800)' },
  { id: 'play-phone', category: 'App Store', name: 'Play téléphone', ratioLabel: '9:16', ratioId: '9:16', width: 1080, height: 1920, ratioClass: 'aspect-[9/16]', desc: 'Google Play : capture téléphone 1080 × 1920' },
  { id: 'play-tablet', category: 'App Store', name: 'Play tablette', ratioLabel: '9:16', ratioId: '9:16', width: 1440, height: 2560, ratioClass: 'aspect-[9/16]', desc: 'Google Play : capture tablette 1440 × 2560' },
  { id: 'play-feature', category: 'App Store', name: 'Play bannière', ratioLabel: '1024:500', ratioId: 'libre', width: 1024, height: 500, ratioClass: 'aspect-[1024/500]', desc: 'Google Play : image de présentation 1024 × 500' },
];

// ══ 4. MODÈLES PRÊTS À L'EMPLOI, CLASSÉS PAR USAGE ══
// Chaque modèle règle d'un coup l'appareil, le fond, l'angle et le format exact du réseau visé.
export interface StudioTemplate {
  id: string;
  category: 'linkedin' | 'instagram' | 'statut' | 'proposition' | 'portfolio';
  title: string;
  deviceLabel: string;
  mockupType: MockupType;
  layoutMode?: 'single' | 'dual-stacked' | 'trio-ecosystem';
  browserStyle?: BrowserStylePreset;
  bgType: 'solid' | 'gradient' | 'glass' | 'texture';
  bgValue: string;
  sceneOverlay?: SceneOverlayPreset;
  aspectRatio: SceneAspectRatio;
  /** Format exact (ex. « li-post » = 1200 × 627 pour LinkedIn) ; sinon le premier format du même ratio */
  framePresetId?: string;
  mockupScale: number;
  mockupTiltX: number;
  mockupTiltY: number;
  mockupRotation: number;
  mockupX: number;
  mockupY: number;
  badge?: string;
  description: string;
}

export const TEMPLATE_CATEGORIES: { id: StudioTemplate['category']; label: string; hint: string }[] = [
  { id: 'linkedin', label: 'Post LinkedIn', hint: '1200 × 627, le format des liens partagés' },
  { id: 'instagram', label: 'Instagram', hint: 'Carré 1080 × 1080 et portrait 1080 × 1350' },
  { id: 'statut', label: 'Statut WhatsApp et Story', hint: 'Vertical 1080 × 1920' },
  { id: 'proposition', label: 'Proposition commerciale', hint: '16:9, pour un PDF ou une présentation' },
  { id: 'portfolio', label: 'Portfolio', hint: '4:3, pour votre site ou Behance' },
];

export const TEMPLATES_CATALOG: StudioTemplate[] = [
  // ── POST LINKEDIN ──
  {
    id: 'tmpl-li-duo-nuit',
    category: 'linkedin',
    title: 'Ordinateur et téléphone',
    deviceLabel: 'MacBook + iPhone 18 Pro',
    mockupType: 'macbook',
    layoutMode: 'dual-stacked',
    bgType: 'gradient',
    bgValue: 'linear-gradient(135deg, #0b0a1f 0%, #1e1b4b 55%, #4c1d95 100%)',
    aspectRatio: '1.91:1',
    framePresetId: 'li-post',
    mockupScale: 86,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    badge: 'Conseillé',
    description: 'Votre site sur ordinateur et sur téléphone : montre qu’il est pensé pour les deux',
  },
  {
    id: 'tmpl-li-safari-clair',
    category: 'linkedin',
    title: 'Navigateur clair',
    deviceLabel: 'Safari clair',
    mockupType: 'browser',
    browserStyle: 'safari-light',
    bgType: 'gradient',
    bgValue: 'linear-gradient(135deg, #e0f2fe 0%, #ede9fe 55%, #fce7f3 100%)',
    aspectRatio: '1.91:1',
    framePresetId: 'li-post',
    mockupScale: 84,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 4,
    description: 'Sobre et lumineux, se lit bien dans le fil d’actualité',
  },

  // ── INSTAGRAM ──
  {
    id: 'tmpl-ig-iphone-feuilles',
    category: 'instagram',
    title: 'iPhone sous les feuilles',
    deviceLabel: 'iPhone 18 Pro',
    mockupType: 'iphone',
    bgType: 'solid',
    bgValue: '#d6cfc7',
    sceneOverlay: 'leaves',
    aspectRatio: '1:1',
    framePresetId: 'ig-post',
    mockupScale: 80,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: -6,
    mockupX: 0,
    mockupY: 0,
    badge: 'Populaire',
    description: 'Ombre naturelle de feuilles sur fond béton chaud',
  },
  {
    id: 'tmpl-ig-navigateur-3d',
    category: 'instagram',
    title: 'Navigateur en perspective',
    deviceLabel: 'Navigateur 3D',
    mockupType: 'browser',
    browserStyle: 'safari-dark',
    bgType: 'gradient',
    bgValue: 'linear-gradient(135deg, #09090b 0%, #1e1b4b 60%, #3b82f6 100%)',
    aspectRatio: '1:1',
    framePresetId: 'ig-post',
    mockupScale: 92,
    mockupTiltX: 14,
    mockupTiltY: -18,
    mockupRotation: 4,
    mockupX: 0,
    mockupY: 0,
    description: 'Perspective dynamique sur dégradé bleu nuit',
  },
  {
    id: 'tmpl-ig-portrait-stores',
    category: 'instagram',
    title: 'Portrait, lumière de fenêtre',
    deviceLabel: 'iPhone 18 Pro',
    mockupType: 'iphone',
    bgType: 'solid',
    bgValue: '#e7e5e4',
    sceneOverlay: 'blinds',
    aspectRatio: '4:5',
    framePresetId: 'ig-portrait',
    mockupScale: 78,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Ombre de stores en plein soleil, format qui prend le plus de place dans le fil',
  },

  // ── STATUT WHATSAPP ET STORY ──
  {
    id: 'tmpl-statut-iphone-violet',
    category: 'statut',
    title: 'iPhone centré',
    deviceLabel: 'iPhone 18 Pro',
    mockupType: 'iphone',
    bgType: 'gradient',
    bgValue: 'linear-gradient(180deg, #1e1b4b 0%, #6d28d9 60%, #c026d3 100%)',
    aspectRatio: '9:16',
    framePresetId: 'ig-story',
    mockupScale: 78,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    badge: 'Conseillé',
    description: 'Le site plein écran dans un iPhone : idéal pour un statut WhatsApp',
  },
  {
    id: 'tmpl-statut-iphone-sable',
    category: 'statut',
    title: 'iPhone incliné, fond sable',
    deviceLabel: 'iPhone 18 Pro',
    mockupType: 'iphone',
    bgType: 'gradient',
    bgValue: 'linear-gradient(180deg, #f5efe6 0%, #e7dccb 100%)',
    sceneOverlay: 'palm',
    aspectRatio: '9:16',
    framePresetId: 'ig-story',
    mockupScale: 76,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: -8,
    mockupX: 0,
    mockupY: 0,
    description: 'Ambiance douce et chaleureuse avec ombre de palmier',
  },

  // ── PROPOSITION COMMERCIALE ──
  {
    id: 'tmpl-prop-trio',
    category: 'proposition',
    title: 'Trio ordinateur, tablette, téléphone',
    deviceLabel: 'MacBook + iPad + iPhone 18 Pro',
    mockupType: 'macbook',
    layoutMode: 'trio-ecosystem',
    bgType: 'gradient',
    bgValue: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
    aspectRatio: '16:9',
    framePresetId: 'geo-16-9',
    mockupScale: 88,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    badge: 'Conseillé',
    description: 'Prouve au client que son site s’adapte à tous les écrans',
  },
  {
    id: 'tmpl-prop-macbook-perspective',
    category: 'proposition',
    title: 'MacBook en perspective',
    deviceLabel: 'MacBook Pro',
    mockupType: 'macbook',
    bgType: 'gradient',
    bgValue: 'radial-gradient(circle at 70% 30%, #4c1d95 0%, #1e1b4b 45%, #09090b 100%)',
    aspectRatio: '16:9',
    framePresetId: 'geo-16-9',
    mockupScale: 86,
    mockupTiltX: 10,
    mockupTiltY: -16,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 2,
    description: 'Rendu haut de gamme sur fond sombre, pour la page de couverture',
  },
  {
    id: 'tmpl-prop-ipad-halo',
    category: 'proposition',
    title: 'iPad avec halo bleu',
    deviceLabel: 'iPad Pro 13"',
    mockupType: 'ipad',
    bgType: 'gradient',
    bgValue: 'radial-gradient(circle at 75% 25%, #0284c7 0%, #0369a1 40%, #030712 100%)',
    aspectRatio: '16:9',
    framePresetId: 'geo-16-9',
    mockupScale: 85,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Tablette centrée avec un halo bleu et une ombre de profondeur',
  },

  // ── PORTFOLIO ──
  {
    id: 'tmpl-pf-safari-sombre',
    category: 'portfolio',
    title: 'Safari sombre',
    deviceLabel: 'Safari sombre',
    mockupType: 'browser',
    browserStyle: 'safari-dark',
    bgType: 'gradient',
    bgValue: 'linear-gradient(180deg, #1e1b4b 0%, #312e81 40%, #0f172a 100%)',
    aspectRatio: '4:3',
    framePresetId: 'geo-4-3',
    mockupScale: 88,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Navigateur sombre sur dégradé nuit',
  },
  {
    id: 'tmpl-pf-safari-clair',
    category: 'portfolio',
    title: 'Safari clair, dégradé chaud',
    deviceLabel: 'Safari clair',
    mockupType: 'browser',
    browserStyle: 'safari-light',
    bgType: 'gradient',
    bgValue: 'linear-gradient(135deg, #38bdf8 0%, #60a5fa 40%, #fdba74 80%, #fb923c 100%)',
    aspectRatio: '4:3',
    framePresetId: 'geo-4-3',
    mockupScale: 88,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Clair et épuré, couleurs chaudes',
  },
  {
    id: 'tmpl-pf-carte-minimale',
    category: 'portfolio',
    title: 'Carte minimaliste',
    deviceLabel: 'Capture seule',
    mockupType: 'flat',
    bgType: 'solid',
    bgValue: '#f4f4f5',
    aspectRatio: '4:3',
    framePresetId: 'geo-4-3',
    mockupScale: 85,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'La page seule, sur une carte neutre avec ombre douce',
  },
  {
    id: 'tmpl-pf-iphone-duo-blanc',
    category: 'portfolio',
    title: 'Duo sur fond blanc',
    deviceLabel: 'MacBook + iPhone 18 Pro',
    mockupType: 'macbook',
    layoutMode: 'dual-stacked',
    bgType: 'solid',
    bgValue: '#ffffff',
    aspectRatio: '4:3',
    framePresetId: 'geo-4-3',
    mockupScale: 80,
    mockupTiltX: 0,
    mockupTiltY: 0,
    mockupRotation: 0,
    mockupX: 0,
    mockupY: 0,
    description: 'Ordinateur et téléphone, épurés sur fond blanc',
  },
];
