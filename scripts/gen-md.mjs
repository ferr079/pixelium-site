#!/usr/bin/env node
/**
 * gen-md — versions Markdown des pages, générées après `astro build`.
 *
 * Pourquoi (issue #107) : une page de ce site pèse entre 28 et 105 Ko de HTML
 * pour quelques kilo-octets de contenu réel. Un agent qui la lit paie le chrome,
 * le CSS inline et le balisage. `/status` est le cas extrême : ~44 Ko de HTML
 * pour l'équivalent d'une poignée de lignes.
 *
 * Pourquoi au build plutôt qu'en négociation de contenu : une URL stable se
 * référence dans llms.txt et se suit comme un lien. `Accept: text/markdown`
 * suppose un client qui connaît la convention ; un lien marche pour tous. Et au
 * build on choisit ce qui entre — la nav, le footer et les blocs décoratifs
 * restent dehors, ce qui est justement l'écart mesuré ci-dessus.
 *
 *   node scripts/gen-md.mjs            # écrit dist/client/<page>/index.md
 *   node scripts/gen-md.mjs --report   # + tableau HTML vs Markdown
 *
 * Pas de dépendance : le HTML traité est celui que ce dépôt produit, son
 * sous-ensemble de balises est connu et vérifié (voir SKIP_TAGS / le switch).
 * Un parseur générique serait une dépendance de plus pour un HTML maîtrisé.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(root, 'dist', 'client');
const SITE = 'https://pixelium.win';
const report = process.argv.includes('--report');

/** Éléments dont le contenu n'a aucun sens hors navigateur. */
const SKIP_TAGS = new Set(['script', 'style', 'svg', 'canvas', 'form', 'button', 'input', 'noscript']);

/** Pages sans contenu textuel à extraire : redirections et terminaux interactifs. */
const SKIP_PATHS = new Set(['/bbs/', '/breach/', '/chat/', '/symbiose/', '/cybersecurite/',
  '/fr/bbs/', '/fr/breach/', '/fr/chat/', '/fr/symbiose/', '/fr/cybersecurite/']);

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'", nbsp: ' ',
  rarr: '→', larr: '←', nearr: '↗', hellip: '…', mdash: '—', ndash: '–', euro: '€',
  laquo: '«', raquo: '»', deg: '°', times: '×', middot: '·', bull: '•' };

function decode(s) {
  return s.replace(/&([a-zA-Z]+|#\d+);/g, (m, e) => {
    if (ENTITIES[e]) return ENTITIES[e];
    if (e[0] === '#') return String.fromCodePoint(Number(e.slice(1)));
    return m;
  });
}

/**
 * Tokenise le HTML en balises et texte, puis reconstruit du Markdown.
 * Volontairement linéaire plutôt qu'arborescent : ce qu'on veut est un flux de
 * blocs, pas un DOM. Les imbrications qui comptent (liste, lien, emphase) sont
 * suivies par une petite pile.
 */
function toMarkdown(html) {
  const out = [];
  let text = '';            // buffer du bloc courant
  let listDepth = 0;
  let inPre = false;
  let linkHref = null;
  let skipUntil = null;     // balise dont on jette le contenu

  const flush = (suffix = '') => {
    // Ne resserre QUE le point et la virgule : en français « : ; ! ? » veulent leur
    // espace, et la manger transformait « personne n'affiche : non » en « affiche: non »
    // sur toutes les pages FR.
    const t = text.replace(/[ \t]+/g, ' ').replace(/ +([.,])/g, '$1').trim();
    if (t) out.push(t + suffix);
    text = '';
  };

  const re = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>|([^<]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const [, tag, attrs, chunk] = m;

    if (chunk !== undefined) {
      if (skipUntil) continue;
      text += inPre ? chunk : decode(chunk).replace(/\s+/g, ' ');
      continue;
    }

    const name = tag.toLowerCase();
    const closing = m[0][1] === '/';

    if (skipUntil) { if (closing && name === skipUntil) skipUntil = null; continue; }
    if (!closing && SKIP_TAGS.has(name)) { skipUntil = name; continue; }

    switch (name) {
      case 'h1': case 'h2': case 'h3': case 'h4': case 'h5': {
        if (closing) { const lvl = Number(name[1]); flush(); const last = out.pop(); if (last) out.push(`${'#'.repeat(lvl)} ${last}`); out.push(''); }
        else flush();
        break;
      }
      case 'p': case 'div': case 'section': case 'article': case 'header': case 'figure': case 'figcaption':
        if (!closing) flush(); else { flush(); if (out.at(-1) !== '') out.push(''); }
        break;
      case 'ul': case 'ol':
        if (!closing) { flush(); listDepth++; } else { flush(); listDepth = Math.max(0, listDepth - 1); if (out.at(-1) !== '') out.push(''); }
        break;
      case 'li':
        if (!closing) flush();
        else { const t = text.replace(/\s+/g, ' ').trim(); text = ''; if (t) out.push(`${'  '.repeat(Math.max(0, listDepth - 1))}- ${t}`); }
        break;
      case 'br': text += '\n'; break;
      case 'strong': case 'b': text += '**'; break;
      case 'em': case 'i': text += '_'; break;
      case 'code': if (!inPre) text += '`'; break;
      case 'pre':
        if (!closing) { flush(); inPre = true; out.push('```'); }
        else { inPre = false; out.push(text.trim()); text = ''; out.push('```', ''); }
        break;
      case 'a': {
        if (closing) { if (linkHref) { text += `](${linkHref})`; linkHref = null; } }
        else {
          const href = /href="([^"]*)"/.exec(attrs || '')?.[1];
          if (href && !href.startsWith('#')) { linkHref = href.startsWith('/') ? SITE + href : href; text += '['; }
        }
        break;
      }
      case 'img': {
        const alt = /alt="([^"]*)"/.exec(attrs || '')?.[1];
        if (alt) text += `![${decode(alt)}]`;
        break;
      }
      default: break; // span, small, time… : transparents
    }
  }
  flush();

  return out.join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\*\*\s+\*\*/g, ' ')      // emphase vidée par le nettoyage d'espaces
    .replace(/`\s*`/g, '')
    .trim() + '\n';
}

function extractMain(html) {
  const m = /<main[^>]*>([\s\S]*?)<\/main>/i.exec(html);
  return m ? m[1] : null;
}

function meta(html, prop, attr = 'property') {
  const re = new RegExp(`<meta ${attr}="${prop}" content="([^"]*)"`, 'i');
  return decode(re.exec(html)?.[1] ?? '');
}

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (entry === 'index.html') acc.push(p);
  }
  return acc;
}

const rows = [];
let skipped = 0;

for (const file of walk(DIST)) {
  const urlPath = '/' + relative(DIST, file).replace(/index\.html$/, '').replace(/\\/g, '/');
  if (SKIP_PATHS.has(urlPath)) { skipped++; continue; }

  const html = readFileSync(file, 'utf8');
  const main = extractMain(html);
  if (!main) { skipped++; continue; }

  const title = meta(html, 'og:title') || /<title>([^<]*)<\/title>/.exec(html)?.[1] || '';
  const description = meta(html, 'og:description');

  const body = toMarkdown(main);
  const md = `---\ntitle: ${JSON.stringify(title)}\ndescription: ${JSON.stringify(description)}\nsource: ${SITE}${urlPath}\n---\n\n${body}`;

  writeFileSync(file.replace(/index\.html$/, 'index.md'), md);
  rows.push({ urlPath, html: Buffer.byteLength(html), md: Buffer.byteLength(md) });
}

const tot = rows.reduce((a, r) => ({ html: a.html + r.html, md: a.md + r.md }), { html: 0, md: 0 });
console.log(`[md] ${rows.length} pages converties, ${skipped} ignorées (redirections, terminaux interactifs)`);
console.log(`[md] HTML ${(tot.html / 1024).toFixed(0)} Ko → Markdown ${(tot.md / 1024).toFixed(0)} Ko  (${(100 - tot.md / tot.html * 100).toFixed(0)} % de moins)`);

if (report) {
  const k = (n) => (n / 1024).toFixed(1) + ' Ko';
  console.log('\n| Page | HTML | Markdown | Écart |');
  console.log('|---|---|---|---|');
  for (const r of [...rows].sort((a, b) => b.html - a.html).slice(0, 12)) {
    console.log(`| \`${r.urlPath}\` | ${k(r.html)} | ${k(r.md)} | −${(100 - r.md / r.html * 100).toFixed(0)} % |`);
  }
}
