#!/usr/bin/env node
/**
 * PitchMySite — création de l'accès administrateur (à lancer UNE fois, sur ton ordinateur) :
 *
 *     node scripts/admin-setup.mjs
 *
 * 1. Tu choisis ton mot de passe (il ne s'affiche pas pendant la saisie et n'est enregistré nulle part).
 * 2. Le script affiche 3 valeurs à copier dans Vercel → Settings → Environment Variables (Production).
 * 3. Il affiche aussi une clé à ajouter dans ton application d'authentification
 *    (Google Authenticator, Microsoft Authenticator…) : « Ajouter un code » → « Saisir une clé ».
 *
 * Ne colle jamais ces valeurs dans un chat, un e-mail ou un fichier du projet.
 * Pour changer de mot de passe ou de téléphone : relance le script et remplace les 3 valeurs.
 */
import crypto from 'node:crypto';
import readline from 'node:readline';

function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolve(answer);
    });
    // Après l'affichage de la question : chaque caractère tapé est remplacé par « * »
    rl._writeToOutput = (s) => {
      if (s === '\r\n' || s === '\n' || s === '\r') process.stdout.write(s);
      else process.stdout.write('*');
    };
  });
}

function base32Encode(buf) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}

const password = await askHidden('Choisis ton mot de passe administrateur (12 caractères minimum) : ');
if (password.length < 12) {
  console.error('\nMot de passe trop court : 12 caractères minimum. Relance le script.');
  process.exit(1);
}
const confirm = await askHidden('Retape-le pour confirmer : ');
if (confirm !== password) {
  console.error('\nLes deux saisies sont différentes. Relance le script.');
  process.exit(1);
}

const N = 32768;
const r = 8;
const p = 1;
const salt = crypto.randomBytes(16);
const hash = crypto.scryptSync(password.normalize('NFKC'), salt, 64, { N, r, p, maxmem: 256 * 1024 * 1024 });
// Séparateur « : » (Next.js remplacerait les « $… » d'une variable d'environnement)
const passwordHash = `scrypt:${N}:${r}:${p}:${salt.toString('base64')}:${hash.toString('base64')}`;
const totpSecret = base32Encode(crypto.randomBytes(20));
const sessionSecret = crypto.randomBytes(48).toString('base64url');

console.log(`
══════════════════════════════════════════════════════════════════════
 1. À COPIER DANS VERCEL (Settings → Environment Variables → Production)
══════════════════════════════════════════════════════════════════════

ADMIN_PASSWORD_HASH
${passwordHash}

ADMIN_TOTP_SECRET
${totpSecret}

ADMIN_SESSION_SECRET
${sessionSecret}

Puis : Deployments → ⋯ → Redeploy, pour que le site les prenne en compte.

══════════════════════════════════════════════════════════════════════
 2. DANS TON APPLICATION D'AUTHENTIFICATION (sur ton téléphone)
══════════════════════════════════════════════════════════════════════

« Ajouter un code » → « Saisir une clé de configuration »
  Nom du compte : PitchMySite Admin
  Clé           : ${totpSecret.replace(/(.{4})/g, '$1 ').trim()}
  Type          : basé sur l'heure

(ou lien direct pour les applications qui l'acceptent :)
otpauth://totp/PitchMySite:Admin?secret=${totpSecret}&issuer=PitchMySite&digits=6&period=30

Ensuite, ouvre https://omni-mockup.vercel.app/admin :
mot de passe + le code à 6 chiffres affiché par l'application.

⚠️  Ferme ce terminal après avoir copié les valeurs. Ne les envoie à personne.
`);
