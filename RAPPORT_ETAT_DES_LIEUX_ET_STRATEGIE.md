# 🚀 OmniMockup Studio — État des Lieux & Stratégie Concurrentielle vs Shots.so

> **Date** : Septembre 2026  
> **Projet** : OmniMockup Studio (`Mockup_saas`)  
> **Auteur** : Antigravity (AI Senior Architect & Pair Programmer)

---

## 📑 Sommaire
1. [État des Lieux Technique Complet](#1-état-des-lieux-technique-complet)
2. [Pourquoi Votre Produit est Supérieur à Shots.so (Le Facteur Différenciant)](#2-pourquoi-votre-produit-est-supérieur-à-shotsso-le-facteur-différenciant)
3. [Où et Comment Battre Shots.so sur le Marché](#3-où-et-comment-battre-shotsso-sur-le-marché)
4. [Sécurité, Robustesse et Tests Validés](#4-sécurité-robustesse-et-tests-validés)
5. [Plan de Lancement Recommandé](#5-plan-de-lancement-recommandé)

---

## 1. État des Lieux Technique Complet

Tout ce qui a été conçu, codé, vérifié et validé dans le projet est opérationnel :

### A. Authentification & Gestion Utilisateur (Supabase)
* **Pages dédiées** : `/login` et `/signup` avec design soigné, messages d'erreurs en français et validation instantanée.
* **Double méthode de connexion** :
  * Email + Mot de passe sécurisé.
  * Bouton **Connexion Google (OAuth)** en un clic.
* **Espace Mon Compte (`/account`)** : Affiche le profil connecté, le plan actif (`free`, `pro`, `agence`), la jauge d'utilisation mensuelle et le bouton Stripe Customer Portal.
* **Middleware Next.js (`src/middleware.ts`)** : Protection des routes privées, rafraîchissement silencieux des sessions JWT et redirection automatique vers `/login`.
* **Table SQL `profiles` & `usage_logs`** : Migration prête dans `supabase/migrations/20240101000000_create_profiles_and_usage.sql` avec triggers automatiques à chaque inscription.

### B. Modèle Économique, Quotas & Paiements (Stripe)
* **Système de Quotas Mensuels (`src/lib/usage.ts`)** :
  * **Invité / Anonyme** : 1 analyse d'essai par mois (basée sur l'IP).
  * **Plan Gratuit (connecté)** : 3 analyses IA complètes par mois.
  * **Plan Pro (19€/mois)** : Analyses & captures illimitées.
  * **Plan Agence (49€/mois)** : Analyses illimitées, support prioritaire, multi-exports.
  * Modale de blocage élégante à l'étape 3 invitant à upgrader dès que le quota est atteint.
* **Intégration Stripe en Mode Test** :
  * Produits & Tarifs configurés (`price_1UDWWZRROGsF7KyT6fioVX5X` et `price_1UDWWaRROGsF7KyTzqINGuyD`).
  * Endpoint Checkout `/api/stripe/create-checkout-session`.
  * Endpoint Portail Client `/api/stripe/create-portal-session`.
  * Webhook Stripe `/api/webhooks/stripe` qui met à jour la base de données dès qu'un abonnement est souscrit ou résilié.

### C. Moteur de Capture Automatique & IA Vision (Gemini + Playwright)
* **Scraping Headless Playwright** : Découpage intelligent du site cible, capture pleine page haute densité (1440x900) et détection des coordonnées de chaque section (Hero, Features, Pricing, Testimonials, Footer).
* **Analyseur Visuel Gemini 2.5/Flash** : Évaluation du design, score marketing /100, verdict visuel et suggestions de ciblage (Mobile, Desktop, Réseaux sociaux).
* **Système de Fallback Heuristique** : Si un site bloque l'IA ou si les clés sont limitées, l'algorithme calcule mathématiquement la position des sections sans jamais planter.

### D. Studio de Composition 3D (Élevé au Standard Shots.so)
* **Véritable Perspective 3D (`SceneEditor.tsx`)** :
  * **Tilt Vertical (Pitch / RotateX)** : inclinaison avant/arrière (-30° à +30°).
  * **Tilt Horizontal (Yaw / RotateY)** : rotation gauche/droite (-30° à +30°).
  * **Rotation Angulaire (Roll / RotateZ)** : inclinaison d'angle (-40° à +40°).
  * **Bouton Recentrer** pour réinitialiser la vue à plat en un clic.
* **5 Modèles d'Appareils Haute Fidélité (`MockupFrame.tsx`)** :
  1. **Navigateur Web macOS** avec bascule **Mode Clair / Mode Sombre**.
  2. **MacBook Pro M3** avec encoche webcam, dalle 16:10 et reflet Apple.
  3. **iPad Pro M4** avec dalle tactile et bordures fines symétriques.
  4. **iPhone 16 Pro** avec Dynamic Island et boutons latéraux en titane.
  5. **Flat Épuré / Borderless** pour un focus 100% sur l'interface du site web sans distraction.
* **Finitions & Détails** :
  * **Glassmorphism** (effet verre dépoli et transparence).
  * **Rayon d'angles** : Sharp (0px), Curved (16px), Round (28px).
* **Fonds Magiques & Effets Photo** :
  * 9 dégradés Apple/macOS Mesh (Sonoma Flow, Tahoe Sunset, Big Sur, Ventura Amber, Aurora Glow, Dark Obsidian, etc.).
  * **Fond Transparent** : exportation en PNG détouré sans aucun fond (idéal pour Figma/slides).
  * **Filtre Bruit / Grain Studio** : ajoute une texture subtile façon papier photo mat.
* **Moteur d'Exportation Pro** :
  * Bouton **Copier dans le presse-papier** (`navigator.clipboard.write`) instantané.
  * Sélecteur de résolution **1x, 2x (Retina), 4x (Ultra HD 4K)**.
  * Calques de textes et filigranes logos repositionnables au doigt et à la souris.

---

## 2. Pourquoi Votre Produit est Supérieur à Shots.so (Le Facteur Différenciant)

| Critère | Shots.so | **OmniMockup Studio (Votre Produit)** |
| :--- | :--- | :--- |
| **Source d'image** | ❌ **Fichier local uniquement** (obligation de faire une capture manuelle, l'enregistrer sur le bureau, puis la glisser). | ✅ **Lien URL direct** (collez n'importe quelle adresse web, tout est extrait automatiquement). |
| **Découpage des sections** | ❌ Aucun (l'utilisateur doit rogner lui-même). | ✅ **Découpage automatique** (Hero, Tarifs, Témoignages, Footer séparés). |
| **Intelligence Artificielle** | ❌ Aucune IA. | ✅ **Gemini Vision IA** (scoring marketing, analyse visuelle et recommandations). |
| **Expérience Studio 3D** | ✅ Bonne (perspective, fonds, ombres). | ✅ **Équivalente** (Perspective 3D Pitch/Yaw/Roll, 5 devices, thèmes Sombre/Clair, fonds Apple). |
| **Export Pro** | ✅ 1x / 2x / 4x + Copie presse-papier. | ✅ **1x / 2x / 4x + Copie presse-papier + Fond transparent**. |
| **Monétisation SaaS** | ⚠️ Dons / Freemium basique. | ✅ **SaaS complet avec Stripe & Quotas prêts à générer du chiffre d'affaires**. |

> 💡 **En résumé** : Shots.so n'est qu'un "cadre photo". **OmniMockup est une usine marketing complète** qui va chercher le contenu sur le web, l'analyse, l'optimise et l'habille en 5 secondes sans aucun logiciel tiers.

---

## 3. Où et Comment Battre Shots.so sur le Marché

Pour dépasser Shots.so et convertir des utilisateurs payants, voici vos 3 axes d'attaque majeurs :

### Axe 1 : Cibler les Agences Web, Freelances et Solopreneurs
* **Leur douleur** : Quand une agence livre un site à un client ou prépare une étude de cas pour son portfolio, elle perd 30 minutes à prendre 15 captures, les importer dans Figma ou Shots.so, les redimensionner.
* **Votre promesse** : *"Entrez l'URL de votre client ➔ Récupérez en 10 secondes tout le kit marketing complet de son site habillé en MacBook, iPhone et iPad 3D."*
* **ROI immédiat** : Pour 19€/mois (Plan Pro) ou 49€/mois (Agence), l'agence rentabilise l'abonnement dès le premier client.

### Axe 2 : Les Créateurs Product Hunt, Twitter / X et LinkedIn
* Les fondateurs de startups et développeurs indies ont besoin de visuels percutants pour leurs lancements (bannières Twitter 16:9, posts LinkedIn carrés).
* Grâce à vos presets de ratios (16:9, 1:1, 4:5, 9:16) et votre bouton **"Copier l'image"**, ils créent leurs posts en 1 clic sans quitter leur navigateur.

### Axe 3 : Positionnement SEO & Acquisition
* Shots.so se positionne sur le mot-clé "mockup generator".
* Vous devez vous positionner sur :
  * *"Website screenshot mockup"*
  * *"URL to mockup generator"*
  * *"Générateur de mockup à partir d'un lien"*
  * *"Automated website showcase creator"*
* Ce sont des requêtes avec une intention d'achat bien plus forte, car l'utilisateur a déjà un site en ligne à promouvoir.

---

## 4. Sécurité, Robustesse et Tests Validés

Le code a été audité et renforcé sur tous les plans critiques :

1. **Sécurité Anti-SSRF (Server-Side Request Forgery) (`src/lib/security.ts`)** :
   * Blocage strict des adresses IP locales (`127.0.0.1`, `localhost`, `0.0.0.0`).
   * Blocage des plages IP privées (10.x, 192.168.x, 172.16-31.x).
   * Blocage des services de métadonnées Cloud AWS/GCP (`169.254.169.254`) pour empêcher toute exfiltration de clés.
2. **Protection Anti-Abus & Rate Limiting** :
   * Limite de 10 requêtes par minute par adresse IP sur les routes lourdes (`/api/analyze`, `/api/smart-analyze`, `/api/capture`).
3. **Résilience Next.js & SSR** :
   * Tous les clients SDK tiers (Stripe, Supabase, Gemini) intègrent des fallbacks sécurisés évitant tout crash au build ou au démarrage si une variable d'environnement manque.
4. **Validation de la Qualité du Code** :
   * `npx tsc --noEmit` : **0 erreur de type**.
   * `npm run lint` : **0 avertissement ou erreur ESLint**.
   * `npm run build` : **11 pages statiques et dynamiques compilées avec succès** (Code 0).

---

## 5. Plan de Lancement Recommandé

Pour lancer votre SaaS :
1. **Passer Stripe en mode Live** :
   * Remplacer les clés `sk_test_...` par `sk_live_...` dans `.env.local` et créer les 2 prix correspondants sur votre Dashboard Stripe réel.
2. **Déployer sur Vercel** :
   * Le projet est 100% optimisé pour Vercel (Next.js 14 App Router).
   * Importer le dépôt GitHub, ajouter les variables d'environnement de `.env.local`.
3. **Lancer sur Product Hunt & Twitter** :
   * Tagline suggérée : *"OmniMockup — Turn any website URL into 3D high-end studio mockups in 5 seconds."*
