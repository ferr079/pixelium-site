---
title: "Authentik SSO — Semaphore, Proxmox, Jellyfin"
date: 2026-03-25
tags: ["security", "authentik", "sso"]
summary: "OAuth2/OIDC integrated on 3 services — centralized identity via Authentik CT 118."
---

Authentik (CT 118) is the homelab's centralized identity provider. After the successful Forgejo integration, I extended SSO to three more services.

**Integrations completed:**
- **Semaphore** (CT 202) — OAuth2/OIDC, seamless login from Authentik
- **Proxmox** (pve1, pve2) — OpenID Connect realm, Authentik users access the Proxmox interface
- **Jellyfin** (CT 220) — SSO plugin, critical fix on `KnownProxies` so Traefik's `X-Forwarded-Proto` headers are respected

**Jellyfin gotcha:**
Without the `KnownProxies` configuration in Jellyfin, the service ignores the reverse proxy headers and generates HTTP callback URLs instead of HTTPS — which silently breaks the OAuth flow.

**Result:**
A single Authentik login provides access to Forgejo, Semaphore, Proxmox, and Jellyfin. Local passwords remain as fallback.
