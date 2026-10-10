/**
 * Scènes photo réalistes : la capture du site est placée en perspective dans l'écran d'une vraie photo
 * (photos Unsplash, licence libre). Coins de l'écran et masque (public/scenes/*-mask.png) mesurés
 * une fois pour chaque photo ; le masque suit les coins arrondis et laisse les doigts au-dessus.
 */
export interface PhotoScene {
  id: string;
  label: string;
  kind: 'phone' | 'laptop';
  width: number;
  height: number;
  /** Coins de l'écran en fraction de la photo : haut-gauche, haut-droite, bas-droite, bas-gauche */
  corners: [number, number][];
}

export const PHOTO_SCENES: PhotoScene[] = [
  { id: '1575909812264-6902b55846ad', label: 'Bureau clair', kind: 'laptop', width: 1600, height: 1067, corners: [[0.29231, 0.33678], [0.70689, 0.3342], [0.70921, 0.7179], [0.29261, 0.7179]] },
  { id: '1578601789053-1c00ea465c7b', label: 'Bureau sombre', kind: 'laptop', width: 1600, height: 1067, corners: [[0.14603, 0.21463], [0.56094, 0.21039], [0.56511, 0.59196], [0.14039, 0.59761]] },
  { id: '1597672996375-4d21cad0cbb9', label: 'Mur végétal', kind: 'laptop', width: 1600, height: 902, corners: [[0.23583, 0.17247], [0.7682, 0.17323], [0.76577, 0.73725], [0.23842, 0.73725]] },
  { id: '1597673030062-0a0f1a801a31', label: 'Salle de réunion', kind: 'laptop', width: 1600, height: 932, corners: [[0.2903, 0.36805], [0.70945, 0.36886], [0.71179, 0.80114], [0.28879, 0.80212]] },
  { id: '1484788984921-03950022c9ef', label: 'Café', kind: 'laptop', width: 1600, height: 996, corners: [[0.32958, 0.25051], [0.71446, 0.25517], [0.71518, 0.65736], [0.32726, 0.65788]] },
  { id: '1691256676376-357c3aa66c89', label: 'Téléphone en main', kind: 'phone', width: 1600, height: 1600, corners: [[0.33752, 0.09993], [0.68793, 0.09502], [0.67911, 0.86032], [0.32816, 0.85736]] },
  { id: '1691207737881-0dd5d3aa732a', label: 'Deux mains, vue de dessus', kind: 'phone', width: 1600, height: 896, corners: [[0.38438, 0.10525], [0.59, 0.10534], [0.59, 0.89955], [0.38436, 0.89955]] },
  { id: '1663524789649-c7abbb378561', label: 'Téléphone sur bois', kind: 'phone', width: 1600, height: 1067, corners: [[0.39753, 0.13685], [0.61684, 0.13705], [0.61215, 0.82714], [0.40424, 0.83352]] },
];

export const photoSceneUrl = (s: PhotoScene, w = s.width) =>
  `https://images.unsplash.com/photo-${s.id}?w=${w}&q=85`;

function loadImage(src: string, cors = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (cors) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Matrice 3×3 de la transformation projective du carré unité vers le quadrilatère (Heckbert). */
function squareToQuadMatrix(q: [number, number][]): number[] {
  const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = q;
  const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2;
  const sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  let g = 0, h = 0;
  if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) {
    const den = dx1 * dy2 - dx2 * dy1;
    g = (sx * dy2 - dx2 * sy) / den;
    h = (dx1 * sy - sx * dy1) / den;
  }
  return [x1 - x0 + g * x1, x3 - x0 + h * x3, x0, y1 - y0 + g * y1, y3 - y0 + h * y3, y0, g, h, 1];
}

function invert3(m: number[]): number[] {
  const [a, b, c, d, e, f, g, h, i] = m;
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C;
  return [
    A / det, -(b * i - c * h) / det, (b * f - c * e) / det,
    B / det, (a * i - c * g) / det, -(a * f - c * d) / det,
    C / det, -(a * h - b * g) / det, (a * e - b * d) / det,
  ];
}

/**
 * Déforme la source dans le quadrilatère, pixel par pixel (transformation inverse + interpolation
 * bilinéaire) : aucune couture visible, contrairement à un découpage en triangles.
 */
function warpInto(target: CanvasRenderingContext2D, src: HTMLCanvasElement, quad: [number, number][]) {
  const inv = invert3(squareToQuadMatrix(quad));
  const xs = quad.map((p) => p[0]), ys = quad.map((p) => p[1]);
  const x0 = Math.max(0, Math.floor(Math.min(...xs))), x1 = Math.min(target.canvas.width, Math.ceil(Math.max(...xs)));
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(target.canvas.height, Math.ceil(Math.max(...ys)));
  const bw = x1 - x0, bh = y1 - y0;
  if (bw <= 0 || bh <= 0) return;
  const sw = src.width, sh = src.height;
  const sd = (src.getContext('2d') as CanvasRenderingContext2D).getImageData(0, 0, sw, sh).data;
  const out = target.createImageData(bw, bh);
  const od = out.data;
  for (let y = 0; y < bh; y++) {
    const py = y0 + y + 0.5;
    for (let x = 0; x < bw; x++) {
      const px = x0 + x + 0.5;
      const w = inv[6] * px + inv[7] * py + inv[8];
      const u = (inv[0] * px + inv[1] * py + inv[2]) / w;
      const v = (inv[3] * px + inv[4] * py + inv[5]) / w;
      if (u < 0 || u > 1 || v < 0 || v > 1) continue;
      const fx = Math.min(sw - 1.001, Math.max(0, u * sw - 0.5));
      const fy = Math.min(sh - 1.001, Math.max(0, v * sh - 0.5));
      const ix = fx | 0, iy = fy | 0, tx = fx - ix, ty = fy - iy;
      const i00 = (iy * sw + ix) * 4, i10 = i00 + 4, i01 = i00 + sw * 4, i11 = i01 + 4;
      const o = (y * bw + x) * 4;
      for (let k = 0; k < 3; k++) {
        const top = sd[i00 + k] + (sd[i10 + k] - sd[i00 + k]) * tx;
        const bot = sd[i01 + k] + (sd[i11 + k] - sd[i01 + k]) * tx;
        od[o + k] = top + (bot - top) * ty;
      }
      od[o + 3] = 255;
    }
  }
  target.putImageData(out, x0, y0);
}

/** Compose la scène : photo + capture en perspective dans l'écran. Renvoie une image JPEG. */
export async function renderPhotoScene(scene: PhotoScene, screenshot: string): Promise<string> {
  const [photo, mask, shot] = await Promise.all([
    loadImage(photoSceneUrl(scene), true),
    loadImage(`/scenes/${scene.id}-mask.png`),
    loadImage(screenshot),
  ]);
  const W = photo.naturalWidth;
  const H = photo.naturalHeight;
  const quad = scene.corners.map(([x, y]) => [x * W, y * H] as [number, number]);

  // Partie de la capture qui remplit l'écran (en haut de la page, largeur entière)
  const topW = Math.hypot(quad[1][0] - quad[0][0], quad[1][1] - quad[0][1]);
  const botW = Math.hypot(quad[2][0] - quad[3][0], quad[2][1] - quad[3][1]);
  const leftH = Math.hypot(quad[3][0] - quad[0][0], quad[3][1] - quad[0][1]);
  const rightH = Math.hypot(quad[2][0] - quad[1][0], quad[2][1] - quad[1][1]);
  const ratio = (leftH + rightH) / (topW + botW);
  const srcW = shot.naturalWidth;
  const srcH = Math.min(shot.naturalHeight, srcW * ratio);
  // Source mise à l'échelle de l'écran (évite un rendu flou ou crénelé)
  const scale = Math.min(1, (Math.max(topW, botW) * 1.25) / srcW);
  const src = document.createElement('canvas');
  src.width = Math.round(srcW * scale);
  src.height = Math.round(srcH * scale);
  (src.getContext('2d') as CanvasRenderingContext2D).drawImage(shot, 0, 0, srcW, srcH, 0, 0, src.width, src.height);

  const layer = document.createElement('canvas');
  layer.width = W;
  layer.height = H;
  const lctx = layer.getContext('2d') as CanvasRenderingContext2D;
  warpInto(lctx, src, quad);
  // Seule la partie visible de l'écran reste (coins arrondis, doigts posés dessus)
  lctx.globalCompositeOperation = 'destination-in';
  lctx.drawImage(mask, 0, 0, W, H);

  const out = document.createElement('canvas');
  out.width = W;
  out.height = H;
  const octx = out.getContext('2d') as CanvasRenderingContext2D;
  octx.drawImage(photo, 0, 0, W, H);
  octx.drawImage(layer, 0, 0);
  return out.toDataURL('image/jpeg', 0.9);
}
