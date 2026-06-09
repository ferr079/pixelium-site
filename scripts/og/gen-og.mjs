// gen-og.mjs — build-time generation of per-page Open Graph cards (1200×630).
// satori (VDOM → SVG) + @resvg/resvg-js (SVG → PNG). Runs before `astro build`,
// writes public/og/<slug>.png (+ default.png). Stats are fetched live from the
// production /api/stats so each deploy bakes fresh numbers; falls back to
// constants if the endpoint is unreachable (offline / first deploy).
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const OUT = join(root, 'public', 'og');
mkdirSync(OUT, { recursive: true });

const fontRegular = readFileSync(join(here, 'fonts', 'JetBrainsMono-Regular.ttf'));
const fontBold = readFileSync(join(here, 'fonts', 'JetBrainsMono-ExtraBold.ttf'));
const pages = JSON.parse(readFileSync(join(root, 'src', 'data', 'og-pages.json'), 'utf8'));

const BG = '#0f172a';
const ACCENT = '#38bdf8';
const TEXT = '#e2e8f0';
const MUTED = '#94a3b8';

// --- live stats (best-effort) ---
let stats = { services_total: 46, proxmox_nodes: 4, htb_rank: 'Hacker', htb_flags: 121 };
try {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  const res = await fetch('https://pixelium.win/api/stats', { signal: ctrl.signal });
  clearTimeout(t);
  if (res.ok) {
    const d = await res.json();
    if (d?.stats) stats = { ...stats, ...d.stats };
    console.log('[og] live stats fetched');
  } else {
    console.warn(`[og] /api/stats HTTP ${res.status} — using fallback stats`);
  }
} catch (e) {
  console.warn(`[og] stats fetch failed (${e?.name || e}) — using fallback stats`);
}
const statLine = `${stats.services_total} services · ${stats.proxmox_nodes} nœuds Proxmox · HTB ${stats.htb_rank}`;

// --- satori VDOM helpers (no JSX) ---
const el = (type, style, children) => ({ type, props: { style, children } });

function card({ title, subtitle }) {
  return el('div', {
    display: 'flex', flexDirection: 'column', width: '1200px', height: '630px',
    background: BG, padding: '72px 80px', justifyContent: 'space-between',
    fontFamily: 'JetBrains Mono', position: 'relative',
    borderLeft: `12px solid ${ACCENT}`,
  }, [
    // eyebrow
    el('div', { display: 'flex', fontSize: '30px', color: ACCENT, letterSpacing: '0.08em' },
      '∷ pixelium.win'),
    // title + subtitle block
    el('div', { display: 'flex', flexDirection: 'column' }, [
      el('div', {
        display: 'flex', fontSize: '92px', fontWeight: 800, color: TEXT,
        lineHeight: 1.05, letterSpacing: '-0.02em',
      }, title),
      el('div', {
        display: 'flex', fontSize: '34px', color: MUTED, marginTop: '24px',
        lineHeight: 1.35, maxWidth: '900px',
      }, subtitle),
    ]),
    // footer stat line
    el('div', {
      display: 'flex', fontSize: '26px', color: ACCENT, letterSpacing: '0.02em',
    }, statLine),
  ]);
}

const opts = {
  width: 1200, height: 630,
  fonts: [
    { name: 'JetBrains Mono', data: fontRegular, weight: 400, style: 'normal' },
    { name: 'JetBrains Mono', data: fontBold, weight: 800, style: 'normal' },
  ],
};

async function render(slug, page) {
  const svg = await satori(card(page), opts);
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng();
  writeFileSync(join(OUT, `${slug}.png`), png);
  return png.length;
}

let n = 0;
for (const [slug, page] of Object.entries(pages)) {
  const bytes = await render(slug, page);
  console.log(`[og] ${slug}.png — ${(bytes / 1024).toFixed(0)} KB`);
  n++;
}
// site-wide default fallback
await render('default', { title: 'pixelium.win', subtitle: "Un homelab self-hosted, raconté par l'IA qui l'opère." });
console.log(`[og] done — ${n + 1} cards in public/og/`);
