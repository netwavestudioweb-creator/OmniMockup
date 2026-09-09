# RAPPORT D'AUDIT COMPLET DU PROJET — OmniMockup Studio
**Date de l'audit :** 9 Septembre 2026  
**Périmètre :** Sécurité, Intégrité des flux, Tests fonctionnels, Responsive/UX & Feuille de route avant lancement  
**Statut global de compilation :** ✅ `next build` réussi sans erreur TypeScript ni ESLint

---

## SOMMAIRE EXÉCUTIF
L'application **OmniMockup Studio** repose sur une architecture moderne et performante (Next.js 14 App Router, Supabase SSR/Auth/Postgres, Stripe SDK, Google Gemini Vision, Playwright Chromium).

L'audit approfondi a permis d'identifier :
1. **Deux vulnérabilités majeures de sécurité :**
   - **Bypass de signature Webhook Stripe (CORRIGÉ lors de l'audit)** : Le webhook acceptait auparavant les requêtes sans signature en mode fallback.
   - **Politique RLS Supabase permissive sur `profiles` (À corriger via migration SQL)** : L'instruction `FOR UPDATE USING (auth.uid() = id)` permet à un utilisateur authentifié de modifier directement sa colonne `plan` via le client Supabase JS public.
2. **Un bug fonctionnel bloquant (CORRIGÉ lors de l'audit) :**
   - L'identifiant de formule `'agency'` dans la page `/pricing` était rejeté par l'API et la base de données qui attendaient `'agence'`.
3. **Une fuite de coûts d'inférence IA :**
   - L'endpoint `/api/smart-analyze` appelait toujours Gemini Vision même quand le quota gratuit de l'utilisateur était dépassé, masquant seulement le résultat au retour au lieu de court-circuiter l'appel API Google.

---

## PARTIE 1 : AUDIT DE SÉCURITÉ

### 1. Variables d'Environnement
* **Inventaire des variables utilisées dans le code :**
  | Variable | Emplacement | Exposition Client ? | Rôle |
  | :--- | :--- | :---: | :--- |
  | `NEXT_PUBLIC_SUPABASE_URL` | Client & Serveur | ✅ Oui (Publique) | Endpoint de l'instance Supabase |
  | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Serveur | ✅ Oui (Publique) | Clé publique anonyme Supabase |
  | `SUPABASE_SERVICE_ROLE_KEY` | Serveur uniquement (`admin.ts`) | 🔒 Non | Clé secrète d'administration (bypasse RLS) |
  | `STRIPE_SECRET_KEY` | Serveur uniquement (`stripe.ts`) | 🔒 Non | Clé secrète API Stripe |
  | `STRIPE_WEBHOOK_SECRET` | Serveur uniquement (`webhooks/stripe`) | 🔒 Non | Secret de validation de signature Stripe |
  | `STRIPE_PRO_PRICE_ID` | Serveur uniquement (`checkout-session`) | 🔒 Non | ID de tarif Stripe pour la formule Pro |
  | `STRIPE_AGENCE_PRICE_ID` | Serveur uniquement (`checkout-session`) | 🔒 Non | ID de tarif Stripe pour la formule Agence |
  | `NEXT_PUBLIC_SITE_URL` | Client & Serveur | ✅ Oui (Publique) | URL de base pour les redirections |
  | `GEMINI_API_KEY` | Serveur uniquement (`smart-analyze`) | 🔒 Non | Clé API Google Generative AI |

* **Vérification `.gitignore` :**
  - Le fichier `.gitignore` contenait initialement `.env*.local`. Il a été renforcé pour inclure explicitement `.env` et `.env.local` afin d'éviter tout commit accidentel d'un fichier `.env` standard.
  - Le fichier `.env.local` est actuellement ignoré par git (vérifié par `git check-ignore`).
* **Scan de clés en dur dans le code :**
  - Recherche par expressions régulières (`sk_`, `whsec_`, `AQ.`, `eyJ...`) effectuée sur l'intégralité du code source (`src/` et `scripts/`).
  - **Résultat :** Aucune clé API réelle n'est présente en dur. Les occurrences trouvées sont des chaînes factices de secours pour le build statique (`sk_test_placeholder_for_build`, `eyJhbGciOi...placeholder`).

---

### 2. Authentification & Autorisation

* **Contrôle d'accès aux routes API sensibles :**
  - `/api/stripe/create-checkout-session` : **Protégée**. Vérifie l'utilisateur via `supabase.auth.getUser()`, renvoie HTTP 401 si non connecté.
  - `/api/stripe/create-portal-session` : **Protégée**. Vérifie l'utilisateur via `supabase.auth.getUser()`, refuse l'accès (HTTP 401) ou si aucun `stripe_customer_id` n'est associé au compte (HTTP 400).
  - `/api/user/usage` : **Protégée**. Ne renvoie que les quotas et informations du profil de l'utilisateur authentifié (HTTP 401 pour les anonymes).
  - `/api/webhooks/stripe` : **Sécurisée**. Exige désormais obligatoirement un header `stripe-signature` valide et la clé secrète configurée.

* **Audit du Webhook Stripe (`/api/webhooks/stripe`) :**
  - **Faille découverte :** Le code comportait un fallback :
    ```typescript
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body) as Stripe.Event; // FAILLE CRITIQUE
    }
    ```
  - **Impact :** Un attaquant externe pouvait forger un événement `checkout.session.completed` sans signature pour élever son compte en Pro ou Agence gratuitement.
  - **Statut :** **CORRIGÉ**. La route rejette immédiatement toute requête non signée avec HTTP 400 (`!webhookSecret || !signature`).

* **Protection de la route `/account` et middleware :**
  - Le middleware (`src/lib/supabase/middleware.ts`) intercepte toutes les requêtes vers `/account`.
  - Si aucun jeton de session valide n'est présent, redirection automatique vers `/login?redirect=/account`.
  - Si un utilisateur connecté tente de visiter `/login` ou `/signup`, il est redirigé vers l'accueil.
  - La page `/account` effectue également un second contrôle côté client et ne charge les données que pour l'ID authentifié.

* **Analyse des Politiques RLS (Row Level Security) Supabase :**
  - Tables auditées : `profiles` et `usage`.
  - `public.usage` :
    - RLS activé (`ALTER TABLE public.usage ENABLE ROW LEVEL SECURITY`).
    - SELECT autorisé uniquement sur `auth.uid() = user_id`.
    - Aucune politique INSERT/UPDATE publique (toutes les écritures passent par le service role serveur).
  - `public.profiles` :
    - RLS activé (`ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY`).
    - SELECT autorisé uniquement sur `auth.uid() = id`.
    - **VULNÉRABILITÉ RLS SUR UPDATE :**
      ```sql
      CREATE POLICY "Les utilisateurs peuvent modifier leur propre profil"
          ON public.profiles FOR UPDATE
          USING (auth.uid() = id);
      ```
      **Risque :** Un utilisateur connecté peut envoyer depuis la console de son navigateur `supabase.from('profiles').update({ plan: 'agence' }).eq('id', user.id)` et s'octroyer un accès illimité sans payer, car PostgreSQL n'a pas de restriction sur les colonnes modifiables.
      **Action requise :** Exécuter une migration SQL pour restreindre les colonnes modifiables (voir Partie 4).

---

### 3. Dispositifs Anti-Abus & Quotas

* **Rate Limiting (10 requêtes / minute par IP) :**
  - Actif sur `/api/analyze`, `/api/smart-analyze` et `/api/capture`.
  - Implémenté via une fenêtre glissante en mémoire (`ipRequestStore` dans `src/lib/security.ts`) avec purge automatique toutes les 5 minutes pour éviter toute fuite mémoire.
  - Renvoie HTTP 429 avec le header `Retry-After`.

* **Protection Anti-SSRF (Server-Side Request Forgery) :**
  - Implémentée dans `validateSafeUrl` (`src/lib/security.ts`).
  - Vérifie le schéma (`http:`, `https:` uniquement).
  - Rejette les hostnames locaux et réservés (`localhost`, `127.0.0.1`, `0.0.0.0`, `::1`, `*.local`, `*.internal`, `*.arpa`).
  - Rejette les plages IP privées et réservées : `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`, `169.254.0.0/16` (bloque l'accès aux métadonnées cloud AWS/GCP `169.254.169.254`), CG-NAT `100.64.0.0/10`.
  - Résolution DNS préventive (`dns.lookup`) pour contrer les attaques par **DNS Rebinding** (domaines pointant vers une IP locale).
  - Présente et active sur `/api/analyze`, `/api/smart-analyze`, `/api/capture`.

* **Contrôle d'intégrité des Quotas :**
  - La vérification du quota est effectuée exclusivement côté serveur dans `src/app/api/smart-analyze/route.ts` via `checkUsageQuota(userId, clientIp, userPlan)`.
  - L'attribut envoyé par le client `isPremiumUser` n'est jamais pris en compte par le serveur. Le statut du plan provient exclusivement de la base de données Supabase.
  - **Anomalie de gestion de quota détectée :**
    - Lorsqu'un utilisateur a épuisé son quota (`isAllowedFullAi = false`), le serveur appelle quand même l'API Gemini Vision (consommation de crédits API inutile) et se contente de supprimer les champs `visualAnalysis` et `justification` de la réponse JSON.
    - **Recommandation :** Quand `isAllowedFullAi` est faux, court-circuiter l'appel à Gemini et basculer directement sur le générateur heuristique local.

---

### 4. Injection & Validation des Entrées
* **Validation des URLs :**
  - Toutes les URLs transmises à Playwright Chromium ou au crawler fetch passent par `validateSafeUrl()`. Si l'URL est invalide ou privée, la requête est rejetée en amont sans démarrer de processus de navigateur.
* **Injections SQL :**
  - Aucun SQL brut concaténé n'est utilisé dans l'application.
  - Toutes les interactions avec PostgreSQL passent par le client Supabase (`supabase-js`), qui utilise des requêtes paramétrées via PostgREST.

---

## PARTIE 2 : AUDIT FONCTIONNEL (CE QUI MARCHE VRAIMENT)

| Fonctionnalité | Statut | Observations & Conditions Réelles |
| :--- | :---: | :--- |
| **Inscription par email** | ⚠️ Partiel | Fonctionne via Supabase Auth. Si l'option "Confirm Email" est active sur Supabase Cloud, l'utilisateur reçoit l'écran "Vérifiez votre boîte de réception". Sans configuration SMTP personnalisée (Resend/SendGrid), Supabase utilise son SMTP par défaut limité à 3-4 emails/heure (peut bloquer en test intensif). |
| **Connexion Google OAuth** | ❌ Non testable sans config | Le bouton déclenche `signInWithOAuth({ provider: 'google' })`. Nécessite la configuration des clés Client ID & Secret Google Cloud Console dans le Dashboard Supabase. Sans cela, Supabase retourne une erreur OAuth. |
| **Wizard : Étape 1 (Analyse URL & Sitemap)** | ✅ Fonctionne | Le crawler extrait les liens, filtre les extensions statiques, et gère le fallback DOM interne. |
| **Wizard : Étape 2 (Smart Sections IA)** | ✅ Fonctionne | Détection DOM multi-signaux + analyse Gemini Vision (modèle `gemini-3.6-flash` avec fallback `gemini-3.5-flash`). Heuristique locale de secours en cas d'absence de clé ou timeout. |
| **Wizard : Étape 3 (Capture Playwright)** | ✅ Fonctionne | Playwright Chromium capture les sections ciblées en haute résolution (avec dimensionnement et rognage coordonné). |
| **Wizard : Étape 4 (Scene Editor / Mockup)** | ✅ Fonctionne | Sélection des cadres (MacBook Pro, iPhone 15 Pro, iPad Air, Safari Window, Minimal Chrome), rotation 3D CSS, ombres douces, fonds dégradés et mesh, ajout de titres et badges. |
| **Wizard : Étape 5 (Export PNG/WebP/ZIP)** | ✅ Fonctionne | Export via `html-to-image` avec gestion du filigrane (masqué pour Pro/Agence). |
| **Décompte des Quotas (Visiteur : 1, Free : 3, Pro : Illimité)** | ✅ Fonctionne | La table `public.usage` enregistre bien la consommation mensuelle. L'UI affiche la jauge et bloque les analyses IA complètes au seuil. |
| **Stripe Checkout (Plan Pro)** | ✅ Fonctionne | `create-checkout-session` génère l'URL Stripe Checkout de test avec metadata `supabase_user_id`. |
| **Stripe Checkout (Plan Agence)** | ✅ Corrigé | Était **CASSÉ** à cause du paramètre `'agency'` au lieu de `'agence'`. Désormais corrigé et fonctionnel. |
| **Webhook Stripe (Mise à jour du profil)** | ✅ Fonctionne | Gère `checkout.session.completed`, `customer.subscription.updated` et `customer.subscription.deleted`. |
| **Portail Client Stripe (Customer Portal)** | ✅ Fonctionne | `/api/stripe/create-portal-session` redirige le client vers l'espace de gestion Stripe pour gérer ou résilier l'abonnement. |

### Inventaire du code résiduel (Placeholders, TODOs, Debug Logs)
- **TODO / FIXME :** 0 commentaire TODO ou FIXME dans le code de production `src/`.
- **Logs de débogage :**
  - 3 logs légitimes dans `/api/webhooks/stripe` (traçabilité des événements de facturation).
  - 3 logs légitimes dans `/api/smart-analyze` (surveillance du modèle Gemini actif).
  - Aucun dump de données sensibles (`console.log(password)` ou tokens).

---

## PARTIE 3 : RESPONSIVE & UX

### 1. Audit Responsive Mobile & Tablette
* **`/login` et `/signup` :**
  - 375px (iPhone SE) : Cartes centrées, paddings fluides (`px-4 sm:px-10`), boutons pleine largeur, tailles de police adaptées (`text-xs sm:text-sm`). Aucun débordement horizontal.
  - 440px (iPhone 15 Pro Max) : Parfait alignement des champs et du bouton Google OAuth.
  - 768px (iPad Mini / Tablette) : Carte contenue dans un conteneur `sm:max-w-md`.
* **`/pricing` :**
  - 375px & 440px : Grille tarifaire basculant en 1 colonne verticale (`grid-cols-1`). Les badges et listes d'avantages sont lisibles.
  - 768px : Mise en page 1 colonne ou 2 colonnes (`md:grid-cols-2`), puis 3 colonnes sur desktop (`lg:grid-cols-3`).
* **`/account` :**
  - 375px & 440px : En-tête profil empilé verticalement (`flex-col sm:flex-row`), bouton de déconnexion positionné sans chevauchement. La jauge de quota s'adapte à la largeur d'écran.
  - 768px : Grille 2 colonnes (`md:grid-cols-2`) pour la consommation et la facturation.

### 2. Écrans et États de Chargement
- `/account` : Spinner centré `Loader2` pendant la récupération du profil et de l'usage. Bouton portail Stripe avec état `isPortalLoading`.
- `/pricing` : Bouton "Passer Pro/Agence" avec état `Loader2` ("Redirection vers Stripe...") pour éviter les doubles clics.
- `/account?success=true` : Bannière verte animée avec `CheckCircle2` confirmant l'activation immédiate du forfait.
- Wizard (`/`) : Stepper animé avec étapes détaillées lors de l'analyse (Sitemap -> DOM -> Vision IA) et de la capture Playwright.

---

## PARTIE 4 : FEUILLE DE ROUTE PRIORISÉE (CE QU'IL RESTE À FAIRE)

### 🔴 P0 — Bloquant (Sécurité, Légal & Lancement Réel)
1. **Verrouillage RLS Supabase sur la colonne `plan` (Sécurité critique) :**
   Exécuter la migration suivante dans Supabase SQL Editor pour empêcher la modification arbitraire du plan par l'utilisateur :
   ```sql
   -- Révoquer la mise à jour des colonnes sensibles pour le rôle authentifié
   REVOKE UPDATE ON public.profiles FROM authenticated;
   GRANT UPDATE (email) ON public.profiles FROM authenticated;
   ```
2. **Création des pages légales obligatoires :**
   - `/terms` (Conditions Générales d'Utilisation et de Vente — CGU/CGV) : Mentions légales, conditions d'abonnement, droit de rétractation (14 jours ou renonciation expresse pour produit numérique immédiat).
   - `/privacy` (Politique de Confidentialité — RGPD) : Collecte d'emails, cookies d'authentification Supabase, sous-traitants (Stripe, Supabase, Google).
   - Lien vers ces pages dans le footer de la landing page et dans `/pricing`.
3. **Migration des clés Stripe en mode Production (Live) :**
   - Passer de `sk_test_...` à `sk_live_...` et `whsec_...` de production.
   - Créer les produits et prix réels sur le Dashboard Stripe Live et renseigner `STRIPE_PRO_PRICE_ID` et `STRIPE_AGENCE_PRICE_ID`.
4. **Configuration du domaine personnalisé & Déploiement Vercel :**
   - Mettre à jour `NEXT_PUBLIC_SITE_URL` avec l'URL réelle (ex: `https://omnimockup.com`).
   - Mettre à jour les URLs de redirection Supabase Auth (`Site URL` et `Redirect URLs` dans Supabase > Authentication > URL Configuration).

---

### 🟡 P1 — Important non bloquant (Expérience utilisateur & Robustesse)
5. **Configuration d'un fournisseur SMTP pour Supabase Auth :**
   - Configurer Resend, Postmark ou SendGrid dans Supabase pour garantir la délivrabilité des emails de confirmation et de réinitialisation de mot de passe (le SMTP par défaut de Supabase bloque à 3 emails/heure).
6. **Configuration Google OAuth :**
   - Créer un projet sur Google Cloud Console, configurer l'écran de consentement OAuth et les identifiants Client Web.
   - Ajouter l'URI de redirection Supabase (`https://<project-ref>.supabase.co/auth/v1/callback`).
   - Activer le provider dans Supabase Dashboard.
7. **Optimisation du coût de l'API Gemini :**
   - Dans `src/app/api/smart-analyze/route.ts`, si `quotaCheck.allowedFullAnalysis === false`, ne pas appeler l'API Google Gemini et renvoyer directement le résultat du fallback heuristique local.
8. **Gestion explicite des échecs de paiement Stripe :**
   - Écouter l'événement webhook `invoice.payment_failed` pour envoyer une notification ou basculer le statut en `past_due`.
9. **Page 404 & Gestion des erreurs globale :**
   - Améliorer `/src/app/_not-found.tsx` et ajouter `error.tsx` pour intercepter les plantages inattendus.

---

### 🟢 P2 — Nice-to-Have (Améliorations futures)
10. **Historique des créations et mockups sauvegardés :**
    - Sauvegarder les scènes créées dans une table `scenes` liée à l'utilisateur pour qu'il puisse les rééditer plus tard.
11. **Multi-formats d'export en 1 clic :**
    - Génération simultanée en 1:1 (Instagram), 16:9 (Twitter/LinkedIn) et 9:16 (Story/TikTok).
12. **Presets de thèmes pré-configurés :**
    - Styles Dark Tech, Minimalist Paper, Gradient Glow, Clay 3D.

---

## RAPPORT FINAL DE SYNTHÈSE

### 1. Tableau des Failles de Sécurité
| Réf | Faille identifiée | Gravité | Statut | Action / Remédiation |
| :---: | :--- | :---: | :---: | :--- |
| **SEC-01** | Absence de vérification de signature sur le Webhook Stripe en mode fallback | 🔴 Critique | **CORRIGÉ** | Le webhook exige désormais strictement `stripe-signature` et `STRIPE_WEBHOOK_SECRET`. |
| **SEC-02** | RLS permissif sur `profiles` (`UPDATE USING (auth.uid() = id)`) | 🔴 Critique | **À appliquer** | Exécuter le script SQL pour restreindre les colonnes modifiables par l'utilisateur connecté (`REVOKE UPDATE`). |
| **SEC-03** | Appel Gemini Vision maintenu même en cas de dépassement de quota (fuite de coûts) | 🟠 Majeure | **À optimiser** | Court-circuiter l'appel Gemini quand le quota est dépassé pour économiser les tokens API. |
| **SEC-04** | Protection `.gitignore` incomplète pour les fichiers `.env` non suffixés | 🟡 Mineure | **CORRIGÉ** | Ajout explicite de `.env` et `.env.local` dans `.gitignore`. |
| **SEC-05** | Exposition de secrets côté client | 🟢 Aucune | **CONFORME** | Aucune clé secrète n'a le préfixe `NEXT_PUBLIC_`. |
| **SEC-06** | Vulnérabilité SSRF sur les requêtes de capture et d'analyse | 🟢 Aucune | **CONFORME** | Module Anti-SSRF complet avec validation IP, DNS lookup et blocage metadata cloud. |

### 2. Tableau des Fonctionnalités en Conditions Réelles
| Composant / Flux | Statut | Commentaire |
| :--- | :---: | :--- |
| **Authentification Email** | 🟡 Partiel | Fonctionnel, dépend des quotas SMTP de test Supabase. |
| **Authentification Google** | ⚪ Non testable par l'agent | Nécessite la configuration des clés OAuth dans Google Cloud & Supabase. |
| **Génération / Wizard Mockup** | 🟢 Fonctionne | Pipeline complet opérationnel (Analyse -> DOM -> IA -> Capture -> Mockup -> Export). |
| **Système de Quotas (1/3/Illimité)** | 🟢 Fonctionne | Décompte côté serveur dans `public.usage`, blocage visuel sur l'interface. |
| **Paiement Stripe Checkout** | 🟢 Fonctionne | Sessions Checkout créées, correction de l'incompatibilité de l'offre Agence. |
| **Webhook de mise à jour des plans** | 🟢 Fonctionne | Mise à jour automatique de la base à la réception de la confirmation Stripe. |
| **Portail Client Stripe** | 🟢 Fonctionne | Ouverture de la session de facturation/résiliation Stripe. |
| **Responsive Mobile (375-768px)** | 🟢 Fonctionne | Aucune régression, adaptation fluide de tous les nouveaux écrans. |
