/** Présentation client : plusieurs mockups + textes, en un PDF prêt à envoyer avec un devis. */

export interface PresentationSlide {
  id: string;
  /** Rendu tel que le forfait l'exporte (avec filigrane si le forfait l'impose) */
  image: string;
  /** Rendu sans filigrane, gardé seulement quand le forfait en met un (export payé en crédits) */
  clean?: string;
  width: number;
  height: number;
  quality: 'standard' | 'hd';
  caption: string;
}

export interface PresentationMeta {
  title: string;
  client: string;
  intro: string;
  author: string;
  /** Couleur principale (#rrggbb) */
  accent: string;
  logo: string | null;
}

// Les polices intégrées au PDF ne couvrent que l'alphabet latin : on retire le reste (émojis…)
const EXTRA_CHARS = new Set(['’', '‘', '“', '”', '…', '–', '—', 'œ', 'Œ', '€', '•']);
function clean(text: string): string {
  return Array.from(text.replace(/[  ]/g, ' '))
    .filter((c) => c.charCodeAt(0) <= 0xff || EXTRA_CHARS.has(c))
    .join('')
    .trim();
}

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return [124, 58, 237];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Convertit n'importe quelle image (SVG, WebP…) en PNG lisible par le PDF. */
async function toPng(src: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = src;
    });
    const w = img.naturalWidth || 300;
    const h = img.naturalHeight || 300;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    c.getContext('2d')?.drawImage(img, 0, 0, w, h);
    return { data: c.toDataURL('image/png'), w, h };
  } catch {
    return null;
  }
}

export async function buildPresentationPdf(
  meta: PresentationMeta,
  slides: PresentationSlide[],
  watermark: boolean
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const H = 210;
  const [ar, ag, ab] = hexToRgb(meta.accent);
  const title = clean(meta.title) || 'Présentation';
  const footerNote = watermark ? 'Réalisé avec OmniMockup' : '';

  // ── Couverture ─────────────────────────────────────────────────────────
  doc.setFillColor(ar, ag, ab);
  doc.rect(0, 0, 10, H, 'F');

  let y = 30;
  if (meta.logo) {
    const logo = await toPng(meta.logo);
    if (logo) {
      // Le logo tient dans un cadre de 60 × 16 mm sans être déformé
      const fit = Math.min(60 / logo.w, 16 / logo.h);
      doc.addImage(logo.data, 'PNG', 28, y - 6, logo.w * fit, logo.h * fit);
      y += 22;
    }
  }

  y = Math.max(y, 70);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(24, 24, 27);
  const titleLines = doc.splitTextToSize(title, 230) as string[];
  doc.text(titleLines, 28, y);
  y += titleLines.length * 12 + 4;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(ar, ag, ab);
  const client = clean(meta.client);
  if (client) {
    doc.text(`Préparé pour : ${client}`, 28, y);
    y += 8;
  }
  doc.setFontSize(11);
  doc.setTextColor(113, 113, 122);
  doc.text(new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }), 28, y);
  y += 14;

  const intro = clean(meta.intro);
  if (intro) {
    doc.setFontSize(12);
    doc.setTextColor(63, 63, 70);
    const introLines = (doc.splitTextToSize(intro, 230) as string[]).slice(0, 12);
    doc.text(introLines, 28, y, { lineHeightFactor: 1.5 });
  }

  doc.setFontSize(10);
  doc.setTextColor(113, 113, 122);
  const author = clean(meta.author);
  if (author) doc.text(`Présenté par ${author}`, 28, H - 16);
  doc.text(`${slides.length} visuel${slides.length > 1 ? 's' : ''}`, W - 16, H - 16, { align: 'right' });
  if (footerNote) doc.text(footerNote, W / 2, H - 8, { align: 'center' });

  // ── Une page par mockup ────────────────────────────────────────────────
  slides.forEach((slide, i) => {
    doc.addPage();
    doc.setFillColor(ar, ag, ab);
    doc.rect(0, 0, W, 2.5, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(113, 113, 122);
    doc.text(title, 15, 11);
    doc.text(`${i + 1} / ${slides.length}`, W - 15, 11, { align: 'right' });

    const caption = clean(slide.caption);
    const boxX = 15;
    const boxY = 17;
    const boxW = W - 30;
    const boxH = caption ? 160 : 175;
    const ratio = slide.width / slide.height;
    let w = boxW;
    let h = w / ratio;
    if (h > boxH) {
      h = boxH;
      w = h * ratio;
    }
    const src = !watermark && slide.clean ? slide.clean : slide.image;
    doc.addImage(src, 'JPEG', boxX + (boxW - w) / 2, boxY + (boxH - h) / 2, w, h, undefined, 'FAST');

    if (caption) {
      doc.setFontSize(12);
      doc.setTextColor(39, 39, 42);
      const lines = (doc.splitTextToSize(caption, boxW) as string[]).slice(0, 2);
      doc.text(lines, W / 2, boxY + boxH + 10, { align: 'center' });
    }
    if (footerNote) {
      doc.setFontSize(8);
      doc.setTextColor(161, 161, 170);
      doc.text(footerNote, W / 2, H - 6, { align: 'center' });
    }
  });

  return doc.output('blob');
}
