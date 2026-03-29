---
title: "Hardening sécurité — headers, JSON-LD, humans.txt"
date: 2026-03-29
tags: ["sécurité", "seo", "site"]
summary: "Durcissement des headers HTTP (CSP, HSTS, Permissions-Policy), données structurées JSON-LD pour le SEO, et easter egg humans.txt."
---

Une conversation avec Gemini (via Théodule) a déclenché cette session — l'IA a fait remarquer qu'un portfolio cybersécurité devrait avoir des headers HTTP exemplaires. C'était juste.

**Headers de sécurité (`_headers`) :**
- `Content-Security-Policy: default-src 'none'` — deny-by-default, chaque type de ressource explicitement autorisé
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — HTTPS forcé pendant 1 an
- `X-Content-Type-Options: nosniff` — empêche les attaques par MIME sniffing
- `X-Frame-Options: DENY` — anti-clickjacking
- `Permissions-Policy` — caméra, micro, géolocalisation, FLoC désactivés
- `Referrer-Policy: strict-origin-when-cross-origin` — fuite d'information minimale
- Déployé via fichier `_headers` Cloudflare Workers Static Assets — appliqué au niveau CDN edge

**Données structurées JSON-LD :**
- Schema `Person` (Stéphane Ferreira) avec `jobTitle` dynamique par langue (EN/FR)
- Schema `WebSite` lié à la Person via référence `@id`
- Liens `sameAs` vers GitHub, X, Hack The Box
- Présent sur les 20 pages via injection dans le layout `Base.astro`

**humans.txt :**
- Crédite l'équipe (Stéphane + Claude), la stack (Astro 6, Cloudflare Workers, CSS pur), l'infra et la philosophie
- Lié via `<link rel="author" href="/humans.txt" />` dans le head HTML

**Nouvelle section sur /securite :**
- Ajout de la section 07 "Ce site lui-même" documentant la posture de sécurité du site
- Compteur de couches défensives mis à jour de 5 à 6

L'objectif : quiconque lance `curl -I https://pixelium.win` doit voir que ce portfolio applique ce qu'il prêche.
