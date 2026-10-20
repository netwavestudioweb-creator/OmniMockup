import React from 'react';
import { SUPPORT_EMAIL } from '@/lib/contact';
import Link from 'next/link';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { ArrowLeft, Shield, FileText, Scale } from 'lucide-react';

export const metadata = {
  title: "Conditions Générales d'Utilisation (CGU/CGV) • PitchMySite",
  description: "Conditions générales d'utilisation et de vente de PitchMySite.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-pms-surface text-stone-900 flex flex-col selection:bg-pms-accent-tint selection:text-pms-accent">
      <Navbar showPricingLink={true} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-pms-surface text-stone-600 hover:text-stone-900 border border-pms-line text-xs font-medium transition-all shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l&apos;accueil</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl border border-pms-line p-8 sm:p-12 shadow-sm space-y-8">
          <div className="border-b border-pms-line pb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pms-accent-tint text-pms-accent border border-pms-accent-tint text-xs font-semibold">
              <Scale className="w-3.5 h-3.5 text-pms-accent" />
              <span>Mentions Légales & CGU/CGV</span>
            </div>
            <h1 className="text-3xl font-semibold text-stone-900 tracking-tight">
              Conditions Générales d&apos;Utilisation et de Vente
            </h1>
            <p className="text-xs text-stone-500">
              Dernière mise à jour : 25 Septembre 2026
            </p>
          </div>

          <section className="space-y-4 text-sm text-stone-700 leading-relaxed">
            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-pms-accent" />
              1. Objet du Service
            </h2>
            <p>
              PitchMySite fournit une plateforme en ligne permettant d&apos;analyser automatiquement la structure de pages web cibles, d&apos;en capturer des volets en haute définition et de composer des visuels de mise en scène (mockups) à des fins marketing ou de présentation.
            </p>

            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-pms-accent" />
              2. Accès et Compte Utilisateur
            </h2>
            <p>
              L&apos;accès à l&apos;application nécessite l&apos;utilisation d&apos;une adresse e-mail valide ou d&apos;un compte Google. L&apos;utilisateur est responsable de la confidentialité de ses accès et des requêtes initiées sous son identité.
            </p>

            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-pms-accent" />
              3. Abonnements & Facturation
            </h2>
            <p>
              Les offres payantes (Solo, Pro et Agence) et les packs de crédits sont payés par Mobile Money via le prestataire SasPay, en francs CFA. Chaque paiement couvre une durée fixe (1 mois ou 1 an) sans renouvellement automatique : l&apos;accès prend fin à la date indiquée dans l&apos;espace client, sauf nouveau paiement.
            </p>

            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-pms-accent" />
              4. Propriété Intellectuelle & Droits des Captures
            </h2>
            <p>
              L&apos;utilisateur garantit détenir les droits d&apos;accès et d&apos;utilisation des sites web soumis à l&apos;analyse. PitchMySite ne revendique aucun droit de propriété sur les captures d&apos;écran d&apos;interfaces tierces générées via le service.
            </p>

            <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-pms-accent" />
              5. Contact & Support
            </h2>
            <p>
              Pour toute question relative aux présentes conditions ou à l&apos;utilisation du service, vous pouvez contacter notre équipe à l&apos;adresse : <span className="font-semibold text-stone-900">{SUPPORT_EMAIL}</span>.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
