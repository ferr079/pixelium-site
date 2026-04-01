---
title: "Live status dashboard — 33 services monitored, real data"
date: 2026-04-01
tags: ["status", "monitoring", "dashboard", "cloudflare", "openfang", "systemd"]
summary: "Built a live /status page, a homepage LiveStats widget, and a monitoring pipeline — kv-push.sh on CT 192 pings 33 services hourly and pushes real data to Cloudflare KV. Zero ports exposed."
---

We built a **live infrastructure dashboard** at `/status`, animated stats on the homepage, and closed the loop with a monitoring pipeline pushing real data — a marathon night session.

**The pipeline (`kv-push.sh`):**
- Runs on CT 192 (OpenFang) via systemd timer, every hour
- Pings 33 services: HTTP(S) health checks + TCP port checks for non-HTTP services (Samba, SSH)
- Queries Proxmox API on pve1 and pve2 for CPU, RAM, uptime
- Pushes two JSON payloads to Cloudflare KV (STATUS_KV + STATS_KV) via Global API Key
- Counts Forgejo commits across all repos (last 30 days)
- Full path: `CT 192 → bash → curl PUT → Cloudflare KV → Workers API → pixelium.win`. Zero ports exposed.

**Health check fixes we debugged together:**
- step-ca: needed `/health` endpoint, not root `/`
- Headscale, Forgejo Runner, OpenFang: listen on localhost only → switched to TCP:22 checks
- share2 (Samba): port 445 → TCP check. APT Cache: port 3142
- Accepted 4xx/5xx as UP (service is responding, just not 200)

**Homepage — LiveStats widget:**
- 8 bricks: services UP, uptime %, commits, PVE nodes, HTB flags, Root-Me score, Ansible playbooks, total services
- Client-side `fetch('/api/stats')` with animated counters (1500ms ease-out cubic)
- Green pulsing dot when data is fresh, graceful fallback when KV is empty

**Status page (`/status`):**
- Summary bar: UP/total, uptime %, active PVE nodes, last check timestamp
- 33 services grouped by category (Infrastructure, Applications, Monitoring, Storage)
- Each service card: green/red dot + name + latency in ms
- 3 Proxmox node cards with CPU and RAM progress bars
- Pure vanilla JS (~50 lines), zero frameworks, XSS-safe DOM construction

**Result:** 32/33 services UP (97%). Only PBS is down — pve3 is an on-demand node, expected. The 11th page of the site, designed and built together in one session.
