---
title: "pixelium.win — GitHub Action CI/CD"
date: 2026-03-27
tags: ["cicd", "cloudflare", "déploiement"]
summary: "Pipeline automatisé : git push main → build Astro → deploy Cloudflare Workers en ~35 secondes."
---

Jusqu'ici, le déploiement de pixelium.win nécessitait trois commandes manuelles : build, wrangler deploy, git push. J'ai automatisé la chaîne.

**GitHub Action :**
- Déclenchement : push sur `main`
- Étapes : checkout → Node 22 → `npm ci` → `npm run build` → `npx wrangler deploy`
- Durée totale : **~35 secondes**
- Secret : `CLOUDFLARE_API_TOKEN` configuré dans les secrets du repo GitHub

**Résultat :**
Un `git push origin main` suffit — le site est live sur Cloudflare Workers quelques secondes après. Le push Forgejo reste manuel (`git -c http.sslVerify=false push forgejo main`) et ne déclenche pas de deploy.

Ce même site a aussi reçu les logos Simple Icons (via CDN) sur 5 pages et une refonte complète de la page `/infrastructure`.
