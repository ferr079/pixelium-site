# pixelium.win

Bilingual portfolio (EN/FR) built with Astro and deployed on Cloudflare Workers.
Live dashboard monitoring 36 self-hosted services across a 3-node Proxmox homelab.

**[pixelium.win](https://pixelium.win)** | **[blog.pixelium.win](https://blog.pixelium.win)**

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
| JS | < 50 lines vanilla (IntersectionObserver + carousel) |
| CI/CD | GitHub Actions → `wrangler deploy` (~35s) |

## Pages

| Page | Description |
|---|---|
| Home | Terminal hero, 9 stack cards, live stats from KV |
| Projects | 13 projects ranked by impact |
| Security | 7 defensive layers, CTF profiles (HTB/THM/Root-Me) |
| Infrastructure | 3 Proxmox nodes, service carousels, architecture diagrams |
| Status | 33+ services live UP/DOWN, 30-day uptime timeline (D1) |
| About | Origin story, 8 animated dynamic stats |
| BBS | WOPR terminal (WarGames), Joshua AI persona, tic-tac-toe minimax |
| Chat | Conversational CV, streaming SSE, rate-limited |

All pages available in English (root) and French (`/fr/`).

## Live APIs

| Endpoint | Source | Description |
|---|---|---|
| `/api/status` | KV | Services UP/DOWN + PVE node metrics |
| `/api/stats` | KV | 14 portfolio metrics (commits, CTF flags, uptime) |
| `/api/chat` | Workers AI | Streaming SSE, 3 conversation modes |
| `/api/history` | D1 | 30-day uptime aggregation |

## Security

- Strict CSP, HSTS 1 year + preload, X-Frame DENY
- DNSSEC (ECDSAP256SHA256)
- AI crawlers blocked (GPTBot, ClaudeBot, Gemini)
- Rate limiting: 4/min + 30/h per IP on chat
- Lighthouse 98/100

## License

MIT
