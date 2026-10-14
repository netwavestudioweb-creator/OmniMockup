# À faire par Dodo — PitchMySite

Liste mise à jour le 14 octobre 2026. Coche chaque ligne quand c'est fait, puis préviens Claude pour la vérification.

> Ne colle jamais une clé secrète dans le chat ni dans ce fichier : ajoute-la directement sur Vercel.

**Changements du 14/10 :**
- **Stockage Vercel** : code corrigé (déploiement de 1,6 Go à 176 Mo) et anciens déploiements supprimés. Le compteur reste bloqué au-dessus de 10 Go : c'est un souci connu chez Vercel (voir point 0).
- **Carte bancaire préparée mais pas activée** : bouton « Carte bancaire » grisé avec « Bientôt » sur la page Tarifs. Activable plus tard par une seule variable (voir point 11).
- **Accès administrateur créé et testé** : tu es connecté à `/admin` (mot de passe + code). Nouvel outil `node scripts/admin-check.mjs` si une connexion est refusée.
- **Tableau de bord version 2 en ligne** : onglets Ventes, Clients payants, Tentatives de paiement, fiche client (voir la section 📊 plus bas).
- **Document de reprise du projet** : `REPRISE_DU_PROJET.md` (tout ce qu'il faut pour reprendre le projet, même sans Claude).

**Changements du 13/10 (soir) :**
- **Paiement par carte retiré du site** : seul le Mobile Money (SasPay, en FCFA) reste. Stripe ne marche pas pour une entreprise au Bénin, et SasPay n'a pas encore la carte. Toutes les étapes Stripe sont supprimées de cette liste.
- **Pitch IA avec la clé de chaque client** (Gemini ou Claude), inclus dans toutes les formules. **Tu n'as plus aucune clé IA à mettre** pour la Pitch IA.

Cette liste remplace les anciens documents (`TODO_PERFECTIONNER_LE_SITE.md`, `RAPPORT_ET_ROADMAP_PROJET.md`, `RECAPITULATIF_GLOBAL_ET_PLAN_LANCEMENT.md`, `ROADMAP_FONCTIONNALITES_ET_PAIEMENTS.md`) : c'est ce fichier qui fait foi.

---

## 🔴 Urgent, avant d'ouvrir les ventes

- [ ] **0. Libérer le stockage Vercel (limite de 10 Go dépassée)**. Le code est corrigé (chaque déploiement passe de 1,6 Go à 176 Mo) et tu as supprimé les anciens déploiements (fait le 13/10). Il reste à :
  - attendre 24 à 48 h et regarder la page **Usage** ;
  - si le compteur reste au-dessus de 10 Go : écrire au support Vercel (vercel.com/help) ou sur community.vercel.com pour demander de libérer l'espace des déploiements supprimés (Claude a préparé le message le 13/10 ; d'autres utilisateurs ont le même souci) ;
  - dans **Settings → Security → Deployment Retention Policy**, choisir une durée courte (par exemple 30 jours).

- [ ] **1. Faire un vrai petit paiement SasPay en Mobile Money** depuis le site (page Tarifs, Petit Pack de crédits par exemple), puis prévenir Claude : il vérifiera que les crédits ou la formule se sont bien activés et que le paiement apparaît dans le tableau de bord.
- [ ] **2. Tester la Pitch IA avec une vraie clé** (toi ou un collègue) :
  - créer une clé Gemini **gratuite** sur https://aistudio.google.com/apikey (1 minute avec un compte Google) ;
  - dans le studio : bouton **Pitch IA** → « Connectez votre IA » → coller la clé → « Enregistrer sur cet appareil » → « Générer » ;
  - dire à Claude si les textes sont bons. Une clé Claude se crée sur la console Claude (payante à l'usage) ; un abonnement Claude.ai (le chat) ne donne pas de clé.
- [ ] **3. Directeur artistique IA (la note de chaque section du site)** : il utilise encore une clé Gemini du site, qui est vide. Choisis :
  - soit Claude le passe aussi sur **la clé du client** (environ 1 h, conseillé) ;
  - soit tu mets ta propre `GEMINI_API_KEY` dans Vercel (c'est toi qui paies l'usage).
- [ ] **4. Test complet de bout en bout**, comme un vrai client : inscription → capture d'un site → studio → paiement Mobile Money → export sans filigrane → lien de partage.
- [x] **5. Créer ton accès administrateur** (étapes T1 à T5 plus bas).

## 🟠 Ensuite

- [ ] **6. Acheter le domaine `pitchmysite.com`** (libre au 13/10/2026)
  - Avant l'achat : vérifier que la marque n'est pas déposée à l'**OAPI** (Afrique de l'Ouest) et à l'**INPI** (France)
  - **Le plus simple : l'acheter dans Vercel** → ton équipe → onglet **Domains** → **Buy** → chercher `pitchmysite.com` (environ 10 à 20 $ par an, carte bancaire). Vercel gère alors tout seul les réglages du domaine (DNS)
  - Ou l'acheter ailleurs (Namecheap, OVH…), puis copier chez ce vendeur exactement ce que Vercel affiche (serveurs de noms ou deux lignes)
  - Projet **omni-mockup → Settings → Domains** : ajouter `pitchmysite.com` et `www.pitchmysite.com` (régler `www` pour qu'il redirige vers `pitchmysite.com`)
  - Ensuite, avec Claude : `NEXT_PUBLIC_SITE_URL` = `https://pitchmysite.com` dans Vercel ; dans Supabase (**Authentication → URL Configuration**) : adresse du site `https://pitchmysite.com` et adresse autorisée `https://pitchmysite.com/**`
  - L'ancienne adresse `omni-mockup.vercel.app` continue de marcher (le retour de paiement SasPay n'est pas coupé)
- [ ] **7. Créer l'adresse `support@pitchmysite.com`** : redirection gratuite vers ton Gmail (ImprovMX ou la redirection de ton vendeur de domaine), à faire après Resend. Claude mettra ensuite l'adresse à jour partout sur le site
- [ ] **8. Resend, pour les e-mails du site** (mot de passe oublié, connexion par code, plus tard l'e-mail à chaque vente)
  - Créer un compte gratuit sur **resend.com**
  - **Domains → Add Domain** → `pitchmysite.com`, région **Irlande (eu-west-1)**
  - Resend affiche 3 ou 4 lignes (en général `TXT resend._domainkey`, `MX send`, `TXT send`) : les ajouter dans Vercel (**Domains → pitchmysite.com → DNS Records**) en recopiant nom, type et valeur. Ajouter aussi `TXT _dmarc` = `v=DMARC1; p=none;`
  - Revenir dans Resend → **Verify** (quelques minutes à quelques heures)
  - **API Keys → Create** : nom « Supabase », droit **Sending access**. **Ne donne jamais cette clé à Claude**
  - Supabase → **Authentication → Emails → SMTP Settings** → activer **Custom SMTP** : hôte `smtp.resend.com`, port `465`, utilisateur `resend`, mot de passe = ta clé Resend, adresse d'envoi `no-reply@pitchmysite.com`, nom `PitchMySite`
  - Supabase → **Authentication → Rate Limits** : monter l'envoi d'e-mails (par exemple 100 par heure)
  - Puis tester avec Claude l'e-mail « mot de passe oublié »
  - La connexion par e-mail + code est prête sur la branche `auth-email`. Décider si on retire le bouton « Continuer avec Google » (tu préférais l'e-mail)
- [ ] **9. Supabase**
  - Activer la protection contre les mots de passe divulgués (Authentication → Policies)
  - Mettre le nom PitchMySite dans les e-mails de connexion
  - **Sauvegardes** : le forfait gratuit de Supabase ne fait pas de sauvegarde automatique. Avant d'avoir de vrais clients, passer au forfait Pro de Supabase ou prévoir un export régulier
- [ ] **10. Nettoyer Vercel** (facultatif) : supprimer les 3 variables FedaPay. Les variables Stripe peuvent rester : la carte est coupée tant que `NEXT_PUBLIC_CARD_PROVIDER` n'est pas défini.
- [ ] **11. Plus tard : la carte bancaire**, pour les clients hors Afrique. Pistes : **Lemon Squeezy** (abonnements automatiques, clients du monde entier, le Bénin est dans sa liste de virements ; environ 5 % + 0,50 $ de frais) ou **KKiaPay** (Bénin, cartes et Mobile Money). Ou attendre que SasPay ouvre la carte (réponse du 13/10 : « pas disponible actuellement »). Tu ouvres le compte, Claude branche le site (environ 1 journée).
  - **Déjà prêt dans le site (14/10)** : le bouton « Carte bancaire » est visible mais grisé avec « Bientôt ». Le jour où la carte est ouverte, une seule variable à ajouter dans Vercel (Settings → Environment Variables), puis redéployer :
    - SasPay ouvre la carte → `NEXT_PUBLIC_CARD_PROVIDER` = `saspay` (aucune autre clé, même page de paiement SasPay) ;
    - Stripe → `NEXT_PUBLIC_CARD_PROVIDER` = `stripe`, plus les clés `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` déjà prévues ;
    - pour revenir en arrière : supprimer la variable et redéployer.

## 📊 Tableau de bord administrateur

L'accès est **séparé des comptes clients** : aucun compte client (même le tien) n'ouvre le tableau de bord. Il faut un **mot de passe administrateur + un code à 6 chiffres** donné par une application sur ton téléphone. Tant que les étapes ci-dessous ne sont pas faites, **personne** ne peut l'ouvrir.

- [x] **T1. Installer une application de codes** sur ton téléphone : Google Authenticator ou Microsoft Authenticator (gratuites).
- [x] **T2. Créer ton accès, sur ton ordinateur** : ouvre un terminal dans le dossier du projet `Mockup_saas`, puis tape :
  `node scripts/admin-setup.mjs`
  - choisis ton mot de passe (12 caractères minimum ; il ne s'affiche pas pendant la saisie) ;
  - le script affiche **3 valeurs** et une **clé pour l'application**.
- [x] **T3. Copier les 3 valeurs dans Vercel** → Settings → Environment Variables → environnement **Production** : `ADMIN_PASSWORD_HASH`, `ADMIN_TOTP_SECRET`, `ADMIN_SESSION_SECRET`. Puis Deployments → ⋯ → **Redeploy**.
- [x] **T4. Ajouter la clé dans l'application** : « Ajouter un code » → « Saisir une clé de configuration », nom « PitchMySite Admin », type « basé sur l'heure ». Ferme ensuite le terminal.
- [x] **T5. Ouvrir** `https://omni-mockup.vercel.app/admin` : mot de passe + code à 6 chiffres. La session dure 12 h ; bouton « Déconnexion » dans le menu. Dis à Claude si quelque chose s'affiche mal.
- Après 5 erreurs, l'accès est bloqué 15 minutes.
- Mot de passe oublié ou téléphone perdu : relance le script et remplace les 3 valeurs dans Vercel. Si la connexion est refusée : `node scripts/admin-check.mjs` dit si c'est le mot de passe ou le code.
- **Ne donne jamais ces valeurs à personne, ni dans le chat** : Claude n'en a pas besoin.
- Les chiffres d'usage se remplissent **depuis le 13/10/2026** ; le chiffre d'affaires compte les paiements SasPay faits après cette date.

### Tableau de bord version 2 : suivre toutes les ventes (plan validé le 14/10, travail de Claude)

**✅ En ligne depuis le 14/10** : onglets **Ventes**, **Clients payants**, **Tentatives de paiement** et **fiche client** (clic sur un e-mail). Testé avec des ventes fictives dans le navigateur (aucune écriture dans la base) ; à regarder avec tes premières vraies ventes. À essayer toi-même : le bouton « Export tableur (CSV) » dès la première vente.

Total : **environ 15 h** pour les étapes 0 à 5, **environ 2 h 30** pour « plus tard ». Claude montre le résultat avant la mise en ligne.

- [x] **D0. Vérifications préalables (1 h)** : ce que SasPay renvoie (pays, réseau, motif d'échec) ; chaque tentative bien marquée payée / abandonnée / échouée dans la base.
- [x] **D1. Onglet « Ventes » en premier (4 h 30)** : ventes et revenu d'aujourd'hui, 7 jours, mois, depuis le début, achat moyen ; revenu net après les frais SasPay (3 % modifiable) ; liste de toutes les ventes (client, achat, montant, date, moyen) avec filtres ; export tableur (CSV) ; badge « nouvelles ventes depuis ta dernière visite ».
- [x] **D2. Clients payants (2 h 30)** : clients actifs avec formule, date de fin, jours restants, total payé ; « à relancer » (expire dans 7 jours ou expiré sans renouvellement) avec bouton e-mail ; revenu attendu des renouvellements du mois suivant.
- [x] **D3. Fiche client (2 h)** : en cliquant sur un compte, tous ses paiements, exports, crédits, inscription, dernière activité, tes actions.
- [x] **D4. Toutes les tentatives de paiement (2 h)** : payées, abandonnées, échouées ; taux de réussite ; paniers abandonnés à relancer.
- [x] **D5. Détails sur l'argent (1 h 30)** : revenu par formule et par durée (1 mois / 1 an) ; courbes par semaine et par mois.
- [x] **D6. Tests et mise en ligne (1 h 30)** : vérification, compilation, affichage 375 / 440 / 768 px, essais en lecture seule sur les vraies données.
- [ ] **Plus tard** : e-mail à chaque vente (1 h 30, après Resend) ; pays et réseau du client (environ 1 h, si SasPay les fournit).

## 📺 Pubs récompensées (formule gratuite)

Règle : **1 pub regardée jusqu'au bout = 1 export Standard de plus, 3 pubs par jour au plus, jamais de pub pour les formules payantes.** Le code est en ligne mais invisible tant que les points ci-dessous ne sont pas faits.

- [x] **P1. Table des pubs créée dans la base en ligne** (vérifié le 13/10/2026).
- [ ] **P2. Ouvrir un compte Google Ad Manager** (admanager.google.com), de préférence après l'achat du domaine : un site sans domaine propre risque d'être refusé. Un partenaire agréé par Google (par exemple Ezoic) peut être plus simple pour un petit site.
- [ ] **P3. Créer un bloc publicitaire « Rewarded » (pub récompensée) pour le web**, puis donner son chemin à Claude (exemple : `/1234567/pitchmysite_rewarded`). Ce n'est pas un secret.
- [ ] **P4. Bannière de consentement aux cookies publicitaires** (visiteurs européens) : à activer dans Ad Manager (Confidentialité et messages).
- [ ] **P5. Déclarer tes infos de paiement dans Ad Manager** pour recevoir l'argent des pubs.
- [ ] **P6. Après 1 mois, regarder les chiffres avec Claude** et ajuster la règle si besoin.

> Google ne diffuse ces pubs que sur téléphone. Sur ordinateur, le bouton affiche « pas disponible sur cet appareil ».

## 🟢 À vérifier toi-même

- [ ] **12.** Une fois connecté, tu restes bien reconnu sur l'accueil et les tarifs
- [ ] **13.** Essayer le site et le studio sur ton propre téléphone : capture, modèles, export, statut WhatsApp
- [ ] **14.** Ton compte est en formule gratuite. Pour tester les fonctions payantes sans payer, demande à Claude de le passer en Pro quelques jours (il te demandera ton accord avant de toucher la base)
- [ ] **15.** Répondre à Claude : que veux-tu dire par « le troisième plan qui concerne la gestion de la page web » ? (formule Agence, studio sur téléphone, nouvelle fonction pour le client de l'agence, autre)

## 🚀 Lancement (après les tests)

- [ ] **16.** Faire le mockup de PitchMySite avec PitchMySite lui-même, et ton post de lancement avec la Pitch IA
- [ ] **17.** Montrer l'outil à 10 à 20 freelances ou agences, gratuitement, et noter ce qu'ils disent (stratégie DODD : prouver la demande)
- [ ] **18.** Publier dans **un seul** canal au début (groupes WhatsApp, LinkedIn ou TikTok de développeurs et d'agences), avec un format répétable : « le site de [entreprise] avant / après », avec l'accord de l'entreprise
- [ ] **19.** Récolter les premiers **vrais** avis clients (ce sont les seules preuves qu'on affichera sur le site)

---

## 💰 Les formules (validées le 13/10/2026)

| | Découverte | Solo | Pro | Agence |
|---|---|---|---|---|
| Prix (Mobile Money) | 0 | 3 300 FCFA / mois · 33 000 / an | 5 900 FCFA / mois · 59 000 / an | 19 000 FCFA / mois · 190 000 / an |
| Exports images | 3 / jour, Standard | 20 / mois, HD | Illimités, HD et 4K | Illimités, HD et 4K |
| Bonus pubs | ✅ (quand actives) | — | — | — |
| Filigrane | oui | discret | aucun | aucun |
| Vidéos et GIF | ❌ | ❌ | 10 / mois | Illimités |
| Liens de partage | 5 actifs | Illimités | Illimités | Illimités |
| Marque blanche | ❌ | ❌ | ❌ | ✅ |
| Directeur artistique IA | 3 / mois | 3 / mois | Illimité | Illimité |
| Pitch IA (clé du client) | ✅ | ✅ | ✅ | ✅ |
| Support | — | — | E-mail | WhatsApp prioritaire |

Un paiement couvre 1 mois ou 1 an, sans renouvellement automatique. Packs de crédits : 10 crédits = 2 600 FCFA, 30 = 6 600 FCFA, 75 = 9 800 FCFA (image sans filigrane 1 crédit, 4K 2, vidéo 3, pack de formats 4).

## 🤖 Ce que Claude fera quand tu le demandes

- Directeur artistique IA avec la clé du client (voir point 3)
- Rappel avant la fin d'une formule (le Mobile Money ne se renouvelle pas tout seul)
- Parcours express : 3 visuels prêts (LinkedIn, WhatsApp, proposition) en 1 clic après la capture
- Bouton « Besoin d'aide ? » WhatsApp, factures PDF, validation des visuels par le client final, projets sauvegardés en ligne
- Image d'aperçu des liens partagés, `sitemap` et `robots.txt` pour Google
- Barre du bas du studio plus simple sur téléphone
- Adresse support définitive (après le point 7), interface en anglais

## 📝 Remarques sur ton site Al Kareem Parfumerie

- Beaucoup de produits de la page Boutique n'ont pas d'image
- Sur téléphone, le texte de certaines sections touche le bord gauche, et la bulle WhatsApp cache du texte

---

### Déjà fait (pour mémoire)

- Captures en ligne : 2 à 12 s, deux moteurs qui se relaient
- Nouveau nom PitchMySite et nouvelle accroche
- iPhone 18 Pro en Duo et Trio, 13 modèles classés par usage
- Pitch IA qui lit le site section par section, avec la clé Gemini ou Claude du client (13/10)
- Paiement par Mobile Money uniquement, carte retirée (13/10)
- Déploiements Vercel allégés : 1,6 Go → 176 Mo chacun (13/10)
- Plan de fluidité, phases 1 à 5 : accueil 57 → 71, accessibilité 100/100, exports sans blocage
- Pubs récompensées : code en ligne (invisible pour l'instant)
- Tableau de bord administrateur `/admin` avec accès séparé (mot de passe + code) ; accès créé et connexion réussie (14/10)
- Outil `scripts/admin-check.mjs` pour comprendre un refus de connexion admin, sans rien envoyer (14/10)
- Carte bancaire préparée, bouton grisé « Bientôt », activable par `NEXT_PUBLIC_CARD_PROVIDER` = `saspay` ou `stripe` ; protection contre un abonnement Stripe en plus d'une formule Mobile Money encore valable (14/10)
- Anciens déploiements Vercel supprimés (13/10)
- Tableau de bord version 2 : ventes, revenu net, export CSV, clients à relancer, renouvellements attendus, tentatives et paniers abandonnés, fiche client (14/10)
- Les tentatives SasPay refusées ou annulées sont maintenant marquées « refusées » au lieu de rester « en attente » (14/10)
- Tâches des anciens documents déjà réalisées : pages CGU / confidentialité / 404 / erreur, pied de page, formule verrouillée dans la base, Duo et Trio, délai de capture, page entière, mode sombre, liens de partage, packs App Store et Google Play, vidéo et GIF, projets enregistrés, export multi-formats, mise en ligne sur Vercel
