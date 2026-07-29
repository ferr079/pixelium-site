#!/usr/bin/env node
/**
 * astro-radar — veille d'upgrade Astro, anti-dette technique.
 *
 * Diffe les versions installées (astro + adaptateur Cloudflare + sitemap, et pour
 * le blog mdx/rss) contre les dernières publiées sur le registre npm, scanne les
 * "surfaces breaking" qui rendraient un saut de major risqué, et émet un brief.
 *
 * MULTI-REPO depuis le 2026-07-29 (`pixelium-site#71`). Le radar ne regardait que
 * le repo où il vit : `blog-pixelium` tournait sur la même paire de dépendances
 * mais n'était scanné par personne, et a dérivé de deux patchs sans que rien ne le
 * signale. Une cible = un repo, une issue par repo.
 *
 * Conçu pour être déclenché par la veille homelab (DAG Dagu / skill Hermes) sur un
 * schedule, OU lancé à la main. Le script est PUR : il lit les repos + le registre
 * npm et écrit le brief sur stdout. Le routage (Telegram, issue Forgejo, dépôt .md)
 * est le job de la couche homelab — ici on ne fait que produire le signal.
 *
 *   node scripts/astro-radar.mjs           # brief markdown (humain)
 *   node scripts/astro-radar.mjs --json     # sortie machine (pour brancher un DAG)
 *
 * Racine d'une cible : `ASTRO_RADAR_<CLE>_DIR` sinon un voisin du repo courant.
 * Une cible introuvable n'est JAMAIS ignorée en silence — ce serait reproduire le
 * bug qu'on corrige : elle alerte avec un titre d'issue stable et distinct.
 *
 * Sort en code 0 si rien à faire, 10 si au moins une cible a du neuf
 * (pratique pour qu'un DAG ne notifie que quand il y a du neuf).
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const selfRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

// --- cibles. `root` : env dédiée sinon voisin sur disque (sur Hermes, le DAG
//     clone les deux repos côte à côte : /root/pixelium-site + /root/blog-pixelium). ---
const TARGETS = [
  {
    key: 'site',
    repo: 'pixelium/pixelium-site',
    label: 'pixelium-site',
    root: process.env.ASTRO_RADAR_SITE_DIR || selfRoot,
    packages: ['astro', '@astrojs/cloudflare', '@astrojs/sitemap'],
    // Le site n'utilise pas MDX : si un jour un remark/rehype apparaît, c'est un
    // vrai signal (un major Astro deviendrait plus risqué) → non acquitté ici.
    mdxAcknowledged: false,
  },
  {
    key: 'blog',
    repo: 'pixelium/blog-pixelium',
    label: 'blog-pixelium',
    root: process.env.ASTRO_RADAR_BLOG_DIR || join(selfRoot, '..', 'blog-pixelium'),
    packages: ['astro', '@astrojs/cloudflare', '@astrojs/sitemap', '@astrojs/mdx', '@astrojs/rss'],
    // Un blog EST du markdown : la surface est permanente et assumée. Sans cet
    // acquittement, chaque run rouvrirait l'issue sur un état qui ne changera
    // jamais — le piège déjà rencontré avec astro:transitions côté site.
    mdxAcknowledged: true,
  },
];

// --- registre npm (partagé entre cibles : un paquet n'est interrogé qu'une fois) ---
const npmCache = new Map();
async function npmInfo(name) {
  if (npmCache.has(name)) return npmCache.get(name);
  const p = (async () => {
    const url = `https://registry.npmjs.org/${name.replace('/', '%2F')}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`npm ${name}: HTTP ${res.status}`);
    const data = await res.json();
    const tags = data['dist-tags'] || {};
    return { latest: tags.latest || null, beta: tags.beta || tags.next || null };
  })();
  npmCache.set(name, p);
  return p;
}

const sv = (v) => (v || '0.0.0').split('-')[0].split('.').map((n) => parseInt(n, 10) || 0);
function gap(cur, lat) {
  const a = sv(cur), b = sv(lat);
  if (b[0] > a[0]) return 'major';
  if (b[0] === a[0] && b[1] > a[1]) return 'minor';
  if (b[0] === a[0] && b[1] === a[1] && b[2] > a[2]) return 'patch';
  return 'none';
}

// --- surfaces breaking : leur ABSENCE rend les majors Astro indolores.
//     Si l'une apparaît, un upgrade devient plus risqué → on le signale. ---
function scanSurfaces(target, read, pkg) {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const hasDep = (re) => Object.keys(deps).some((d) => re.test(d));
  const grepSrc = (re) => {
    // scan léger des .astro/.ts/.mjs sous src/ + config (les .md sont du CONTENU :
    // un article qui *parle* d'astro:transitions n'est pas une surface de code)
    const files = [];
    const walk = (dir) => {
      for (const e of readdirSync(join(target.root, dir), { withFileTypes: true })) {
        const p = `${dir}/${e.name}`;
        if (e.isDirectory()) walk(p);
        else if (/\.(astro|ts|mjs|js)$/.test(e.name)) files.push(p);
      }
    };
    try { walk('src'); } catch { /* ignore */ }
    return files.some((f) => { try { return re.test(read(f)); } catch { return false; } });
  };
  let config = '';
  try { config = read('astro.config.mjs'); } catch { /* absent = pas de flag */ }
  return [
    {
      key: 'Markdown remark/rehype/MDX',
      risky: hasDep(/remark|rehype|@astrojs\/mdx/),
      acknowledged: target.mdxAcknowledged,
    },
    { key: '@astrojs/db', risky: hasDep(/@astrojs\/db/) },
    // Adoptée délibérément le 2026-07-21 (ClientRouter/View Transitions, src/layouts/Base.astro) :
    // permanente pour ce site → ne doit plus rouvrir une issue à chaque run, seulement rester visible au brief.
    { key: 'astro:transitions (helpers retirés en v7, adoptée 2026-07-21)', risky: grepSrc(/astro:transitions/), acknowledged: true },
    { key: 'src/fetch.ts (réservé par advanced routing v7)', risky: existsSync(join(target.root, 'src/fetch.ts')) },
    { key: 'flags experimental dans la config', risky: /experimental\s*:/.test(config) },
  ];
}

// --- analyse d'une cible ---
async function analyse(target) {
  const read = (p) => readFileSync(join(target.root, p), 'utf8');

  if (!existsSync(join(target.root, 'package.json'))) {
    // Bruyant par conception : une cible muette est exactement le bug de #71.
    // Titre stable → une seule issue tant que ce n'est pas réglé (idempotence).
    return {
      ...target,
      unavailable: true,
      debt: '⚠️ cible injoignable',
      shouldAlert: true,
      results: [], surfaces: [], upgrades: [],
      brief: [
        `## ${target.label} — ⚠️ cible injoignable`,
        '',
        `Aucun \`package.json\` sous \`${target.root}\`. Le radar **ne surveille pas** ce repo :`,
        'il dériverait en silence, ce que cette cible existe précisément pour empêcher.',
        '',
        `Corriger : cloner le repo à côté du site, ou pointer \`ASTRO_RADAR_${target.key.toUpperCase()}_DIR\`.`,
      ].join('\n'),
      issue: {
        repo: target.repo,
        title: `[astro-radar] ${target.label} — cible injoignable (repo non cloné)`,
        labels: ['astro-upgrade', 'dependencies'],
        body: `Le radar ne trouve pas \`package.json\` sous \`${target.root}\`.\n\n`
          + 'Tant que cette cible est injoignable, ses upgrades ne sont surveillés par personne '
          + '(le mode de panne de `pixelium-site#71`). Cloner le repo à côté du site sur l\'hôte '
          + `du DAG, ou définir \`ASTRO_RADAR_${target.key.toUpperCase()}_DIR\`.`,
      },
    };
  }

  const pkg = JSON.parse(read('package.json'));
  let lock = {};
  try { lock = JSON.parse(read('package-lock.json')); } catch { /* optionnel */ }
  const installedVersion = (name) => {
    const fromLock = lock.packages?.[`node_modules/${name}`]?.version;
    if (fromLock) return fromLock;
    const range = pkg.dependencies?.[name] || pkg.devDependencies?.[name] || '';
    return range.replace(/^[\^~]/, '') || null;
  };

  const results = [];
  for (const name of target.packages) {
    const installed = installedVersion(name);
    if (!installed) continue; // paquet absent de cette cible : rien à diffé
    try {
      const { latest, beta } = await npmInfo(name);
      results.push({ name, installed, latest, beta, gap: gap(installed, latest) });
    } catch (e) {
      results.push({ name, installed, error: String(e.message) });
    }
  }

  const surfaces = scanSurfaces(target, read, pkg);
  const risky = surfaces.filter((s) => s.risky);
  // Une surface "acknowledged" reste affichée (transparence) mais n'est plus un motif d'alerte :
  // elle a été adoptée sciemment et restera présente en permanence, sans quoi la clôture de
  // l'issue Tier 2 la rouvrirait au run suivant (boucle infinie sur un état qui ne changera jamais).
  const alertingRisky = risky.filter((s) => !s.acknowledged);
  const upgrades = results.filter((r) => r.gap && r.gap !== 'none');
  const worst = upgrades.reduce((acc, r) => {
    const rank = { patch: 1, minor: 2, major: 3 };
    return Math.max(acc, rank[r.gap] || 0);
  }, 0);
  const debt = worst === 0 ? '🟢 à jour' : worst === 1 ? '🟢 patch dispo' : worst === 2 ? '🟡 minor dispo' : '🔴 major dispo';
  const shouldAlert = upgrades.length > 0 || alertingRisky.length > 0;

  const lines = [];
  lines.push(`## ${target.label} — ${debt}`);
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
  for (const s of surfaces) {
    const flag = !s.risky ? '✅ absente' : s.acknowledged ? '🔶 PRÉSENTE (acceptée)' : '⚠️ PRÉSENTE';
    lines.push(`- ${flag} — ${s.key}`);
  }
  lines.push('');
  if (!shouldAlert) {
    lines.push('> Rien à faire : tout est à jour et aucune surface à risque non acceptée. La dette reste à zéro.');
  } else {
    lines.push('**Recommandation :**');
    if (upgrades.some((u) => u.gap === 'patch')) lines.push('- Patchs dispo → `npm update` (bugfix/sécurité, risque ~nul).');
    if (upgrades.some((u) => u.gap === 'minor')) lines.push('- Minor dispo → lire le changelog, bumper le plancher, build + smoke.');
    if (upgrades.some((u) => u.gap === 'major')) lines.push('- **Major dispo** → vérifier la compat de l\'adaptateur Cloudflare en premier (dépendance qui commande), worktree isolé, build + Playwright avant deploy.');
    if (alertingRisky.length) lines.push(`- ⚠️ ${alertingRisky.length} surface(s) breaking désormais présente(s) → un futur major demandera plus de soin.`);
  }

  // --- spec d'issue Forgejo : le CONTRAT Tier 2, partagé par les deux domaines.
  //     La couche homelab n'a qu'à ouvrir l'issue avec ces champs ; une session web la
  //     retrouve sans ambiguïté via le label `astro-upgrade`. Vit dans l'artefact que
  //     les deux côtés lisent (ce script), pas dans une convention de mémoire privée.
  //     ⚠️ Le titre porte le LABEL DU REPO : l'idempotence côté routeur est
  //     « préfixe + repo », sinon une issue ouverte sur le site bâillonnerait le blog. ---
  const issue = shouldAlert ? {
    repo: target.repo,
    title: `[astro-radar] ${target.label} — upgrade dispo — ${upgrades.map((u) => `${u.name} ${u.installed}→${u.latest}`).join(', ') || 'surfaces breaking'}`,
    labels: ['astro-upgrade', 'dependencies'],
    body: lines.join('\n'),
  } : null;

  return { ...target, unavailable: false, debt, shouldAlert, results, surfaces, upgrades, riskySurfaces: risky.map((s) => s.key), brief: lines.join('\n'), issue };
}

// --- assemblage ---
const targets = [];
for (const t of TARGETS) targets.push(await analyse(t));

const shouldAlert = targets.some((t) => t.shouldAlert);
const issues = targets.map((t) => t.issue).filter(Boolean);
const rank = { '🟢 à jour': 0, '🟢 patch dispo': 1, '🟡 minor dispo': 2, '🔴 major dispo': 3, '⚠️ cible injoignable': 4 };
const debt = targets.reduce((worst, t) => ((rank[t.debt] ?? 0) > (rank[worst] ?? 0) ? t.debt : worst), '🟢 à jour');

const brief = [`# Astro radar — ${debt}`, '', ...targets.map((t) => t.brief)].join('\n\n');

// --- sortie ---
if (process.argv.includes('--json')) {
  const site = targets.find((t) => t.key === 'site') || targets[0];
  console.log(JSON.stringify({
    debt, shouldAlert, brief,
    // par cible — ce que consomme le routeur multi-repo
    targets: targets.map(({ key, repo, label, root, unavailable, debt: d, shouldAlert: a, upgrades, results, riskySurfaces, brief: b, issue }) =>
      ({ key, repo, label, root, unavailable, debt: d, shouldAlert: a, upgrades, results, riskySurfaces, brief: b, issue })),
    issues,
    // --- compat ascendante : un DAG déployé avant le multi-repo lit encore ces
    //     champs à plat. Ils décrivent le SITE (comportement historique) ; si seul
    //     le blog alerte, `.issue` porte la sienne — le titre dit lequel, et
    //     l'issue atterrit sur le repo en dur du vieux DAG plutôt que nulle part. ---
    upgrades: site.upgrades || [],
    results: site.results || [],
    riskySurfaces: site.riskySurfaces || [],
    issue: issues[0] || null,
  }, null, 2));
} else {
  console.log(brief);
}

process.exit(shouldAlert ? 10 : 0);
