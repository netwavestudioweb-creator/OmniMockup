# 🇧🇯 Guide d'Intégration MTN Mobile Money Bénin & Kit de Vente Développeur

**Projet :** OmniMockup Studio  
**Date :** Octobre 2026  
**Localisation & Opérateur :** Bénin — MTN Mobile Money (MoMo)

---

## 📱 1. Comment recevoir l'argent directement sur ton compte MTN MoMo ?

Nous avons intégré **FedaPay**, la passerelle de paiement leader basée au Bénin qui gère nativement **MTN Mobile Money Bénin** (ainsi que Moov Money et Wave) et effectue des reversements directs (*payouts*) sur ton propre numéro de téléphone MTN MoMo.

### Étape 1 : Créer ton compte FedaPay
1. Rends-toi sur [https://fedapay.com](https://fedapay.com) et crée ton compte marchand.
2. Dans le menu **Paramètres > Clés d'API**, tu trouveras :
   * Ta **Clé Publique** (`pk_live_...` ou `pk_sandbox_...` pour tester)
   * Ta **Clé Secrète** (`sk_live_...` ou `sk_sandbox_...`)

### Étape 2 : Connecter ton numéro MTN MoMo pour les reversements
1. Dans ton tableau de bord FedaPay, va dans **Reversements / Payouts**.
2. Ajoute ton numéro personnel **MTN Mobile Money Bénin** (+229 XX XX XX XX).
3. Active le reversement automatique (ou demande un virement en 1 clic dès que des clients s'abonnent). L'argent arrive directement sur ton solde MTN MoMo.

### Étape 3 : Renseigner les clés dans ton projet
Ouvre ton fichier `.env.local` et renseigne tes clés :
```env
FEDAPAY_PUBLIC_KEY=pk_live_votre_cle_publique_ici
FEDAPAY_SECRET_KEY=sk_live_votre_cle_secrete_ici
FEDAPAY_ENVIRONMENT=live
```
*(En attendant de valider ton KYC FedaPay, tu peux laisser `FEDAPAY_ENVIRONMENT=sandbox` et tester avec les numéros de test FedaPay).*

### Étape 4 : Activer le Webhook sur FedaPay
1. Dans ton dashboard FedaPay > **Webhooks**, clique sur **Ajouter un endpoint**.
2. Renseigne l'URL de ton site :
   `https://ton-domaine.com/api/payments/fedapay/webhook`
3. Coche l'événement : `transaction.approved`.
4. Dès qu'un client valide son paiement sur son téléphone MTN, son abonnement OmniMockup est instantanément activé dans ta base de données Supabase !

---

## 🗄️ 2. Migration Base de Données Supabase

Exécute ce script SQL dans l'éditeur SQL de ton projet Supabase (ou via les migrations) :
Fichier : `supabase/migrations/20240102000000_add_fedapay_and_plans.sql`

```sql
-- 1. Mise à jour de la contrainte pour accepter tous les plans
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_plan_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_plan_check 
CHECK (plan IN ('free', 'starter', 'creator', 'pro', 'agence'));

-- 2. Colonnes pour FedaPay et Mobile Money
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS fedapay_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS momo_phone TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_fedapay_tx 
ON public.profiles(fedapay_transaction_id);
```

---

## 🚀 3. Fonctionnalités "Aider les Développeurs à se Vendre" Ajoutées

### A. Badges Stack Technique (Composant `TechStackPicker.tsx`)
* **Dans le Studio 3D**, un nouvel onglet **"Stack"** (6ème onglet) permet de sélectionner jusqu'à 6 technologies maîtrisées (Next.js, React, Tailwind, TypeScript, Supabase, Node.js, Python, Flutter, Docker, etc.).
* Les badges s'affichent en temps réel sur la scène en **verre poli (glassmorphism)**, haut, bas ou flottant.
* **Bénéfice :** Vos réalisations prouvent immédiatement votre niveau technique aux clients et recruteurs sans qu'ils aient besoin d'ouvrir GitHub.

### B. Assistant Vente & Pitch Commercial IA (Composant `DeveloperSalesKitModal.tsx`)
* Bouton **"Pitch & Vente IA"** accessible directement en haut du Studio 3D.
* Propulsé par Google Gemini (`/api/generate-pitch`), il produit en 1 clic :
  1. **Un Post LinkedIn Viral :** Accroche percutante, narration du problème client résolu, mise en valeur de la stack, et appel à l'action pour attirer des prospects en messagerie privée.
  2. **Un Pitch Devis / Email Freelance :** Idéal pour postuler sur Upwork, Malt, Fiverr ou démarcher directement des entreprises pour vendre une prestation similaire à forte valeur.
  3. **Une Fiche Étude de Cas Portfolio :** Défi, Solution technique adoptée, et Impact business mesurable.
  4. **Bouton Copier en 1 clic** avec retour visuel immédiat.

### C. Nouveaux Presets Spécial Vente Freelance & Réseaux
* **Upwork / Portfolio (4:3)** : Dimensions parfaites pour les vignettes de profil de mission freelance.
* **LinkedIn Post (1.91:1)** : Format officiel recommandé par LinkedIn pour maximiser la portée organique dans le flux d'actualité.
* **Product Hunt / X (16:9)** : Ratio d'impact pour les lancements publics et Twitter.

---

## 💰 4. Grille Tarifaire FCFA Implémentée

Dans la page `/pricing`, les visiteurs peuvent désormais basculer entre :
1. 🇧🇯 **MTN Mobile Money Bénin & Afrique (FCFA)** :
   * **Starter :** 5 000 FCFA / mois (4 000 FCFA / mois en annuel)
   * **Essentiel :** 9 000 FCFA / mois (7 500 FCFA / mois en annuel)
   * **Pro Unlimited :** 15 000 FCFA / mois (12 000 FCFA / mois en annuel)
   * **Studio Agence :** 35 000 FCFA / mois (28 000 FCFA / mois en annuel)
2. 🌐 **Carte Bancaire Internationale (Stripe - € / $)**.

Lorsqu'un utilisateur sélectionne Mobile Money, une boîte de dialogue contextuelle lui demande son numéro MTN Bénin (`+229 ...`) et redirige automatiquement vers le guichet sécurisé FedaPay pour validation par USSD Push !
