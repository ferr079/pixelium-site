#!/usr/bin/env node
/**
 * lock-diff — ce qu'un bump a RÉELLEMENT tiré dans le lockfile.
 *
 * Un `npm install <pkg>@<version>` ne change pas que la ligne du manifeste : il
 * peut ajouter, retirer ou déplacer des dépendances indirectes sans que rien ne
 * le signale. Vécu le 2026-08-14 : le patch `astro 7.2.1→7.2.2` a tiré HUIT
 * paquets (find-process, chalk, loglevel, commander…) pour aller vérifier si le
 * processus détenteur d'un verrou de build existe encore. Le manifeste, lui, ne
 * bougeait que d'un chiffre. Relu dans six mois, ça ressemble à une dépendance
 * ajoutée par quelqu'un.
 *
 * Le radar (astro-radar.mjs) ne peut pas voir ça : il tourne AVANT le bump et ne
 * compare que des numéros de version au registre npm. Ce script est la moitié
 * manquante — il se lance APRÈS `npm install`, avant le commit.
 *
 *   node scripts/lock-diff.mjs                  # repo courant, vs HEAD
 *   node scripts/lock-diff.mjs ../blog-pixelium # une autre racine
 *   node scripts/lock-diff.mjs --base main~1    # ce qu'un commit déjà fait a tiré
 *   node scripts/lock-diff.mjs --json           # sortie machine
 *
 * La sortie markdown est faite pour être collée telle quelle dans un corps de PR.
 * Sort en code 0 si le lockfile est inchangé, 10 s'il a changé.
 */

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, join } from 'node:path';

// --- arguments : positionnel = racine, --base <ref>, --json ---
const argv = process.argv.slice(2);
let base = 'HEAD';
let json = false;
let root = process.cwd();
let rootGiven = false;

for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--json') json = true;
  else if (a === '--base') base = argv[++i];
  else if (a.startsWith('--')) {
    console.error(`argument inconnu : ${a}`);
    process.exit(2);
  } else {
    root = resolve(a);
    rootGiven = true;
  }
}

// Sans argument on prend le repo COURANT, pas la racine du script : lancé depuis
// le blog, c'est le blog qu'on veut diffe, pas le site où le script est rangé.
const lockPath = join(root, 'package-lock.json');
if (!existsSync(lockPath)) {
  console.error(
    `package-lock.json introuvable dans ${root}` +
      (rootGiven ? '' : ' — lance depuis un repo, ou passe la racine en argument.'),
  );
  process.exit(2);
}

// --- lecture des deux versions ---
function readCurrent() {
  return JSON.parse(readFileSync(lockPath, 'utf8'));
}

function readBase() {
  try {
    const out = execFileSync('git', ['-C', root, 'show', `${base}:package-lock.json`], {
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    return JSON.parse(out);
  } catch {
    console.error(`impossible de lire package-lock.json à la révision « ${base} » dans ${root}`);
    process.exit(2);
  }
}

// `packages` est l'index moderne (lockfileVersion >= 2) : clé = chemin
// node_modules/…, ce qui distingue une dépendance imbriquée d'une hissée à plat.
function index(lock) {
  const out = new Map();
  for (const [path, meta] of Object.entries(lock.packages || {})) {
    if (!path || !meta?.version) continue; // '' = le projet lui-même
    out.set(path, meta.version);
  }
  return out;
}

const before = index(readBase());
const after = index(readCurrent());

const added = [];
const removed = [];
const bumped = [];

for (const [path, version] of after) {
  if (!before.has(path)) added.push({ path, version });
  else if (before.get(path) !== version) bumped.push({ path, from: before.get(path), to: version });
}
for (const [path, version] of before) {
  if (!after.has(path)) removed.push({ path, version });
}

const byPath = (a, b) => a.path.localeCompare(b.path);
added.sort(byPath);
removed.sort(byPath);
bumped.sort(byPath);

const changed = added.length + removed.length + bumped.length;

if (json) {
  console.log(JSON.stringify({ root, base, added, removed, bumped, changed }, null, 2));
  process.exit(changed ? 10 : 0);
}

// --- brief markdown, collable dans un corps de PR ---
const name = (p) => p.replace(/^node_modules\//, '').replace(/\/node_modules\//g, ' › ');

if (!changed) {
  console.log(`Lockfile inchangé vs \`${base}\` (${root}).`);
  process.exit(0);
}

console.log(`**Diff du lockfile** vs \`${base}\` — ${changed} entrée(s) touchée(s)\n`);

if (bumped.length) {
  console.log(`### Versions changées (${bumped.length})\n`);
  for (const p of bumped) console.log(`- \`${name(p.path)}\` ${p.from} → ${p.to}`);
  console.log('');
}

if (added.length) {
  console.log(`### ⚠️ Paquets AJOUTÉS (${added.length})\n`);
  console.log('Nouvelles dépendances indirectes tirées par ce bump — vérifier que le');
  console.log('changelog les justifie, sinon elles passeront pour un ajout maison.\n');
  for (const p of added) console.log(`- \`${name(p.path)}\` ${p.version}`);
  console.log('');
}

if (removed.length) {
  console.log(`### Paquets retirés (${removed.length})\n`);
  for (const p of removed) console.log(`- \`${name(p.path)}\` ${p.version}`);
  console.log('');
}

process.exit(10);
