# PitchMySite — audit sans pitié et étude de la concurrence

16 octobre 2026. Tests faits sur le site en ligne (https://omni-mockup.vercel.app), avec des essais légers et sans danger : aucun compte créé, aucun paiement, aucune donnée modifiée. Le code et les droits de la base ont été relus en lecture seule.

---

## Partie 1 — Les failles trouvées

### Ce qui a résisté aux attaques ✅
- **La base de données** : avec la clé publique (visible par tout visiteur), impossible de lire ou d'écrire les paiements, les comptes, les crédits ou l'admin. Les fonctions qui donnent des crédits ou une formule ne sont pas appelables depuis l'extérieur.
- **Les adresses internes** dans la capture : `127.0.0.1`, `localhost`, l'adresse cachée des serveurs cloud (`169.254.169.254`), les écritures piégées (`2130706433`, `0x7f000001`), un domaine qui pointe vers une adresse interne et `file://` sont tous refusés.
- **Le paiement** : impossible de payer sans compte ou de changer le prix. Les fausses notifications SasPay sont refusées. Le mode démo est inactif en ligne.
- **L'administration** : toutes les pages et routes admin répondent « connexion requise » sans ton mot de passe et ton code.
- **Les liens de partage** : identifiants de 10 caractères aléatoires, impossibles à deviner.

### Les failles, de la plus grave à la moins grave

> **Mise à jour du 16/10 (après-midi)** : les failles 2, 3, 5, 6, 7 et 8 sont **corrigées et vérifiées sur le site en ligne**.
> - Anti-abus : 24 appels sur 75 bloqués en rafale.
> - `[::1]` et la redirection vers une adresse interne sont refusés.
> - Les 5 en-têtes de protection sont présents.
> - Les comptes n'ont plus le droit de modifier leur formule.
>
> La faille 1 (passer Vercel en Pro) est **de ton côté**. La faille 4 (Microlink) est atténuée par la mémoire des captures (3 h).

| # | Gravité | Faille | Ce qui peut arriver | Correction | Qui | Temps |
|---|---|---|---|---|---|---|
| 1 | 🔴 Critique | **La formule gratuite de Vercel (Hobby) interdit l'usage commercial.** Le règlement de Vercel range dans le commercial le fait d'encaisser des paiements et les publicités | Vercel peut suspendre le site du jour au lendemain | Passer le projet en **Vercel Pro** (environ 20 $ par mois) **avant** d'ouvrir les ventes | Toi | 10 min |
| 2 | 🔴 Haute | **Les limites anti-abus ne marchent pas sur Vercel** : 70 appels en moins d'une minute depuis la même adresse, alors que la limite est de 60, et aucun bloqué. Elles sont gardées en mémoire, séparément sur chaque serveur | N'importe qui peut lancer des centaines de captures (sans compte), épuiser le service Microlink et tes limites Vercel, ou remplir le formulaire « fondateurs » | Compteur partagé dans la base (ou pare-feu Vercel avec règle de limite) | Claude (+ ton accord pour une petite table) | 2 h |
| 3 | 🔴 Haute | **Capture : l'adresse interne `[::1]` (IPv6) n'est pas bloquée**, et **les redirections et ce que la page charge ensuite ne sont pas vérifiés** | Une page piégée pourrait faire photographier par ton serveur des adresses internes, puis afficher le résultat dans la capture | Bloquer `[::1]` et filtrer **chaque** requête du navigateur de capture (redirections, images, cadres) | Claude | 1 h 30 |
| 4 | 🟠 Moyenne | **Microlink, le premier moteur de capture, est utilisé sans clé** : environ **50 captures gratuites par jour** au total pour tout le site | Au-delà, toutes les captures passent par le second moteur, plus lent. Avec du trafic, l'expérience se dégrade | Surveiller ; prendre une clé Microlink payante quand les ventes démarrent | Toi, plus tard | — |
| 5 | 🟠 Moyenne | **Le quota gratuit (3 exports par jour) se contourne** : si la demande d'autorisation est bloquée par l'utilisateur ou refusée pour excès d'appels, l'export passe quand même (avec filigrane) | Exports gratuits illimités pour un petit malin | Refuser l'export si le serveur ne répond pas, avec un message clair | Claude | 30 min |
| 6 | 🟠 Moyenne | **Redirection piégée après connexion** : `/login?redirect=https://site-pirate…` envoie la personne sur un autre site une fois connectée | Hameçonnage : faux site qui ressemble au tien | N'accepter que les chemins internes (`/…`) | Claude | 30 min |
| 7 | 🟠 Moyenne | **En-têtes de sécurité absents** (anti-script, anti-intégration dans un autre site…) | Si une faille de script apparaît un jour, elle pourrait voler la clé IA que le client garde dans son navigateur | Ajouter les en-têtes de protection | Claude | 1 h |
| 8 | 🟡 Faible | **Les comptes connectés ont en théorie le droit de modifier leur formule et leurs crédits** ; seule une seconde barrière (RLS) les en empêche aujourd'hui | Si un jour la RLS est désactivée par erreur, n'importe qui se donne la formule Agence | Retirer ce droit (petite migration, avec ton accord) | Claude | 15 min |
| 9 | 🟡 Faible | **Pubs récompensées** : un script peut obtenir les 3 exports bonus du jour sans regarder la pub (8 secondes d'attente suffisent) | 3 exports Standard par jour, avec filigrane | Acceptable (plafond de 3), ou attendre le signal officiel de Google côté serveur | — | — |
| 10 | 🟡 Faible | **Filigrane et qualité calculés dans le navigateur** | Un développeur peut retirer le filigrane avec les outils du navigateur | Normal pour ce type d'outil ; plus tard, générer la 4K côté serveur | — | — |

### Les faiblesses « produit » (ce qui peut faire perdre des clients)

| # | Faiblesse | Pourquoi c'est un problème | Idée |
|---|---|---|---|
| A | **La Pitch IA demande une clé API au client** | La plupart des freelances ne savent pas créer une clé Google. Beaucoup abandonneront avant d'essayer | Offrir **2 ou 3 pitchs d'essai** avec la clé du site (Gemini Flash coûte très peu), puis proposer leur clé |
| B | **Pas d'image d'aperçu** quand on partage ton site (LinkedIn, WhatsApp), **pas de robots.txt ni de plan du site** pour Google | Ton lien partagé apparaît sans image et Google te trouve mal | 1 h de travail |
| C | **Les projets ne sont gardés que sur l'appareil** | Changer de téléphone = tout perdre ; un client payant s'attend à les retrouver | Sauvegarde en ligne pour les formules payantes |
| D | **Pas de renouvellement automatique** (Mobile Money) et **pas encore d'e-mail de rappel** | Beaucoup oublieront de repayer à la fin du mois | E-mail et message WhatsApp de rappel 3 jours avant la fin |
| E | **Pas de facture PDF** | Les agences et entreprises en ont besoin pour leur comptabilité | Facture automatique en FCFA |
| F | **Base de données sans sauvegarde** (Supabase gratuit) | Une erreur = perte des comptes et paiements | Forfait Pro de Supabase ou export régulier |
| G | **Site seulement en français** | Marché limité (Nigeria, Ghana, Kenya, reste du monde) | Version anglaise |
| H | **Pas de domaine ni d'adresse e-mail pro** | Moins de confiance pour payer | Déjà dans ta liste (points 6 à 8) |

---

## Partie 2 — La concurrence

Prix trouvés le 16/10/2026 sur les sites officiels ou des comparateurs. Ils varient selon les sources : à revérifier avant de les citer publiquement.

| Outil | Ce qu'il fait | Coller un lien ? | Prix | Points forts | Points faibles pour ta cible |
|---|---|---|---|---|---|
| **Shots.so** | Captures d'écran en visuels avec cadres et scènes 3D | Non (on importe une image) | Gratuit + payant (environ 8 à 12 $/mois selon des estimations) | Très beau, très connu | En dollars, par carte ; pas de textes de vente |
| **Pika.style** | Éditeur de captures et de maquettes, capture de site par lien | **Oui** | Environ 13 à 15 $/mois | Capture par lien, beaucoup de modèles | En dollars, par carte ; rien pour vendre au client |
| **Mockuuups Studio** | Application d'ordinateur, plus de 5 300 scènes | Par son API seulement | Gratuit limité, 15 $/mois ou 120 $/an | Énorme bibliothèque de scènes | Application à installer ; en dollars |
| **Previewed** | Maquettes d'appareils Apple, vidéos 3D | Non | Gratuit limité, 9,99 $ une fois, 19 $/mois | Vidéos 3D soignées | Surtout iPhone/Apple ; anglais |
| **Rotato** | Animations 3D d'appareils | Non | Version web gratuite (bêta), application Mac de 79 à 199 $ une fois | Les plus belles animations | Mac surtout ; demande du savoir-faire |
| **Canva (Mockups)** | Maquettes dans Canva, bureau, objets, appareils | Non | Gratuit + Canva Pro (environ 12 à 13 $/mois) | Tout le monde connaît Canva | Généraliste ; aucune capture de site |
| **Placeit** | Modèles de maquettes, logos, vidéos | Non | Environ 7,50 à 15 $/mois | Énorme catalogue | Rendu « banque d'images », générique |
| **URL2Mockup** et autres petits outils gratuits | Lien → cadre d'appareil simple | **Oui** | Gratuit | Simple et rapide | Très basique, pas de studio |

### Ce qui rend PitchMySite différent (personne ne réunit tout ça)
1. **Un lien suffit** : capture de la **page entière** et de la **vraie version téléphone** du site, pas une image redimensionnée.
2. **Un outil pour vendre, pas seulement pour faire joli** : visuels, **post LinkedIn et proposition commerciale écrits par l'IA**, **PDF de présentation** et **lien de partage** pour le client, en un seul endroit.
3. **Pensé pour l'Afrique de l'Ouest** : **paiement Mobile Money en FCFA**, prix local (3 300 FCFA/mois, environ 5 €), **format statut WhatsApp**, tout en français.
4. **Marque blanche pour les agences** : le client final voit le logo de l'agence, pas PitchMySite.
5. **iPhone 18 Pro et dispositions Duo / Trio** prêtes en un clic.

### Ce qui manque face à eux
- Moins de scènes photo (8, contre plus de 5 300 chez Mockuuups).
- Moins d'animation 3D que Rotato ou Previewed.
- Pas d'anglais, une marque inconnue, pas encore de vrais avis.

---

## Partie 3 — Ce qu'il faut ajouter pour se démarquer (les arguments qui feront vendre)

Classé par impact sur la vente. **Les idées 1 à 4 font de PitchMySite « l'outil qui aide à signer des clients »**, ce qu'aucun concurrent ne fait.

| # | Idée | Pourquoi ça convainc | Temps estimé |
|---|---|---|---|
| 1 | **« Votre client a ouvert votre proposition »** : prévenir le freelance quand son client ouvre le lien de partage, combien de fois et quand (le compteur de vues existe déjà) | Le freelance sait **quand relancer**. Aucun concurrent ne le fait | 3 h |
| 2 | **Validation par le client** : boutons « Je valide » et « Je demande une modification » sur le lien de partage, avec commentaire | Fini les allers-retours WhatsApp désordonnés : le client valide en un clic | 4 h |
| 3 | **Kit de proposition en 1 clic** : visuels, PDF, texte de proposition et lien de partage générés ensemble juste après la capture | « De l'adresse du site à la proposition prête à envoyer en 2 minutes » | 4 h |
| 4 | **Pitch IA sans clé pour 3 essais** | Le client voit la magie avant de devoir créer une clé | 2 h |
| 5 | **Scènes photo locales** : bureau à Cotonou ou Dakar, mains, marché, boutique | Les concurrents n'ont que des scènes occidentales. Tes clients s'y reconnaîtront | Selon les photos disponibles |
| 6 | **Devis et facture PDF en FCFA** au nom de l'agence | Les agences peuvent facturer leur propre client depuis l'outil | 4 h |
| 7 | **Portfolio public automatique** : une page de l'agence avec tous ses projets partagés | Un portfolio pro sans site à construire | 4 h |
| 8 | **Parrainage** : 10 crédits offerts au parrain et au filleul | Le bouche-à-oreille WhatsApp fait la croissance | 3 h |
| 9 | **Rappels de renouvellement** par e-mail et WhatsApp | Garde les clients qui oublient de repayer | 2 h (après Resend) |
| 10 | **Version anglaise** | Ouvre le Nigeria, le Ghana, le Kenya, Reddit et Product Hunt | 1 à 2 jours |

### Les 5 phrases pour convaincre un client
1. « **Collez le lien de votre site, recevez des visuels qui donnent envie de signer.** »
2. « **Vos visuels, votre texte de proposition et votre lien client, en 2 minutes.** » (après l'idée 3)
3. « **Sachez quand votre client a ouvert votre proposition.** » (après l'idée 1)
4. « **Payez en Mobile Money, en FCFA. Dès 3 300 FCFA par mois.** »
5. « **Pour les agences : votre logo, pas le nôtre.** »

---

## Plan d'action conseillé

**Avant d'ouvrir les ventes (sécurité et règles) :**
1. **Toi** : passer Vercel en Pro (faille 1).
2. **Claude** : corriger les failles 2, 3, 5, 6 et 7, puis la 8 avec ton accord. Environ **6 h** au total, testées, puis montrées avant la mise en ligne.

**Pour vendre mieux :**
3. Idées 4, 1 et 3 (Pitch IA d'essai, « client a ouvert », kit en 1 clic) : environ **9 h**.
4. Image d'aperçu et plan du site pour Google : **1 h**.

**Ensuite** : validation client, rappels de renouvellement, factures, version anglaise.

---

## Sources (concurrence et règles)
- Règles de Vercel sur l'usage commercial : https://vercel.com/docs/limits/fair-use-guidelines
- Limite gratuite de Microlink : https://microlink.io/pricing
- Mockuuups Studio : https://mockuuups.studio/pricing/
- Rotato : https://rotato.app/pricing.md
- Previewed : https://toolradar.com/tools/previewed/pricing
- Pika.style : https://toolradar.com/tools/pika-style et https://freetier.co/directory/products/pika
- Shots.so : https://gappsy.com/tools/shots/
- Placeit : https://www.freevisuals.net/post/placeit-review et https://toolradar.com/tools/placeit/pricing
- Canva Mockups : https://freetier.co/directory/products/canva-mockups
- Comparatif d'outils : https://toolradar.com/compare/screely-vs-rotato, https://postmake.io/compare/smartmockups-vs-rotato
- URL2Mockup : https://peerpush.com/p/url2mockup
