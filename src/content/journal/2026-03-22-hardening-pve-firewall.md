---
title: "Hardening Proxmox — Firewall natif datacenter"
date: 2026-03-22
tags: ["sécurité", "proxmox", "firewall"]
summary: "Firewall Proxmox activé au niveau datacenter et host — IP Sets, Security Groups, politique DROP par défaut."
---

Les trois nœuds Proxmox étaient exposés sur le LAN sans filtrage réseau. J'ai implémenté le firewall natif Proxmox à deux niveaux.

**Niveau datacenter :**
- Politique par défaut : **DROP** en entrée
- IP Sets créés : `management` (terre2, Semaphore), `dns-servers` (CT 100, 101), `web-services` (CT 110)
- Security Groups : SSH+WebUI limités aux IPs de management uniquement

**Niveau host (pve1, pve2, pve3) :**
- Firewall activé sur chaque nœud individuellement
- Règles héritées du datacenter + règles spécifiques par nœud
- Ports Proxmox API (8006), SSH (22), et cluster (corosync) autorisés uniquement depuis les sources légitimes

**Vérification :**
- Connectivité inter-services testée après activation
- Accès WebUI confirmé depuis terre2 uniquement
- Les CTs continuent de communiquer normalement entre eux
