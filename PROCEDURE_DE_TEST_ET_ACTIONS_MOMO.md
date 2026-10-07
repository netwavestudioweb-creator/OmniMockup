# 📱 PROCÉDURE DE TEST MOBILE MONEY & ACTIONS À MENER

Ce document détaille la démarche pas-à-pas pour tester le paiement **MTN Mobile Money Bénin (FedaPay)** sans risquer d'argent réel, ainsi que les démarches pour recevoir les vrais fonds sur ton téléphone.

---

## ⚡ 1. TEST RAPIDE EN LOCAL (MODE SANDBOX / VIRTUEL)

Tu peux tester tout le flux dès maintenant sur ta machine locale (`localhost:3000`).

### Étape 1 : Vérifier le fichier `.env.local`
Assure-toi que les variables suivantes sont dans ton fichier [`.env.local`](file:///c:/Users/HP/Downloads/Mockup_saas/.env.local) :
```env
FEDAPAY_PUBLIC_KEY=pk_sandbox_your_fedapay_public_key
FEDAPAY_SECRET_KEY=sk_sandbox_your_fedapay_secret_key
FEDAPAY_ENVIRONMENT=sandbox
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Étape 2 : Lancer le serveur local
Ouvre ton terminal dans le dossier du projet et exécute :
```bash
npm run dev
```
Accède à : `http://localhost:3000`

### Étape 3 : Exécuter le test de souscription MoMo
1. Connecte-toi ou crée un compte de test sur `http://localhost:3000/signup`.
2. Rends-toi sur la page des tarifs : `http://localhost:3000/pricing`.
3. Vérifie que le sélecteur est sur **"🇧🇯 MTN Mobile Money Bénin & Afrique (FCFA)"**.
4. Choisis le plan **Pro Unlimited (15 000 FCFA)** et clique sur **"Payer via MTN MoMo"**.
5. Une boîte de dialogue aux couleurs de MTN MoMo s'ouvre :
   - Indicatif : `🇧🇯 +229`
   - Tape un numéro test : `97 00 00 00`
   - Clique sur **"Confirmer & Payer sur mon MoMo"**.
6. Tu es redirigé vers l'interface FedaPay Checkout sécurisée.
7. En mode Sandbox, FedaPay propose de simuler une transaction réussie en 1 clic.
8. Une fois validé, tu es automatiquement redirigé vers `http://localhost:3000/pricing?success=true&provider=fedapay`.
9. Une bannière verte de félicitations s'affiche : **"🎉 Félicitations ! Votre paiement MTN Mobile Money Bénin a été validé avec succès."**

---

## 🏦 2. ACTIONS À MENER POUR LE PASSAGE EN PRODUCTION (ARGENT RÉEL)

Pour que l'argent des vrais clients atterrisse sur ton compte MTN MoMo personnel, voici les actions simples à réaliser :

### Action 1 : Inscription Marchand FedaPay
* Rends-toi sur **[https://fedapay.com](https://fedapay.com)** et clique sur **Ouvrir un compte**.
* Choisis un compte **Entreprise** ou **Indépendant / Particulier**.
* Fournis ta pièce d'identité béninoise (CIP ou Carte d'Identité ou Passeport) et ton numéro IFU.
* La validation KYC prend généralement entre 24h et 48h.

### Action 2 : Lier ton numéro MTN Mobile Money personnel
* Dans ton tableau de bord FedaPay, va dans **Paramètres > Reversements (Payouts)**.
* Clique sur **Ajouter un compte de retrait**.
* Sélectionne :
  - **Pays :** Bénin 🇧🇯
  - **Moyen :** MTN Mobile Money
  - **Numéro :** Ton numéro personnel MTN (+229 XX XX XX XX)
* Active l'option **"Reversement Automatique"** (les fonds te sont virés automatiquement à fréquence choisie ou sur demande en 1 clic).

### Action 3 : Récupérer tes clés de production
* Une fois ton compte FedaPay activé, va dans **Paramètres > Clés d'API**.
* Bascule en mode **Live** et copie :
  - Ta clé publique : `pk_live_...`
  - Ta clé secrète : `sk_live_...`
* Colle-les dans ton fichier `.env.local` :
  ```env
  FEDAPAY_PUBLIC_KEY=pk_live_votre_cle_ici
  FEDAPAY_SECRET_KEY=sk_live_votre_cle_ici
  FEDAPAY_ENVIRONMENT=live
  ```

### Action 4 : Configurer le Webhook FedaPay
* Dans ton tableau de bord FedaPay > **Webhooks** :
  - URL cible : `https://ton-domaine.com/api/payments/fedapay/webhook`
  - Événement à écouter : `transaction.approved`
* C'est ce webhook qui active instantanément l'abonnement du client dans ta base Supabase dès qu'il tape son code secret MoMo.

---

## 🔒 3. SÉCURITÉ & GARANTIES
* **Aucun compte bancaire requis :** Tout le système passe directement de FedaPay à ton numéro MTN MoMo.
* **Clients internationaux inclus :** Si un client en France ou aux USA paye par carte Visa/Mastercard sur ton site, FedaPay encaisse les Euros/Dollars et te les vire en FCFA sur ton MTN MoMo.
* **Zéro fraude :** La validation USSD exige le code PIN personnel du client sur son propre téléphone portable.
