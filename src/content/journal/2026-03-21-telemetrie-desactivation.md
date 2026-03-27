---
title: "Désactivation de la télémétrie — Loki et Tailscale"
date: 2026-03-21
tags: ["sécurité", "vie-privée", "hardening"]
summary: "Blocage des phone-home de Grafana et Tailscale — le homelab ne fuit pas de données vers l'extérieur."
---

Un self-hosted qui phone-home, c'est un self-hosted qui ne l'est qu'à moitié. Audit et correction de deux services qui envoyaient de la télémétrie.

**Loki (CT 240) :**
- Le binaire Loki contactait `stats.grafana.org` à chaque démarrage
- Résolution DNS bloquée via TechnitiumDNS (enregistrement CNAME vers `0.0.0.0`)
- Configuration ajustée : `analytics.reporting_enabled: false`

**Tailscale/Headscale (CT 106) :**
- Le client Tailscale envoyait des logs à `log.tailscale.com`
- Désactivé via `--no-logs-no-support` dans la configuration du service
- Vérifié : plus aucune connexion sortante vers les serveurs Tailscale

Philosophie : chaque service tourne en local, les données restent en local.
