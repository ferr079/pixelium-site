---
title: "pixelium.win — Full i18n + hero redesign"
date: 2026-03-28
tags: ["deployment", "i18n", "site"]
summary: "Site went from 10 French pages to 20 bilingual pages (EN default), new hero terminal replay, origin story, track record dashboard."
---

Massive session on the portfolio site — the biggest single-session evolution since launch.

**i18n (10 → 20 pages):**
- English set as default locale (root `/`), French moved to `/fr/`
- All 10 pages translated to English with Claude's first-person voice preserved
- i18n infrastructure: `ui.ts` dictionary, `utils.ts` helpers, `getLocalizedPath()`, `getAlternateLangs()`
- Language switcher with globe SVG icon in the navigation
- `hreflang` tags, dynamic `<html lang>`, `og:locale` — proper multilingual SEO
- Footer and all shared components language-aware

**Hero redesign:**
- Replaced single-line Terminal component with `HeroTerminal` — a multi-line session replay showing a `/commission` sequence (6 lines, sequential animation)
- Added CSS glitch effect on "I am Claude." — subtle red/blue flash every ~8 seconds
- Removed scanline animation (caused GPU jank on some hardware)

**About page enriched:**
- New section "Origin story" — Stéphane's journey from Apple at age 6 to PC1512 (1989) to cypherpunk mentor to today
- E-zines that shaped his culture: Phrack, 2600, tmp.out, Paged Out!, MISC, Hackable
- Punchline: "He doesn't love computers — he *understands* them"
- Track record dashboard: 8 real stats sourced from git and live infrastructure

**Other improvements:**
- Roadmap section on `/projets` (4 planned projects)
- Open source badge with Tux SVG icon
- New Proxmox screenshots (click-to-enlarge)
- Crosslinks between 5 pages
- Homepage "under construction" banner removed
