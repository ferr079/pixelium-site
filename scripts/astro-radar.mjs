#!/usr/bin/env node
/**
 * astro-radar — veille d'upgrade Astro, anti-dette technique.
 *
 * Diffe les versions installées (astro + adaptateur Cloudflare + sitemap) contre
 * les dernières publiées sur le registre npm, scanne les "surfaces breaking" qui
 * rendraient un saut de major risqué pour CE site, et émet un brief scopé.
 *
 * Conçu pour être déclenché par la veille homelab (DAG Dagu / skill Hermes) sur un
 * schedule, OU lancé à la main. Le script est PUR : il lit le repo + le registre npm
 * et écrit le brief sur stdout. Le routage (Telegram, issue Forgejo, dépôt .md) est
 * le job de la couche homelab — ici on ne fait que produire le signal.
 *
 *   node scripts/astro-radar.mjs           # brief markdown (humain)
 *   node scripts/astro-radar.mjs --json     # sortie machine (pour brancher un DAG)
 *
 * Sort en code 0 si rien à faire, 10 si au moins un upgrade est disponible
 * (pratique pour qu'un DAG ne notifie que quand il y a du neuf).
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');
const readJSON = (p) => JSON.parse(read(p));

const TRACKED = ['astro', '@astrojs/cloudflare', '@astrojs/sitemap'];

// --- versions installées (résolues depuis le lockfile, plancher depuis package.json) ---
const pkg = readJSON('package.json');
let lock = {};
try { lock = readJSON('package-lock.json'); } catch { /* optionnel */ }

function installedVersion(name) {
  const fromLock = lock.packages?.[`node_modules/${name}`]?.version;
  if (fromLock) return fromLock;
  const range = pkg.dependencies?.[name] || pkg.devDependencies?.[name] || '';
  return range.replace(/^[\^~]/, '') || null;
}

// --- registre npm ---
async function npmInfo(name) {
  const url = `https://registry.npmjs.org/${name.replace('/', '%2F')}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`npm ${name}: HTTP ${res.status}`);
  const data = await res.json();
  const tags = data['dist-tags'] || {};
  return { latest: tags.latest || null, beta: tags.beta || tags.next || null };
}

const sv = (v) => (v || '0.0.0').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
function gap(cur, lat) {
  const a = sv(cur), b = sv(lat);
  if (b[0] > a[0]) return 'major';
  if (b[0] === a[0] && b[1] > a[1]) return 'minor';
  if (b[0] === a[0] && b[1] === a[1] && b[2] > a[2]) return 'patch';
  return 'none';
}

// --- surfaces breaking : leur ABSENCE rend les majors Astro indolores pour ce site.
//     Si l'une apparaît, un upgrade devient plus risqué → on le signale. ---
function scanSurfaces() {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const hasDep = (re) => Object.keys(deps).some((d) => re.test(d));
  const grepSrc = (re) => {
    // scan léger des .astro/.ts/.mjs sous src/ + config
    const files = [];
    const walk = (dir) => {
      for (const e of readdirSync(join(root, dir), { withFileTypes: true })) {
        const p = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(p);
        else if (/\.(astro|ts|mjs|js)$/.test(e.name)) files.push(p);
      }
    };
    try { walk('src'); } catch { /* ignore */ }
    return files.some((f) => { try { return re.test(read(f)); } catch { return false; } });
  };
  return [
    { key: 'Markdown remark/rehype/MDX', risky: hasDep(/remark|rehype|@astrojs\/mdx/) },
    { key: '@astrojs/db', risky: hasDep(/@astrojs\/db/) },
    { key: 'astro:transitions (helpers retirés en v7)', risky: grepSrc(/astro:transitions/) },
    { key: 'src/fetch.ts (réservé par advanced routing v7)', risky: existsSync(join(root, 'src/fetch.ts')) },
    { key: 'flags experimental dans la config', risky: /experimental\s*:/.test(read('astro.config.mjs')) },
  ];
}

// --- assemblage ---
const results = [];
for (const name of TRACKED) {
  const installed = installedVersion(name);
  try {
    const { latest, beta } = await npmInfo(name);
    results.push({ name, installed, latest, beta, gap: gap(installed, latest) });
  } catch (e) {
    results.push({ name, installed, error: String(e.message) });
  }
}

const surfaces = scanSurfaces();
const risky = surfaces.filter((s) => s.risky);
const upgrades = results.filter((r) => r.gap && r.gap !== 'none');
const worst = upgrades.reduce((acc, r) => {
  const rank = { patch: 1, minor: 2, major: 3 };
  return Math.max(acc, rank[r.gap] || 0);
}, 0);
const debt = worst === 0 ? '🟢 à jour' : worst === 1 ? '🟢 patch dispo' : worst === 2 ? '🟡 minor dispo' : '🔴 major dispo';
const shouldAlert = upgrades.length > 0 || risky.length > 0;

// --- sortie ---
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ debt, shouldAlert, upgrades, results, riskySurfaces: risky.map((s) => s.key) }, null, 2));
} else {
  const lines = [];
  lines.push(`# Astro radar — ${debt}`);
  lines.push('');
  lines.push('| paquet | installé | stable | beta | écart |');
  lines.push('|---|---|---|---|---|');
  for (const r of results) {
    if (r.error) { lines.push(`| \`${r.name}\` | ${r.installed || '?'} | — | — | ⚠️ ${r.error} |`); continue; }
    const flag = r.gap === 'none' ? '—' : r.gap === 'major' ? `🔴 ${r.gap}` : r.gap === 'minor' ? `🟡 ${r.gap}` : `🟢 ${r.gap}`;
    lines.push(`| \`${r.name}\` | ${r.installed} | ${r.latest} | ${r.beta || '—'} | ${flag} |`);
  }
  lines.push('');
  lines.push('**Surfaces breaking** (leur absence garde les majors indolores) :');
  for (const s of surfaces) lines.push(`- ${s.risky ? '⚠️ PRÉSENTE' : '✅ absente'} — ${s.key}`);
  lines.push('');
  if (!shouldAlert) {
    lines.push('> Rien à faire : tout est à jour et aucune surface à risque. La dette reste à zéro.');
  } else {
    lines.push('**Recommandation :**');
    if (upgrades.some((u) => u.gap === 'patch')) lines.push('- Patchs dispo → `npm update` (bugfix/sécurité, risque ~nul).');
    if (upgrades.some((u) => u.gap === 'minor')) lines.push('- Minor dispo → lire le changelog, bumper le plancher, build + smoke.');
    if (upgrades.some((u) => u.gap === 'major')) lines.push('- **Major dispo** → vérifier la compat de l\'adaptateur Cloudflare en premier (dépendance qui commande), worktree isolé, build + Playwright avant deploy.');
    if (risky.length) lines.push(`- ⚠️ ${risky.length} surface(s) breaking désormais présente(s) → un futur major demandera plus de soin.`);
  }
  console.log(lines.join('\n'));
}

process.exit(shouldAlert ? 10 : 0);
