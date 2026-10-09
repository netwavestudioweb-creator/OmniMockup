# Studio OmniMockup — liste fonctionnelle complète

Rédigé le 9 octobre 2026. Base : inventaire du code (`SceneEditor.tsx`, `MockupFrame.tsx`, etc.), captures du studio (`captures-studio/`), outils du marché (Shots.so, Screely, Pika, Rotato, Mockuuups, Smartmockups, Placeit, AppLaunchFlow) et besoins des agences web et freelances (cible n°1).

**Statut** : ✅ existe et fonctionne · ⚠️ existe mais à corriger ou simplifier · ❌ à créer
**Origine** : 🌐 vu partout sur le marché · 🏢 besoin agence ou freelance · 🌍 besoin Afrique de l'Ouest · 🔧 déjà dans OmniMockup
**Lot** : ordre de réalisation proposé (Lot 1 = en premier)

---

## Suivi

| Lot | État | Détail |
|---|---|---|
| Lot 1 | ✅ en ligne (commit `4dea094`) | B1 à B10, H1, I2. 30/30 contrôles automatiques. |
| Lot 2 | ✅ codé et testé (branche `studio-lot2`, non mise en ligne) | C1, C3, C4, D1, D2, D3, E1, E2, E4, E5, F1, G1, H2 (MP4), H3, B11, B12, I3. 2 migrations à appliquer. |

**Lot 2, ce qui a été fait :**
- Android + 5 couleurs d'appareil ; vraie capture mobile du site dans les téléphones (Solo, Duo, Trio)
- Sauvegarde automatique (navigateur) et « Reprendre votre dernier mockup » sur l'accueil
- Annotations : flèche, cadre, cercle, étapes numérotées, **flou réel dans le fichier exporté** ; repères d'alignement
- Avant / Après (ancien site par URL, archive ou image) avec libellés modifiables
- Kit de marque (logo, couleurs, police, signature) — compte ou navigateur ; 7 polices incluses dans l'export ; « Mes styles »
- Vidéo en **MP4** quand le navigateur le permet ; mentions « 60fps » retirées
- Statut WhatsApp (1080×1920, ~100 Ko) et partage natif sur téléphone
- **Limites d'export vérifiées par le serveur** et **crédits enfin utilisés** (ils étaient vendus sans servir à rien)
- Captures en JPG (capture mobile −79 %), studio chargé à la demande
- Visite guidée en 3 étapes

**Bugs corrigés pendant le Lot 2 :** contour de sélection et boutons de suppression exportés dans l'image ; fenêtre d'offre « Quota atteint » affichée même pour une option non incluse ; texte de la fenêtre d'offre (MP4) ; filigrane en anglais.

**Reste du Lot 2 non traité :** C2 (portable Windows) déplacé au Lot 3 ; D5 couvert par la signature du kit de marque.

**Bugs trouvés et corrigés pendant le Lot 1** (en plus de la liste) : le fond ne s'affichait jamais ; l'export échouait sur tous les sites (favicon bloqué) ; le pack sortait 5 images identiques ; deux badges ne s'affichaient jamais ; badges cachés derrière l'appareil ; couleur des bulles ignorée ; rendu différent selon la taille de l'écran ; studio inutilisable sur téléphone.

---

## A. Ce qui est déjà dans le studio (inventaire)

| Fonction | Statut | Remarque |
|---|---|---|
| Capture automatique d'une URL | ✅ | ~15 à 30 s |
| Import d'une image (glisser-déposer) | ✅ | |
| 7 appareils : Web, MacBook, iMac, iPad, iPhone, Watch, Flat | ✅ | Apple uniquement |
| Dispositions Solo, Duo (Mac + iPhone), Trio (Mac + iPad + iPhone) | ⚠️ | iPad mal placé en Trio |
| Thème clair/sombre, style Standard/Glass, coins 0/16/28 px | ✅ | |
| 6 styles de navigateur (Safari, Chrome, Arc, clair/sombre), barre d'adresse personnalisée | ✅ | |
| Ombres (4 types, opacité, angle de lumière) | ✅ | |
| 3D : poses rapides, inclinaisons, rotation, taille | ✅ | |
| Défilement de la page dans l'appareil | ✅ | |
| Formats : 16:9, 1:1, 4:3, 9:16, 1.91:1 + tailles réseaux sociaux | ⚠️ | 2 réglages de format qui se contredisent |
| Arrière-plans : dégradés, couleur, image, transparent, flou, « Magic » (couleurs tirées de la capture) | ✅ | |
| Effets : flou portrait, halo VFX, grain, ombres d'ambiance, formes 3D | ✅ | |
| Textes, logos, badges de technologies | ✅ | |
| Callouts (bulles) et badges de preuve sociale | ⚠️ | faux chiffres pré-remplis |
| 18 templates de mise en scène | ✅ | |
| Export PNG 1x/2x/4x, copie presse-papier | ⚠️ | limites décidées dans le navigateur |
| Vidéo 3 s (zoom) | ⚠️ | format WebM seulement (pas MP4) |
| Pack OmniExport (5 formats d'un coup) | ⚠️ | se lance sans prévenir |
| Pitch IA (textes de vente via Gemini) | ✅ | |
| Mode présentation, zoom du canevas, plein écran | ✅ | |
| Version mobile du studio (panneau en bas) | ⚠️ | à vérifier en détail |
| Choix des sections par l'IA (directeur artistique) | ❌ | composants codés mais **débranchés** |

---

## B. Corrections et simplification (Tâche 1 — « facile pour tout le monde »)

| # | Quoi | Origine | Lot |
|---|---|---|---|
| B1 | Barre du haut qui déborde à 1440 px : regrouper en 3 zones claires (Projet · Disposition · Exporter) | 🔧 | 1 |
| B2 | **Un seul bouton « Exporter »** qui ouvre un panneau : format (PNG/JPG/WebP/MP4), taille, qualité, et « Pack réseaux sociaux » en option | 🌐 🔧 | 1 |
| B3 | Un seul réglage de format (fusionner le format du bas et « Format du canevas ») | 🔧 | 1 |
| B4 | Supprimer la barre de gauche qui fait doublon, garder les onglets de droite | 🔧 | 1 |
| B5 | Renommer les onglets en français simple : Appareil · Angle 3D · Fond · Textes & logo · Annotations · Modèles | 🏢 | 1 |
| B6 | **Mode Simple / Mode Expert** : par défaut, 4 réglages essentiels visibles ; le reste derrière « Plus de réglages » | 🏢 | 1 |
| B7 | Callouts : remplacer les faux chiffres par des modèles à compléter (« Votre note », « Votre chiffre clé ») | 🔧 règle Dodo | 1 |
| B8 | Placement Trio corrigé (iPad, iPhone et Mac bien alignés) | 🔧 | 1 |
| B9 | Annuler / Rétablir (Ctrl+Z / Ctrl+Y) + boutons visibles | 🌐 | 1 |
| B10 | Infobulles sur chaque bouton + raccourcis clavier affichés | 🌐 | 1 |
| B11 | Visite guidée au premier lancement (3 étapes, ignorable) | 🌐 | 2 |
| B12 | Limites d'export (filigrane, 4K, 3/jour) vérifiées **côté serveur** | 🔧 sécurité | 2 |

## C. Appareils et rendu

| # | Quoi | Origine | Lot |
|---|---|---|---|
| C1 | **Téléphones Android** (style Pixel / Samsung génériques) | 🌍 🌐 | 2 |
| C2 | Ordinateur portable Windows générique | 🌍 | 3 |
| C3 | Couleurs d'appareil (noir, argent, titane…) | 🌐 | 2 |
| C4 | **Capture mobile réelle** : le site capturé en largeur téléphone pour l'iPhone/Android (pas l'image du bureau réduite) | 🏢 🌐 | 2 |
| C5 | Capture pleine page (toute la hauteur) + vidéo de défilement | 🌐 🏢 | 3 |
| C6 | Options de capture : délai, masquer les bandeaux cookies, mode sombre du site | 🌐 | 3 |
| C7 | Scènes photo réalistes (téléphone en main, ordinateur sur un bureau) | 🌐 | 4 |

## D. Fond, style et marque

| # | Quoi | Origine | Lot |
|---|---|---|---|
| D1 | **Kit de marque** enregistré : logo, couleurs et police de l'agence, réappliqués en 1 clic | 🏢 | 2 |
| D2 | Mes styles enregistrés (réutiliser une mise en scène) | 🌐 | 2 |
| D3 | Choix de polices (Google Fonts) pour les textes | 🌐 | 2 |
| D4 | Bibliothèque de fonds photo (images libres de droits) | 🌐 | 3 |
| D5 | Filigrane « Réalisé par [agence] » personnalisable (plan Agence) | 🏢 | 2 |

## E. Annotations (expliquer un site au client)

| # | Quoi | Origine | Lot |
|---|---|---|---|
| E1 | Flèches et formes (cercle, rectangle) | 🌐 | 2 |
| E2 | **Flouter une zone** (données sensibles du client) | 🌐 🏢 | 2 |
| E3 | Loupe / zoom sur un détail | 🌐 | 3 |
| E4 | Étapes numérotées (1, 2, 3) | 🏢 | 3 |
| E5 | Repères d'alignement et magnétisme lors du déplacement | 🌐 | 2 |

## F. Spécial agences (différenciation)

| # | Quoi | Origine | Lot |
|---|---|---|---|
| F1 | **Avant / Après** : ancien site vs refonte côte à côte (2 URL) | 🏢 | 2 |
| F2 | **Présentation client en PDF** : plusieurs mockups + textes, prête à envoyer avec un devis | 🏢 | 3 |
| F3 | Carrousel LinkedIn / Instagram (plusieurs visuels d'un coup) | 🏢 🌐 | 3 |
| F4 | Plusieurs pages d'un même site capturées d'un coup (accueil, tarifs, contact) | 🏢 | 3 |
| F5 | **Rebrancher l'IA directeur artistique** : choix des meilleures sections avec justification | 🔧 | 3 |
| F6 | Lien de partage d'un mockup (page publique pour le client) | 🌐 🏢 | 4 |

## G. Projets et sauvegarde

| # | Quoi | Origine | Lot |
|---|---|---|---|
| G1 | Sauvegarde automatique du travail en cours (ne rien perdre en fermant l'onglet) | 🌐 | 2 |
| G2 | **Mes projets** : historique des mockups, rouvrir, dupliquer, supprimer | 🌐 🏢 | 3 |
| G3 | Dossiers par client | 🏢 | 4 |

## H. Export et partage

| # | Quoi | Origine | Lot |
|---|---|---|---|
| H1 | Export JPG et WebP (fichiers plus légers) | 🌐 🌍 | 1 |
| H2 | **Vidéo MP4** (lisible partout, WhatsApp compris) | 🌐 🌍 | 3 |
| H3 | Export optimisé WhatsApp (statut 9:16, fichier léger) + bouton « Partager » du téléphone | 🌍 | 2 |
| H4 | GIF animé | 🌐 | 4 |
| H5 | Animations vidéo supplémentaires (rotation 3D, défilement, glissement) | 🌐 | 3 |
| H6 | Pack App Store / Play Store (tailles officielles) | 🌐 | 4 |

## I. Confort et accessibilité

| # | Quoi | Origine | Lot |
|---|---|---|---|
| I1 | Interface FR / EN (cible francophone et anglophone) | 🏢 | 3 |
| I2 | Studio vraiment utilisable sur téléphone (vérification complète 375 / 440 / 768 px) | 🌍 | 1 |
| I3 | Chargement rapide sur connexion lente (images compressées, chargement progressif) | 🌍 | 2 |

---

## Plan de travail proposé

| Étape | Contenu | Correspond à |
|---|---|---|
| **Lot 1** | B1 à B10, H1, I2 : studio simplifié, bugs corrigés, export clair | Tâche 1 |
| **Lot 2** | Android, capture mobile, kit de marque, annotations, avant/après, WhatsApp, sauvegarde auto, limites serveur | Tâche 2 |
| **Lot 3** | PDF client, carrousel, multi-pages, IA directeur artistique, MP4, projets, FR/EN | Tâche 2 |
| **Lot 4** | Scènes photo, partage public, GIF, App Store, dossiers clients | Tâche 2 |
| **Contrôle** | Vérification complète de tout ce qui a été fait + rendu + fonctions restantes | Tâche 3 |
| **Mise en ligne** | Liste finale de ce qui reste pour tester et lancer | Tâche 4 |

Chaque lot : code → `tsc` + build → test à l'écran (1440, 768, 440, 375 px) → captures avant/après → validation de Dodo → mise en ligne.
