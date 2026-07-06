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

// Last-known snapshot (2026-06-27). Only used if the build can't reach /api/stats.
const FALLBACK: Record<string, string | number> = {
  claude_hours: 1432,
  claude_cache_hit: 97.3,
  claude_sessions: 273,
  services_up: 46,
  services_total: 46,
  uptime_pct: 100,
  forgejo_commits_30d: 1257,
  proxmox_nodes: 4,
  htb_flags: 77,
  htb_rank: 'Hacker',
  htb_ranking: 788,
  htb_system_owns: 37,
  htb_user_owns: 40,
  rootme_score: 980,
  rootme_validations: 72,
  rootme_position: 16889,
  ansible_playbooks: 51,
  lxc_count: 60,
  https_services: 36,
  ansible_hosts: 34,
  beszel_agents: 30,
  inv_skills: 151,
  inv_kali: 42,
  inv_forworld: 173,
};

let promise: Promise<Record<string, string | number>> | null = null;

async function fetchOnce(): Promise<Record<string, string | number>> {
  try {
    const res = await fetch('https://pixelium.win/api/stats', {
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.stats && typeof data.stats === 'object') {
        // live values win, fallback fills any gap
        return { ...FALLBACK, ...data.stats };
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
