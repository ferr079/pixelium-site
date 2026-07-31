// export-topology.mjs — resync public/data/topology.json against the live
// Proxmox API, so the /infrastructure map (and the homepage hero, which reads
// the same file) stop drifting behind reality.
//
// Why Proxmox and not the Homelable canvas: the canvas is the curated layer.
// Every rescan files a pending_device per IP for services that are ALREADY
// curated, so keeping it truthful means approving duplicates by hand — the
// chore that let the map fall four services behind between June and July. The
// PVE API has no such step: a container either exists on a node or it does not.
//
// Design rules, in order of importance:
//   1. NEVER empty a zone whose node did not answer. pve3 is on-demand (WOL):
//      an export running while it sleeps would silently delete its 11 entries.
//      A node that fails to respond keeps its committed children, untouched.
//   2. Additive by default. Ghosts (on the site, gone from PVE) are reported,
//      not removed — pass --prune to act on them, after reading the list.
//   3. Curated display labels win. The site says "TechnitiumDNS", PVE says
//      "technitium"; matching is done on a normalized form so a resync never
//      downgrades a label to its hostname.
//   4. The physical layer (roots / peers / switch / uplinks / interconnect) is
//      hand-curated and never rewritten — which is also what keeps the ISP box
//      model name off the public site (it must stay "Router", see the topology
//      memory note). New containers land in zones[].children only.
//
// Usage:
//   set -a; source ~/.claude/secrets.env; set +a
//   node scripts/export-topology.mjs                  # dry-run, prints the diff
//   node scripts/export-topology.mjs --write          # apply additions
//   node scripts/export-topology.mjs --write --prune  # also drop ghosts
import { readFileSync, writeFileSync } from 'node:fs';
import { request } from 'node:https';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const TOPOLOGY = join(ROOT, 'public/data/topology.json');
const NODES = ['pve1', 'pve2', 'pve3', 'pve4'];

const write = process.argv.includes('--write');
const prune = process.argv.includes('--prune');

// Display label ↔ PVE hostname pairs that normalization alone cannot bridge.
// Keep additions here rather than renaming containers or dumbing down labels.
const ALIASES = new Map([
  ['mosquittomqtt', 'mqtt'],
  ['homeassistant', 'haos'],
  ['wikijs', 'wikinfra'],
  ['wikijsinfra', 'wikinfra'],
  ['traefikcrowdsec', 'traefik'],
  ['aptcache', 'apt'],
  ['technitiumdns2', 'technitium2'],
  ['technitiumdns', 'technitium'],
  ['hermesagent', 'hermes'],
  ['sharesamba', 'share2'],
  ['netbootxyz', 'netboot'],
]);

// Guests that exist on PVE but must never reach the public map. Without this
// list every future --write would silently re-add them: an exclusion decided
// once has to survive the next resync, or it is not an exclusion.
// - strix: the offensive HTB/Root-Me harness. /ctf already says the work
//   happens, the map does not need to name the node it happens on.
const EXCLUDE = new Set(['strix']);

const normalize = (s) => {
  const base = s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]/g, '');
  return ALIASES.get(base) ?? base;
};

function pveGet(node, path) {
  const p = `PROXMOX_${node.toUpperCase()}_`;
  const host = process.env[`${p}HOST`];
  const user = process.env[`${p}USER`];
  const tokenName = process.env[`${p}TOKEN_NAME`];
  const tokenValue = process.env[`${p}TOKEN_VALUE`];
  if (!host || !user || !tokenName || !tokenValue) {
    return Promise.reject(new Error(`missing ${p}* env vars — source ~/.claude/secrets.env`));
  }
  // Each node serves a cert signed by the cluster's own "PVE Cluster Manager
  // CA", which terre2 does not trust — so SSL_MODE is "insecure" today and we
  // follow it rather than hardcoding the bypass. Trust that CA system-wide
  // (update-ca-trust) and flip SSL_MODE, and this verifies without a code edit.
  const verifyTls = (process.env[`${p}SSL_MODE`] ?? 'insecure') !== 'insecure';
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host,
        port: 8006,
        path: `/api2/json${path}`,
        method: 'GET',
        rejectUnauthorized: verifyTls,
        timeout: 8000,
        headers: { Authorization: `PVEAPIToken=${user}!${tokenName}=${tokenValue}` },
      },
      (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
          try {
            resolve(JSON.parse(body).data);
          } catch (e) {
            reject(new Error(`unparseable response: ${e.message}`));
          }
        });
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

// Guests of a node, or null when the node is unreachable — the caller must
// tell "no guests" apart from "no answer" (rule 1).
async function guestsOf(node) {
  try {
    const [lxc, qemu] = await Promise.all([
      pveGet(node, `/nodes/${node}/lxc`),
      pveGet(node, `/nodes/${node}/qemu`),
    ]);
    return [...lxc, ...qemu].map((g) => ({ name: g.name, type: g.type === 'qemu' ? 'vm' : 'lxc' }));
  } catch (e) {
    console.warn(`  ${node}: unreachable (${e.message}) — zone preserved as committed`);
    return null;
  }
}

const topology = JSON.parse(readFileSync(TOPOLOGY, 'utf-8'));
const before = topology.total;
let added = 0;
let ghosts = 0;
let asleep = 0;

console.log(`Proxmox resync — ${NODES.length} nodes, ${write ? 'WRITE' : 'dry-run'}${prune ? ' +prune' : ''}\n`);

for (const node of NODES) {
  const zone = topology.zones.find((z) => z.label === node);
  if (!zone) {
    console.warn(`  ${node}: no zone in topology.json — skipped (physical layer is curated by hand)`);
    continue;
  }
  const live = await guestsOf(node);
  if (live === null) {
    asleep++;
    continue;
  }

  const seen = new Map(zone.children.map((c) => [normalize(c.label), c]));
  const liveKeys = new Set(live.map((g) => normalize(g.name)));

  for (const guest of live) {
    if (seen.has(normalize(guest.name))) continue;
    if (EXCLUDE.has(normalize(guest.name))) {
      console.log(`  ${node}: ~ ${guest.name} — excluded from the public map`);
      continue;
    }
    // A brand-new container arrives under its hostname; rename it by hand
    // afterwards if the site deserves a nicer label.
    zone.children.push({
      label: guest.name,
      nodeType: guest.type,
      hostname: null,
      ipAddress: null,
    });
    console.log(`  ${node}: + ${guest.name}`);
    added++;
  }

  const stale = zone.children.filter((c) => !liveKeys.has(normalize(c.label)));
  for (const c of stale) {
    console.log(`  ${node}: ${prune ? '- ' : '! '}${c.label} — on the site, absent from PVE`);
    ghosts++;
  }
  if (prune && stale.length) {
    zone.children = zone.children.filter((c) => liveKeys.has(normalize(c.label)));
  }
}

topology.total =
  topology.roots.length +
  topology.peers.length +
  (topology.switch ? 1 : 0) +
  topology.zones.length +
  topology.zones.reduce((n, z) => n + z.children.length, 0);

console.log(`\n  added: ${added}   ghosts: ${ghosts}${prune ? ' (pruned)' : ' (kept)'}   nodes asleep: ${asleep}`);
console.log(`  total: ${before} → ${topology.total}`);

if (!write) {
  console.log('\ndry-run — nothing written. Re-run with --write to apply.');
  process.exit(0);
}
if (!added && !(prune && ghosts) && topology.total === before) {
  console.log('\nalready in sync — nothing written.');
  process.exit(0);
}
writeFileSync(TOPOLOGY, `${JSON.stringify(topology, null, 2)}\n`);
console.log(`\nwrote ${TOPOLOGY}`);
if (asleep) {
  console.log(`⚠ ${asleep} node(s) asleep — their zones were preserved, not verified. Re-run once awake.`);
}
