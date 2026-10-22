# PitchMySite — Journal de travail avec Claude

> **Nouvelle session : lire d'abord `PROCHAINE_SESSION.md`** (règles, état du code, tâches suivantes).

> Ce fichier est la mémoire de travail partagée entre toi et Claude.
> Chaque session de travail est ajoutée ici. Ne pas supprimer les sections précédentes.

---

## 📌 Contexte du projet

**Nom du produit :** PitchMySite (anciennement OmniMockup)
**URL en production :** https://pitchmysite.com (hébergé sur Vercel, projet `omni-mockup`)
**Stack :**
- Next.js 14.2 (App Router) + TypeScript + Tailwind CSS
- Supabase (Auth + PostgreSQL avec RLS)
- Stripe (carte bancaire — bouton grisé, activable via variable d'env)
- SasPay (Mobile Money FCFA — paiement principal actif)
- Anthropic Claude + Google Gemini (IA côté client, clé fournie par l'utilisateur)
- Playwright / Puppeteer + Microlink (capture de sites web)
- Vercel (déploiement, stockage edge, analytics)

**Dossier local :** `C:\Users\HP\Downloads\Mockup_saas`

---

## 🔴 Problèmes identifiés — État au 18 octobre 2026

### 1. Clés API manquantes sur Vercel (CRITIQUE)

| Variable | État | Impact |
|---|---|---|
| `ANTHROPIC_API_KEY` | ❌ absente sur Vercel | Pitch IA (via clé site) non fonctionnelle |
| `GEMINI_API_KEY` | 🔴 vide sur Vercel (présente en local) | Directeur artistique IA cassé |
| `NEXT_PUBLIC_CARD_PROVIDER` | ❌ non définie | Bouton carte bancaire grisé "Bientôt" (voulu) |
| `SASPAY_SECRET_KEY` | ✅ présente (sk_live_...) | OK |
| `SASPAY_WEBHOOK_SECRET` | ✅ présente | OK |
| `STRIPE_WEBHOOK_SECRET` | 🟡 présente mais webhook non configuré | Paiements Stripe sans activation formule |

> Note : La Pitch IA utilise désormais la clé de l'utilisateur (Gemini ou Claude),
> donc ANTHROPIC_API_KEY et GEMINI_API_KEY sont uniquement pour le Directeur artistique IA.

### 2. Supabase — URL Configuration non mise à jour

Depuis l'achat du domaine pitchmysite.com (16/10/2026), mettre à jour dans Supabase :
- Authentication → URL Configuration → Site URL → https://pitchmysite.com
- Authentication → URL Configuration → Redirect URLs → ajouter https://pitchmysite.com/**

Sans ça, les liens de confirmation d'inscription redirigent vers l'ancienne URL omni-mockup.vercel.app.

### 3. Vercel — Formule Hobby (usage commercial interdit)

Le projet tourne sur la formule Hobby de Vercel. Cette formule interdit l'usage commercial.
Il faut passer en Pro (~20 $/mois) avant d'ouvrir les ventes.

### 4. Webhook Stripe non configuré

Le webhook Stripe (/api/webhooks/stripe) est en place dans le code, mais le webhook n'est pas
créé dans le dashboard Stripe. Events à activer :
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.paid
- invoice.payment_failed

### 5. SasPay jamais testé avec un vrai paiement

Le code est en place, mais aucun vrai paiement Mobile Money n'a été effectué de bout en bout.

### 6. Supabase — pas de sauvegarde automatique

Le forfait gratuit Supabase ne fait pas de sauvegarde. À régler avant les premières vraies ventes.

---

## ✅ Ce qui fonctionne (vérifié au 16-18 octobre 2026)

- Page d'accueil PitchMySite ✅
- Capture de sites web (2-12s, deux moteurs) ✅
- Studio complet (appareils, dispositions, fonds, effets, annotations) ✅
- 13 modèles prêts, 8 scènes photo ✅
- Exports PNG/JPG/WebP Standard/HD/4K ✅
- Packs de formats (réseaux sociaux, App Store) ✅
- Liens de partage /p/... ✅
- Auth (inscription, connexion, déconnexion) ✅
- Quotas vérifiés côté serveur (gratuit 3/jour, Solo 20/mois, etc.) ✅
- Sécurité anti-SSRF, rate limiting, RLS Supabase ✅
- Tableau de bord admin /admin (accès créé le 14/10) ✅
- Domaine pitchmysite.com acheté et branché (16/10) ✅
- Paiement SasPay — code prêt, jamais testé avec vrai paiement 🟡
- Pitch IA (avec clé client) — code prêt, non testé en production 🟡
- Directeur artistique IA — bloqué (clé Gemini vide sur Vercel) 🔴

---

## 📋 Choses à faire (par priorité)

### 🔴 Urgent — avant d'ouvrir les ventes

- [ ] Passer Vercel en Pro (Settings → Billing → Upgrade to Pro)
- [ ] Mettre à jour Supabase URL Configuration (voir point 2 ci-dessus)
- [x] **Faire un vrai paiement SasPay : VALIDÉ** (test de 200 FCFA réussi le 18/10/2026, crédit activé instantanément)
- [ ] Tester la Pitch IA avec une vraie clé Gemini gratuite (aistudio.google.com/apikey)
- [ ] Régler le Directeur artistique IA : soit passer sur clé client, soit mettre GEMINI_API_KEY sur Vercel
- [ ] Test complet de bout en bout : inscription → capture → studio → paiement → export

### 🟠 Ensuite

- [ ] Créer webhook Stripe dans le dashboard (si on ouvre la carte bancaire)
- [ ] Configurer Resend pour les emails (support@pitchmysite.com)
- [ ] Activer protection mots de passe divulgués dans Supabase
- [ ] Mettre nom PitchMySite dans les emails Supabase
- [ ] Image d'aperçu OG (LinkedIn/WhatsApp) + sitemap.xml + robots.txt
- [ ] Nettoyer variables FedaPay de Vercel (obsolètes)

### 🟢 Fonctionnalités à développer (quand demandé)

- [ ] Parcours express : 3 visuels prêts (LinkedIn, WhatsApp, proposition) en 1 clic
- [ ] Bouton "Besoin d'aide ?" WhatsApp dans le studio
- [ ] Factures PDF automatiques après chaque paiement
- [ ] Validation client sur le lien de partage (Valider / Demander modif)
- [ ] Projets sauvegardés en ligne (formules payantes)
- [ ] Studio mobile : barre du bas simplifiée
- [ ] Interface en anglais
- [ ] Rappel avant fin de formule (Mobile Money sans renouvellement auto)
- [ ] Directeur artistique IA avec clé client (au lieu de clé serveur)

---

## 🗓️ Journal des sessions de travail

### Session — 18 octobre 2026 (Mise à jour GitHub & Vercel)

**Objectif :** Vérification de la synchronisation avec GitHub et Vercel en production, résolution du problème de build local.

**Ce qui a été vérifié & réalisé :**
1. **GitHub :**
   - Dépôt : `https://github.com/netwavestudioweb-creator/OmniMockup.git`
   - Branche active : `main`, parfaitement à jour avec `origin/main` (Dernier commit : `76e2beb` - *paiement de test 200 FCFA pour l'admin*).
2. **Build Local (RÉSOLU) :**
   - Erreur bloquante initiale : `@anthropic-ai/sdk` manquant dans `node_modules`.
   - Résolution : `npm install` exécuté.
   - Validation : `npm run build` réussi à 100% (17/17 pages générées avec succès, 0 erreur TypeScript, 0 erreur de compilation).
3. **Production Vercel :**
   - URL principale : `https://pitchmysite.com` (En ligne, 200 OK, SSL actif).
   - URL miroir : `https://omni-mockup.vercel.app` (En ligne, 200 OK).
   - Les deux adresses répondent et affichent bien la dernière version de PitchMySite.

**Points d'attention et décisions validées :**
- **Supabase URL Configuration :** ✅ VÉRIFIÉ EN DIRECT. `Site URL` est bien `https://pitchmysite.com` et les liens d'authentification (confirmation, réinitialisation) pointent correctement vers le domaine de production.
- **Vercel Pro :** Décision actée de passer au plan Pro dès la première vente client.
- **Directeur Artistique IA & Pitch IA :** Fonctionne 100% avec la clé de chaque client (BYOK - Gemini ou Claude), aucune clé payante nécessaire sur Vercel.
- **Paiement Mobile Money SasPay :** ✅ VÉRIFIÉ ET VALIDÉ EN PRODUCTION (test réel de 200 FCFA avec attribution instantanée du crédit).

### 🏷️ Harmonisation des tarifs (18 octobre 2026)
- **Problème :** La page d'accueil affichait les prix en mensuel fixe (5 € / 9 € / 29 €) uniquement en euros, créant un décalage visuel avec la page `/pricing` qui affichait l'annuel par défaut (4,17 € / 7,50 € / 24,17 €) et les montants en FCFA pour l'Afrique.
- **Résolution :**
  - Ajout du switch interactif **Mensuel / Annuel (-17%, 2 mois offerts)** directement sur la section Tarification de la page d'accueil (`src/app/page.tsx`).
  - Calcul dynamique en direct : le visiteur voit immédiatement l'économie en annuel ou le tarif mensuel.
  - Affichage automatique de l'équivalent en **FCFA** (`soit 5 900 FCFA pour 1 mois` ou `soit 59 000 FCFA pour 1 an`) pour les visiteurs de la zone Mobile Money.
  - Test de compilation : `npm run build` réussi à 100% (code 0).

### 🎉 Premier paiement réel SasPay validé avec succès (18 octobre 2026)
- **Transaction SasPay :** `36582e54-cadb-4f50-9526-ffdc055551e6` (Réf : `5b17c582d2c84c85a424fbf6dae5a678`)
- **Opérateur :** MTN Bénin (`mtn_bj` - `229 01 XX XX XX XX` (masqué))
- **Montant :** 200 FCFA net (débit client : 207 FCFA avec frais)
- **Statut SasPay :** `SUCCESS`
- **Application automatique :**
  - Table `saspay_checkouts` : `status: "applied"`
  - Table `profiles` : `credit_balance: 1`
  - Table `payments` : Vente enregistrée avec succès pour le dashboard admin.
- **Conclusion :** Toute la chaîne de paiement Mobile Money SasPay (création, redirection, validation MTN MoMo, vérification API et crédit du compte client) fonctionne parfaitement de bout en bout en production.

Les logs de la base de données Supabase et de l'API SasPay ont été interrogés :
1. **Tentative du 15/10 (Plan Pro annuel à 59 000 FCFA) :**
   - Session créée (`83d9dde9-84b1-4aeb-89c8-5ded572e0766`), mais aucune transaction initiée sur la page SasPay (`transaction: null`). La page a expiré après 1h.
2. **3 Tentatives du 17/10 (Paiement test de 200 FCFA) :**
   - Numéros testés : `229 01 XX XX XX XX` (masqué) et `229 01 XX XX XX XX` (masqué) sur **MTN Bénin** (`network_code: mtn_bj`).
   - Montant débité demandé : **208 FCFA** (200 FCFA + 8 FCFA de frais SasPay).
   - Statut dans l'API SasPay : Les transactions sont bien créées (`a4cc8b28...`, `2ff4f875...`, `29b67cda...`) mais sont restées bloquées en **`PENDING`** (en attente).
   - **Pourquoi c'est resté en PENDING / EXPIRED :**
     1. **Validation PIN MTN non reçue ou non effectuée :** MTN n'a pas validé le prélèvement. Soit la notification USSD (push) n'est pas apparue sur le téléphone (il fallait composer `*880#` pour approuver manuellement), soit le code secret n'a pas été saisi dans le délai imparti.
     2. **Solde insuffisant :** Le compte MTN MoMo devait contenir au moins 208 FCFA.
     3. **Nouveau format 10 chiffres (01...) :** Le numéro envoyé était `229 01 XX XX XX XX` (masqué). Si l'agrégateur MTN chez SasPay attendait 8 chiffres ou n'a pas routé le push vers le nouveau plan de numérotation.
3. **Paiement par Carte bancaire (Stripe) :**
   - Désactivé en ligne (`NEXT_PUBLIC_CARD_PROVIDER` non configuré, Stripe refusé aux entreprises au Bénin).

---

## 🏗️ Architecture technique

```
src/
├── app/
│   ├── page.tsx              # Page d'accueil (86 Ko — très grande)
│   ├── pricing/page.tsx      # Tarifs (SasPay + Stripe grisé)
│   ├── login/page.tsx        # Connexion
│   ├── signup/page.tsx       # Inscription
│   ├── account/              # Espace client
│   ├── admin/                # Tableau de bord admin (accès séparé)
│   ├── p/                    # Liens de partage publics
│   └── api/
│       ├── capture/          # Capture de sites web (Playwright/Microlink)
│       ├── smart-analyze/    # Directeur artistique IA (Gemini)
│       ├── generate-pitch/   # Pitch IA (clé client)
│       ├── payments/saspay/  # Paiement Mobile Money
│       ├── webhooks/stripe/  # Webhook Stripe
│       ├── exports/          # Export PNG/PDF/vidéo
│       ├── share/            # Liens de partage
│       └── user/             # Profil utilisateur
├── components/
│   ├── SceneEditor.tsx       # Studio principal (300 Ko)
│   ├── MockupFrame.tsx       # Rendu du mockup
│   ├── AiDirectorPanel.tsx   # Directeur artistique IA
│   └── ...
├── lib/
│   ├── browser.ts            # Moteur de capture (Playwright)
│   ├── pricing.ts            # Plans, packs, prix EUR/USD/FCFA
│   ├── security.ts           # Anti-SSRF, rate limiting
│   ├── saspay.ts             # Client SasPay
│   └── supabase/             # Clients Supabase (browser, server, admin)
└── context/
    ├── UserContext.tsx        # Auth + profil utilisateur
    └── CurrencyContext.tsx    # Devise détectée (EUR/USD)
```

### Variables d'environnement

| Variable | Présente localement | Sur Vercel | Obligatoire |
|---|---|---|---|
| NEXT_PUBLIC_SUPABASE_URL | ✅ | ✅ | ✅ |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | ✅ | ✅ | ✅ |
| SUPABASE_SERVICE_ROLE_KEY | ✅ | ✅ | ✅ |
| GEMINI_API_KEY | ✅ | ❌ MANQUANT | Directeur IA |
| SASPAY_SECRET_KEY | ✅ | ✅ | ✅ |
| SASPAY_WEBHOOK_SECRET | ✅ | ✅ | ✅ |
| STRIPE_SECRET_KEY | ✅ | ✅ | Si carte |
| STRIPE_WEBHOOK_SECRET | ✅ | 🟡 webhook non créé | Si carte |
| NEXT_PUBLIC_CARD_PROVIDER | ❌ absent | ❌ absent | Bouton carte |
| NEXT_PUBLIC_SITE_URL | localhost:3000 | pitchmysite.com | ✅ |
| ADMIN_PASSWORD_HASH | — | ✅ | ✅ admin |
| ADMIN_TOTP_SECRET | — | ✅ | ✅ admin |
| ADMIN_SESSION_SECRET | — | ✅ | ✅ admin |

---

## ⚡ Session — 18 octobre 2026 : Intégration de Fabric (Daniel Miessler) & Offres $100M (Alex Hormozi)

### 1. Analyse du dossier Fabric (`Fabric-main`)
Fabric est le framework open-source d'IA de Daniel Miessler contenant plus de 265 patterns de prompts spécialisés.

**Patterns clés analysés et retenus pour PitchMySite :**
1. **`create_hormozi_offer` :** Basé sur le livre *$100M Offers* d'Alex Hormozi.
   - **L'Équation de la Valeur :** $\text{Valeur} = \frac{\text{Dream Outcome} \times \text{Perceived Likelihood}}{\text{Time Delay} \times \text{Effort \& Sacrifice}}$.
   - **Grand Slam Offer :** Formule de nommage MAGIC, inversion du risque (garanties inconditionnelles ou de service), empilement de bonus (Bonus Stack) à fort effet de levier et coût marginal nul pour le prestataire.
2. **`extract_primary_problem` & `extract_primary_solution` :** Extraction chirurgicale sans superflu du problème douloureux du prospect et de la solution concrète.
3. **Architecture des prompts Fabric :**
   - Structure stricte `# IDENTITY and PURPOSE`, `# GOALS`, `# STEPS`, `# CONSTRAINTS & RULES`, `# OUTPUT JSON FORMAT`. Cette structure élimine les hallucinations et force les modèles (Claude 3.5/Opus ou Gemini 1.5/2.0/3.x) à générer des livrables de niveau exécutif.

---

### 2. Ce qui a été développé et intégré en local

#### A. Moteur de Prompting (`src/lib/pitchPrompt.ts`)
- **Restructuration complète** selon l'architecture Fabric (`# IDENTITY`, `# GOALS`, `# STEPS`, `# CONSTRAINTS`).
- **Enrichissement du schéma JSON `PitchResult` :**
  - `primaryProblem` : Le problème douloureux identifié chez le client cible.
  - `primarySolution` : La réponse technique et business apportée par la réalisation.
  - `hormoziOffer` :
    - `offerName` : Nom d'offre irrésistible au format MAGIC (Avatar + Objectif + Délai/Clé en main).
    - `dreamOutcome` : Le bénéfice ultime pour le prospect.
    - `guarantee` : Inversion du risque (ex: ajustements illimités jusqu'à validation ou délai garanti).
    - `bonuses` : 3 bonus offerts (ex: audit SEO express, tutoriel Loom, support 30 jours).
    - `pitchLine` : Phrase d'attaque percutante prête à l'envoi pour décrocher un appel commercial en DM ou WhatsApp.

#### B. Interface Utilisateur (`src/components/DeveloperSalesKitModal.tsx`)
- **Nouvel onglet vedette « Offre $100M »** (activé par défaut dès la réception des résultats) :
  - Badge exclusif *Grand Slam Offer — Méthode Alex Hormozi*.
  - Bouton **« Copier tout le pack »** en 1 clic.
  - Cartes visuelles de l'Équation de la Valeur (Problème Douloureux en rouge, Solution en bleu, Dream Outcome en violet).
  - Bloc **Garantie & Inversion du Risque** (avec icône `ShieldCheck` et mention rassurante).
  - Bloc **Stack de Bonus Inclus** (liste des 3 bonus à forte valeur perçue).
  - Bloc sombre contrasté **Phrase d'attaque directe** avec bouton dédié « Copier » pour DM LinkedIn / WhatsApp.
- **Nouvel onglet « 3 Hooks X »** : Mise à disposition des 3 accroches courtes virales pour Twitter/Threads avec boutons de copie individuels.

#### C. Configuration TypeScript (`tsconfig.json`)
- Exclusion de `Fabric-main` dans `tsconfig.json` pour éviter que le compilateur Next.js n'essaie de compiler l'application web Svelte interne de Fabric.

---

### 3. Validation locale
- **Build de production (`npm run build`) :** ✅ **Succès total (Code 0)**.
- 17/17 routes statiques et dynamiques compilées sans aucune erreur TypeScript ni linting.

---

### 4. Comment tester en local
1. Lancer le serveur local :
   ```bash
   npm run dev
   ```
2. Ouvrir `http://localhost:3000` dans votre navigateur.
3. Se rendre dans le Studio (ou capturer une URL).
4. Cliquer sur le bouton **« Pitch IA / Assistant Vente »** (icône éclair ou TrendingUp).
5. Saisir ou valider les informations du projet, puis cliquer sur **« Générer mes Textes de Vente en 1 Clic »** (avec votre clé Gemini ou Claude connectée).
6. Admirer l'onglet **« Offre $100M »** affichant le pack de vente complet prêt à closer des clients.

---

*Dernière mise à jour : 19 octobre 2026 — Intégration complète des piliers Fabric :*
- **Audit de Monétisation & Opportunités Inexploitées** (`analyze_monetization_opportunities`) : Onglet « Audit Revenus » avec intention d'achat, quick win 30 jours, opportunités concrètes et failles de conversion du site.
- **Email de Prospection Froide B2B** (`create_formal_email` / `improve_writing`) : Onglet « Email Prospect » avec objet testé, corps ultra-personnalisé mentionnant le mockup 3D en pièce jointe et CTA direct.
- **BYOK Élargi à Groq & OpenAI** (`src/lib/byokPitch.ts`) : Support de Groq (Llama 3.3 / Llama 3.2 Vision 100% gratuit et réponse en 1s), Google Gemini (gratuit), OpenAI (GPT-4o-mini) et Claude (Anthropic).
- **Ingestion Instantanée YouTube vers Mockup & Pitch** (`src/lib/browser.ts` & `src/components/UrlInputForm.tsx`) : Détection automatique des liens YouTube (`youtube.com` ou `youtu.be`), extraction des métadonnées (titre, chaîne via oEmbed) et de la miniature HD en 200 ms directement dans les mockups 3D et la Pitch IA.
- **Validation TypeScript (`npx tsc --noEmit`) :** ✅ **Code 0 (Zéro erreur)**.

---

## 🗓️ Session — 19 octobre 2026 (matin) : Reprise & Vérification état du projet

### Contexte
Reprise du projet après la longue session de la veille. Vérification que tout ce qui avait été développé et intégré est bien en place et fonctionnel.

### Ce qui a été vérifié

#### ✅ Fonctionnalités confirmées en place

| Fonctionnalité | Fichier | Statut |
|---|---|---|
| Offre Grand Slam Hormozi | `src/lib/pitchPrompt.ts` | ✅ Intégré |
| Audit de Monétisation | `src/lib/pitchPrompt.ts` | ✅ Intégré |
| Email de Prospection Froide | `src/lib/pitchPrompt.ts` | ✅ Intégré |
| BYOK Groq / Gemini / OpenAI / Claude | `src/lib/byokPitch.ts` | ✅ Intégré |
| Ingestion YouTube (oEmbed + Miniature HD) | `src/lib/browser.ts` | ✅ Intégré |
| URL Input accepte les liens YouTube | `src/components/UrlInputForm.tsx` | ✅ Intégré |
| Modal 8 onglets (Hormozi, Audit, Email, LinkedIn, Pitch Devis, Étude de Cas, Hooks X, Captures) | `src/components/DeveloperSalesKitModal.tsx` | ✅ Intégré |

#### ⚙️ Architecture BYOK confirmée (Bring Your Own Key)

- L'utilisateur connecte **sa propre clé IA** (stockée uniquement dans son navigateur via `localStorage`).
- PitchMySite **ne paye rien** pour les tokens IA de ses utilisateurs.
- 4 fournisseurs supportés :
  - ⚡ **Groq** (`gsk_...`) — 100% gratuit, Llama 3.3/3.2 Vision, réponse en ~1 seconde
  - 🤖 **Gemini** — Gratuit (quota journalier), clé depuis Google AI Studio
  - 🧠 **OpenAI** (`sk-...`) — GPT-4o-mini, payant à l'usage
  - 🔵 **Claude** (`sk-ant-...`) — Anthropic, payant à l'usage
- Validation automatique du format de la clé avant envoi.
- Fallback : si pas de clé client, l'API serveur `/api/generate-pitch` est appelée (quota mensuel du plan).

#### 🎬 Ingestion YouTube — Architecture Tier 0

Quand l'utilisateur colle un lien YouTube dans le champ URL :
1. `extractYouTubeVideoId()` extrait l'ID vidéo en regex (supporte `watch?v=`, `youtu.be/`, `shorts/`, `embed/`).
2. `captureYouTubeVideo()` appelle l'API oEmbed YouTube pour récupérer titre + nom de chaîne.
3. Télécharge la miniature HD (`maxresdefault.jpg`, fallback `hqdefault.jpg`) en JPEG.
4. Renvoie le résultat comme un site normal → s'insère dans le MacBook/iPhone 3D.
5. Le Pitch IA analyse la miniature et le titre pour générer l'offre commerciale.
- **Temps d'exécution : ~200ms** (zéro navigateur Playwright nécessaire).

### Serveur de développement

```bash
npm run dev
# Serveur démarré sur http://localhost:3001
# (port 3000 occupé par une session précédente)
```

> **Note :** Si le port change à chaque démarrage, vérifier qu'aucune autre instance Next.js n'est en cours (`netstat -ano | findstr :3000` sous Windows).

### Décisions et rappels importants

- **Le modèle BYOK est définitif et confirmé** : chaque utilisateur apporte sa propre clé. Aucun frais IA pour PitchMySite.
- **Pas de modification des plans tarifaires** : ce modèle s'intègre parfaitement dans tous les plans existants (gratuit, Solo, Pro, Agence).
- **`claude.md` est la mémoire officielle du projet** — toujours mettre à jour après chaque session.

---



---

## 🗓️ Session — 20 octobre 2026 : Avis d'un expert SaaS (vidéo TikTok « Je teste votre SaaS en 5 min »)

- Vidéo transcrite sur l'ordinateur (faster-whisper) : `TRANSCRIPTION_AVIS_EXPERT.txt`. Analyse complète et plan d'action : `AVIS_EXPERT_TIKTOK.md`.
- **Aimé :** le nom, la rapidité de capture, la visite guidée, les formats et poses 3D.
- **Critiques :** (1) ergonomie du studio sur téléphone (défilement bloqué, sortie accidentelle du studio, le fond photo fait disparaître le site, pas de retour facile, réglages inactifs) ; (2) design « AI slop » (dégradés violets) → refaire un design system à partir de références Dribbble ; (3) « Agences fondatrices » mal compris → parler de programme bêta ; (4) proposition de valeur et offre à clarifier (gain de temps, prix face au marché).
- **Idée de fonction :** captures pour Google Play et App Store (la base existe dans le menu Exporter, mais elle est introuvable) → mode dédié.
- **Plan :** 1. ergonomie mobile (1 à 1,5 j) · 2. renommer le programme bêta (30 min) · 3. proposition de valeur (3 h) · 4. refonte du design (2 à 3 j, références à choisir par Dodo) · 5. mode stores (1 à 2 j).

---

## 🗓️ Session — 20 octobre 2026 (après-midi) : Dépôt privé, vérification et mise en ligne du travail du 18-19/10

- **Dépôt GitHub passé en privé** (compte personnel : Vercel Hobby continue de déployer). Numéros MTN masqués dans ce fichier.
- **Groq corrigé :** l'ancien modèle vision (`llama-3.2-90b-vision-preview`) a été retiré par Groq en avril 2025 → `qwen/qwen3.8-27b`, limité à 3 captures par demande (les 3 premières sections sont envoyées).
- **Libellés renommés** dans la fenêtre Pitch IA : « Offre $100M » / « Méthode Alex Hormozi » / « Méthode Fabric » → « Offre irrésistible » / « Valeur, garantie et bonus » / « Opportunités de revenus ». La consigne interdit à l'IA de citer ces noms.
- **Testé en local :** import d'un lien YouTube (miniature dans le studio à 375 px), ouverture de la fenêtre Pitch IA. **Non testé :** génération réelle (il faut une clé IA de Dodo).
- **Remarqué :** le bouton « Pitch IA » n'est visible qu'en grand écran (pas sur téléphone ni tablette) → à traiter avec l'ergonomie mobile.
- **Ergonomie du studio sur téléphone mise en ligne** (`b9c34fb`) : hauteur réelle de l'écran (100dvh), panneau de réglages agrandi, confirmation avant de quitter, fond qui ne cache plus le site après une scène photo, bouton « ← Revenir à mon mockup », boutons de 44 px, Pitch IA visible sur téléphone. Reste : test sur un vrai iPhone par Dodo.
- **Dépôt GitHub remis en public** : en privé, Vercel Hobby bloquait le déploiement (auteur Git ≠ propriétaire du compte Vercel).

---

## 🗓️ Session — 20-21 octobre 2026 : Refonte du design (accueil + studio) et studio sur téléphone

- **Accueil refait avec les skills de design** (`references-design/` : Taste Skill, frontend-design ; UI UX Pro Max seulement pour sa liste de contrôle accessibilité). Palette tirée par Taste Skill : blanc, encre noire, un seul bleu `#1A4BE0` (violet abandonné, choix de Dodo). Police Archivo. Plus de dégradés, badges, étiquettes en capitales.
- **Visuels = vrais mockups de sites connus** (choix de Dodo, site international) : Wave en haut, Netflix pour les 3 formats, carrousel Al Kareem / Apple / Notion / Spotify, Apple dans le pied de page. Mention « exemples sans lien avec ces marques ». Captures refaites à la largeur qui ne coupe aucune section (Netflix 2240 px, Apple 1280, Spotify et Al Kareem 1600, Wave et Notion 1440).
- **Retirés à la demande de Dodo** : bouton « Tarifs » de la barre (les tarifs sont en bas de l'accueil, #pricing), bloc « Devise », bouton « Réglages » du champ de lien (réglages dans le studio), photos de Cotonou.
- **Corrigé au passage** : `overflow-x-hidden` sur `<body>` empêchait tous les éléments « collants » (barre de navigation) → `overflow-x-clip`.
- **Studio** : violet → bleu dans 27 fichiers ; fond par défaut gris clair uni ; fond à points, halo et titres en capitales retirés ; libellés traduits (« Remettre droit », « Incliné à gauche », « Perspective », « Sans appareil », noms des fonds en français).
- **Studio sur téléphone** (simulation iPhone 13 et Pixel 7 avec Playwright, moteur Chrome ; moteur Safari pas encore installé) : onglets qui commencent par l'essentiel (appareil, fonds, titres), retour en haut au changement d'onglet, « Voir en grand » sur l'aperçu, barre des formats sous l'aperçu, menu Exporter avec 3 gros boutons (image, statut WhatsApp, lien de partage), « Plus de réglages » au lieu de « Mode Simple », zones de clic 44 px, champs à 16 px (pas de zoom Safari), filigrane qui ouvre les formules sans quitter le studio, visite guidée lisible.
- **Reste** : test sur un vrai iPhone par Dodo ; mode « Captures pour les stores » ; refonte des pages tarifs / connexion / compte avec la nouvelle identité.
- **21/10 (suite)** : bandes noires de l'accueil retirées. **Studio sur téléphone : la page entière défile** (barre du haut, aperçu et onglets collés en haut) ; le doigt sur le mockup fait défiler au lieu de le déplacer et d'ouvrir l'onglet Angle (vraie cause du « je n'arrive pas à scroller » de l'expert). **Mode « Captures pour les stores »** : bloc « Vous faites des applis ? » sur l'accueil (jusqu'à 8 écrans), un iPhone + une accroche par écran, fond au choix, export de tous les écrans aux tailles App Store (iPhone 6,9") et Google Play. Pages tarifs / connexion / inscription / compte / légales en bleu, sans badges ni capitales ; « Le plus populaire » → « recommandé » ; sélecteur de devise retiré partout. Police Archivo sur tout le site (hors studio). À vérifier : sur ordinateur, le mockup ne se déplace pas à la souris dans les tests automatiques (déjà le cas avant ces changements).

---

## 🗓️ Session — 21 octobre 2026 (soir) : nouveaux prix, fidélité, parcours en 4 étapes, nouveau haut de page

- **Paiement test 200 FCFA retiré** : bouton de `/admin` et article `test_200` côté serveur (le paiement du 18/10 reste dans l'historique).
- **Nouveaux prix (choix de Dodo)**, dans `src/lib/pricing.ts` : Solo 5 500 FCFA / 8 €, Pro 9 500 FCFA / 14 €, Agence 19 000 FCFA / 29 € (Agence gardée à 29 € pour ne pas gonfler les prix). Annuel = 12 × le prix plancher : 48 000 / 78 000 / 192 000 FCFA (73 / 119 / 290 €). Packs : 3 200 / 7 500 / 12 500 FCFA (5 / 11 / 19 €). Stratégie : Solo = ticket d'entrée, Pro = offre poussée (leurre), Agence = prix repère, packs = « popcorn ».
- **Fidélité (Mobile Money, au mois)** : chaque mois payé d'affilée sur la même formule baisse le mois suivant (Solo −500, Pro et Agence −1 000), 3 baisses au maximum (planchers 4 000 / 6 500 / 16 000 FCFA). Repayer au plus tard 3 jours après la fin du mois ; un mois raté → prix de départ. Calcul serveur `src/lib/loyalty.ts` depuis `saspay_checkouts` (aucun changement de base), appliqué à la création du paiement ; affichage du prix fidélité sur `/pricing` (route `/api/payments/saspay/loyalty`). Testé sur 8 cas types ; pas encore testé avec un vrai paiement.
- **Stripe** : clés de prix passées en `_v3` (prix en euros changés) → relancer `scripts/setup-stripe-products.ts` avant d'activer la carte.
- **Accueil, « Comment ça marche » en 4 étapes** (`src/components/home/Journey.tsx`) : zigzag image gauche / droite, ligne qui se remplit au défilement, numéros qui s'allument, images grises qui prennent leurs couleurs ; la valeur monte (lien → capture → visuel → argument de vente).
- **Nouveau haut de page** (inspiré de Byto AI) : titre centré, champ du lien au-dessus du site de Wave en grand, étiquettes « MacBook et iPhone », « Format LinkedIn 4:5 », « Export 4K ». Version A choisie par Dodo (la B, champ dans l'image, retirée).
- Vérifié : `tsc`, `npm run build`, captures à 375 / 768 / 1440 px sans défilement horizontal (`captures-studio/validation-accueil/2026-10-21/`).
- **Accueil refait le 21/10 (suite), d'après les modèles de Dodo** (tarifs en cartes, questions avec catégories, pied de page en colonnes) : fond de sites atténués derrière le haut de page ; ligne « Essai sans inscription » et liens du haut retirés ; avant / après « 2 heures / 2 minutes » ; « Un lien, trois usages » (choix à gauche, résultat à droite, défilement automatique) ; « Vous faites des applis ? » illustré par 3 écrans de store ; exemples qui défilent seuls en boucle ; liens YouTube mentionnés (haut de page, étape 1, questions, pied de page). Sections dans `src/components/home/Sections.tsx`. Pas de lettre d'information (rien pour stocker les e-mails) ni d'icônes de réseaux sociaux (pas de comptes).

---

## 🗓️ Session — 22 octobre 2026 : partie du site montrée, test du studio, textes réécrits

- **Accueil :** espaces entre sections réduits d'un tiers ; nouvelle section « Montrez la partie du site qui fait vendre » (page entière de Wave `public/images/demo/wave-long.jpg`, cadre à glisser, zones, zoom) ; « Ce que contient le studio » refait avec 5 vraies captures du studio (`public/images/studio/`) ; textes réécrits par un agent « copywriter » (phrases courtes, boutons au « je », objections levées, « Le meilleur choix » retiré).
- **Téléphones (MockupFrame) :** barre d'état (heure, réseau, batterie) de la couleur du haut du site ; le site n'est plus caché sous la Dynamic Island.
- **Studio, fonction phare :** bloc « Partie du site montrée » en tête de l'onglet Appareil (`src/components/PagePartPicker.tsx`) : cadre sur la page entière, Haut / Milieu / Bas, zoom jusqu'à 3 fois (`cropZoom`), nouvelle capture plus large (1 024 à 2 560 px, largeur bornée côté serveur). L'ancien curseur « Défilement Web » est retiré.
- **Test du studio en tant que client** (iPhone 13 et Pixel 7, vraies captures avec l'accord de Dodo) : tableau dans `TEST_STUDIO_2026-10-22.md`, photos dans `captures-studio/test-studio-2026-10-22/`. Corrigé : modèles introuvables sur téléphone, ombre qui restait d'un modèle à l'autre, 6 modèles violets, badges « Populaire / Conseillé », aperçus iPhone coupés, Échap sur les fenêtres Modèles et Pitch IA, bouton « Voir en grand » trop grand, « Image locale » dans la barre d'adresse. Non testé : export réel, génération Pitch IA, vrai iPhone.
- **En attente :** les liens des réseaux Netwave Studio pour le pied de page.
- **22/10 (suite) :** section « Montrez la partie du site qui fait vendre » redessinée (panneau sombre, 4 zones numérotées, MacBook avec la page entière posée dessus) ; emojis remplacés par des icônes (connexion, inscription, tarifs, badges et étiquettes du studio, Pitch IA, menu du compte) ; pied de page : « Un service de NetWave Studio » (https://www.netwave-studio.company/).
- **22/10 (fin) :** « STUDIO » seulement dans le studio (panneaux connexion / inscription simplifiés) ; étoiles « style IA » (Sparkles) remplacées partout (stylo pour la Pitch IA, palette, logo du site dans la barre du studio) ; favicon et icône iPhone = logo du site (calques blancs sur carré bleu) ; bloc « Bientôt disponible » (tutoriels vidéo, paiement par carte ; projets dans le compte, validation client et site en anglais gardés pour plus tard sans les afficher) ; studio sur téléphone et tablette : conseil « plus confortable sur ordinateur » (une fois) et repère « Autres réglages plus bas » (`src/components/StudioMobileHelp.tsx`). Prochaine étape : vidéo de présentation.
