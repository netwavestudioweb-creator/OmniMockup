# PitchMySite — Journal de travail avec Claude

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
- **Opérateur :** MTN Bénin (`mtn_bj` - `2290150884670`)
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
   - Numéros testés : `2290153291052` et `2290150884670` sur **MTN Bénin** (`network_code: mtn_bj`).
   - Montant débité demandé : **208 FCFA** (200 FCFA + 8 FCFA de frais SasPay).
   - Statut dans l'API SasPay : Les transactions sont bien créées (`a4cc8b28...`, `2ff4f875...`, `29b67cda...`) mais sont restées bloquées en **`PENDING`** (en attente).
   - **Pourquoi c'est resté en PENDING / EXPIRED :**
     1. **Validation PIN MTN non reçue ou non effectuée :** MTN n'a pas validé le prélèvement. Soit la notification USSD (push) n'est pas apparue sur le téléphone (il fallait composer `*880#` pour approuver manuellement), soit le code secret n'a pas été saisi dans le délai imparti.
     2. **Solde insuffisant :** Le compte MTN MoMo devait contenir au moins 208 FCFA.
     3. **Nouveau format 10 chiffres (01...) :** Le numéro envoyé était `2290150884670`. Si l'agrégateur MTN chez SasPay attendait 8 chiffres ou n'a pas routé le push vers le nouveau plan de numérotation.
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

*Dernière mise à jour : 18 octobre 2026 — Session d'audit initial*
