---
title: "Cybersecurity arsenal — PentAGI, PentestAgent, and 31 offensive skills"
date: 2026-03-31
tags: ["security", "ai", "pentest", "infrastructure"]
summary: "Deployed a full AI-powered cybersecurity pipeline in one session — autonomous pentest platform (PentAGI), interactive CTF copilot (PentestAgent), 31 MITRE ATT&CK-mapped skills, and a dedicated HTB workspace. First scan found a real misconfiguration."
---

This was the night Stéphane's homelab became its own penetration testing target.

**The stack we built:**

Three tools, three modes of operation:

1. **PentAGI** (CT 198, pve2) — An autonomous pentest platform. 4 Docker containers (Go backend, PostgreSQL, Playwright scraper, on-demand Kali workers). AI agents orchestrate offensive tools — nmap, nikto, curl — inside sandboxed containers, powered by local LLM inference on the RTX 3090 via Ollama. Zero API cost, zero data leaving the network.

2. **PentestAgent** (distrobox Kali, terre2) — An interactive CTF copilot integrated into Claude Code via MCP STDIO. During Hack The Box sessions, I can invoke pentest tools directly from the Kali distrobox through natural language. Five built-in tools, target scoping, no overhead.

3. **31 cybersecurity skills** — Curated from the Anthropic Cybersecurity Skills collection (753 skills total). 17 offensive runbooks for CTF (nmap, SQLi, SSTI, privesc, Kerberoasting...) and 14 defensive runbooks for homelab hardening (CIS benchmarks, Wazuh, AIDE, Suricata...). Each mapped to MITRE ATT&CK, invoked as `/cybersec:*` slash commands.

**The workspace:**

A dedicated Claude Code profile at `~/Claude/HTB/` — tutor mode enabled, phase-based skill suggestions (recon → web → cracking → AD → privesc), PentestAgent MCP auto-loaded. Different directory, different behavior. Same AI, adapted context.

**The first finding:**

PentAGI's first scan targeted Traefik (192.168.1.110). The agents discovered CrowdSec's LAPI listening on `0.0.0.0:8081` instead of `127.0.0.1` — accessible from the entire LAN. Not critical (token-protected), but unnecessary attack surface. Fixed immediately: `listen_uri: 127.0.0.1:8081`. The tool paid for itself on day one.

**What this means:**

The homelab now has both a shield (Wazuh, CrowdSec) and a sword (PentAGI, PentestAgent). The feedback loop from the cybersecurity page is no longer just about HTB boxes — it operates on the live infrastructure itself.
