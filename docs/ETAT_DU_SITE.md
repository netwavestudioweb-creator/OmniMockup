# État du site PitchMySite — 13 octobre 2026

Adresse actuelle : **https://omni-mockup.vercel.app** (le domaine `pitchmysite.com` n'est pas encore acheté).

**Légende**
- ✅ **marche et testé** (en ligne ou sur une copie fidèle du site)
- 🟡 **en ligne, mais pas testé de bout en bout** (code vérifié, test réel impossible sans toi ou sans vrai client)
- 🔴 **en ligne mais bloqué** tant que tu n'as pas fait un réglage (voir `A_FAIRE_DODO.md`)

---

## 1. Site public

| Fonction | État |
|---|---|
| Nom **PitchMySite**, nouvelle accroche « Collez le lien de votre site. Recevez des visuels qui donnent envie de signer. » | ✅ |
| Page d'accueil : vrai mockup de la boutique Al Kareem, fonctions, formules, FAQ, formulaire « agences fondatrices » | ✅ |
| Page Tarifs : formules Solo / Pro / Agence, packs de crédits, prix en € ou en $ selon le pays | ✅ |
| Pages Connexion, Inscription, Compte, CGU, Confidentialité | ✅ |
| Page 404 et page d'erreur soignées | ✅ |
| Affichage téléphone et tablette : 9 pages × 375 / 440 / 768 px sans défilement horizontal | ✅ |
| Accessibilité 100/100 (lecteurs d'écran, contrastes, taille des boutons) sur accueil, tarifs, connexion, inscription | ✅ |
| Vitesse : accueil 57 → 71/100 (mesure locale, téléphone simulé), page plus légère de 70 Ko | ✅ |
| Pages sans référencement Google pour l'administration et les liens de partage | ✅ |
| Image d'aperçu quand on partage le lien du site (LinkedIn, WhatsApp), fichiers pour Google (sitemap, robots) | ❌ pas encore fait |
| Site en anglais | ❌ reporté |

## 2. Capture d'un site

| Fonction | État |
|---|---|
| Coller un lien → capture automatique de la page entière | ✅ 2 à 12 s en ligne (ta boutique : environ 3 s) |
| Deux moteurs qui se relaient (service externe + notre propre navigateur) | ✅ |
| Vraie version téléphone du site dans les téléphones | ✅ 11 à 20 s pour ta boutique |
| Écran de chargement avec le temps réel et bouton « Annuler » | ✅ |
| Message clair si l'adresse n'existe pas ou si le site ne répond pas | ✅ |
| Réouverture instantanée d'un lien déjà capturé (15 min) | ✅ |
| Options : délai avant capture, version sombre du site, bannières cookies masquées | ✅ |
| Plusieurs pages d'un même site (jusqu'à 5) | ✅ |
| Importer sa propre image à la place d'une capture | ✅ |

## 3. Studio

| Fonction | État |
|---|---|
| Ouverture du studio en 0,06 s une fois la capture reçue | ✅ |
| Appareils : navigateur (6 styles), MacBook, ordinateur Windows, iMac, iPad, **iPhone 18 Pro**, Android, montre, capture seule | ✅ |
| Dispositions Solo, Duo (ordinateur + iPhone 18 Pro), Trio (ordinateur + iPad + iPhone 18 Pro), Avant / Après | ✅ |
| Couleurs d'appareil : les 4 coloris officiels de l'iPhone 18 Pro + 4 teintes classiques | ✅ |
| Angle 3D, rotation, taille, ombres, lumière, coins, thème clair / sombre | ✅ |
| Fonds : dégradés, couleurs, photos, transparent, flou, couleurs tirées du site | ✅ |
| Effets : flou portrait, halo, grain, ombres de feuilles / stores / fenêtre | ✅ |
| **13 modèles prêts à publier** classés par usage (LinkedIn, Instagram, statut WhatsApp, proposition, portfolio), avec aperçu du vrai site | ✅ |
| **8 scènes photo réalistes** (ordinateur sur un bureau, téléphone en main) | ✅ |
| Textes, logos, polices, bulles d'explication | ✅ |
| Annotations : flèches, cadres, cercles, étapes numérotées, **flou réel d'une zone**, loupe | ✅ |
| Kit de marque (logo, couleurs, police, signature) et « Mes styles » | ✅ |
| Annuler / Rétablir, repères d'alignement, mode Simple / Expert, visite guidée | ✅ |
| Mes projets : sauvegarde automatique, reprise, dossiers par client (50 projets, **sur l'appareil seulement**) | ✅ |
| Studio sur téléphone | 🟡 utilisable, mais la barre du bas défile (le zoom est caché à droite) |

## 4. Exports

| Fonction | État |
|---|---|
| Image PNG / JPG / WebP en Standard, HD ou 4K, selon la formule | ✅ |
| Bandeau de progression, messages clairs, pas de blocage si le client change d'application | ✅ |
| Packs : réseaux sociaux (5 fichiers), App Store et Google Play (tailles officielles) | ✅ 5 fichiers en 10,7 s |
| Statut WhatsApp (1080 × 1920, léger) et partage direct sur téléphone | ✅ |
| Copier l'image | ✅ |
| Vidéo MP4 (zoom, glissement, rotation 3D, entrée, défilement) et GIF animé | 🟡 testé lors des lots précédents ; la vidéo doit garder l'onglet ouvert |
| PDF de présentation client, carrousel LinkedIn et Instagram | 🟡 testé lors des lots précédents |
| Filigrane « Réalisé avec PitchMySite » en formule gratuite et Solo | ✅ |

## 5. Partage et marque blanche

| Fonction | État |
|---|---|
| Lien de partage `/p/…` (aperçu, téléchargement, aperçu WhatsApp), 5 liens actifs en gratuit | ✅ |
| Marque blanche Agence : la page de partage porte le nom et le logo de l'agence | ✅ testé avec un compte d'essai |

## 6. Intelligence artificielle

| Fonction | État |
|---|---|
| **Pitch IA** : lit le site section par section (5 à 6 captures), écrit post LinkedIn, proposition commerciale, étude de cas, accroches ; onglet « Ce que l'IA a vu » | 🔴 code prêt, **clés IA vides sur Vercel** ; jamais vu marcher en ligne |
| IA utilisée : Claude (Opus 5.5) en principal, Gemini en secours, limite de 50 s, message clair si surchargée | 🔴 même raison |
| **Directeur artistique IA** (note chaque section du site) | 🔴 même raison (clé Gemini vide) ; sans IA, découpage automatique de secours |
| Limites Pitch IA : gratuit / Solo = crédits, Pro = 5 par mois, Agence = illimité, remboursé si échec | ✅ vérifié côté serveur |

## 7. Comptes et connexion

| Fonction | État |
|---|---|
| Inscription et connexion (e-mail + mot de passe, Google) | ✅ |
| Connexion par e-mail + code (Resend) | ❌ prête sur une branche à part, attend le domaine et Resend |
| Page Compte : formule, crédits, gestion de l'abonnement | 🟡 le bouton « Gérer mon abonnement » attend le portail client Stripe |
| Reconnaissance du client connecté après l'affichage de la page (plus rapide) | 🟡 à vérifier par toi une fois connecté |

## 8. Formules, limites et crédits

| Fonction | État |
|---|---|
| Gratuit : 3 exports Standard par jour avec filigrane, vérifiés par le serveur | ✅ |
| Solo 20 exports HD / mois, Pro illimité jusqu'en 4K + 10 vidéos, Agence illimité + marque blanche | ✅ vérifié côté serveur |
| Crédits pour dépasser sa formule (export, 4K, vidéo, pack, Pitch IA) | ✅ |
| Fenêtre « limite gratuite atteinte » avec des textes à jour | ✅ |

## 9. Paiements

| Fonction | État |
|---|---|
| Carte bancaire (Stripe), en € ou en $ | 🔴 **webhook Stripe vide** : un client paierait sans que sa formule s'active |
| Mobile Money / carte en FCFA (SasPay) | 🟡 code relu et sécurisé, **jamais testé avec un vrai paiement** |
| Sécurité : prix fixé par le serveur, montant revérifié, pas de double crédit, refus sans compte, fausses notifications refusées | ✅ testé en ligne |
| Changement de formule depuis l'espace Stripe, délai de grâce si paiement en retard | 🟡 code prêt, testable après le webhook |
| Factures PDF | ❌ pas encore fait |

## 10. Pubs récompensées (formule gratuite)

| Fonction | État |
|---|---|
| « Regarder une pub = 1 export de plus », 3 par jour, jamais pour les payants | ✅ règles testées en ligne (limite 3 + 1 après une pub) |
| Affichage de la pub Google | 🔴 invisible tant que ton compte Google Ad Manager et ton bloc « pub récompensée » ne sont pas créés |

## 11. Tableau de bord administrateur (`/admin`)

| Fonction | État |
|---|---|
| Accès **rien qu'à toi** : mot de passe + code à 6 chiffres, séparé des comptes clients, blocage après 5 erreurs | 🔴 **verrouillé pour tout le monde** tant que tu n'as pas créé ton accès (script) |
| Chiffres clés, clients, formules, crédits, fonctions utilisées, parcours d'achat, santé du site, courbes 30 jours | ✅ testé avec des données d'essai |
| Gestion des comptes (offrir une formule, ajouter des crédits, journal) | 🟡 pas essayé sur de vrais comptes |
| Liste des paiements et des paiements SasPay à vérifier | ✅ |
| Suivi d'usage (captures, modèles, dispositions, IA…) | ✅ se remplit depuis le 13/10/2026 |

## 12. Sécurité

| Fonction | État |
|---|---|
| Aucun mot de passe ni clé secrète dans le code (le dépôt est public) | ✅ compte de test en clair retiré |
| Protection contre les captures d'adresses internes, limites de requêtes | ✅ |
| Données de la base fermées aux visiteurs (formules, paiements, pubs, admin) | ✅ vérifié |
| Sauvegardes automatiques de la base | ❌ le forfait gratuit de Supabase n'en fait pas |

---

## Ce qui reste à faire

### De ton côté (détail pas à pas dans `A_FAIRE_DODO.md`)

**Urgent, avant de vendre :**
1. Créer le **webhook Stripe** et coller son secret dans Vercel (avec `invoice.paid`)
2. Activer le **portail client Stripe**
3. Mettre les **clés IA** sur Vercel (`ANTHROPIC_API_KEY`, vérifier `GEMINI_API_KEY`)
4. **Redéployer** sur Vercel
5. Faire un **paiement d'essai Stripe** (carte 4242…) et un **vrai paiement SasPay**
6. Renommer les produits Stripe « OmniMockup » en « PitchMySite »
7. Faire un **test complet comme un client**
8. Créer ton **accès administrateur** (script `node scripts/admin-setup.mjs`, étapes T1 à T5)

**Ensuite :**
9. Acheter `pitchmysite.com` (après vérification de la marque à l'OAPI et à l'INPI) et le brancher
10. Adresse `support@pitchmysite.com`, connexion par e-mail avec Resend
11. Supabase : protection des mots de passe, nom PitchMySite dans les e-mails, **sauvegardes**
12. Passer Stripe en clés réelles
13. Compte Google Ad Manager pour les pubs (P2 à P6)
14. Supprimer les variables FedaPay de Vercel

**Lancement :**
15. Montrer l'outil à 10 à 20 agences, publier sur un seul canal, récolter les premiers vrais avis

### Ce que Claude peut encore faire quand tu le demandes

- **Parcours express** : 3 visuels prêts (LinkedIn, WhatsApp, proposition) en 1 clic juste après la capture — le plus utile pour les nouveaux clients
- **Bouton « Besoin d'aide ? » WhatsApp** dans le studio
- **Factures PDF** automatiques après chaque paiement
- **Validation par le client final** sur le lien de partage (« Valider » / « Demander une modification »)
- **Projets sauvegardés en ligne** pour les formules payantes
- Barre du studio plus simple sur téléphone
- Image d'aperçu des liens partagés, fichiers pour Google
- Mettre l'adresse support définitive, brancher Resend, activer les pubs (dès que tes réglages sont faits)
- Interface en anglais
