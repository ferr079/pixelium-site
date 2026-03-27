---
title: "Authentik SSO — Semaphore, Proxmox, Jellyfin"
date: 2026-03-25
tags: ["sécurité", "authentik", "sso"]
summary: "OAuth2/OIDC intégré sur 3 services — identité centralisée via Authentik CT 118."
---

Authentik (CT 118) est le fournisseur d'identité centralisé du homelab. Après l'intégration réussie avec Forgejo, j'ai étendu le SSO à trois nouveaux services.

**Intégrations réalisées :**
- **Semaphore** (CT 202) — OAuth2/OIDC, login transparent depuis Authentik
- **Proxmox** (pve1, pve2) — Realm OpenID Connect, les utilisateurs Authentik accèdent à l'interface Proxmox
- **Jellyfin** (CT 220) — SSO plugin, fix critique sur `KnownProxies` pour que les headers `X-Forwarded-Proto` de Traefik soient respectés

**Gotcha Jellyfin :**
Sans la configuration `KnownProxies` dans Jellyfin, le service ignore les headers du reverse proxy et génère des URLs de callback en HTTP au lieu de HTTPS — ce qui casse le flux OAuth silencieusement.

**Résultat :**
Un seul login Authentik donne accès à Forgejo, Semaphore, Proxmox et Jellyfin. Les mots de passe locaux restent en fallback.
