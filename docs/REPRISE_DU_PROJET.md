# Reprendre le projet PitchMySite

Document de passation, mis à jour le **14 octobre 2026**. Il permet à n'importe qui (développeur, associé, autre assistant IA) de reprendre le projet à tout moment, même après une longue pause.

> **Aucun secret dans ce document** (le dépôt GitHub est public). Les mots de passe et les clés se trouvent uniquement dans Vercel, Supabase, SasPay et chez le propriétaire.

---

## 0. En deux minutes

- **Le produit** : PitchMySite (ancien nom : OmniMockup). On colle le lien d'un site, l'outil le capture et produit des visuels de présentation (ordinateur, iPhone, iPad…), des vidéos, des PDF et des textes de vente, pour les freelances et les agences web.
- **Le propriétaire** : Dodo (Cotonou, Bénin), entreprise NetWave Studio.
- **Adresse du site** : https://pitchmysite.com (acheté sur Vercel le 16/10/2026, renouvellement automatique). L'ancienne adresse https://omni-mockup.vercel.app reste active.
- **Code** : dépôt GitHub `netwavestudioweb-creator/OmniMockup`, branche `main`. **Chaque envoi sur `main` met le site en ligne automatiquement** (Vercel).
- **Technique** : Next.js 14 (App Router), TypeScript, Tailwind ; base de données et comptes Supabase ; hébergement Vercel (formule gratuite Hobby).
- **Paiement** : Mobile Money en FCFA par **SasPay**. La carte bancaire est préparée mais désactivée (bouton grisé « Bientôt »).
- **Où en est-on** : le site est complet et en ligne, pas encore lancé auprès des clients. Il manque surtout un vrai paiement d'essai, le domaine, les e-mails (Resend) et la version 2 du tableau de bord administrateur. Voir les sections 10 et 11.
- **Les deux fichiers à lire ensuite** : `A_FAIRE_DODO.md` (la liste des tâches, qui fait foi) et `ETAT_DU_SITE.md` (l'inventaire des fonctions au 13/10).

---

## 1. Le produit

| Partie | Ce qu'elle fait |
|---|---|
| Accueil `/` | Présentation, champ « collez le lien de votre site », ouvre le studio |
| Capture | Capture la page entière d'un site, version ordinateur et version téléphone, jusqu'à 5 pages |
| Studio | Éditeur de visuels : appareils (dont iPhone 18 Pro), dispositions Solo / Duo / Trio, fonds, effets, 13 modèles, 8 scènes photo, textes, annotations, kit de marque, projets enregistrés sur l'appareil |
| Exports | PNG / JPG / WebP (Standard, HD, 4K), packs réseaux sociaux et stores, statut WhatsApp, vidéo MP4, GIF, PDF de présentation, carrousels |
| Partage | Lien public `/p/[id]`, marque blanche pour la formule Agence |
| Pitch IA | Rédige post LinkedIn, proposition commerciale, étude de cas, avec **la clé Gemini ou Claude du client** (gardée dans son navigateur) |
| Directeur artistique IA | Note chaque section du site ; utilise encore la clé Gemini du site (vide pour l'instant) |
| Formules | Découverte (gratuite), Solo, Pro, Agence + packs de crédits ; limites vérifiées par le serveur |
| Pubs récompensées | Formule gratuite : 1 pub vue = 1 export de plus, 3 par jour (invisible tant que Google Ad Manager n'est pas configuré) |
| Administration `/admin` | Tableau de bord réservé au propriétaire : ventes (revenu net, export CSV), clients payants et relances, tentatives de paiement et paniers abandonnés, fiche client, résumé, comptes, courbes |

Prix validés le 13/10/2026 : Solo 3 300 FCFA par mois ou 33 000 par an ; Pro 5 900 ou 59 000 ; Agence 19 000 ou 190 000. Packs : 10 crédits = 2 600 FCFA, 30 = 6 600, 75 = 9 800. Le détail est dans `src/lib/pricing.ts` et dans `A_FAIRE_DODO.md`.

---

## 2. Les comptes et services

Tous appartiennent à Dodo. Pour reprendre le projet, il faut qu'il vous y invite ; il ne faut jamais lui demander ses mots de passe.

| Service | À quoi il sert | Identifiants utiles (pas secrets) |
|---|---|---|
| **GitHub** | Le code | `netwavestudioweb-creator/OmniMockup` (public) |
| **Vercel** | Hébergement, variables d'environnement, futur domaine | projet `omni-mockup` (`prj_5RKV0TUlfD79yLl3zGs7wkBW6PeG`), équipe `netwavestudioweb-creators-projects` |
| **Supabase** | Base de données, comptes clients, connexion Google | projet `xbhcwqnvmbagbkwgsuwf` |
| **SasPay** (saspay.me) | Paiement Mobile Money en FCFA (70 réseaux) | webhook vers `/api/payments/saspay/webhook`, événement `transaction.success` |
| **Microlink** | Premier moteur de capture des sites (version ordinateur) | service externe, sans clé |
| **Google AI Studio / console Claude** | Clés IA, côté client (Pitch IA) | aucune clé du site nécessaire |
| **Stripe** | Préparé, pas utilisé (Stripe n'ouvre pas de compte pour une entreprise au Bénin) | — |
| À venir | Domaine `pitchmysite.com`, **Resend** (e-mails), Google Ad Manager (pubs), redirection `support@` | voir `A_FAIRE_DODO.md` points 6 à 8 et P2 à P6 |

---

## 3. Les variables d'environnement

Elles sont dans **Vercel → omni-mockup → Settings → Environment Variables** (en ligne) et dans `.env.local` (sur l'ordinateur, jamais envoyé sur GitHub). Modèle : `.env.example`. **Après toute modification dans Vercel, il faut redéployer.** Les variables `NEXT_PUBLIC_…` sont lues au moment de la construction du site.

| Variable | Rôle | Obligatoire |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Connexion à Supabase côté navigateur | Oui |
| `SUPABASE_SERVICE_ROLE_KEY` | Accès complet à la base, côté serveur seulement | Oui (secret) |
| `NEXT_PUBLIC_SITE_URL` | Adresse du site (retours de paiement, liens) | Oui |
| `SASPAY_SECRET_KEY`, `SASPAY_WEBHOOK_SECRET` | Paiement Mobile Money | Oui (secrets) |
| `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, `ADMIN_SESSION_SECRET` | Accès administrateur (créés par `node scripts/admin-setup.mjs`) | Oui (secrets, créés par Dodo lui-même) |
| `NEXT_PUBLIC_CARD_PROVIDER` | Carte bancaire : absente = grisée ; `saspay` ou `stripe` = activée | Non |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Seulement si la carte passe par Stripe | Non |
| `STRIPE_ENABLED` | Ancien interrupteur Stripe, encore accepté | Non |
| `GEMINI_API_KEY`, `ANTHROPIC_API_KEY` | IA du site (directeur artistique, Pitch IA de secours) ; vides aujourd'hui | Non |
| `NEXT_PUBLIC_GAM_REWARDED_AD_UNIT` | Bloc Google Ad Manager des pubs récompensées | Non |

Les 3 anciennes variables FedaPay peuvent être supprimées : FedaPay n'est plus utilisé.

---

## 4. Le code

```
src/
  app/                 pages (accueil, pricing, account, admin, login, signup, p/[id], terms, privacy)
  app/api/             routes serveur (voir ci-dessous)
  components/          34 composants ; le studio est SceneEditor.tsx (environ 6 000 lignes)
  context/             UserContext (compte connecté), CurrencyContext (devise, région Mobile Money)
  lib/                 logique partagée (voir ci-dessous)
supabase/migrations/   historique de la base de données (13 fichiers)
scripts/               admin-setup.mjs (créer l'accès admin), admin-check.mjs (diagnostiquer un refus)
docs/                  ce document
next.config.mjs        réglages Next.js (dont le navigateur Chrome limité aux 2 fonctions de capture)
```

**Routes serveur (`src/app/api`)**

| Route | Rôle |
|---|---|
| `capture`, `smart-analyze`, `analyze`, `site-links`, `favicon` | Capture d'un site, découpage en sections, directeur artistique, liens internes |
| `exports/authorize`, `user/usage` | Vérifie le droit d'exporter selon la formule et décompte les crédits |
| `share` | Liens de partage publics |
| `generate-pitch` | Pitch IA de secours côté serveur (si des clés sont mises dans Vercel) |
| `payments/saspay/create`, `return`, `webhook` | Paiement Mobile Money |
| `stripe/create-checkout-session`, `create-portal-session`, `webhooks/stripe` | Carte par Stripe (répond 410 tant que la carte Stripe n'est pas activée) |
| `ads/reward` | Pubs récompensées |
| `events` | Statistiques d'usage (liste blanche de noms d'événements) |
| `founders` | Formulaire « agences fondatrices » |
| `admin/login`, `admin/stats`, `admin/users`, `admin/users/[id]`, `admin/payments`, `admin/sales` | Tableau de bord administrateur (`sales` : ventes, tentatives et clients ; `users/[id]` : fiche client) |

**Fichiers clés de `src/lib`**

| Fichier | Contenu |
|---|---|
| `pricing.ts` | Formules, prix (€, $, FCFA), packs de crédits, fonctions affichées |
| `plan.ts`, `usage.ts` | Droits de chaque formule, quotas |
| `saspay.ts`, `saspay-apply.ts` | Appels à SasPay ; activation de la formule ou des crédits après paiement |
| `paymentConfig.ts` | Interrupteur de la carte bancaire (`NEXT_PUBLIC_CARD_PROVIDER`) |
| `stripe.ts` | Client Stripe |
| `browser.ts`, `captureCache.ts` | Moteur de capture (Microlink, puis Chrome sur le serveur) et mémoire courte côté client |
| `byokPitch.ts`, `pitchPrompt.ts` | Pitch IA avec la clé du client, consigne commune |
| `adminAuth.ts`, `admin.ts` | Mot de passe et code admin, session, journal, enregistrement des paiements |
| `rewardedAd.ts` | Pubs Google |
| `security.ts` | Limites de requêtes (compteur partagé dans la base, repli en mémoire), refus des adresses internes, filtre des requêtes du navigateur de capture |
| `captureStore.ts` | Mémoire des captures côté serveur (3 h) |
| `safeRedirect.ts` | Adresse de retour après connexion limitée au site |
| `shotsPresets.ts`, `photoScenes.ts`, `studioDraft.ts` | Modèles, scènes photo, projets enregistrés |
| `tracking.ts` | Envoi des événements d'usage |

---

## 5. La base de données (Supabase)

| Table | Contenu |
|---|---|
| `profiles` | Un compte par client : formule, date de fin (`plan_expires_at`), crédits, ids Stripe |
| `usage`, `export_events`, `pitch_events` | Consommation (exports, Pitch IA) pour les quotas |
| `credit_transactions` | Historique des crédits |
| `saspay_checkouts` | Chaque tentative de paiement SasPay (statut, montant, article) |
| `payments` | Paiements confirmés (SasPay ou Stripe) |
| `shared_mockups` | Liens de partage |
| `brand_kits` | Kits de marque |
| `ad_rewards` | Pubs récompensées |
| `events` | Statistiques d'usage et tentatives de connexion admin |
| `founder_applications` | Candidatures « agences fondatrices » |
| `app_admins`, `admin_actions` | Journal des actions faites depuis `/admin` |

Règles :
- Les tables sont protégées (RLS) : un visiteur ne lit que ses propres données ; formules, paiements et admin ne sont modifiables que par le serveur.
- Toute nouvelle modification de la base passe par un fichier dans `supabase/migrations/`, appliqué en production **seulement avec l'accord explicite de Dodo, à chaque fois**.
- Le forfait gratuit de Supabase ne fait **pas de sauvegarde automatique** : à régler avant les premiers vrais clients.

---

## 6. Comment marchent les parties importantes

**Capture d'un site.** Sur Vercel, version ordinateur : Microlink d'abord (15 s au plus), puis notre propre Chrome (puppeteer-core 25 et @sparticuz/chromium 153). Version téléphone : notre Chrome d'abord. Le navigateur est fermé en 2 s au plus. Une adresse injoignable donne un message clair. Chrome (environ 70 Mo) n'est copié que dans les fonctions `capture` et `smart-analyze` : c'est ce qui garde chaque déploiement autour de 176 Mo (au lieu de 1,6 Go, qui avait fait dépasser la limite de stockage de Vercel).

**Paiement Mobile Money (SasPay).**
1. Le client clique sur une formule. `/api/payments/saspay/create` enregistre la tentative dans `saspay_checkouts` (le prix vient du serveur, jamais du navigateur), puis crée la page de paiement SasPay.
2. Le client paie sur la page SasPay, puis revient sur `/api/payments/saspay/return`, qui revérifie auprès de SasPay.
3. SasPay prévient aussi le site par le webhook (`transaction.success`, signé avec `SASPAY_WEBHOOK_SECRET`).
4. `saspay-apply.ts` active la formule pour 1 mois ou 1 an (sans renouvellement automatique) ou ajoute les crédits, sans jamais créditer deux fois, et enregistre le paiement dans `payments`.

**Carte bancaire.** Elle est préparée mais désactivée. `NEXT_PUBLIC_CARD_PROVIDER=saspay` utilise la même page SasPay. `stripe` passe par Stripe : abonnement en € ou en $, refusé si une formule Mobile Money est encore valable. Il faut redéployer après le changement.

**Pitch IA.** Le client colle sa clé Gemini ou Claude. Elle reste dans son navigateur et l'appel part directement de son navigateur vers Google ou Anthropic. Le site ne voit ni la clé, ni la facture.

**Administration.** L'accès est séparé des comptes clients : mot de passe (stocké sous forme d'empreinte scrypt) et code à 6 chiffres (TOTP), cookie signé valable 12 h, blocage 15 minutes après 5 erreurs. Si la connexion est refusée, lancer `node scripts/admin-check.mjs`. Si le mot de passe est perdu, relancer `node scripts/admin-setup.mjs` et remplacer les 3 valeurs dans Vercel.

---

## 7. Installer et mettre en ligne

**Installer sur un ordinateur**
1. Installer Node.js 22 et Git.
2. `git clone https://github.com/netwavestudioweb-creator/OmniMockup.git`, puis `cd OmniMockup` et `npm install`.
3. Copier `.env.example` en `.env.local` et le remplir avec les valeurs fournies par Dodo. Ne jamais envoyer ce fichier sur GitHub.
4. `npm run dev`, puis ouvrir http://localhost:3000.

**Avant chaque mise en ligne (obligatoire)**
1. `npx tsc --noEmit` : aucune erreur de type.
2. `npm run build` : la construction réussit.
3. Vérifier l'affichage à **375, 440 et 768 px de large, sans défilement horizontal**.
4. **Montrer le résultat à Dodo et attendre son accord.**
5. Envoyer sur `main` (`git push origin HEAD:main`, en vérifiant d'abord qu'on est à jour avec `origin/main`). Vercel construit et met en ligne en 2 à 3 minutes.
6. Vérifier sur le site en ligne. Exemple pour la capture : `POST /api/capture` avec `{"urls":["https://example.com"],"mobile":true}` doit répondre `success: true`.

**Organisation actuelle sur l'ordinateur de Dodo.** Le dossier `Mockup_saas` est la copie principale. Le travail se fait dans un second dossier, `omni-moteur` (branche `moteur-capture`, avec ses propres modules), qui envoie directement sur `main`. Les fichiers ont des fins de ligne Windows (CRLF). Un dépôt fraîchement cloné suffit pour reprendre : cette organisation n'est pas obligatoire.

**Annuler une mise en ligne.** Vercel → Deployments → choisir un déploiement précédent → ⋯ → **Promote to Production** (ou **Instant Rollback**).

---

## 8. Les règles de travail du projet

- Toujours parler à Dodo **en français**, simplement.
- **Aucune fausse preuve sociale** sur le site : ni faux avis, ni faux chiffres de clients.
- Dire clairement si une chose est seulement « compilée » ou vraiment « testée ».
- Affichage correct à 375, 440 et 768 px, sans défilement horizontal.
- `npx tsc --noEmit` et `npm run build` avant chaque envoi ; montrer à Dodo avant de mettre en ligne.
- **Aucun secret dans le dépôt**, qui est public : pas de clé, pas de mot de passe, pas de compte de test écrit en dur.
- On ne saisit jamais de clé ou de mot de passe dans un service à la place de Dodo : c'est lui qui le fait. On ne lui demande jamais ses valeurs `ADMIN_…`.
- Toute modification de la base de production demande l'accord explicite de Dodo, à chaque fois.
- Les clés IA des clients restent dans leur navigateur.

---

## 9. Historique du projet

| Date | Étape |
|---|---|
| 05/09/2026 | Création du projet (Next.js) |
| 09 et 10/09 | Première version complète de l'application, sécurité, audit, première feuille de route |
| 25 et 26/09 | Studio façon « shots.so » (fonds, filtres, vidéo, filigrane), moteur de capture à 3 niveaux (dont Microlink), Chrome sur Vercel, poses 3D |
| 29/09 au 08/10 | Défilement des captures, refonte mobile, mockup iPhone, commandes du studio, ombres, disposition Trio, formules en euros, feuille de route des paiements africains |
| 09/10 | FedaPay retiré ; sécurité des paiements ; arrivée de SasPay (Mobile Money) |
| 10/10 | Grosse journée (38 changements) : moteur de capture compatible Vercel, liens de partage, directeur artistique IA, lots 3 et 4 du studio |
| 11 et 12/10 | Kits de marque, limites d'export et de Pitch IA vérifiées par le serveur, nettoyage de sécurité |
| 13/10 | Nouveau nom **PitchMySite** et nouvelle accroche ; 13 modèles ; iPhone 18 Pro ; plan de fluidité (phases 1 à 5) ; exports qui ne bloquent plus ; pubs récompensées ; tableau de bord admin et accès séparé ; carte retirée (SasPay seul) ; Pitch IA avec la clé du client ; formules validées ; stockage Vercel corrigé |
| 16/10 | Domaine pitchmysite.com acheté et relié ; test de l'accroche ; message prêt à envoyer au prospect ; fichier Excel de 70 agences (5 continents) ; audit de sécurité (rapport `AUDIT_ET_CONCURRENCE.md`) : capture protégée contre le réseau interne (filtre de chaque requête + contrôle de l'IP de chaque réponse), anti-abus partagé dans la base (`rate_limits`, `hit_rate_limit`), quota gratuit non contournable, redirections de connexion limitées au site (`safeRedirect.ts`), en-têtes de protection, droits d'écriture retirés aux comptes, route `analyze` supprimée ; mémoire des captures 3 h (espace privé `captures-cache`) ; étude de la concurrence |
| 14/10 | Carte bancaire préparée (grisée « Bientôt ») ; accès admin créé par Dodo et connexion réussie ; outil `admin-check.mjs` ; ce document ; **tableau de bord version 2 en ligne** (Ventes, Clients payants, Tentatives, fiche client) |

Les anciens documents à la racine (`AUDIT_…`, `RAPPORT_…`, `ROADMAP_…`, `TODO_…`, `RECAPITULATIF_…`, `GUIDE_INTEGRATION_MOMO…`, `PROCEDURE_DE_TEST…`) sont **dépassés** : ils parlent encore de FedaPay ou de Stripe comme moyen principal. Seuls comptent ce document, `A_FAIRE_DODO.md` et `ETAT_DU_SITE.md`.

---

## 10. État au 14 octobre 2026

**Marche et testé en ligne** : site public, capture (2 à 12 s), studio, exports images et packs, liens de partage, limites des formules, sécurité des paiements (faux appels refusés), règles des pubs, accès administrateur, carte grisée. Tableau de bord version 2 : testé avec des ventes fictives (la base n'a encore aucune vente).

**En ligne mais pas encore testé de bout en bout** :
- un vrai paiement SasPay (jamais fait) ;
- la Pitch IA avec une vraie clé (testée seulement avec de fausses clés) ;
- la gestion des comptes depuis `/admin` sur de vrais comptes ;
- la vidéo, le GIF et le PDF (testés lors des lots précédents).

**Bloqué tant qu'un réglage n'est pas fait** :
- le directeur artistique IA (clé Gemini du site vide) ;
- les pubs (Google Ad Manager) ;
- les e-mails fiables (Resend) ;
- le domaine ;
- les sauvegardes de la base.

**Point critique** : la formule gratuite de Vercel (Hobby) interdit l'usage commercial ; passer en Pro avant d'ouvrir les ventes.

**Problème en cours** : le compteur « Functions Storage » de Vercel reste au-dessus de 10 Go alors que les anciens déploiements sont supprimés. C'est un souci connu côté Vercel : attendre, puis écrire au support si besoin (`A_FAIRE_DODO.md`, point 0).

---

## 11. Ce qui reste à faire

La liste détaillée, avec les cases à cocher, est dans **`A_FAIRE_DODO.md`**. Résumé :

**Côté Dodo**
1. Faire un vrai petit paiement Mobile Money.
2. Tester la Pitch IA avec une vraie clé Gemini.
3. Faire un test complet comme un client.
4. Choisir pour le directeur artistique IA : clé du client (conseillé) ou clé du site.
5. Acheter le domaine, créer l'adresse support et configurer Resend (pas à pas dans la liste, points 6 à 8).
6. Supabase : protection des mots de passe, nom PitchMySite dans les e-mails, sauvegardes.
7. Google Ad Manager pour les pubs.
8. Lancement : 10 à 20 agences, un seul canal, premiers vrais avis.

**Côté développement**
- **Tableau de bord version 2** : fait et en ligne le 14/10 (onglets Ventes, Clients payants, Tentatives, fiche client ; code dans `src/app/admin/SalesTabs.tsx` et `ui.tsx`). Reste : e-mail à chaque vente (1 h 30, après Resend) ; pays, réseau et frais réels du client (environ 1 h + une migration : SasPay les donne dans sa fiche « transaction », champs `country`, `network`, `gateway_fee`).
- Après le domaine : mettre à jour `NEXT_PUBLIC_SITE_URL`, l'adresse support et les e-mails ; brancher la connexion par e-mail et code (branche `auth-email`).
- Idées validées en attente : directeur artistique IA avec la clé du client, rappel avant la fin d'une formule, parcours express (3 visuels en 1 clic), bouton d'aide WhatsApp, factures PDF, validation des visuels par le client final, projets enregistrés en ligne, image d'aperçu des liens et sitemap, barre du studio plus simple sur téléphone, version anglaise.
- Plus tard : la carte bancaire (attendre SasPay, ou Lemon Squeezy, KKiaPay…). Le site est déjà prêt (section 6).

---

## 12. Dépannage rapide

| Problème | Que faire |
|---|---|
| Une variable changée dans Vercel ne marche pas | Redéployer (Deployments → ⋯ → Redeploy) |
| Connexion `/admin` refusée | `node scripts/admin-check.mjs` ; au bout de 5 erreurs, attendre 15 min |
| Le site affiche « Accès administrateur non configuré » | Les 3 variables `ADMIN_…` manquent, ou le site n'a pas été redéployé |
| Une capture échoue | Vérifier que le site visé répond ; regarder les journaux Vercel (Logs) de `/api/capture` |
| Un client a payé mais sa formule n'est pas active | `/admin` → Paiements → « Paiements SasPay à vérifier » ; vérifier dans SasPay ; activer à la main dans `/admin` → Comptes |
| Le stockage Vercel dépasse 10 Go | Ne pas remettre Chrome dans toutes les fonctions (`next.config.mjs`) ; supprimer les vieux déploiements ; durée de conservation courte |
| La construction échoue sur Vercel | Lancer `npm run build` en local, corriger, renvoyer |

---

## 13. Reprendre avec un assistant IA

Message de départ à donner à l'assistant (Claude Code ou autre), dans le dossier du projet :

> Lis `docs/REPRISE_DU_PROJET.md`, puis `A_FAIRE_DODO.md` et `ETAT_DU_SITE.md`. Respecte les règles de la section 8 : français, pas de secret dans le dépôt, pas de clé saisie à ma place, mon accord avant toute modification de la base et avant chaque mise en ligne. Fais-moi un point de 10 lignes sur l'état du projet, puis propose la prochaine tâche.

À chaque fin de session de travail, mettre à jour ce document (sections 9 à 11) et `A_FAIRE_DODO.md`.
