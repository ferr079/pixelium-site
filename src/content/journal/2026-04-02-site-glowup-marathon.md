---
title: "Site glowup marathon — tapes, dynamic stats, easter eggs"
date: 2026-04-02
tags: ["site", "vhs", "cloudflare", "astro", "design"]
summary: "A single session that transformed the portfolio: VHS terminal recordings with custom theme, random hero rotation, 14 dynamic KV stats, 3 easter eggs, content audit fixing 40+ issues, and a security headers audit scoring A."
---

A marathon session where every layer of the site got attention — from infrastructure automation to visual polish to hidden easter eggs.

**VHS terminal recordings (tapes):**
We installed [VHS](https://github.com/charmbracelet/vhs) (Charm) to record terminal sessions as WebM videos. 5 tapes created with a custom "pixelium" theme matching the site's exact colors (`#0f172a` background, `#38bdf8` accent, `#22c55e` green). The prompt shows `root@openfang:~#` with the same green/blue styling as the original HeroTerminal component. Each tape is ~200 KB on R2 CDN.

**Hero random rotation:**
The homepage hero terminal now shows a random tape on each page load — cert-check, http-check, pbs-backup, pve-status, or loki-query. A recruiter who refreshes sees a different terminal demo each time. The title bar updates to match the command. It's an easter egg for the observant.

**Dynamic stats (DynNum):**
Created a `DynNum` component that fetches live numbers from Cloudflare KV. `kv-push.sh` on CT 192 now pushes 14 metrics every hour: services count, LXC containers, HTTPS services, Ansible hosts/playbooks, Beszel agents, Forgejo commits (30d + total), journal entries, uptime, and more. The about page "track record" section is 100% dynamic — zero hardcoded numbers.

**Content audit:**
A thorough review of all 22 pages found ~40 missing French accents in `fr/infrastructure.astro`, 15 instances of "Stephane" without accent, stale numbers (12→13 playbooks, 25+→22+ HTTPS), and prose improvements ("thirtiplicate" → "thirty-fold"). All fixed across EN+FR.

**New content:**
- PBS backup project added to projects page (9-step orchestration, tested live at 14 min)
- "Agents in production" section on IA page — 4 agent cards (OpenFang, veille-rss, PentAGI, IronClaw)
- Cert monitoring added to security page PKI section
- Guardian updated to 5 crons, 7 wrappers, v0.9.0 everywhere

**Easter eggs — 3 layers:**
1. **Footer ASCII** — PIXELIUM block art at 12% opacity, visible when scrolling to bottom
2. **Console (F12)** — colored ASCII banner + recruiter message in DevTools
3. **View Source (Ctrl+U)** — Claude's message in an ASCII box at the top of every page

**Security:**
- Removed `<meta name="generator">` to hide Astro from Wappalyzer
- Added `media-src` to CSP for R2 video playback
- Full security headers audit: HSTS preload, CSP strict (default-src 'none'), X-Frame-Options DENY, all APIs tested for injection — grade A
- PentAGI autonomous scan launched against the live site (results pending)

**Design polish:**
- Status page SectionHeadings removed — fits 1080p viewport
- Architecture SVG diagram removed — will be replaced by Homelable screenshot
- Tagline width aligned with hero tape (40rem)
- Homepage dashboard screenshot moved into monitoring carousel

**PentAGI autonomous scan:**
We launched PentAGI (CT 198) against pixelium.win — the first autonomous pentest of our own public site. Running on qwen3.5:9b via Ollama, it struggled with tool-calling (dozens of retries) but completed 12 subtasks: TLS config, CSP bypass testing, API fuzzing, directory enumeration, CORS analysis, backup file scanning, HTML source scanning. **Result: 8/10, zero critical or high vulnerabilities.** Findings matched our manual audit exactly — CORS wildcard and CSP unsafe-inline as the only improvement areas. Next step: configure MiniMax M2.7 on PentAGI for faster, more reliable scans.

The site went from "good portfolio" to "the kind of site where you discover something new every time you look."
