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
| Contributions | `src/pages/contributions.astro` | `src/pages/fr/contributions.astro` | OSS PRs/reports — statuts reflètent l'état upstream réel (vérifier via `gh pr view`) |
| About | `src/pages/about.astro` | `src/pages/fr/about.astro` | Merged with symbiose.astro |
| BBS | `src/pages/bbs.astro` | — (EN only) | WOPR terminal, Workers AI |
| Chat | `src/pages/chat.astro` | — (EN only) | CV conversationnel, Workers AI |
| ~~Lab~~ (`/ia`) | `src/pages/ia.astro` | `src/pages/fr/ia.astro` | **Archivée 2026-06-08** (hors nav, toujours accessible) — instantané AIops v2 (trio décommissionné). Deep-link `/ia#mcp` conservé depuis l'accueil (contenu MCP toujours valide) |

**Redirects (301):** symbiose→about, cybersecurite→securite (PAS ia : page archivée, accessible)

**Nav:** Projects | Security | CTF | Infra | Contributions | Status | Chat | About | Blog↗
(2026-06-08 : « Lab »/`/ia` retiré de la nav → remplacé par « Contributions » ; brick OSS de l'accueil supprimé — il vedettait la PR #309, fermée sans merge)

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
- Local build: `source ~/.claude/secrets.env && HTB_API_TOKEN="$HTB_API_TOKEN" ROOTME_API_KEY="$ROOTME_API_KEY" ROOTME_UID="$ROOTME_UID" GITHUB_TOKEN="$GITHUB_TOKEN" npm run build`

**`contributions.astro` (EN+FR) — statut PR synchronisé au build** : le tableau `contributions` porte le contenu éditorial (insight/tags/blog) + un `status` *fallback* ; au build, `liveStatus()` fetch `api.github.com/repos/{o}/{r}/pulls/{n}` → `merged`/`open`/`closed` réel (override le fallback ; warning loggé `[contributions] …` si dérive ou échec). Résumé du hero (`statusBreakdown`) dérivé du live. Discussions exclues (pas d'état de merge). Token : `GITHUB_TOKEN` (CI = auto-Actions `secrets.GITHUB_TOKEN`, lecture publique). ⚠️ **Une NOUVELLE contribution s'ajoute toujours à la main** (l'éditorial n'est pas auto-généré) — seul le statut est auto-synchro. Vérifier les nouvelles PR mergées : `gh search prs --author ferr079 --merged`.

## Images organization

```
public/images/
  *.webp              — PVE dashboards, homepage, neofetch, architecture SVG
  services/           — 10 screenshots (Traefik, Authentik, Technitium, Semaphore, NetBox, Immich, ByteStash, Joplin, OMV, netboot)
  monitoring/         — 5 screenshots (Beszel, Wazuh×2, VictoriaMetrics, Patchmon)
```
Images served from **Cloudflare R2 CDN** (`assets.pixelium.win`). `aws` (awscli, brew sur l'hôte terre2) — creds R2 mappés depuis `secrets.env`.
Convert with: `magick input.png -resize '1200x>' -quality 80 output.webp`

**Mettre à jour UNE image** (recommandé — `cp` ciblé, PAS `sync` du dossier) :
```bash
set -a; source ~/.claude/secrets.env; set +a
AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
  aws s3 cp public/images/<f>.webp s3://pixelium-assets/images/<f>.webp \
  --endpoint-url "$R2_ENDPOINT" --region auto
# PUIS purge cache CDN (sinon le edge sert l'ancienne ~4h, même nom d'objet) :
python3 - <<'PY'  # zone pixelium.win = 12961123076e01643b3df3aded6e7982 ; purge = Global API Key requise
import os,json,urllib.request
s={}
[s.__setitem__(k.strip(),v.strip().strip('"').strip("'")) for k,v in (l.split('=',1) for l in open(os.path.expanduser('~/.claude/secrets.env')) if '=' in l and not l.startswith('#'))]
req=urllib.request.Request('https://api.cloudflare.com/client/v4/zones/12961123076e01643b3df3aded6e7982/purge_cache',
  data=json.dumps({"files":["https://assets.pixelium.win/images/<f>.webp"]}).encode(),method='POST')
req.add_header('Content-Type','application/json'); req.add_header('X-Auth-Email',s['CLOUDFLARE_EMAIL']); req.add_header('X-Auth-Key',s['CLOUDFLARE_API_KEY'])
print(json.load(urllib.request.urlopen(req)).get('success'))
PY
```
⚠️ **Ne PAS faire `aws s3 sync public/images/` du dossier entier** : `sync` compare taille+mtime et re-pousse tout objet R2 dont l'état diverge du repo — écrase silencieusement d'éventuelles variantes R2 (2026-06-25 : a re-poussé 8 screenshots services/monitoring ; sans gravité ici, dimensions identiques, mais R2 n'a **pas** de versioning → irréversible). Cibler le fichier modifié.
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
git push origin main && git push forgejo main   # remote SSH (forgejo-ssh), plus besoin de sslVerify=false
```

**CI/CD is active.** `git push origin main` triggers automatic deploy. No manual `wrangler deploy` needed. Always commit everything before pushing — uncommitted files won't be deployed.

## Profiles — real data, do not modify without verification

| Platform | Username | Current stats |
|---|---|---|
| Hack The Box | Ferr079 | Hacker rank, #881, 34 system + 37 user owns, 71 flags (fallback ctf.astro ; live au build via `/profile/basic`). Lvl 50 « Professional » · Season 11 Ruby tier #381 (screenshot `htb-dashboard.webp`, MAJ 2026-06-27). ⚠️ `/profile/activity` **supprimé par HTB 2026** (HTTP 400) → `flags = user_owns + system_owns`, ne PAS ré-ajouter d'appel activity. NB : `ranking` = rang **global** HTB (≠ `#381` = rang de saison du screenshot) |
| TryHackMe | ferr0 | Top 15%, 35 rooms, 7 badges |
| Root-Me | Ferr0 | 765 pts, 63 challenges |
| GitHub | ferr079 | github.com/ferr079 |
| X/Twitter | @ferr079 | x.com/ferr079 |

## Content rules

- **All content is sourced** from the real ops journal or verifiable data. No invention.
- **MCP = least-privilege**: Proxmox = PVEAuditor (read-only). Always mention access restrictions when the topic is discussed.
- **Update platform stats** (HTB/THM/Root-Me) after each CTF session.
- **Local models list** (`/uses` → « Local models — Ollama », EN+FR) is **static, maintained by hand** — Ollama (`0.0.0.0:11434`) is local, unreachable from CI. Refresh it when the model set changes (`ollama list` / `GET /api/tags`). Offensive models (abliterated/uncensored) are grouped under CTF/red-team, no raw suffixes, with the legitimate-use framing.
- **Do not add npm dependencies** without explicit reason.
- **Edit both EN and FR** when modifying page content.
- **Cross-link projects ↔ blog**: any `/projets` card that has a matching post on `blog.pixelium.win` must link it — add `<a href="https://blog.pixelium.win/<slug>" class="project-link" target="_blank" rel="noopener">read the story &rarr;</a>` (FR: `lire le récit`) inside that card's `project-services` span (decommissioned cards link from their `decom-note` instead). When a **new project** is added *or* a **new blog post** is published, create the link. Verify the URL returns 200 before committing. EN + FR. The fiche sells (the what), the post proves (the how) — keep them wired.

## After every modification

Verify the build passes before pushing:
```bash
npm run build  # must finish with "Complete!" and no errors
```
