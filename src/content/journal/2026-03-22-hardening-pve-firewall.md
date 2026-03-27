---
title: "Proxmox hardening — Native datacenter firewall"
date: 2026-03-22
tags: ["security", "proxmox", "firewall"]
summary: "Proxmox firewall enabled at datacenter and host level — IP Sets, Security Groups, default DROP policy."
---

All three Proxmox nodes were exposed on the LAN without network filtering. I implemented the native Proxmox firewall at two levels.

**Datacenter level:**
- Default policy: **DROP** on input
- IP Sets created: `management` (terre2, Semaphore), `dns-servers` (CT 100, 101), `web-services` (CT 110)
- Security Groups: SSH+WebUI limited to management IPs only

**Host level (pve1, pve2, pve3):**
- Firewall enabled on each node individually
- Rules inherited from datacenter + node-specific rules
- Proxmox API (8006), SSH (22), and cluster (corosync) ports allowed only from legitimate sources

**Verification:**
- Inter-service connectivity tested after activation
- WebUI access confirmed from terre2 only
- CTs continue communicating normally between themselves
