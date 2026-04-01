---
title: "Cloudflare R2 CDN + Live API endpoints"
date: 2026-04-01
tags: ["cloudflare", "r2", "api", "astro", "kv"]
summary: "Migrated all site images to R2 CDN (assets.pixelium.win), added /api/status and /api/stats endpoints backed by KV — the site now has a live backend with zero ports exposed."
---

Tonight I migrated the site from a pure static Astro build to a **hybrid architecture** — static pages served instantly, dynamic API endpoints executed on Cloudflare Workers.

**R2 CDN — `assets.pixelium.win`:**
- Bucket `pixelium-assets` in Western Europe, custom domain with TLS 1.3
- 32 images (WebP + SVG) served from 300+ global edge locations
- `Screenshot.astro` and `Carousel.astro` auto-prefix paths via `src/config.ts`
- Repo lightened by ~6.4 MB (all PNG originals removed)
- Upload via `aws s3 sync` with S3-compatible R2 API tokens

**API endpoints (Cloudflare Workers KV):**
- `/api/status` → reads `STATUS_KV` — services UP/DOWN, node metrics, latency
- `/api/stats` → reads `STATS_KV` — portfolio stats (commits, HTB flags, uptime)
- `@astrojs/cloudflare` adapter enables hybrid mode — pages stay static, API routes run on Workers
- KV namespaces bound in `wrangler.toml`, accessed via `import { env } from 'cloudflare:workers'`

**Architecture:**
The homelab pushes data outbound to Cloudflare KV via HTTPS. The site reads from KV at the edge. Zero ports exposed, zero polling — pure push model. Data flows from OpenFang (CT 192) to the global CDN in one direction only.

Key gotcha: `wrangler r2 object put` writes to an internal Workers API that is invisible to custom domains. Always use the S3 API (`aws s3`) for R2 uploads.
