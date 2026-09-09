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
  title: "OmniMockup Studio • Analyse Web & Mockups IA Haute Fidélité",
  description: "Capture intelligente de pages et sections web, analyse de composition par IA et studio de mise en scène de mockups.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="overflow-x-hidden w-full max-w-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans bg-sand-50 text-stone-900 antialiased selection:bg-violet-100 selection:text-violet-900 min-h-screen flex flex-col overflow-x-hidden w-full max-w-full`}
      >
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
