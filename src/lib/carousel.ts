/** Carrousel LinkedIn / Instagram : une couverture + une page par mockup, format portrait 4:5. */
import type { PresentationMeta, PresentationSlide } from './presentationPdf';

export const CAROUSEL_WIDTH = 1080;
export const CAROUSEL_HEIGHT = 1350;
const FONT = 'Helvetica, Arial, sans-serif';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Découpe un texte en lignes qui tiennent dans la largeur donnée. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = test;
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  if (lines.length === maxLines && words.join(' ').length > lines.join(' ').length) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/\s+\S*$/, '')}…`;
  }
  return lines;
}

function shade(hex: string, amount: number): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  const n = m ? parseInt(m[1], 16) : 0x7c3aed;
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + (amount < 0 ? c : 255 - c) * amount)));
  return `rgb(${f((n >> 16) & 255)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Rend toutes les pages du carrousel en JPEG (1080 × 1350). */
export async function renderCarouselPages(
  meta: PresentationMeta,
  slides: PresentationSlide[],
  watermark: boolean
): Promise<string[]> {
  const W = CAROUSEL_WIDTH;
  const H = CAROUSEL_HEIGHT;
  const total = slides.length + 1;
  const pages: string[] = [];
  const author = meta.author.trim();

  const newCanvas = () => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    if (!ctx) throw new Error('canvas');
    return { c, ctx };
  };

  const footer = (ctx: CanvasRenderingContext2D, index: number, light: boolean) => {
    ctx.fillStyle = light ? 'rgba(255,255,255,0.75)' : 'rgba(24,24,27,0.6)';
    ctx.font = `600 30px ${FONT}`;
    ctx.textAlign = 'left';
    if (author) ctx.fillText(author, 80, H - 70);
    ctx.textAlign = 'right';
    ctx.fillText(index < total ? `${index} / ${total}  →` : `${index} / ${total}`, W - 80, H - 70);
    if (watermark) {
      ctx.textAlign = 'center';
      ctx.font = `500 24px ${FONT}`;
      ctx.fillStyle = light ? 'rgba(255,255,255,0.6)' : 'rgba(24,24,27,0.45)';
      ctx.fillText('Réalisé avec OmniMockup', W / 2, H - 28);
    }
  };

  // ── Couverture ─────────────────────────────────────────────────────────
  {
    const { c, ctx } = newCanvas();
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, shade(meta.accent, 0.1));
    g.addColorStop(1, shade(meta.accent, -0.45));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    let y = 200;
    if (meta.logo) {
      try {
        const logo = await loadImage(meta.logo);
        const fit = Math.min(260 / logo.naturalWidth, 110 / logo.naturalHeight);
        ctx.drawImage(logo, 80, y - 60, logo.naturalWidth * fit, logo.naturalHeight * fit);
        y += 120;
      } catch {
        /* logo illisible : ignoré */
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `800 92px ${FONT}`;
    const titleLines = wrap(ctx, meta.title || 'Présentation', W - 160, 5);
    y = Math.max(y + 80, 460);
    titleLines.forEach((l, i) => ctx.fillText(l, 80, y + i * 108));
    y += titleLines.length * 108 + 30;

    if (meta.client.trim()) {
      ctx.font = `500 44px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.fillText(`Pour ${meta.client.trim()}`, 80, y);
      y += 70;
    }
    if (meta.intro.trim()) {
      ctx.font = `400 36px ${FONT}`;
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      wrap(ctx, meta.intro, W - 160, 5).forEach((l, i) => ctx.fillText(l, 80, y + 20 + i * 52));
    }
    footer(ctx, 1, true);
    pages.push(c.toDataURL('image/jpeg', 0.92));
  }

  // ── Une page par mockup ────────────────────────────────────────────────
  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const { c, ctx } = newCanvas();
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = meta.accent;
    ctx.fillRect(0, 0, W, 14);

    const caption = slide.caption.trim();
    let top = 150;
    if (caption) {
      ctx.fillStyle = '#18181b';
      ctx.textAlign = 'left';
      ctx.font = `800 64px ${FONT}`;
      const lines = wrap(ctx, caption, W - 160, 3);
      lines.forEach((l, k) => ctx.fillText(l, 80, 170 + k * 78));
      top = 170 + lines.length * 78 + 20;
    }

    const img = await loadImage(!watermark && slide.clean ? slide.clean : slide.image);
    const boxW = W - 120;
    const boxH = H - top - 180;
    const fit = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight);
    const w = img.naturalWidth * fit;
    const h = img.naturalHeight * fit;
    const x = (W - w) / 2;
    const y = top + (boxH - h) / 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 16;
    roundRect(ctx, x, y, w, h, 24);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRect(ctx, x, y, w, h, 24);
    ctx.clip();
    ctx.drawImage(img, x, y, w, h);
    ctx.restore();

    footer(ctx, i + 2, false);
    pages.push(c.toDataURL('image/jpeg', 0.92));
  }

  return pages;
}

/** Carrousel LinkedIn : un PDF dont chaque page est une image 4:5. */
export async function buildLinkedInCarouselPdf(pages: string[]): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const pw = CAROUSEL_WIDTH * 0.75;
  const ph = CAROUSEL_HEIGHT * 0.75;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [pw, ph] });
  pages.forEach((p, i) => {
    if (i > 0) doc.addPage([pw, ph], 'portrait');
    doc.addImage(p, 'JPEG', 0, 0, pw, ph, undefined, 'FAST');
  });
  return doc.output('blob');
}
