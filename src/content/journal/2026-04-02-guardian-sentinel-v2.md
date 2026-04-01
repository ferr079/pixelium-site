---
title: "Guardian Sentinel v2 — cert monitoring, PBS backup automation, D1 history"
date: 2026-04-02
tags: ["openfang", "backup", "pbs", "tls", "cloudflare", "d1", "monitoring"]
summary: "Four deployments in one session: dynamic site stats, 30-day uptime history via Cloudflare D1, automated TLS certificate monitoring, and fully autonomous PBS backup with WOL — tested live, 33 CTs backed up in 14 minutes."
---

A marathon session that transformed Guardian from a monitoring-only agent into an **autonomous infrastructure operator**.

**Dynamic stats (DynNum component):**
We replaced hardcoded numbers across 12 pages with a new `DynNum` component that fetches live data from `/api/stats`. The site now self-corrects: when we commission a new service, the numbers update automatically. First live data revealed the site was *overestimating* — "25+ HTTPS services" was actually 22, and "30+ LXC" was actually 36.

**Uptime history (Cloudflare D1):**
The `/status` page now shows a 30-day timeline — 30 colored bars, one per day, with hover details. Under the hood: `kv-push.sh` calls a POST endpoint that writes hourly snapshots to D1 (with 55-minute dedup). A GET endpoint aggregates by day. The D1 database costs nothing at this scale (~720 rows/month).

**Certificate monitoring (`cert-check` + `guardian-certs`):**
A new wrapper checks TLS certificate expiration for all 22 HTTPS services via `openssl s_client`. Runs daily at 10h — alerts via Telegram only if a cert expires within 14 days. First scan: all 22 certs healthy, 75-81 days remaining. This closes the silent failure gap: if step-ca ACME renewal fails after a reboot (documented race condition), we'll know before HTTPS breaks.

**PBS backup automation (`pbs-backup` + `guardian-backup`):**
The crown jewel. A 9-step orchestration script:
1. Wake pve3 via Wake-on-LAN
2. Wait for PBS API (CT 150) to respond
3. Enable `pbs-pve3` storage on pve1/pve2 via Proxmox API
4. Launch `vzdump --all` on both nodes (parallel)
5. Wait for completion (polling every 30s)
6. Run PBS prune (`keep-weekly=5`, `keep-last=1`)
7. Run garbage collection
8. Disable storage (zero polling when pve3 is off)
9. Shutdown pve3

**Live test results:** pve1 (10 CTs, 29 GB) backed up in 4 minutes, pve2 (23 CTs, 173 GB) in 13 minutes. Full cycle including prune, GC, and shutdown: **14 minutes**. PBS deduplication compressed 202 GB of live data into 100 GB. Retention policy: 5 weekly snapshots, ~140 GB estimated on a 932 GB disk (15%).

The script runs every Monday at 00:08. pve3 wakes, backs up everything, and goes back to sleep. No human intervention. The first thing I check Monday morning is the Telegram report.

**Guardian is now 5 cron jobs:** health (6h), security (8h daily), disk (9h daily), certs (10h daily), backup (Monday 00:08). Cost: ~$1.50/month. The homelab operates itself.
