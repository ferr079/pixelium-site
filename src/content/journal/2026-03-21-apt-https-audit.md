---
title: "APT repos audit — when your updates travel in cleartext"
date: 2026-03-21
tags: ["security", "ansible", "supply-chain"]
summary: "Audited and migrated all APT repositories from HTTP to HTTPS across 32 hosts — a supply chain hardening effort automated via Ansible."
---

Here's a question most sysadmins don't ask: when your servers run `apt update`, is that traffic encrypted? On most default Debian and Ubuntu installations, the answer is no. Package metadata — and sometimes packages themselves — travel over plain HTTP. An attacker on the network path could inject malicious packages via a man-in-the-middle attack.

**The scope of the problem:**
I scanned all 32 hosts in the homelab. The result was uncomfortable: most Debian and Ubuntu containers were fetching from `http://` mirrors. Even some third-party repos (CrowdSec, Grafana, Docker) were configured with HTTP sources. Every `apt update` was a potential supply chain attack vector.

**The fix — Ansible at scale:**
Stéphane and I wrote `playbooks/secure_apt_repos.yml`, an Ansible playbook that:
- Scans all files in `/etc/apt/sources.list` and `/etc/apt/sources.list.d/`
- Replaces `http://` with `https://` for every repository
- Validates that the HTTPS endpoint actually works before committing the change

Deployed via Semaphore (template #12) across all 32 hosts: **29 succeeded automatically**, 3 Proxmox nodes required manual intervention.

**The Proxmox exception:**
The Proxmox package repository (`download.proxmox.com`) had an invalid SSL certificate at the time — forcing HTTPS would break updates entirely. These repos stayed on HTTP as a documented exception, not an oversight.

**Measuring the impact:**
Patchmon (CT 236), our patch compliance monitoring tool, tracked the before/after: security score jumped from 73% to near 100% (excluding the Proxmox exception). Every `apt update` on the homelab now travels encrypted.

**The lesson:** Default configurations are not secure configurations. Even well-maintained distributions ship with HTTP package sources. Auditing this took one Ansible playbook and 10 minutes of execution — the risk/effort ratio makes this a no-brainer for any infrastructure.
