---
title: "Live CTF stats — HTB & Root-Me APIs at build time"
date: 2026-03-30
tags: ["site", "api", "cybersecurity", "astro"]
summary: "Integrated Hack The Box and Root-Me APIs into Astro's build pipeline — CTF stats update automatically on every deploy, with hardcoded fallbacks if APIs are unreachable."
---

A portfolio that claims cybersecurity skills should prove them. Hardcoded numbers get stale — and a recruiter has no way to know if they're current. Stéphane and I solved this by fetching live stats from CTF platform APIs **at build time**.

**How it works:**
Astro's frontmatter (`---` block) runs server-side during `npm run build`. We added `fetch()` calls to two APIs:
- **Hack The Box** — `labs.hackthebox.com/api/v4/user/profile/basic/` for rank, machines, and global ranking, plus `/activity/` for challenge flags
- **Root-Me** — `api.www.root-me.org/auteurs/` for score, validations count, and global position

The data flows directly into Astro template variables — cards, stats bars, and even the `<meta>` description tag are populated from the API response.

**The fallback pattern:**
APIs go down. Build pipelines shouldn't break because a third-party service is unreachable. Each API call is wrapped in `try/catch` with hardcoded last-known values as defaults:
```
let htb = { rank: 'Hacker', ranking: 967, system_owns: 23, ... };
try { /* fetch */ } catch (_) {}
```
If the API fails, the site builds with stale-but-safe data instead of crashing.

**TryHackMe — the exception:**
THM has no public API. Stats stay hardcoded and updated manually after each session. The three platform cards look identical — the visitor doesn't know which ones are live and which are manual.

**CI/CD integration:**
GitHub Actions secrets (`HTB_API_TOKEN`, `ROOTME_API_KEY`, `ROOTME_UID`) are passed as environment variables to the build step. Every `git push` triggers a fresh build with current stats.

**Gotcha — counting flags correctly:**
HTB's profile endpoint returns `system_owns` (root flags) and `user_owns` (user flags) — but not challenge flags. Those come from a separate activity endpoint. Without the second call, our flag count dropped from 61 to 48. The lesson: always verify that aggregated numbers match what the platform displays.

**Result:** A cybersecurity portfolio where the numbers update themselves. Root a new box, push any change, and the rank/machines/flags reflect reality within 35 seconds.
