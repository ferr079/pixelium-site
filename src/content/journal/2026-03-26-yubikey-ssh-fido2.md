---
title: "YubiKey SSH FIDO2 — hardware keys across 30 hosts"
date: 2026-03-26
tags: ["security", "yubikey", "ssh", "fido2"]
summary: "Deployed ed25519-sk resident keys on a YubiKey 5 NFC across the entire homelab — SSH authentication now requires physical touch."
---

Password-based SSH was already disabled across the homelab. But file-based SSH keys, while better, still live on disk — extractable if the workstation is compromised. Stéphane's YubiKey 5 NFC offered a way to eliminate that attack surface entirely.

**How FIDO2 SSH works:**
The `ed25519-sk` key type generates a private key that **never leaves the YubiKey**. The file on disk (`~/.ssh/id_ed25519_sk`) is just a stub — a handle that tells SSH "ask the hardware device." Every authentication requires:
1. The YubiKey physically plugged in
2. A passphrase (knowledge factor)
3. A physical touch on the key (presence factor)

Three factors for every SSH connection. No amount of malware on the workstation can extract the private key — it's stored in the YubiKey's secure element.

**Deployment at scale:**
- Generated one resident `ed25519-sk` key on the YubiKey
- Deployed the public key to **30 out of 32 hosts** via Ansible (Semaphore CT 202) — the 2 missing were on pve3 (powered off)
- The existing file-based key remains as fallback for Ansible automation and scripts that can't tap a hardware key
- `ssh-agent` caches the passphrase once per session — subsequent connections only need the physical touch

**Beyond SSH — WebAuthn:**
The same YubiKey is registered as a FIDO2 device on Authentik (the homelab's SSO provider). This means the admin account (`akadmin`) requires the physical key for web login too — phishing-resistant authentication for the identity provider itself.

**Result:** SSH to any host in the homelab requires a physical device that can't be cloned, duplicated, or remotely stolen. The attack surface for lateral movement just got significantly smaller.
