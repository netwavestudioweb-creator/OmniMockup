/**
 * Découpe la capture pleine page en sections (de haut en bas) pour que l'IA lise le vrai site.
 * Chaque section est réduite à 768 px de large en JPG : assez net pour lire les titres,
 * assez léger pour l'envoyer (environ 50 à 120 Ko par section).
 */
export const MAX_PITCH_SECTIONS = 6;
const OUT_WIDTH = 768;

export async function sliceIntoSections(dataUrl: string, maxSections = MAX_PITCH_SECTIONS): Promise<string[]> {
  if (!dataUrl) return [];
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('Capture illisible'));
    i.src = dataUrl;
  });

  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (!w || !h) return [];
  // Une section ≈ un écran d'ordinateur (proportion 16:10) ; les pages très longues gardent le haut
  const sliceH = Math.round(w * 0.625);
  const count = Math.max(1, Math.min(maxSections, Math.ceil(h / sliceH)));
  const scale = Math.min(1, OUT_WIDTH / w);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return [];
  const sections: string[] = [];
  for (let k = 0; k < count; k++) {
    const sy = k * sliceH;
    const sh = Math.min(sliceH, h - sy);
    if (sh < 80) break; // reste trop petit pour contenir une section utile
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(sh * scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, sy, w, sh, 0, 0, canvas.width, canvas.height);
    sections.push(canvas.toDataURL('image/jpeg', 0.72).split(',')[1]);
  }
  return sections;
}
