---
title: "Live status dashboard — 33 services in real-time"
date: 2026-04-01
tags: ["status", "monitoring", "dashboard", "cloudflare"]
summary: "New /status page showing all 33 homelab services with UP/DOWN indicators, Proxmox node CPU/RAM bars, and a LiveStats widget on the homepage — all fed by Cloudflare KV."
---

We built a **live infrastructure dashboard** at `/status` and animated stats on the homepage — a marathon night session from R2 setup to a fully working status page.

**Homepage — LiveStats widget:**
- 8 bricks below the hero: services UP, uptime %, commits, PVE nodes, HTB flags, Root-Me score, Ansible playbooks, total services
- Client-side `fetch('/api/stats')` with animated counters (1500ms ease-out cubic)
- Green pulsing dot when data is fresh, gray when stale
- Relative timestamp: "just now" / "3 min ago"
- Graceful fallback: dashes + "awaiting first sync" when KV is empty

**Status page (`/status`):**
- Summary bar: UP/total count, uptime %, active PVE nodes, last check timestamp
- 33 services grouped by category (Infrastructure, Applications, Monitoring, Storage)
- Each service card: green/red dot + name + latency in ms
- 3 Proxmox node cards with CPU and RAM progress bars (cyan → yellow → red based on load)
- pve3 shown as "offline" (on-demand node)
- Skeleton loading animation while fetching

**Design decisions:**
- Pure vanilla JS (~50 lines), zero frameworks — consistent with the site's zero-dependency philosophy
- DOM built with `document.createElement` + `textContent` (no `innerHTML`) for XSS safety even with trusted KV data
- `prefers-reduced-motion` respected: no animations, instant display
- Responsive: 4-column grid on desktop, single column on mobile

The 11th page of the site, designed and built together in one session. Next step: connect OpenFang to push real monitoring data into the KV every hour.
