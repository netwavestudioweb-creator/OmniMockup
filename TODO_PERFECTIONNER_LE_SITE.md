# 📋 LISTE DES TÂCHES POUR PARFAIRE OMNIMOCKUP STUDIO
> **Objectif :** Guider pas à pas la finalisation du SaaS pour le rendre 100% prêt à la commercialisation, sécurisé, conforme légalement et ultra-performant.  
> **Dernière mise à jour :** Septembre 2026

---

## 🎯 SOMMAIRE DES PHASES
1. [Phase 1 — Sécurité & Base de Données (P0 - Bloquant)](#-phase-1--sécurité--base-de-données-p0)
2. [Phase 2 — Conformité Légale & Footer (P0 - Obligatoire Stripe)](#-phase-2--conformité-légale--footer-p0)
3. [Phase 3 — Monétisation Stripe en Production (P0 - Vente réelle)](#-phase-3--monétisation-stripe-en-production-p0)
4. [Phase 4 — Optimisations Techniques & Économie d'API (P1 - Recommandé)](#-phase-4--optimisations-techniques--économie-dapi-p1)
5. [Phase 5 — Authentification & Délivrabilité Emails (P1 - UX Utilisateur)](#-phase-5--authentification--délivrabilité-emails-p1)
6. [Phase 6 — Améliorations UX & Fonctionnalités Rétention (P2 - Valeur ajoutée)](#-phase-6--améliorations-ux--fonctionnalités-rétention-p2)
7. [Phase 7 — SEO, Partage Réseaux & Lancement (P2 - Visibilité)](#-phase-7--seo-partage-réseaux--lancement-p2)

---

## 🔒 PHASE 1 : SÉCURITÉ & BASE DE DONNÉES (P0)

- [ ] **1.1. Verrouiller la colonne `plan` dans Supabase (Empêcher l'auto-upgrade gratuit)**
  * **Problème :** La policy RLS actuelle permet à un utilisateur connecté de modifier son profil, y compris le champ `plan`.
  * **Action à faire :** Se rendre sur le **Dashboard Supabase > SQL Editor** et exécuter la requête suivante :
    ```sql
    -- 1. Révoquer la permission UPDATE brute sur la table profiles
    REVOKE UPDATE ON public.profiles FROM authenticated;

    -- 2. Autoriser l'utilisateur à modifier uniquement ses données inoffensives (ex: email, full_name s'il existe)
    GRANT UPDATE (email) ON public.profiles FROM authenticated;
    ```
  * **Validation :** Tenter une requête client `supabase.from('profiles').update({ plan: 'agence' }).eq('id', user.id)` doit retourner une erreur de permission.

- [ ] **1.2. Vérifier les sauvegardes automatiques Supabase**
  * S'assurer que les sauvegardes automatiques (Point-in-Time Recovery ou Daily Backups) sont activées sur votre projet Supabase.

---

## ⚖️ PHASE 2 : CONFORMITÉ LÉGALE & FOOTER (P0)

Stripe et la loi européenne exigent des mentions légales, des CGU/CGV et une politique de confidentialité claires pour activer les paiements en ligne réels.

- [ ] **2.1. Créer la page `/terms` (Conditions Générales d'Utilisation et de Vente - CGU/CGV)**
  * Créer le fichier `src/app/terms/page.tsx`.
  * Contenu obligatoire :
    - Identité de l'éditeur (nom, statut juridique, email de contact).
    - Description du service SaaS (génération de mockups et analyse IA).
    - Tarifs, facturation mensuelle et renouvellement automatique.
    - Droit de rétractation (renonciation expresse à l'exécution immédiate du service numérique).
    - Modalités de résiliation (directement via le portail client Stripe).

- [ ] **2.2. Créer la page `/privacy` (Politique de Confidentialité / RGPD)**
  * Créer le fichier `src/app/privacy/page.tsx`.
  * Contenu obligatoire :
    - Données collectées (email de l'utilisateur, logs de requêtes, captures temporaires).
    - Sous-traitants utilisés (Supabase pour l'authentification/base, Stripe pour le paiement, Google Generative AI pour l'analyse visuelle, Vercel pour l'hébergement).
    - Durée de conservation des données.
    - Droits de l'utilisateur (droit d'accès, de rectification, de suppression des données).

- [ ] **2.3. Ajouter un Footer complet sur le site**
  * Créer `src/components/Footer.tsx` et l'intégrer dans `src/app/page.tsx` et `src/app/pricing/page.tsx`.
  * Liens à inclure :
    - Produit : Accueil, Studio Mockup, Tarifs.
    - Légal : Mentions légales & CGU (`/terms`), Confidentialité (`/privacy`).
    - Contact : Lien email support ou Twitter/LinkedIn.
    - Copyright et badge "Fait avec passion".

---

## 💳 PHASE 3 : MONÉTISATION STRIPE EN PRODUCTION (P0)

- [ ] **3.1. Passer Stripe en mode Live (Production)**
  * Basculer l'interrupteur Stripe de **Test** à **Live**.
  * Récupérer la clé secrète de production : `sk_live_...`

- [ ] **3.2. Créer les produits réels dans le Dashboard Stripe**
  * Créer le produit **OmniMockup Pro** :
    - Tarif : 19 € / mois (récurrent).
    - Récupérer l'ID de prix : `price_...` -> à assigner à `STRIPE_PRO_PRICE_ID`.
  * Créer le produit **OmniMockup Agence** :
    - Tarif : 49 € / mois (récurrent).
    - Récupérer l'ID de prix : `price_...` -> à assigner à `STRIPE_AGENCE_PRICE_ID`.

- [ ] **3.3. Configurer le Webhook de production**
  * Dans **Stripe Dashboard > Développeurs > Webhooks** :
    - Ajouter le endpoint : `https://votre-domaine.com/api/webhooks/stripe`
    - Sélectionner les événements :
      - `checkout.session.completed`
      - `customer.subscription.updated`
      - `customer.subscription.deleted`
      - `invoice.payment_failed`
    - Copier la clé de signature du webhook : `whsec_...` -> à assigner à `STRIPE_WEBHOOK_SECRET`.

- [ ] **3.4. Activer le Portail Client Stripe**
  * Dans **Stripe Dashboard > Paramètres > Portail client** :
    - Activer la résiliation d'abonnement en fin de période.
    - Permettre la mise à jour des moyens de paiement (carte bancaire).
    - Ajouter le lien de retour vers `https://votre-domaine.com/account`.

---

## ⚡ PHASE 4 : OPTIMISATIONS TECHNIQUES & ÉCONOMIE D'API (P1)

- [ ] **4.1. Court-circuiter l'appel Gemini Vision si le quota est dépassé**
  * **Emplacement :** `src/app/api/smart-analyze/route.ts`
  * **Problème actuel :** Si `quotaCheck.allowedFullAnalysis === false`, Gemini est quand même interrogé puis masqué au client, ce qui gaspille des crédits Google AI.
  * **Action :** Ajouter une vérification :
    ```typescript
    if (!quotaCheck.allowedFullAnalysis) {
      // Renvoyer directement les sections heuristiques locales sans appeler l'API Gemini
      return NextResponse.json({
        sections: localHeuristicSections,
        fullAiAvailable: false,
        message: "Quota gratuit atteint. Passez Pro pour l'analyse IA complète."
      });
    }
    ```

- [ ] **4.2. Créer une page 404 sur-mesure (`not-found.tsx`)**
  * Créer le fichier `src/app/not-found.tsx` avec un design soigné, cohérent avec l'identité graphique (fond sable, boutons violets, redirection vers l'accueil).

- [ ] **4.3. Créer une page d'erreur globale (`error.tsx`)**
  * Créer `src/app/error.tsx` pour attraper les plantages inattendus côté client avec un bouton "Réessayer" et un lien vers le support.

- [ ] **4.4. Gestion de l'événement webhook `invoice.payment_failed`**
  * Dans `src/app/api/webhooks/stripe/route.ts`, ajouter la gestion de `invoice.payment_failed` pour basculer le profil utilisateur en statut `'free'` ou envoyer un email d'alerte.

---

## 🔑 PHASE 5 : AUTHENTIFICATION & DÉLIVRABILITÉ EMAILS (P1)

- [ ] **5.1. Configurer un service SMTP personnalisé pour Supabase**
  * **Pourquoi :** Le service email gratuit de Supabase est plafonné à 3 emails par heure. Si plusieurs utilisateurs s'inscrivent, les emails sont bloqués.
  * **Action :** 
    1. Créer un compte sur [Resend.com](https://resend.com) ou [Brevo.com](https://brevo.com).
    2. Valider votre domaine (enregistrements DNS DKIM/SPF).
    3. Dans **Supabase > Project Settings > Authentication > SMTP Settings**, renseigner les accès SMTP.

- [ ] **5.2. Activer la connexion Google OAuth (1 clic)**
  * Créer un projet dans [Google Cloud Console](https://console.cloud.google.com).
  * Configurer l'écran de consentement OAuth (logo OmniMockup, email de support).
  * Créer un identifiant "ID client OAuth" (Application Web) :
    - URI de redirection autorisée : `https://<votre-id-supabase>.supabase.co/auth/v1/callback`
  * Renseigner l'ID client et le code secret dans **Supabase > Authentication > Providers > Google**.

---

## 🎨 PHASE 6 : AMÉLIORATIONS UX & NOUVELLES FONCTIONNALITÉS (P2)

- [ ] **6.1. Système de "Sauvegarde de Projets / Galerie Personnelle"**
  * Créer une table Supabase `mockup_projects` (`id`, `user_id`, `name`, `config_json`, `preview_url`, `created_at`).
  * Permettre à un utilisateur connecté de sauvegarder sa scène courante et de la rouvrir ultérieurement depuis sa page `/account`.

- [ ] **6.2. Bibliothèque de Presets Visuels en 1 Clic dans le Studio**
  * Ajouter un sélecteur de styles rapides dans `SceneEditor.tsx` :
    - 🌌 *Dark Neon / Cyberpunk* (fond sombre, lueur violette intense, cadre MacBook noir mat).
    - 📄 *Paper Minimalist* (fond blanc cassé, ombre ultra douce, cadre fenêtre Safari épuré).
    - 🌈 *Aurora Gradient* (dégradé pêche/indigo avec blur en arrière-plan).
    - 💎 *Glassmorphism 3D* (effet verre dépoli, rotation 3D légère).

- [ ] **6.3. Export Multi-Formats en 1 Clic**
  * Permettre d'exporter la même scène automatiquement en plusieurs formats adaptés aux réseaux sociaux :
    - 16:9 (Twitter / X, LinkedIn, Présentations).
    - 1:1 (Instagram Feed, Dribbble).
    - 9:16 (Stories Instagram, TikTok, Shorts).

- [ ] **6.4. Notifications Toast modernes**
  * Installer et intégrer `sonner` ou un toast personnalisé pour notifier l'utilisateur :
    - "Lien copié dans le presse-papier !"
    - "Export PNG haute définition terminé avec succès."
    - "Projet sauvegardé dans votre espace."

---

## 🚀 PHASE 7 : SEO, PARTAGE RÉSEAUX & DÉPLOIEMENT (P2)

- [ ] **7.1. Configurer l'image de partage réseaux (`og:image` / Twitter Card)**
  * Générer une bannière 1200x630 px attrayante montrant l'application et des exemples de mockups.
  * L'ajouter dans `public/og-image.png`.
  * Configurer `openGraph` et `twitter` dans `src/app/layout.tsx`.

- [ ] **7.2. Fichiers `sitemap.ts` et `robots.txt`**
  * Créer `src/app/sitemap.ts` pour générer dynamiquement la liste des pages publiques (`/`, `/pricing`, `/terms`, `/privacy`).
  * Créer `src/app/robots.ts` pour autoriser l'indexation par Google.

- [ ] **7.3. Déploiement sur Vercel**
  * Connecter le dépôt GitHub [netwavestudioweb-creator/OmniMockup](https://github.com/netwavestudioweb-creator/OmniMockup) à Vercel.
  * Configurer toutes les variables d'environnement dans le Dashboard Vercel (Production) :
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `STRIPE_SECRET_KEY`
    - `STRIPE_WEBHOOK_SECRET`
    - `STRIPE_PRO_PRICE_ID`
    - `STRIPE_AGENCE_PRICE_ID`
    - `NEXT_PUBLIC_SITE_URL` (ex: `https://omnimockup.com`)
    - `GEMINI_API_KEY`
  * Assigner le nom de domaine personnalisé et vérifier le certificat SSL.
  * Mettre à jour l'URL de redirection dans Supabase Auth (`Site URL` = `https://omnimockup.com`).

---

## 💡 RÉCAPITULATIF : ORDRE CHRONOLOGIQUE CONSEILLÉ

| Étape | Description | Durée estimée |
| :---: | :--- | :---: |
| **1** | Exécuter le script SQL Supabase pour verrouiller `plan` | 2 min |
| **2** | Créer `/terms`, `/privacy` et le composant `Footer` | 20 min |
| **3** | Court-circuiter l'appel Gemini hors quota dans `/api/smart-analyze` | 10 min |
| **4** | Créer les pages `not-found.tsx` et `error.tsx` | 15 min |
| **5** | Configurer Stripe en Live (produits, prix et webhook) | 15 min |
| **6** | Configurer le SMTP Resend/Brevo dans Supabase | 10 min |
| **7** | Déployer sur Vercel avec le domaine définitif | 15 min |
| **8** | Ajouter les presets et fonctionnalités créatives avancées | Évolutif |
