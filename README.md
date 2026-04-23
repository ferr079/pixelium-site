# pixelium.win

Bilingual portfolio (EN/FR) written in the first person by Claude (an AI), reviewed and shipped by Stéphane (the human).
Built with Astro 6, deployed on Cloudflare Workers. Live dashboard monitoring **55+ self-hosted services** across a **4-node Proxmox** homelab, with **tri-state status** (up · on-demand · down) and **per-page SessionImprint** (each page signs itself with its own commit SHA).

**[pixelium.win](https://pixelium.win)** | **[blog.pixelium.win](https://blog.pixelium.win)**

Reads best after: [`/pact`](https://pixelium.win/pact) (the deal), [`/ia`](https://pixelium.win/ia) (the lab), [`/claude`](https://pixelium.win/claude) (the stats), [`/contributions`](https://pixelium.win/contributions) (the OSS ledger).

## Stack

| Layer | Technology |
|---|---|
| Framework | Astro 6 (SSG hybrid mode) |
| Hosting | Cloudflare Workers (free tier) |
| CDN | Cloudflare R2 (`assets.pixelium.win`) |
| Database | Cloudflare D1 (uptime history 30 days) |
| Key-Value | Cloudflare KV (3 namespaces: sessions, status, stats) |
| AI | Workers AI (Llama 3.1 8B) — conversational CV + BBS terminal |
| CSS | Pure CSS, zero frameworks, zero Tailwind |
| JS | < 50 lines vanilla (IntersectionObserver + carousel + client-side stats hydration) |
| CI/CD | GitHub Actions → `wrangler deploy` (~35s) |
| Build-time | `git log` per-page for SessionImprint · JSON datasets for topology & journal |

## Pages

| Page | Description |
|---|---|
| Home | Terminal hero, 3 signature numbers (`611h · 97.4% · 300+`), 5-line manifesto, 9 stack cards, OSS brick, live StatsBar + LiveStats |
| Pact | The contract: who writes, who is presented, what to expect, the 1=1 deal |
| Projects | 14 projects ranked by impact |
| Security | 7 defensive layers, crosslink to /ctf |
| CTF | Verified HTB/THM/Root-Me badges, profiles, techniques |
| Infrastructure | 4 Proxmox nodes, **interactive topology map (62 nodes, 8 edges from Homelable)**, service carousels |
| Lab (`/ia`) | Claude's technical autoportrait: AIops v2 trio with ASCII diagram, 8 Guardian crons, MCP surface (9 servers, 312 tools), methodology, incidents |
| Claude | Deep-dive usage stats: hourly heatmap 24h, focus breakdown, Max-plan economics framing (≈ ~30× compression factor) |
| Status | 54 services live tri-state (up / on-demand / down), PVE × 4, 30-day uptime timeline (D1) |
| Journal | Auto-generated from `homelab-infra/journal/*.md` — 26 entries, 248 subjects |
| Contributions | OSS PR shelf with insight-per-PR, 4 contributions shipped on 2026-04-22 |
| Making-of/v3 | The session log behind this very rewrite |
| About | Origin story, partnership terms, 9 MCP servers detailed |
| BBS | WOPR terminal (WarGames), Joshua AI persona, tic-tac-toe minimax — EN only |
| Chat | Conversational CV, streaming SSE, rate-limited — EN only |

All content pages available in English (root) and French (`/fr/`).

## Custom components

| Component | Purpose |
|---|---|
| `Nav` · `Footer` | Sticky nav with i18n switcher · Footer with socials |
| `SessionImprint` | Per-page footer showing last edit date + commit SHA (clickable) + signed-by. Uses `execFileSync('git log')` at build time. |
| `TopologyMap` | Native SVG of the Homelable topology export (62 nodes colored by type, hover reveals hostname/IP). |
| `DynNum` | Renders a fallback number in static HTML (SEO), hydrated client-side from `/api/stats` once the page loads. |
| `HeroTerminal` · `StatsBar` · `LiveStats` · `Card` · `Carousel` · `Screenshot` · `SectionHeading` | Atomic pieces used across pages. |

## Live APIs

| Endpoint | Source | Description |
|---|---|---|
| `/api/status` | KV `STATUS_KV` | Services tri-state + PVE node metrics (CPU/RAM/uptime) |
| `/api/stats` | KV `STATS_KV` | 25+ portfolio metrics (services, PVE, Ansible, Beszel, CTF, Forgejo, **Claude hours/sessions/cache**) |
| `/api/chat` | Workers AI | Streaming SSE, 3 conversation modes |
| `/api/history` | D1 | 30-day uptime aggregation |

## Data pipelines

Two pipelines feed the KV blob that the site reads:

1. **kv-push** (on CT 192 OpenFang, `/opt/openfang/scripts/kv-push.sh`, hourly timer)
   - Tri-state pings of 54 services (`schedule: always | on-demand`)
   - Proxmox API scraping of 4 nodes
   - Forgejo commit counts, HTB/Root-Me API, Semaphore template count, Beszel agent count
   - Reads `/srv/kv-inbox/claude-stats.json` if present and forwards
2. **push-stats** (on terre2 workstation, `~/Claude/claude-usage/scripts/push-stats.sh`, on session end or cron)
   - SQL queries against `~/.claude/usage.db` (from `phuryn/claude-usage`)
   - Produces `claude-stats.json` (hours, sessions, turns, cache hit, hourly heatmap, focus)
   - `scp` to `root@192.168.1.192:/srv/kv-inbox/claude-stats.json`

Two static JSON datasets are also commited to `public/data/`:

- `topology.json` — 62-node Homelable export, rendered by `<TopologyMap>`
- `journal.json` — 26 dated entries from `homelab-infra/journal/*.md`, rendered by `/journal`

## Security

- Strict CSP, HSTS 1 year + preload, X-Frame DENY, X-Content-Type-Options nosniff
- DNSSEC (ECDSAP256SHA256)
- AI crawlers blocked (GPTBot, ClaudeBot, Gemini)
- Rate limiting: 4/min + 30/h per IP on `/api/chat`
- Lighthouse 98/100
- Easter egg signed in `<head>` of every page (view-source)

## License

MIT
