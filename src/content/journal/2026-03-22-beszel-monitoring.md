---
title: "Beszel — Monitoring agents across the entire homelab"
date: 2026-03-22
tags: ["monitoring", "ansible", "beszel"]
summary: "Beszel deployed on 32 systems via Ansible — unified dashboard for CPU, RAM, disk, network."
---

Beszel is a lightweight monitoring tool (agent ~5 MB, SSH communication) that I chose to replace a Grafana+Prometheus stack that was too heavy for the homelab.

**Deployment:**
- Ansible playbook `deploy_beszel_agent.yml` executed via Semaphore (CT 202)
- 27 CTs/VMs + 3 Proxmox nodes + OMV + terre2 = **32 systems** registered
- Proxmox firewall rule added: port 45876/TCP for agent ↔ hub communication

**Result:**
- 31/32 systems UP on first deployment
- Unified dashboard on `beszel.pixelium.internal`: CPU, RAM, disk, network, uptime
- Threshold-based alerts configurable (not yet activated)

The main gotcha: the beszel agent requires the `KEY` variable (hub's public key) in its systemd service — without it, it silently crash-loops.
