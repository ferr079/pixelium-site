// audit-freshness.mjs — fail if a hardcoded number in the source has drifted
// away from the live KV value exposed at /api/stats.
//
// Most figures on the site are DynNum-backed (they self-update from KV). But a
// few live in prose or build-time config (the chatbot system prompt, a StatsBar
// label) and CAN drift silently — exactly what happened to /claude (frozen at
// 611h while reality was 1010h). This guard codifies the corrected values: each
// entry pins a (file, regex→number, KV key). On drift it prints the delta and
// exits 1, so CI catches it before a recruiter does.
//
// Run: npm run audit:freshness   (needs network to https://pixelium.win/api/stats)
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Each check: the captured group (1) is parsed as an int and compared to stats[key].
const CHECKS = [
  { file: 'src/pages/api/chat.ts', re: /(\d+) Proxmox nodes/, key: 'proxmox_nodes', label: 'chat.ts — Proxmox nodes' },
  { file: 'src/pages/securite.astro', re: /number: '(\d+)', label: 'hardened SSH hosts'/, key: 'ansible_hosts', label: 'securite.astro — SSH hosts StatsBar' },
  { file: 'src/pages/fr/securite.astro', re: /number: '(\d+)', label: 'hosts SSH durci'/, key: 'ansible_hosts', label: 'fr/securite.astro — SSH hosts StatsBar' },
  { file: 'src/pages/index.astro', re: /hardened SSH on (\d+) hosts/, key: 'ansible_hosts', label: 'index.astro — SSH hosts (Security card)' },
  { file: 'src/pages/fr/index.astro', re: /SSH durci sur (\d+) h(?:ô|o)tes/, key: 'ansible_hosts', label: 'fr/index.astro — SSH hosts (Security card)' },
  // Les playbooks des cartes IaC (index.astro + fr/index.astro) ne sont plus surveillés :
  // ils sont injectés au build depuis le KV (`stats.ansible_playbooks`, 2026-08-08), comme
  // lxc_count. Plus de littéral = plus de dérive possible. Les 2 checks correspondants ont
  // été retirés — les garder les faisait remonter en « stale » et sortir le guard en 1.
  // Static prose / SEO meta — the ansible_hosts/playbooks literals above still need
  // pinning (manual check 2026-06-23 caught LXC 48/53, playbooks 41/46).
  // lxc_count was the worst offender (drifted 49→58→59 in days as the homelab grew):
  // ALL its literals are now dynamic — `${stats.lxc_count}` from build-stats on the
  // index cards + infra meta (EN/FR), and fuzzy "~60" in the chat.ts system prompt —
  // so no lxc literal can lie anymore. Nothing left to pin for it.
  //
  // chat.ts est un Worker runtime : il ne peut pas lire build-stats (évalué au build).
  // Il lit le KV LUI-MÊME, à la requête — c'est son équivalent de <DynNum>. Depuis le
  // 2026-08-25 les compteurs d'infra y passent par les jetons {{SERVICES}} / {{LXC}} /
  // {{BESZEL}} / {{PLAYBOOKS}} / {{HOSTS}} / {{CROWDSEC}} (liveStats()), donc ils ne
  // sont plus épinglés ici : cinq d'entre eux avaient dérivé sans que rien ne le voie
  // côté visiteur, le site affichant les bons chiffres pendant que le chat en récitait
  // d'autres. Seul reste épinglé le nombre de nœuds Proxmox, volontairement en dur :
  // il est lié à l'énumération pve1–4 en prose, un 5e nœud demande une réécriture.
  // NB: the volatile CTF figures are no longer pinned — HTB ranking/flags/machines and the
  // Root-Me score are injected live from STATS_KV via the {{HTB_RANK}}/{{HTB_FLAGS}}/
  // {{HTB_MACHINES}}/{{ROOTME_SCORE}} tokens (liveStats() in chat.ts), the Worker's <DynNum>.
  // (2026-07-12: htb_flags drifted 77→79 as new boxes were pwned — made dynamic instead of re-pinned.)
  // proxmox_nodes narrative prose: the count is bound to the pve1–4 enumeration, so a
  // 5th node needs a human rewrite (not just a number bump) — pin it so CI flags the drift.
  { file: 'src/pages/infrastructure.astro', re: /(\d+) heterogeneous Proxmox VE nodes/, key: 'proxmox_nodes', label: 'infrastructure.astro — Proxmox nodes (prose)' },
  { file: 'src/pages/fr/infrastructure.astro', re: /(\d+) n.uds Proxmox VE h/, key: 'proxmox_nodes', label: 'fr/infrastructure.astro — Proxmox nodes (prose)' },
  { file: 'src/data/og-pages.json', re: /"(\d+) n.uds Proxmox/, key: 'proxmox_nodes', label: 'og-pages.json — Proxmox nodes (OG subtitle)' },
  // humans.txt n'est plus épinglé : il n'est plus un fichier statique. Le commentaire
  // qui vivait ici posait qu'un fichier de public/ « ne PEUT PAS » être rendu dynamique —
  // c'était vrai de public/, pas de humans.txt. Depuis le 2026-08-25 il est servi par
  // src/pages/humans.txt.ts (prerender), qui lit build-stats comme le reste du site.
  // Il avait dérivé deux fois (60 LXC vs 76 live, puis 61 vs 59) sur un fichier qui
  // affirme lui-même « Every number on this site is live from the homelab ».
  // Couverture défensive (2026-08-01) — les 4 clés alloy_hosts / authentik_services /
  // inv_crowdsec_scenarios / wazuh_agents sont enfin publiées au KV (infra/homelab#129),
  // donc /securite, /infrastructure et /projets sont passés en <DynNum> : le sweep
  // "orphan stats" plus bas les couvre déjà, rien à pinner pour ces pages. Restent les
  // deux surfaces qui ne PEUVENT pas lire build-stats :
  //   - chat.ts, Worker runtime (même raison que les facts pinnés plus haut) ;
  //   - les meta SEO des cartes d'accueil, chaînes statiques dans le frontmatter.
  { file: 'src/pages/index.astro', re: /Authentik SSO on (\d+) services/, key: 'authentik_services', label: 'index.astro — Authentik services (Security card meta)' },
  { file: 'src/pages/fr/index.astro', re: /SSO Authentik sur (\d+) services/, key: 'authentik_services', label: 'fr/index.astro — Authentik services (Security card meta)' },
];

const STATS_URL = 'https://pixelium.win/api/stats';

let stats;
try {
  const res = await fetch(STATS_URL, { headers: { 'User-Agent': 'pixelium-freshness-guard' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  stats = (await res.json()).stats;
  if (!stats) throw new Error('no .stats in response');
} catch (e) {
  console.error(`✗ cannot reach ${STATS_URL} (${e.message}) — freshness check skipped, not failing the build`);
  process.exit(0); // network failure is not a drift; don't block on it
}

const drift = [];
const missing = [];
for (const c of CHECKS) {
  let text;
  try { text = readFileSync(join(root, c.file), 'utf8'); }
  catch { missing.push(`${c.label}: file ${c.file} not found`); continue; }
  const m = text.match(c.re);
  if (!m) { missing.push(`${c.label}: pattern ${c.re} not found in ${c.file}`); continue; }
  const hardcoded = parseInt(m[1], 10);
  const live = stats[c.key];
  if (live === undefined) { missing.push(`${c.label}: KV key '${c.key}' absent from /api/stats`); continue; }
  if (hardcoded !== Number(live)) {
    drift.push(`${c.label}: hardcoded ${hardcoded} ≠ live ${live} (KV '${c.key}')`);
  }
}

// --- Orphan stat keys -------------------------------------------------------
// The CHECKS above only pin *hardcoded* literals. The dynamic side had its own
// blind spot: a <DynNum stat="x"> (or a StatsBar `stat: 'x'`) whose key doesn't
// exist in the KV silently serves its component fallback — forever, with the same
// visual authority as a live number. mcp_tools sat at a frozen 312 on the homepage
// this way, next to three genuinely live tiles. Nothing flagged it, because the
// header comment above assumed "DynNum-backed ⇒ self-updating". It isn't, if the
// key was never fed. Sweep every stat reference and require it to exist upstream.
function astroSources(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) astroSources(p, out);
    else if (/\.(astro|ts)$/.test(e.name)) out.push(p);
  }
  return out;
}

const orphans = new Set();
for (const file of astroSources(join(root, 'src'))) {
  const text = readFileSync(file, 'utf8');
  // matches both <DynNum stat="key" /> and StatsBar's { stat: 'key' }
  for (const [, key] of text.matchAll(/\bstat\s*[:=]\s*["']([a-z0-9_]+)["']/g)) {
    if (stats[key] === undefined) {
      orphans.add(`${file.replace(`${root}/`, '')}: stat '${key}' absent from /api/stats — serving its fallback`);
    }
  }
}

if (missing.length) {
  console.error('⚠ stale checks (regex/file/key no longer match — update audit-freshness.mjs):');
  for (const m of missing) console.error(`   - ${m}`);
}
if (orphans.size) {
  console.error('\n✗ ORPHAN STATS — these keys are read by the site but not published by the KV:');
  for (const o of orphans) console.error(`   - ${o}`);
  console.error('\nFeed the key from the homelab pipeline (kv-push), or point the reference at a key that exists.');
}
if (drift.length) {
  console.error('\n✗ FRESHNESS DRIFT — hardcoded numbers diverged from live KV:');
  for (const d of drift) console.error(`   - ${d}`);
  console.error('\nFix the source (or convert to <DynNum>) so the site stops lying.');
}
if (drift.length || orphans.size) process.exit(1);
if (missing.length) process.exit(1); // a broken check is itself a problem to fix
console.log(`✓ freshness OK — ${CHECKS.length} hardcoded values match live KV, no orphan stat keys`);
