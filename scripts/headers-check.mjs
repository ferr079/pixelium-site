#!/usr/bin/env node
/**
 * headers-check — ce que la production SERT vraiment, comparé à ce qu'on croit
 * servir.
 *
 * Un fichier `public/_headers` correct ne prouve rien. Entre lui et le
 * navigateur il y a le build (l'adaptateur Cloudflare réécrit ce fichier pour y
 * injecter le Cache-Control des assets), le déploiement, et un edge qui cache
 * les en-têtes autant que le corps. Ce script ne lit aucun fichier local : il
 * interroge la production et compare en-tête par en-tête.
 *
 * Pourquoi il existe — trois pannes de la même famille, toutes avec un build
 * vert et aucune alerte :
 *   - les 2 badges de /ctf invisibles 3 mois et demi (origine absente d'img-src) ;
 *   - le beacon Web Analytics bloqué sur TOUT le blog (2026-08-20, corrigé) ;
 *   - la CSP servie encore périmée sur /fr/ctf alors que /ctf était à jour.
 * Un garde-fou de sécurité qui casse une fonctionnalité en s'appliquant
 * correctement ne se signale jamais tout seul.
 *
 *   node scripts/headers-check.mjs                # pixelium.win
 *   node scripts/headers-check.mjs --target blog  # blog.pixelium.win
 *   node scripts/headers-check.mjs --target all
 *   node scripts/headers-check.mjs --json         # sortie machine
 *
 * Sort en code 1 dès le premier écart : utilisable comme étape post-deploy.
 *
 * ⚠️ La CSP est comparée en ENSEMBLES de directives et de sources, jamais par
 * regex. C'est la leçon du freshness guard : une regex ne voit que la première
 * occurrence et passe au vert avec une valeur encore fausse. Ici une source en
 * trop est signalée au même titre qu'une source manquante — une origine qu'on
 * n'a pas décidé d'autoriser est une régression, pas un détail.
 */

const UA = 'pixelium-headers-check/1.0';

/** En-têtes posés par public/_headers sur tout ce que sert Workers Assets. */
const BASE = {
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-site',
  'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
};

const SITE_CSP = {
  'default-src': ["'none'"],
  'script-src': ["'self'", "'unsafe-inline'", 'https://static.cloudflareinsights.com'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'https://cdn.simpleicons.org', 'https://assets.pixelium.win',
              'https://www.hackthebox.com', 'https://tryhackme-badges.s3.amazonaws.com', 'data:'],
  'media-src': ["'self'", 'https://assets.pixelium.win'],
  'font-src': ["'self'"],
  'connect-src': ["'self'", 'https://cloudflareinsights.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

const BLOG_CSP = {
  'default-src': ["'none'"],
  // static.cloudflareinsights.com : le beacon est injecté au niveau de la ZONE
  // pixelium.win, donc sur le blog aussi. Sans cette source il est bloqué en
  // silence (constaté le 2026-08-20). connect-src va avec — l'une sans l'autre
  // ne fait que déplacer le blocage d'un cran.
  'script-src': ["'self'", "'unsafe-inline'", 'https://static.cloudflareinsights.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.bunny.net'],
  'img-src': ["'self'", 'https://cdn.simpleicons.org', 'data:'],
  'font-src': ["'self'", 'https://fonts.bunny.net'],
  'connect-src': ["'self'", 'https://cloudflareinsights.com'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

/** Les routes /api/* ne sortent pas de Workers Assets mais de src/middleware.ts. */
const API_CSP = {
  'default-src': ["'none'"],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
};

const TARGETS = {
  site: {
    origin: 'https://pixelium.win',
    routes: [
      { path: '/', status: 200, csp: SITE_CSP, headers: BASE, contentType: /^text\/html/ },
      { path: '/fr/', status: 200, csp: SITE_CSP, headers: BASE, contentType: /^text\/html/ },
      { path: '/robots.txt', status: 200, csp: SITE_CSP, headers: BASE },
      { path: '/llms.txt', status: 200, csp: SITE_CSP, headers: BASE },
      { path: '/.well-known/api-catalog', status: 200, csp: SITE_CSP, headers: BASE,
        contentType: /^application\/linkset\+json/ },
      { path: '/page-inexistante-headers-check', status: 404, csp: SITE_CSP, headers: BASE,
        contentType: /^text\/html/ },
      // Routes Worker : couvertes par le middleware, pas par _headers.
      { path: '/api/stats', status: 200, csp: API_CSP, headers: BASE,
        contentType: /^application\/json/ },
      { path: '/api/status', status: 200, csp: API_CSP, headers: BASE,
        contentType: /^application\/json/ },
    ],
    // Découvert dans le HTML de la home : le nom contient un hash, il change à
    // chaque build. Le figer dans la matrice la rendrait fausse au déploiement
    // suivant.
    asset: { cacheControl: /immutable/ },
  },
  blog: {
    origin: 'https://blog.pixelium.win',
    routes: [
      { path: '/', status: 200, csp: BLOG_CSP, headers: BASE, contentType: /^text\/html/ },
      { path: '/robots.txt', status: 200, csp: BLOG_CSP, headers: BASE, contentType: /^text\/plain/ },
      { path: '/rss.xml', status: 200, csp: BLOG_CSP, headers: BASE, contentType: /^application\/xml/ },
      { path: '/page-inexistante-headers-check', status: 404, csp: BLOG_CSP, headers: BASE },
    ],
    asset: { cacheControl: /immutable/ },
  },
};

/** CSP → { directive: Set(sources) }. Aucune regex sur la chaîne brute. */
function parseCsp(value) {
  const out = {};
  for (const part of (value || '').split(';')) {
    const tokens = part.trim().split(/\s+/).filter(Boolean);
    if (!tokens.length) continue;
    out[tokens[0].toLowerCase()] = new Set(tokens.slice(1));
  }
  return out;
}

function diffCsp(expected, actual) {
  const problems = [];
  for (const [directive, sources] of Object.entries(expected)) {
    const got = actual[directive];
    if (!got) { problems.push(`directive absente : ${directive}`); continue; }
    for (const s of sources) if (!got.has(s)) problems.push(`${directive} : source manquante ${s}`);
    for (const s of got) if (!sources.includes(s)) problems.push(`${directive} : source EN TROP ${s}`);
  }
  for (const directive of Object.keys(actual)) {
    if (!(directive in expected)) problems.push(`directive en trop : ${directive}`);
  }
  return problems;
}

async function fetchHeaders(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA }, redirect: 'manual' });
  const headers = {};
  for (const [k, v] of res.headers) headers[k.toLowerCase()] = v;
  return { status: res.status, headers, body: res };
}

async function discoverAsset(origin) {
  const res = await fetch(origin + '/', { headers: { 'user-agent': UA } });
  const html = await res.text();
  const match = html.match(/\/_astro\/[A-Za-z0-9._-]+\.(?:css|js)/);
  return match ? match[0] : null;
}

async function checkTarget(name, target) {
  const results = [];
  for (const route of target.routes) {
    const url = target.origin + route.path;
    const problems = [];
    let status = null;
    try {
      const res = await fetchHeaders(url);
      status = res.status;
      if (route.status && res.status !== route.status) {
        problems.push(`statut ${res.status}, attendu ${route.status}`);
      }
      for (const [key, want] of Object.entries(route.headers || {})) {
        const got = res.headers[key];
        if (got === undefined) problems.push(`en-tête absent : ${key}`);
        else if (got !== want) problems.push(`${key} : « ${got} », attendu « ${want} »`);
      }
      if (route.contentType && !route.contentType.test(res.headers['content-type'] || '')) {
        problems.push(`content-type « ${res.headers['content-type']} » ne correspond pas à ${route.contentType}`);
      }
      if (route.csp) {
        const raw = res.headers['content-security-policy'];
        if (!raw) problems.push('CSP absente');
        else problems.push(...diffCsp(route.csp, parseCsp(raw)));
      }
    } catch (err) {
      problems.push(`requête impossible : ${err.message}`);
    }
    results.push({ url, status, problems });
  }

  const assetPath = await discoverAsset(target.origin);
  if (!assetPath) {
    results.push({ url: target.origin + '/_astro/*', status: null,
                   problems: ['aucun asset hashé trouvé dans le HTML de la home'] });
  } else {
    const res = await fetchHeaders(target.origin + assetPath);
    const problems = [];
    if (!target.asset.cacheControl.test(res.headers['cache-control'] || '')) {
      problems.push(`cache-control « ${res.headers['cache-control']} » sans immutable`);
    }
    results.push({ url: target.origin + assetPath, status: res.status, problems });
  }
  return results;
}

const args = process.argv.slice(2);
const asJson = args.includes('--json');
const idx = args.indexOf('--target');
const wanted = idx >= 0 ? args[idx + 1] : 'site';
const names = wanted === 'all' ? Object.keys(TARGETS) : [wanted];

for (const n of names) {
  if (!TARGETS[n]) {
    console.error(`cible inconnue : ${n} (attendu : ${Object.keys(TARGETS).join(', ')}, ou all)`);
    process.exit(2);
  }
}

const report = {};
let failures = 0;
for (const name of names) {
  report[name] = await checkTarget(name, TARGETS[name]);
  failures += report[name].filter((r) => r.problems.length).length;
}

if (asJson) {
  console.log(JSON.stringify(report, null, 1));
} else {
  for (const [name, results] of Object.entries(report)) {
    console.log(`\n## ${name} — ${TARGETS[name].origin}\n`);
    for (const r of results) {
      const path = r.url.replace(TARGETS[name].origin, '') || '/';
      if (!r.problems.length) {
        console.log(`  ok   ${String(r.status ?? '—').padEnd(3)} ${path}`);
      } else {
        console.log(`  KO   ${String(r.status ?? '—').padEnd(3)} ${path}`);
        for (const p of r.problems) console.log(`         → ${p}`);
      }
    }
  }
  console.log(failures
    ? `\n${failures} route(s) en écart avec la matrice attendue.`
    : '\nToutes les routes servent les en-têtes attendus.');
}

process.exit(failures ? 1 : 0);
