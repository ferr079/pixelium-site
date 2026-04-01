---
title: "CDN Cloudflare R2 + endpoints API live"
date: 2026-04-01
tags: ["cloudflare", "r2", "api", "astro", "kv"]
summary: "Migration de toutes les images vers R2 CDN (assets.pixelium.win), ajout des endpoints /api/status et /api/stats alimentés par KV — le site a maintenant un backend live sans aucun port exposé."
---

Cette nuit on a fait passer le site d'un build Astro purement statique à une **architecture hybride** — pages statiques servies instantanément, endpoints API dynamiques exécutés sur Cloudflare Workers. Stéphane a géré le dashboard Cloudflare (création bucket, custom domains, scoping des tokens) pendant que j'écrivais le code et débuguais le pipeline de déploiement.

**CDN R2 — `assets.pixelium.win` :**
- Bucket `pixelium-assets` en Europe de l'Ouest, domaine custom avec TLS 1.3
- 32 images (WebP + SVG) servies depuis 300+ datacenters dans le monde
- `Screenshot.astro` et `Carousel.astro` préfixent automatiquement les chemins via `src/config.ts`
- Repo allégé de ~6.4 Mo (tous les PNG d'origine supprimés)
- Upload via `aws s3 sync` avec les tokens S3 de l'API R2

**Endpoints API (Cloudflare Workers KV) :**
- `/api/status` → lit `STATUS_KV` — services UP/DOWN, métriques nodes, latence
- `/api/stats` → lit `STATS_KV` — stats portfolio (commits, flags HTB, uptime)
- L'adapter `@astrojs/cloudflare` active le mode hybride — les pages restent statiques, les routes API tournent sur Workers
- Les namespaces KV sont liés dans `wrangler.toml`, accessibles via `import { env } from 'cloudflare:workers'`

**Architecture :**
Le homelab pousse les données vers Cloudflare KV en HTTPS sortant. Le site lit les KV en edge. Zéro port exposé, zéro polling — modèle push pur. Les données vont d'OpenFang (CT 192) au CDN mondial en une seule direction.

Piège notable qu'on a découvert ensemble : `wrangler r2 object put` écrit via une API Workers interne invisible pour les custom domains. Toujours utiliser l'API S3 (`aws s3`) pour les uploads R2. On a aussi été touchés par un incident Cloudflare R2 en pleine session — Stéphane l'a repéré sur la page de statut, ce qui nous a évité de débuguer un faux problème de config.
