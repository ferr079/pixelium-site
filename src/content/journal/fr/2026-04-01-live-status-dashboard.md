---
title: "Dashboard statut live — 33 services monitorés, données réelles"
date: 2026-04-01
tags: ["status", "monitoring", "dashboard", "cloudflare", "openfang", "systemd"]
summary: "Construction d'une page /status live, d'un widget LiveStats sur la homepage, et d'un pipeline monitoring — kv-push.sh sur CT 192 ping 33 services toutes les heures et pousse les données réelles vers Cloudflare KV. Zéro port exposé."
---

On a construit un **dashboard infrastructure live** sur `/status`, des stats animées sur la homepage, et bouclé la boucle avec un pipeline monitoring qui pousse des données réelles — une session marathon nocturne.

**Le pipeline (`kv-push.sh`) :**
- Tourne sur CT 192 (OpenFang) via timer systemd, toutes les heures
- Ping 33 services : health checks HTTP(S) + checks TCP pour les services non-HTTP (Samba, SSH)
- Interroge l'API Proxmox sur pve1 et pve2 pour CPU, RAM, uptime
- Pousse deux payloads JSON vers Cloudflare KV (STATUS_KV + STATS_KV) via Global API Key
- Compte les commits Forgejo sur tous les repos (30 derniers jours)
- Chemin complet : `CT 192 → bash → curl PUT → Cloudflare KV → Workers API → pixelium.win`. Zéro port exposé.

**Corrections de health check débuguées ensemble :**
- step-ca : endpoint `/health` nécessaire, pas la racine `/`
- Headscale, Forgejo Runner, OpenFang : écoutent en localhost → passés en check TCP:22
- share2 (Samba) : port 445 → check TCP. APT Cache : port 3142
- Acceptation des 4xx/5xx comme UP (le service répond, juste pas en 200)

**Homepage — widget LiveStats :**
- 8 briques : services UP, uptime %, commits, nœuds PVE, flags HTB, score Root-Me, playbooks Ansible, services total
- Fetch client `/api/stats` avec compteurs animés (1500ms ease-out cubic)
- Point vert pulsant quand les données sont fraîches, fallback gracieux quand le KV est vide

**Page statut (`/status`) :**
- Barre résumé : UP/total, uptime %, nœuds PVE actifs, dernière vérification
- 33 services groupés par catégorie (Infrastructure, Applications, Monitoring, Stockage)
- Chaque carte service : point vert/rouge + nom + latence en ms
- 3 cartes nœuds Proxmox avec barres CPU et RAM
- JS vanilla pur (~50 lignes), zéro framework, construction DOM sûre contre XSS

**Résultat :** 32/33 services UP (97%). Seul PBS est down — pve3 est un nœud on-demand, c'est attendu. La 11e page du site, conçue et construite ensemble en une seule session.
