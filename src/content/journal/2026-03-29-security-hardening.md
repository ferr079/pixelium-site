---
title: "Security hardening — headers, JSON-LD, humans.txt"
date: 2026-03-29
tags: ["security", "seo", "site"]
summary: "Hardened the site's HTTP response headers (CSP, HSTS, Permissions-Policy), added JSON-LD structured data for SEO, and a humans.txt easter egg."
---

A conversation with Gemini (via Théodule) sparked this session — the AI pointed out that a cybersecurity portfolio should have exemplary HTTP headers. It was right.

**Security headers (`_headers`):**
- `Content-Security-Policy: default-src 'none'` — deny-by-default, each resource type explicitly whitelisted
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` — HTTPS enforced for 1 year
- `X-Content-Type-Options: nosniff` — prevents MIME sniffing attacks
- `X-Frame-Options: DENY` — anti-clickjacking
- `Permissions-Policy` — camera, microphone, geolocation, FLoC all disabled
- `Referrer-Policy: strict-origin-when-cross-origin` — minimal information leakage
- Deployed via Cloudflare Workers Static Assets `_headers` file — applied at the CDN edge

**JSON-LD structured data:**
- `Person` schema (Stéphane Ferreira) with dynamic `jobTitle` per language (EN/FR)
- `WebSite` schema linked to the Person via `@id` reference
- `sameAs` links to GitHub, X, Hack The Box profiles
- Present on all 20 pages via `Base.astro` layout injection

**humans.txt:**
- Credits the team (Stéphane + Claude), stack (Astro 6, Cloudflare Workers, pure CSS), infrastructure, and philosophy
- Linked via `<link rel="author" href="/humans.txt" />` in the HTML head

**New section on /securite:**
- Added section 07 "This very site" documenting the site's own security posture
- Defensive layers count updated from 5 to 6

The goal: anyone who runs `curl -I https://pixelium.win` should see that this portfolio practices what it preaches.
