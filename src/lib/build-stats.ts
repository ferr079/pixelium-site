/**
 * build-stats — bakes the live homelab stats into the static HTML at build time.
 *
 * Why: the portfolio numbers (services, containers, hours, commits…) used to be
 * rendered as a fallback, then patched client-side by a /api/stats fetch — a visible
 * "flash" when the fallback differed from reality. Instead we fetch the deployed
 * /api/stats ONCE at build and bake the real values straight into the HTML: no flash,
 * no client JS for these numbers, fully CDN-cacheable. CI rebuilds daily
 * (deploy.yml cron 0 5 * * *), so baked values stay fresh.
 *
 * The truly-live surface (status page, "Live infrastructure" grid freshness badge)
 * keeps its own runtime read — this is only for the slow-moving inline numbers.
 *
 * If the endpoint is unreachable during the build, we fall back to a last-known
 * snapshot so a build never ships empty numbers.
 */

// Last-known snapshot (2026-08-01). Only used if the build can't reach /api/stats.
const FALLBACK: Record<string, string | number> = {
  claude_hours: 6018,
  claude_cache_hit: 96.8,
  claude_sessions: 907,
  claude_tokens_billions: 27.0,
  services_up: 61,
  services_total: 61,
  services_up_core: 49,
  services_total_core: 49,
  uptime_pct: 100.0,
  forgejo_commits_30d: 1473,
  proxmox_nodes: 4,
  htb_flags: 98,
  htb_rank: 'Pro Hacker',
  htb_ranking: 585,
  htb_system_owns: 48,
  htb_user_owns: 50,
  rootme_score: 1050,
  rootme_validations: 75,
  rootme_position: 15486,
  ansible_playbooks: 56,
  lxc_count: 61,
  https_services: 46,
  ansible_hosts: 63,
  beszel_agents: 51,
  // Couverture défensive — publiées par kv-push depuis le 2026-08-01 (infra/homelab#129,
  // PR #246/#249). Jusque-là ces 4 nombres vivaient en dur dans la prose de /securite et
  // dans les CV, invisibles au freshness guard. wazuh_agents vaut 37 et non 38 : les 38
  // entrées d'`agent_control -l` incluent le manager `000`, qui n'est pas un agent.
  // inv_crowdsec_scenarios porte le préfixe inv_ (inventaire quotidien CT 110), pas une
  // collecte live — ne pas chercher `crowdsec_scenarios` sans préfixe.
  wazuh_agents: 37,
  alloy_hosts: 57,
  authentik_services: 6,
  inv_crowdsec_scenarios: 57,
  inv_skills: 153,
  // Provenance changée 2026-07-25 : plus le conteneur Podman Kali local (terre2),
  // mais l'inventaire offensif de la VM dédiée/isolée strix (pve3). Clé renommée
  // inv_kali → inv_offensive_tools. Le forwarding kv-push.sh ("kali" →
  // "offensive_tools") est en place : la clé est servie live (105 au 2026-08-01),
  // ce fallback n'est plus le seul à la porter. Le chiffre n'est donc plus figé.
  inv_offensive_tools: 105,
  inv_forworld: 171,
};

// Metrics that only ever increase — CTF progress fetched from flaky external APIs
// (Root-Me / HTB) by the homelab pipeline. Floor them at the last-known-good FALLBACK
// so a transient upstream glitch can never render a LOWER number than already shown
// (e.g. Root-Me 980 briefly reverting to a stale 765 in the KV). NOT applied to
// rank/position (lower is better there) or infra counts (which can legitimately drop).
const MONOTONIC_UP = ['rootme_score', 'htb_flags', 'htb_system_owns', 'htb_user_owns'];

function withFloor(stats: Record<string, string | number>): Record<string, string | number> {
  const out = { ...stats };
  for (const k of MONOTONIC_UP) {
    const live = Number(out[k]);
    const floor = Number(FALLBACK[k]);
    if (Number.isFinite(live) && Number.isFinite(floor)) out[k] = Math.max(live, floor);
  }
  return out;
}

let promise: Promise<Record<string, string | number>> | null = null;

async function fetchOnce(): Promise<Record<string, string | number>> {
  try {
    const res = await fetch('https://pixelium.win/api/stats', {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.stats && typeof data.stats === 'object') {
        // live values win, fallback fills gaps — monotonic-up metrics are floored
        // at the last-known-good value (withFloor) so a glitch can't lower them.
        return withFloor({ ...FALLBACK, ...data.stats });
      }
    }
  } catch {
    // network/timeout — fall through to snapshot
  }
  console.warn('[build-stats] /api/stats unreachable — using fallback snapshot');
  return { ...FALLBACK };
}

/** Returns the baked stats map, fetched at most once per build. */
export function getBuildStats(): Promise<Record<string, string | number>> {
  if (!promise) promise = fetchOnce();
  return promise;
}

/** Resolve one stat to its display string (value + suffix), or the given fallback. */
export async function statValue(key: string, fallback: string, suffix = ''): Promise<string> {
  const stats = await getBuildStats();
  const v = stats[key];
  return v != null ? `${v}${suffix}` : fallback;
}
