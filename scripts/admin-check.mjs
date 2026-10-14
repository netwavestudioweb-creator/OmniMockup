#!/usr/bin/env node
/**
 * PitchMySite — vérifier son accès administrateur, sur son ordinateur (rien n'est envoyé nulle part) :
 *
 *     node scripts/admin-check.mjs
 *
 * Colle les valeurs telles qu'elles sont dans Vercel (ADMIN_PASSWORD_HASH, ADMIN_TOTP_SECRET),
 * puis tape ton mot de passe. Le script dit si le mot de passe correspond et affiche le code
 * à 6 chiffres attendu en ce moment, à comparer avec celui de ton téléphone.
 */
import crypto from 'node:crypto';
import readline from 'node:readline';

// Une seule lecture du clavier pour toutes les questions ; ce qui est tapé ou collé s'affiche en « * »
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let muted = false;
rl._writeToOutput = (s) => {
  if (!muted || s === '\r\n' || s === '\n' || s === '\r') process.stdout.write(s);
  else process.stdout.write('*');
};
const pending = [];
const waiting = [];
rl.on('line', (line) => (waiting.length ? waiting.shift()(line) : pending.push(line)));

function askHidden(question) {
  muted = false;
  process.stdout.write(question);
  muted = true;
  return new Promise((resolve) => {
    const done = (answer) => {
      process.stdout.write('\n');
      resolve(answer);
    };
    if (pending.length) done(pending.shift());
    else waiting.push(done);
  });
}

function base32Decode(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of clean) {
    value = (value << 5) | alphabet.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totpCode(secret, timeMs) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(Math.floor(timeMs / 1000 / 30)));
  const hmac = crypto.createHmac('sha1', base32Decode(secret)).update(msg).digest();
  const o = hmac[hmac.length - 1] & 0x0f;
  const bin = ((hmac[o] & 0x7f) << 24) | (hmac[o + 1] << 16) | (hmac[o + 2] << 8) | hmac[o + 3];
  return String(bin % 1e6).padStart(6, '0');
}

function warnings(name, raw) {
  const w = [];
  if (raw !== raw.trim()) w.push('espace ou retour à la ligne au début ou à la fin');
  if (/^["']|["']$/.test(raw.trim())) w.push('guillemets autour de la valeur');
  if (raw.trim().startsWith(name)) w.push(`le nom « ${name} » a été collé avec la valeur`);
  return w;
}

const hashRaw = await askHidden('1/3 Colle la valeur ADMIN_PASSWORD_HASH (telle qu’elle est dans Vercel) : ');
const secretRaw = await askHidden('2/3 Colle la valeur ADMIN_TOTP_SECRET (telle qu’elle est dans Vercel) : ');
const password = await askHidden('3/3 Tape ton mot de passe administrateur : ');
rl.close();

console.log('\n── Résultat ──────────────────────────────────────────');

// Mot de passe
const hw = warnings('ADMIN_PASSWORD_HASH', hashRaw);
const parts = hashRaw.trim().split(':');
if (parts.length !== 6 || parts[0] !== 'scrypt') {
  console.log('❌ ADMIN_PASSWORD_HASH : format incorrect (doit commencer par « scrypt: » et contenir 5 « : »).');
} else {
  const [, n, r, p, salt, hash] = parts;
  const expected = Buffer.from(hash, 'base64');
  const actual = crypto.scryptSync(password.normalize('NFKC'), Buffer.from(salt, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 256 * 1024 * 1024,
  });
  const ok = actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  console.log(ok ? '✅ Mot de passe : correct.' : '❌ Mot de passe : ne correspond pas à ADMIN_PASSWORD_HASH.');
}
if (hw.length) console.log('   ⚠️  ADMIN_PASSWORD_HASH : ' + hw.join(', ') + '.');

// Code à 6 chiffres
const sw = warnings('ADMIN_TOTP_SECRET', secretRaw);
const secret = secretRaw.trim();
if (!/^[A-Z2-7]{16,}$/i.test(secret.replace(/\s/g, ''))) {
  console.log('❌ ADMIN_TOTP_SECRET : format incorrect (lettres A-Z et chiffres 2-7 seulement).');
} else {
  if (/\s/.test(secret)) sw.push('espaces au milieu (à retirer dans Vercel)');
  console.log(`✅ Code attendu en ce moment : ${totpCode(secret, Date.now())}`);
  console.log('   Compare avec ton application : s’il est différent, la clé du téléphone ne correspond pas à Vercel.');
}
if (sw.length) console.log('   ⚠️  ADMIN_TOTP_SECRET : ' + sw.join(', ') + '.');

console.log('\nHeure de cet ordinateur : ' + new Date().toLocaleTimeString('fr-FR'));
console.log('Ne copie pas ce résultat ailleurs que dans tes notes ; ferme ce terminal ensuite.\n');
