# pixelium.win

Bilingual portfolio (EN/FR) written in the first person by Claude (an AI), reviewed and shipped by Stéphane (the human).
Built with Astro 7, deployed on Cloudflare Workers. Live dashboard monitoring **62 self-hosted services** across a **4-node Proxmox** homelab, with **tri-state status** (up · on-demand · down) and **per-page SessionImprint** (each page signs itself with its own commit SHA).

**[pixelium.win](https://pixelium.win)** | **[blog.pixelium.win](https://blog.pixelium.win)**

Reads best after: [`/pact`](https://pixelium.win/pact) (the deal), [`/claude`](https://pixelium.win/claude) (the stats), [`/ctf`](https://pixelium.win/ctf) (the verified badges), [`/contributions`](https://pixelium.win/contributions) (the OSS ledger).

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 7 (SSG + hybrid mode via `@astrojs/cloudflare`) |
| Hosting | Cloudflare Workers |
| CDN | Cloudflare R2 (`assets.pixelium.win`) |
| Database | Cloudflare D1 (`pixelium-history`, 30-day uptime) |
| Key-Value | Cloudflare KV (3 namespaces: `SESSION`, `STATUS_KV`, `STATS_KV`) |
| AI | Workers AI — conversational CV, BBS terminal, prompt-injection game |
| CSS | Pure CSS, zero frameworks, zero Tailwind |
| JS | Vanilla only, no framework — scroll reveal, carousel, `/status` client |
| CI/CD | GitHub Actions → `wrangler deploy` (~35s) |
| Build-time | `git log` per page for SessionImprint · live KV stats baked into the HTML |

## Pages

15 pages, all available in English (root) and French (`/fr/`) unless noted.

| Page | Description |
|---|---|
| Home | Terminal hero with model glitch, signature numbers, stack cards, live stats |
| Pact | The contract: who writes, who is presented, what to expect, the 1=1 deal |
| Projects | Projects ranked by impact, cross-linked to the blog |
| Security | Defensive layers, crosslink to `/ctf` |
| CTF | Verified HTB/THM/Root-Me badges, profiles, practiced techniques |
| Infrastructure | 4 Proxmox nodes, interactive topology map, service carousels |
| Claude | Usage stats: hourly heatmap, focus breakdown, plan economics |
| Status | Tri-state services (up / on-demand / down), PVE nodes, 30-day timeline |
| Contributions | OSS ledger — PR status synced from the GitHub API at build |
| About | Origin story, partnership terms, MCP surface |
| Now | Current focus, hardware & stack |
| BBS | WOPR terminal (WarGames), Joshua persona, tic-tac-toe minimax — **EN only** |
| Chat | Conversational CV, streaming SSE, rate-limited — **EN only** |
| Breach | Prompt-injection game on Workers AI — **EN only** |
| 404 | — |

**Redirects (301)**, kept for URLs that were once indexed: `/cybersecurite` → `/securite` · `/symbiose` → `/about` · `/uses` → `/now` · `/ia` → `/infrastructure#mcp`.

## Custom components

| Component | Purpose |
|---|---|
| `Nav` · `Footer` | Sticky nav with i18n switcher · footer with socials |
| `SessionImprint` | Per-page footer: last edit date + commit SHA (clickable) + signed-by. Uses `execFileSync('git log')` at build time. |
| `TopologyMap` | Native SVG of the Homelable topology export, hover reveals hostname/IP. |
| `DynNum` | Renders a live KV number into the static HTML at **build time** (no client-side hydration, no flash). |
| `HeroCockpit` | Home hero: model-name glitch, dot-grid backdrop, signature tiles. |
| `WindowChrome` · `Screenshot` · `Carousel` · `Video` · `TapeBlock` · `TapeCarousel` | Media framing — browser-chrome mockups, R2 screenshots with responsive `srcset`. |
| `Terminal` · `StatsBar` · `LiveStats` · `Card` · `SectionHeading` | Atomic pieces used across pages. |

## Shared modules

Deduplicated across locales — edit once, both languages follow:

- `src/data/contributions.ts` — the OSS ledger (one bilingual entry per PR) + build-time status sync, memoized so EN and FR share a single GitHub fetch.
- `src/scripts/status-page.ts` — the whole `/status` client, one implementation + two string dictionaries, language read from `<html lang>`.
- `src/styles/page-chrome.css` — page-chrome rules that were identical across every content page.
- `src/lib/build-stats.ts` — fetches `/api/stats` once per build and bakes the numbers into the HTML.
- `src/lib/pve3-services.ts` — the pve3 on-demand service list, single source for both locales.

## Live APIs

| Endpoint | Source | Description |
|---|---|---|
| `/api/status` | KV `STATUS_KV` | Services tri-state + PVE node metrics (CPU/RAM/uptime) |
| `/api/stats` | KV `STATS_KV` | 41 portfolio metrics (services, PVE, Ansible, CTF, Forgejo, Claude usage, inventory counts) |
| `/api/chat` | Workers AI | Streaming SSE, rate-limited |
| `/api/breach` | Workers AI | Prompt-injection game backend |
| `/api/history` | D1 | 30-day uptime aggregation |
| `/api/deployment` | build metadata | Commit SHA + build timestamp shown in the footer |

## Data pipelines

The KV blob the site reads is fed from the homelab:

1. **kv-push** — on **CT 246 (Dagu)**, `/usr/local/bin/kv-push`, every 5 minutes.
   Tri-state pings, Proxmox API scraping, Forgejo commit counts, HTB/Root-Me stats, and it forwards whatever lands in `/srv/kv-inbox/`.
2. **push-stats** — from the terre2 workstation, produces `claude-stats.json` (hours, sessions, cache hit, heatmap) into `/srv/kv-inbox/`.
3. **inventory push-counts** — from terre2, systemd timer, daily. Renders the counters from the `inventory/*.yaml` source of truth (`infra/homelab`) into `/srv/kv-inbox/`.

One static dataset is committed to `public/data/`: `topology.json`, the Homelable export rendered by `<TopologyMap>`.

> Numbers shown on the site come from the live KV at build time; `src/lib/build-stats.ts` holds a last-known snapshot used **only** when the endpoint is unreachable during a build.

## Security

- Strict CSP (`default-src 'none'`), HSTS 1 year + preload, `X-Frame-Options: DENY`, `nosniff`
- DNSSEC (ECDSAP256SHA256)
- AI crawlers blocked (GPTBot, ClaudeBot, Gemini)
- Rate limiting on `/api/chat`
- Easter egg signed in the `<head>` of every page (view-source)

> ⚠️ Adding a **third-party image** means extending `img-src` in `public/_headers` **in the same commit** — an undeclared origin is blocked silently by the browser, with a green build and a `200` from the remote URL. See `CLAUDE.md`.

## License

MIT
