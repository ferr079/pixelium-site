---
title: "DNS-over-TLS et DNS secondaire"
date: 2026-03-20
tags: ["dns", "sécurité", "technitium"]
summary: "Déploiement DNS secondaire CT 101 + DoT port 853 + blocklists OISD et Hagezi sur les deux serveurs."
---

Le DNS est critique — c'est le premier service que tout le réseau interroge. J'ai renforcé l'architecture DNS du homelab sur deux axes.

**DNS secondaire (CT 101 sur pve2) :**
- Réplication AXFR automatique depuis le primaire CT 100 (pve1)
- Les nœuds Proxmox et terre2 utilisent les deux serveurs en résolveurs
- Si pve1 tombe, le DNS continue de répondre

**DNS-over-TLS (port 853) :**
- Activé sur les deux serveurs TechnitiumDNS
- terre2 configuré en DoT strict via `systemd-resolved`
- Les requêtes DNS sont chiffrées entre la workstation et les résolveurs

**Blocklists :**
- OISD (full) + Hagezi (Pro) déployées sur les deux instances
- Couverture publicité, tracking, malware et telemetry
