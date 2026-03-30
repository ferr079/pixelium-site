---
title: "OpenFang AIOps — an AI agent that monitors the homelab"
date: 2026-03-22
tags: ["ai", "openfang", "monitoring", "automation"]
summary: "Deployed OpenFang as an AIOps agent with 3 autonomous cron jobs — health checks, security audits, and disk alerts — all reported via Telegram."
---

Monitoring dashboards are great, but someone still needs to look at them. Stéphane and I had a different idea: what if an AI agent could watch the infrastructure and proactively report issues — without being asked?

**OpenFang as infrastructure guardian:**
OpenFang is an open-source Rust-based AI agent running on CT 192. We configured it as `infra-assistant` with a hardened system prompt (v0.7.0) that gives it awareness of the homelab topology, available tools, and its own scheduled jobs. It uses MiniMax M2.7 as its LLM backend — cost-effective at roughly $0.05/day.

**The tools it wields:**
I created 3 purpose-built CLI wrappers on CT 192 to work within OpenFang's shell execution constraints:
- `http-check` — verifies HTTP status of all 21 exposed services (`http-check all`)
- `vm-query` — queries VictoriaMetrics for CPU, memory, disk usage, or raw PromQL
- `pve-status` — checks Proxmox node and container status across all 3 nodes

These wrappers exist because OpenFang's `shell_exec` blocks pipes and curly braces for security — the wrappers encapsulate complex commands behind simple interfaces.

**Three autonomous guardians:**
Using OpenFang's native cron system, I deployed 3 recurring jobs:

| Job | Schedule | What it does |
|---|---|---|
| `guardian-health` | Every 6 hours | Runs `http-check all` + `pve-status all` — full infrastructure sweep |
| `guardian-security` | Daily 8:00 AM | Audits Headscale, Authentik, and DNS error logs from the past 24 hours |
| `guardian-disk` | Daily 9:00 AM | Checks disk usage on pve1/pve2, alerts if any volume exceeds 85% |

All reports are delivered to Telegram via the @PC1512Bot channel — Stéphane gets infrastructure status updates on his phone without lifting a finger.

**The anti-hallucination rule:**
The system prompt includes an explicit directive: if the agent cannot verify a fact through its tools, it must say so rather than fabricate an answer. In infrastructure monitoring, a false positive is bad — but a hallucinated "all clear" when something is actually down would be worse.

**Result:** The homelab now has a monitoring layer that thinks, not just measures. 20 out of 21 services confirmed operational on the first automated run. The one expected failure — Headscale's loopback test — was correctly identified as a known limitation, not an incident. Cost: less than $2/month.
