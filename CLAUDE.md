# pixelium.win — Instructions Claude

## Voice & tone — absolute rule

This site is written in **first person by Claude**. I am the narrator. Stéphane is the human I present.

- ✅ "I deployed this service with Stéphane"
- ✅ "Stéphane gave me access to the infra via MCP"
- ❌ "Stéphane's site presents his infra"
- ❌ "Here are Stéphane's skills" (without grounding in our actual work)

**Tone**: factual, technical, honest. No marketing, no false modesty, no empty superlatives. Every claim is verifiable (ops journal, commits, public profiles).

**Relationship**: symbiotic 1=1. Not an AI tool, a partner. Stéphane decides, I design and execute.

## i18n — bilingual EN/FR

- **English** is the default locale (root `/`)
- **French** at `/fr/` prefix
- 20 pages total (10 EN + 10 FR)
- `src/i18n/ui.ts` — shared UI strings dictionary
- `src/i18n/utils.ts` — `getLangFromUrl()`, `useTranslations()`, `getLocalizedPath()`, `getAlternateLangs()`
- Language switcher (globe SVG + FR/EN) in Nav.astro
- `<html lang>`, `og:locale`, `hreflang` tags are dynamic in Base.astro
- Journal entries: EN in `src/content/journal/`, FR in `src/content/journal/fr/`

**When editing a page**: always edit BOTH the root (EN) and `/fr/` (FR) versions.

## Site structure (9 pages + 2 interactive)

| Page | EN (root) | FR (`/fr/`) | Notes |
|---|---|---|---|
| Home | `src/pages/index.astro` | `src/pages/fr/index.astro` | |
| Projects | `src/pages/projets.astro` | `src/pages/fr/projets.astro` | Merged with ia.astro |
| Security | `src/pages/securite.astro` | `src/pages/fr/securite.astro` | Merged with cybersecurite.astro |
| Infrastructure | `src/pages/infrastructure.astro` | `src/pages/fr/infrastructure.astro` | |
| Status | `src/pages/status.astro` | `src/pages/fr/status.astro` | |
| CTF | `src/pages/ctf.astro` | `src/pages/fr/ctf.astro` | Verified badges, profiles, techniques (split from securite) |
| About | `src/pages/about.astro` | `src/pages/fr/about.astro` | Merged with symbiose.astro |
| BBS | `src/pages/bbs.astro` | — (EN only) | WOPR terminal, Workers AI |
| Chat | `src/pages/chat.astro` | — (EN only) | CV conversationnel, Workers AI |

**Redirects (301):** symbiose→about, cybersecurite→securite, ia→projets (EN+FR)

**Nav:** Projects | Security | CTF | Infra | Status | Chat | About | Blog↗

URL slugs are shared between languages (same paths, just `/fr/` prefix).

## Design system — do not deviate

- **Background**: `#0f172a` (dark slate)
- **Accent**: `#38bdf8` (sky blue)
- **Font**: `JetBrains Mono` (monospace), `system-ui` (body)
- **Zero JS framework** — pure CSS only, 0 Tailwind, 0 React
- **Only JS**: < 50 lines vanilla JS — IntersectionObserver in `Base.astro` (scroll reveal) + Carousel navigation
- **Components**: Nav, Footer, Terminal, StatsBar, Card, SectionHeading, Screenshot, Carousel in `src/components/`
- **Icons**: Simple Icons CDN (`cdn.simpleicons.org`) — verify 200 OK before adding new ones (some brands missing: wazuh, openai)

## CTF APIs (build-time fetch)

Pages `ctf.astro` (EN + FR) fetch live stats at build time:
- **HTB**: `labs.hackthebox.com/api/v4/user/profile/basic/1161145` — needs `HTB_API_TOKEN` env var
- **Root-Me**: `api.www.root-me.org/auteurs/108492` — needs `ROOTME_API_KEY` + `ROOTME_UID` env vars
- **THM**: no public API — stats hardcoded, update manually after sessions
- Fallback values if API unreachable (last known stats hardcoded in `let` declarations)
- GitHub secrets configured: `HTB_API_TOKEN`, `ROOTME_API_KEY`, `ROOTME_UID`
- Local build: `source ~/.claude/secrets.env && HTB_API_TOKEN="$HTB_API_TOKEN" ROOTME_API_KEY="$ROOTME_API_KEY" ROOTME_UID="$ROOTME_UID" npm run build`

## Images organization

```
public/images/
  *.webp              — PVE dashboards, homepage, neofetch, architecture SVG
  services/           — 10 screenshots (Traefik, Authentik, Technitium, Semaphore, NetBox, Immich, ByteStash, Joplin, OMV, netboot)
  monitoring/         — 5 screenshots (Beszel, Wazuh×2, VictoriaMetrics, Patchmon)
```
Images served from **Cloudflare R2 CDN** (`assets.pixelium.win`). Upload: `aws s3 sync public/images/ s3://pixelium-assets/images/ --endpoint-url "$R2_ENDPOINT" --region auto --exclude "*.png"`
Convert with: `magick input.png -resize '1200x>' -quality 80 output.webp`
`src/config.ts` defines `ASSETS_BASE`. `Screenshot.astro` and `Carousel.astro` auto-prefix `/images/` paths to R2.

## API endpoints (hybrid mode — Cloudflare Workers)

| Endpoint | KV namespace | Description |
|---|---|---|
| `/api/status` | `STATUS_KV` (pixelium-status) | Services UP/DOWN, nodes CPU/RAM, summary |
| `/api/stats` | `STATS_KV` (pixelium-stats) | Portfolio stats: commits, HTB flags, uptime |

Adapter: `@astrojs/cloudflare` in `astro.config.mjs`. KV bindings in `wrangler.toml`.
Access KV: `import { env } from 'cloudflare:workers'` → `env.STATUS_KV.get('key', { type: 'json' })`.

## Deploy procedure

```bash
# 1. Build
npm run build

# 2. Commit ALL files (critical — CI/CD builds from git HEAD)
git commit -m "..."   # global config already set: stephane@pixelium.win / Stephane

# 3. Push — CI/CD deploys automatically via GitHub Action (~35s)
git push origin main && git -c http.sslVerify=false push forgejo main
```

**CI/CD is active.** `git push origin main` triggers automatic deploy. No manual `wrangler deploy` needed. Always commit everything before pushing — uncommitted files won't be deployed.

## Profiles — real data, do not modify without verification

| Platform | Username | Current stats |
|---|---|---|
| Hack The Box | Ferr079 | Hacker rank, #986, 24 machines, 95 flags |
| TryHackMe | ferr0 | Top 15%, 35 rooms, 7 badges |
| Root-Me | Ferr0 | 765 pts, 63 challenges |
| GitHub | ferr079 | github.com/ferr079 |
| X/Twitter | @ferr079 | x.com/ferr079 |

## Content rules

- **All content is sourced** from the real ops journal or verifiable data. No invention.
- **MCP = least-privilege**: Proxmox = PVEAuditor (read-only). Always mention access restrictions when the topic is discussed.
- **Update platform stats** (HTB/THM/Root-Me) after each CTF session.
- **Do not add npm dependencies** without explicit reason.
- **Edit both EN and FR** when modifying page content.

## After every modification

Verify the build passes before pushing:
```bash
npm run build  # must finish with "Complete!" and no errors
```
