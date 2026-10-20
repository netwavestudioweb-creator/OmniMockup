import type { Metadata } from "next";
import localFont from "next/font/local";
import { Archivo } from "next/font/google";
import "./globals.css";

// Police de la nouvelle identité (accueil) : un seul caractère, poids normal pour les titres
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-archivo",
  display: "swap",
});

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "PitchMySite • Votre site en visuels qui donnent envie de signer",
  description: "Collez le lien de votre site : il est capturé et mis en scène sur ordinateur, téléphone et tablette, prêt pour LinkedIn, Instagram, WhatsApp ou votre proposition commerciale.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: [
      { url: '/apple-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
};

import { UserProvider } from "@/context/UserContext";
import { HERO_SCRIPT } from "@/lib/heroTest";
import { CurrencyProvider } from "@/context/CurrencyContext";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="overflow-x-hidden w-full max-w-full" suppressHydrationWarning>
      <head>
        {/* Test de l'accroche : version choisie avant l'affichage (pas de clignotement) */}
        <script dangerouslySetInnerHTML={{ __html: HERO_SCRIPT }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} font-archivo bg-pms-paper text-stone-900 antialiased selection:bg-pms-accent-tint selection:text-pms-ink min-h-screen flex flex-col overflow-x-clip w-full max-w-full`}
      >
        <UserProvider>
          <CurrencyProvider>
            {children}
          </CurrencyProvider>
        </UserProvider>
      </body>
    </html>
  );
}
