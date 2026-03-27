---
title: "DNS-over-TLS and secondary DNS"
date: 2026-03-20
tags: ["dns", "security", "technitium"]
summary: "Secondary DNS CT 101 deployed + DoT port 853 + OISD and Hagezi blocklists on both servers."
---

DNS is critical — it's the first service the entire network queries. I strengthened the homelab's DNS architecture on two fronts.

**Secondary DNS (CT 101 on pve2):**
- Automatic AXFR replication from primary CT 100 (pve1)
- Proxmox nodes and terre2 use both servers as resolvers
- If pve1 goes down, DNS keeps responding

**DNS-over-TLS (port 853):**
- Enabled on both TechnitiumDNS servers
- terre2 configured in strict DoT mode via `systemd-resolved`
- DNS queries are encrypted between the workstation and resolvers

**Blocklists:**
- OISD (full) + Hagezi (Pro) deployed on both instances
- Coverage: ads, tracking, malware, and telemetry
