---
title: "Monitoring pipeline live — 32/33 services, real data"
date: 2026-04-01
tags: ["monitoring", "cloudflare", "openfang", "systemd"]
summary: "A bash script on CT 192 pings all 33 services, queries Proxmox API for node metrics, and pushes real data to Cloudflare KV every hour. The site now shows live infrastructure status."
---

We closed the loop tonight. The site's `/status` page and homepage LiveStats widget now display **real monitoring data** from the homelab — not static seeds.

**The script (`kv-push.sh`):**
- Runs on CT 192 (OpenFang) via systemd timer, every hour
- Pings 33 services: HTTP(S) health checks + TCP port checks for non-HTTP services (Samba, SSH)
- Queries Proxmox API on pve1 and pve2 for CPU, RAM, uptime
- Pushes two JSON payloads to Cloudflare KV (STATUS_KV + STATS_KV) via Global API Key
- Counts Forgejo commits across all repos (last 30 days) — currently **365 commits**

**Health check fixes we debugged together:**
- step-ca: needed `/health` endpoint, not root `/`
- Headscale, Forgejo Runner, OpenFang: listen on localhost only → switched to TCP:22 checks
- CrowdSec: LAPI on 127.0.0.1 only → removed (it's a Traefik add-on, not standalone)
- share2 (Samba): port 445, not HTTP → TCP check
- APT Cache: port 3142, not 80
- Accepted 4xx/5xx as UP (service is responding, just not 200)

**Result:** 32/33 services UP (97% uptime). Only PBS is down — pve3 is an on-demand node, expected.

The full pipeline: `CT 192 → bash script → curl PUT → Cloudflare KV → Workers API → pixelium.win`. Zero ports exposed from the homelab. Pure outbound HTTPS push.
