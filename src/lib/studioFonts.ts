import { Inter, Poppins, Montserrat, Playfair_Display, DM_Sans, Space_Grotesk, Bebas_Neue } from 'next/font/google';

/*
 * Polices des textes du studio, hébergées par Next.js sur notre domaine :
 * elles s'affichent sans requête vers Google et sont incluses dans les images exportées.
 */
const inter = Inter({ subsets: ['latin'], variable: '--font-studio-inter', display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '700', '800'], variable: '--font-studio-poppins', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-studio-montserrat', display: 'swap' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-studio-playfair', display: 'swap' });
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-studio-dmsans', display: 'swap' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-studio-space', display: 'swap' });
const bebas = Bebas_Neue({ subsets: ['latin'], weight: '400', variable: '--font-studio-bebas', display: 'swap' });

export const STUDIO_FONTS = [
  { id: 'inter', label: 'Inter', family: 'var(--font-studio-inter), system-ui, sans-serif' },
  { id: 'poppins', label: 'Poppins', family: 'var(--font-studio-poppins), system-ui, sans-serif' },
  { id: 'montserrat', label: 'Montserrat', family: 'var(--font-studio-montserrat), system-ui, sans-serif' },
  { id: 'dmsans', label: 'DM Sans', family: 'var(--font-studio-dmsans), system-ui, sans-serif' },
  { id: 'space', label: 'Space Grotesk', family: 'var(--font-studio-space), system-ui, sans-serif' },
  { id: 'playfair', label: 'Playfair', family: 'var(--font-studio-playfair), Georgia, serif' },
  { id: 'bebas', label: 'Bebas Neue', family: 'var(--font-studio-bebas), Impact, sans-serif' },
] as const;

export type StudioFontId = (typeof STUDIO_FONTS)[number]['id'];

/** Classes à poser sur la racine du studio pour rendre les variables de police disponibles */
export const STUDIO_FONT_VARIABLES = [inter, poppins, montserrat, playfair, dmSans, spaceGrotesk, bebas]
  .map((f) => f.variable)
  .join(' ');

/** Famille CSS d'une police du studio (les anciennes valeurs comme « font-sans » donnent Inter) */
export function studioFontFamily(id?: string): string {
  return (STUDIO_FONTS.find((f) => f.id === id) || STUDIO_FONTS[0]).family;
}
