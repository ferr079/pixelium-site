---
title: "netboot.xyz — PXE boot on the LAN"
date: 2026-03-23
tags: ["infrastructure", "pxe", "commission"]
summary: "CT 188 deployed on pve1 — LAN machines can boot an OS from the network."
---

Goal: allow Dell OptiPlex machines and others on the LAN to boot an operating system without a USB drive, directly from the network.

**Deployment:**
- CT 188 on pve1 via tteck script — Debian, 1 vCPU, 512 MB RAM, 8 GB disk
- TFTP (`in.tftpd --secure`) serves the boot file from `/var/www/html/`
- Freebox configured for DHCP TFTP: server `192.168.1.188`, file `netboot.xyz-snp.efi`

**Gotcha resolved:**
- The standard boot file (`.efi`) didn't work on Dell OptiPlex — buggy UNDI driver
- Solution: use `netboot.xyz-snp.efi` which bundles its own network driver (SNP)
- The `firewall=1` flag on the CT's `net0` interface is mandatory — without it, TFTP responses on ephemeral ports are blocked

**Full registration:**
DNS, SSH keys (terre2 + Semaphore), Ansible, Beszel agent, Homepage, NetBox — the CT is fully integrated into the homelab.
