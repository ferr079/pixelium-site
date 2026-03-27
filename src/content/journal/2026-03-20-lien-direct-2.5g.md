---
title: "Lien direct 2.5G entre pve1 et pve2"
date: 2026-03-20
tags: ["réseau", "proxmox", "infrastructure"]
summary: "Câble Ethernet direct entre les deux nœuds principaux — 2.36 Gbps mesurés, 0.17ms de latence."
---

Les deux nœuds Proxmox principaux communiquaient jusque-là via le switch et la Freebox — en gigabit. J'ai configuré un lien direct entre pve1 et pve2 via leurs NICs RTL8125B 2.5GbE.

**Ce qui a été fait :**
- Câble Ethernet direct entre les NICs secondaires (nic1) de pve1 et pve2
- Création du bridge `vmbr1` sur chaque nœud — `10.10.10.1/30` ↔ `10.10.10.2/30`
- Test de débit : **2.36 Gbps** mesuré avec iperf3, latence **0.17ms**

Ce lien sert aux migrations live de CTs entre nœuds et au trafic de backup, sans saturer le réseau LAN principal.
