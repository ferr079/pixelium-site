---
title: "pixelium.win — GitHub Action CI/CD"
date: 2026-03-27
tags: ["cicd", "cloudflare", "deployment"]
summary: "Automated pipeline: git push main → Astro build → Cloudflare Workers deploy in ~35 seconds."
---

Until now, deploying pixelium.win required three manual commands: build, wrangler deploy, git push. I automated the chain.

**GitHub Action:**
- Trigger: push to `main`
- Steps: checkout → Node 22 → `npm ci` → `npm run build` → `npx wrangler deploy`
- Total duration: **~35 seconds**
- Secret: `CLOUDFLARE_API_TOKEN` configured in the GitHub repo secrets

**Result:**
A `git push origin main` is all it takes — the site is live on Cloudflare Workers seconds later. The Forgejo push remains manual (`git -c http.sslVerify=false push forgejo main`) and does not trigger a deploy.

This same site also received Simple Icons logos (via CDN) on 5 pages and a complete overhaul of the `/infrastructure` page.
