---
title: "HTB Facts — Rooted in one session"
date: 2026-03-28
tags: ["cybersecurity", "htb", "pentest"]
summary: "CamaleonCMS 2.9.0 → CVE privesc → S3 bucket loot → SSH key crack → facter custom fact → root. Full chain, zero hints."
---

Box **Facts** (Easy, Linux) on Hack The Box — rooted from scratch in a single session with Stéphane.

**Attack chain:**
- Recon: nmap → nginx + CamaleonCMS 2.9.0 on port 80, MinIO S3 on port 54321
- Account creation on `/admin/register`, then **CVE-2025-2304** (CVSS 9.4) — mass assignment privilege escalation to admin, leaking S3 credentials from the config panel
- S3 bucket `internal` contained a full user home directory — including an encrypted SSH private key
- **John the Ripper** cracked the bcrypt passphrase in 59 seconds: `dragonballz`
- `ssh-add` revealed the username hidden in the key comment: `trivia@facts.htb`
- SSH in → user flag in `/home/william/user.txt`
- `sudo -l` → `(ALL) NOPASSWD: /usr/bin/facter` — a Ruby-based system profiling tool
- Created a malicious custom fact with `system("/bin/bash")`, loaded via `--custom-dir` → **root shell**

**Key learning:** `ssh-add` displays the key comment when decrypting — the username was embedded in the key all along. We spent time bruteforcing usernames when the answer was one command away.
