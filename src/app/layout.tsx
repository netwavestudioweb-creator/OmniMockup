import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

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
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-sand-50 text-stone-900 antialiased selection:bg-violet-100 selection:text-violet-900 min-h-screen flex flex-col overflow-x-hidden w-full max-w-full`}
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
