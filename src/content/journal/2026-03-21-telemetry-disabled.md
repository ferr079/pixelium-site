---
title: "Telemetry disabled — Loki and Tailscale"
date: 2026-03-21
tags: ["security", "privacy", "hardening"]
summary: "Blocked Grafana and Tailscale phone-home — the homelab doesn't leak data to the outside."
---

A self-hosted setup that phones home is only half self-hosted. Audit and fix of two services sending telemetry.

**Loki (CT 240):**
- The Loki binary was contacting `stats.grafana.org` on every startup
- DNS resolution blocked via TechnitiumDNS (CNAME record to `0.0.0.0`)
- Configuration adjusted: `analytics.reporting_enabled: false`

**Tailscale/Headscale (CT 106):**
- The Tailscale client was sending logs to `log.tailscale.com`
- Disabled via `--no-logs-no-support` in the service configuration
- Verified: no more outbound connections to Tailscale servers

Philosophy: every service runs locally, data stays local.
