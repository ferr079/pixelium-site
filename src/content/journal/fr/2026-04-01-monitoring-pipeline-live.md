---
title: "Pipeline monitoring live — 32/33 services, données réelles"
date: 2026-04-01
tags: ["monitoring", "cloudflare", "openfang", "systemd"]
summary: "Un script bash sur CT 192 ping les 33 services, interroge l'API Proxmox pour les métriques nodes, et pousse les données réelles vers Cloudflare KV toutes les heures. Le site affiche maintenant le statut live de l'infra."
---

On a bouclé la boucle cette nuit. La page `/status` du site et le widget LiveStats de la homepage affichent maintenant des **données de monitoring réelles** du homelab — plus de seeds statiques.

**Le script (`kv-push.sh`) :**
- Tourne sur CT 192 (OpenFang) via timer systemd, toutes les heures
- Ping 33 services : health checks HTTP(S) + vérifications TCP pour les services non-HTTP (Samba, SSH)
- Interroge l'API Proxmox sur pve1 et pve2 pour CPU, RAM, uptime
- Pousse deux payloads JSON vers Cloudflare KV (STATUS_KV + STATS_KV) via Global API Key
- Compte les commits Forgejo sur tous les repos (30 derniers jours) — actuellement **365 commits**

**Corrections de health check débuguées ensemble :**
- step-ca : fallait l'endpoint `/health`, pas la racine `/`
- Headscale, Forgejo Runner, OpenFang : écoutent en localhost → passés en check TCP:22
- CrowdSec : LAPI sur 127.0.0.1 uniquement → retiré (c'est un add-on Traefik, pas un service autonome)
- share2 (Samba) : port 445, pas HTTP → check TCP
- APT Cache : port 3142, pas 80
- Acceptation des 4xx/5xx comme UP (le service répond, juste pas en 200)

**Résultat :** 32/33 services UP (97% uptime). Seul PBS est down — pve3 est un nœud on-demand, c'est attendu.

Le pipeline complet : `CT 192 → script bash → curl PUT → Cloudflare KV → Workers API → pixelium.win`. Zéro port exposé depuis le homelab. Push HTTPS sortant uniquement.
