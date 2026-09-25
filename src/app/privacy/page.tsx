import React from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { ArrowLeft, Lock, Database, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: "Politique de Confidentialité (RGPD) • OmniMockup Studio",
  description: "Politique de traitement et protection des données personnelles d'OmniMockup Studio.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-sand-50 text-stone-900 flex flex-col selection:bg-violet-100 selection:text-violet-900">
      <Navbar showPricingLink={true} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-sand-100 text-stone-600 hover:text-stone-900 border border-sand-200 text-xs font-medium transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-sand-200 p-8 sm:p-12 shadow-sm space-y-8">
          <div className="border-b border-sand-100 pb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 text-violet-800 border border-violet-200 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
              <span>Protection des Données</span>
            </div>
            <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight">
              Politique de Confidentialité (RGPD)
            </h1>
            <p className="text-xs text-stone-500 font-mono">
              Dernière mise à jour : 25 Septembre 2026
            </p>
          </div>

          <section className="space-y-4 text-sm text-stone-700 leading-relaxed">
            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Database className="w-4 h-4 text-violet-600" />
              1. Données Collectées
            </h2>
            <p>
              Dans le cadre du fonctionnement de l&apos;application, nous collectons les informations strictement nécessaires :
            </p>
            <ul className="list-disc pl-5 space-y-1 text-stone-600">
              <li>Adresse e-mail (pour l&apos;authentification et la gestion du compte via Supabase Auth).</li>
              <li>Historique d&apos;utilisation des quotas mensuels d&apos;analyse.</li>
              <li>Identifiants de facturation Stripe anonymisés (Customer ID & Subscription ID).</li>
            </ul>

            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-600" />
              2. Utilisation et Traitement des URLs
            </h2>
            <p>
              Les URLs soumises pour analyse sont traitées de façon automatisée en mémoire par nos modules de scraping et d&apos;IA afin de générer les captures. Aucune capture d&apos;écran ou donnée privée de votre navigateur n&apos;est revendue à des tiers.
            </p>

            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-600" />
              3. Sous-traitants & Sécurité
            </h2>
            <p>
              Vos données sont sécurisées et hébergées auprès d&apos;acteurs de confiance conformes au RGPD : Supabase (Gestion des données et authentification), Stripe (Traitements de paiements sécurisés PCI-DSS) et Google Cloud (Inférence IA Generative).
            </p>

            <h2 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-violet-600" />
              4. Vos Droits
            </h2>
            <p>
              Conformément à la réglementation RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification et de suppression de vos données personnelles. Vous pouvez exercer ce droit à tout moment en envoyant un e-mail à <span className="font-semibold text-stone-900">privacy@omnimockup.com</span>.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
