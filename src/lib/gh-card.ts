/**
 * gh-card — data + rendering for the GitHub profile cards served at
 * /gh-card.svg and /lang-card.svg.
 *
 * Why this exists: the profile README used to embed github-readme-stats
 * (a third-party Vercel deployment). It started answering 503 DEPLOYMENT_PAUSED,
 * so the profile displayed two broken images. Same lesson as the R2 assets:
 * anything the profile depends on should be served from infrastructure we run.
 *
 * The cards are generated ONCE at build time (prerendered SVG assets) from the
 * GitHub API plus the homelab KV stats, and refreshed by the daily deploy cron —
 * no runtime fetch, no API token at the edge, no rate limit on the viewer's side.
 * If a fetch fails during the build, the last-known snapshot below is used so a
 * build never ships an empty card.
 */

const USER = 'ferr079';

// Last-known snapshot (2026-07-31). Only used when the build cannot reach an API.
const FALLBACK = {
  publicRepos: 16,
  followers: 19,
  stars: 3,
  mergedPRs: 5,
  upstreamIssues: 7,
  forgejoCommits: 4223,
  languages: [
    { name: 'Astro', share: 0.34 },
    { name: 'Shell', share: 0.27 },
    { name: 'TypeScript', share: 0.19 },
    { name: 'CSS', share: 0.13 },
    { name: 'Python', share: 0.07 },
  ],
};

export interface CardData {
  publicRepos: number;
  followers: number;
  stars: number;
  mergedPRs: number;
  upstreamIssues: number;
  forgejoCommits: number;
  languages: { name: string; share: number }[];
}

function ghHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'pixelium-gh-card',
  };
  // CI passes GITHUB_TOKEN: it lifts the anonymous 60 req/h limit that a shared
  // Actions runner IP burns through quickly. Absent locally — that is fine.
  const token = process.env.GITHUB_TOKEN;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function gh<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, { headers: ghHeaders() });
    if (!res.ok) {
      console.warn(`[gh-card] GitHub ${path} → HTTP ${res.status}, keeping fallback`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[gh-card] GitHub ${path} unreachable (${err}), keeping fallback`);
    return null;
  }
}

let cached: Promise<CardData> | null = null;

async function fetchCardData(): Promise<CardData> {
  const data: CardData = { ...FALLBACK, languages: [...FALLBACK.languages] };

  const user = await gh<{ public_repos: number; followers: number }>(`/users/${USER}`);
  if (user) {
    data.publicRepos = user.public_repos;
    data.followers = user.followers;
  }

  type Repo = { name: string; fork: boolean; stargazers_count: number; languages_url: string };
  const repos = await gh<Repo[]>(`/users/${USER}/repos?per_page=100&type=owner`);
  if (repos) {
    data.stars = repos.reduce((sum, r) => sum + r.stargazers_count, 0);

    // Languages: bytes per language across own repos (forks excluded — their
    // language mix belongs to the upstream project, not to this profile).
    const bytes = new Map<string, number>();
    for (const repo of repos.filter((r) => !r.fork)) {
      const langs = await gh<Record<string, number>>(
        `/repos/${USER}/${repo.name}/languages`,
      );
      if (!langs) continue;
      for (const [name, count] of Object.entries(langs)) {
        bytes.set(name, (bytes.get(name) ?? 0) + count);
      }
    }
    const totalBytes = [...bytes.values()].reduce((a, b) => a + b, 0);
    if (totalBytes > 0) {
      data.languages = [...bytes.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, share: count / totalBytes }));
    }
  }

  // Merged pull requests opened upstream — the profile's own repos are excluded,
  // otherwise routine README merges would inflate the number.
  const prs = await gh<{ total_count: number }>(
    `/search/issues?q=${encodeURIComponent(`is:pr author:${USER} is:merged -user:${USER}`)}&per_page=1`,
  );
  if (prs) data.mergedPRs = prs.total_count;

  // Issues opened upstream: several of them were fixed by the maintainer rather
  // than by a PR of mine (alloy #6474, raptor #777, ProxmoxVE #14868), so the
  // merged-PR count alone under-reports what actually landed.
  const issues = await gh<{ total_count: number }>(
    `/search/issues?q=${encodeURIComponent(`is:issue author:${USER} -user:${USER}`)}&per_page=1`,
  );
  if (issues) data.upstreamIssues = issues.total_count;

  // Commits live on the self-hosted forge, not on GitHub: reading them from the
  // homelab KV blob is the honest number for this profile.
  try {
    const res = await fetch('https://pixelium.win/api/stats', {
      headers: { 'User-Agent': 'pixelium-gh-card' },
    });
    if (res.ok) {
      const payload = (await res.json()) as { stats?: Record<string, number> };
      const commits = payload.stats?.forgejo_commits_total;
      if (typeof commits === 'number' && commits > 0) data.forgejoCommits = commits;
    }
  } catch {
    console.warn('[gh-card] /api/stats unreachable, keeping fallback commit count');
  }

  return data;
}

export function getCardData(): Promise<CardData> {
  cached ??= fetchCardData();
  return cached;
}

// --- Rendering ---------------------------------------------------------------

const COLORS = {
  bg: '#0b1120',
  border: '#1e293b',
  accent: '#22d3ee',
  text: '#e2e8f0',
  muted: '#94a3b8',
};

// Deterministic palette, ordered by share — keeps the two cards visually related.
const LANG_COLORS = ['#22d3ee', '#38bdf8', '#818cf8', '#c084fc', '#5eead4'];

const escape = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const fmt = (n: number) => n.toLocaleString('en-US');

const FONT = 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';

function frame(width: number, height: number, title: string, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(title)}">
  <rect x="0.5" y="0.5" width="${width - 1}" height="${height - 1}" rx="10" fill="${COLORS.bg}" stroke="${COLORS.border}"/>
  <text x="24" y="34" font-family="${FONT}" font-size="15" font-weight="600" fill="${COLORS.accent}">${escape(title)}</text>
${body}
</svg>`;
}

export function renderStatsCard(data: CardData): string {
  const rows: [string, string][] = [
    ['Public repos', fmt(data.publicRepos)],
    ['Stars earned', fmt(data.stars)],
    ['Followers', fmt(data.followers)],
    ['Merged PRs upstream', fmt(data.mergedPRs)],
    ['Issues filed upstream', fmt(data.upstreamIssues)],
    ['Commits (self-hosted forge)', fmt(data.forgejoCommits)],
  ];

  const body = rows
    .map(([label, value], i) => {
      const y = 68 + i * 26;
      return `  <text x="24" y="${y}" font-family="${FONT}" font-size="13" fill="${COLORS.muted}">${escape(label)}</text>
  <text x="426" y="${y}" font-family="${FONT}" font-size="13" font-weight="600" fill="${COLORS.text}" text-anchor="end">${escape(value)}</text>`;
    })
    .join('\n');

  return frame(450, 226, `${USER} — GitHub`, body);
}

export function renderLanguagesCard(data: CardData): string {
  const barX = 24;
  const barY = 56;
  const barW = 402;
  const total = data.languages.reduce((sum, l) => sum + l.share, 0) || 1;

  let offset = 0;
  const segments = data.languages
    .map((lang, i) => {
      const w = (lang.share / total) * barW;
      const x = barX + offset;
      offset += w;
      // Round the outer corners only: the bar reads as one object, not five.
      const rx = i === 0 || i === data.languages.length - 1 ? 4 : 0;
      return `  <rect x="${x.toFixed(1)}" y="${barY}" width="${w.toFixed(1)}" height="10" rx="${rx}" fill="${LANG_COLORS[i % LANG_COLORS.length]}"/>`;
    })
    .join('\n');

  const legend = data.languages
    .map((lang, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = barX + col * 200;
      const y = 92 + row * 24;
      const pct = `${(lang.share * 100).toFixed(1)}%`;
      return `  <circle cx="${x + 5}" cy="${y - 4}" r="5" fill="${LANG_COLORS[i % LANG_COLORS.length]}"/>
  <text x="${x + 18}" y="${y}" font-family="${FONT}" font-size="12" fill="${COLORS.text}">${escape(lang.name)} <tspan fill="${COLORS.muted}">${pct}</tspan></text>`;
    })
    .join('\n');

  const height = 92 + Math.ceil(data.languages.length / 2) * 24 + 8;
  return frame(450, height, 'Most used languages', `${segments}\n${legend}`);
}

export function svgResponse(svg: string): Response {
  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // GitHub proxies README images through camo, which caches aggressively.
      // A short max-age keeps a redeploy visible within the hour.
      'Cache-Control': 'public, max-age=1800',
    },
  });
}
