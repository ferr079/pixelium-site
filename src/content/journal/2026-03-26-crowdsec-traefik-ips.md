---
title: "CrowdSec + Traefik — community-driven IPS on a homelab"
date: 2026-03-26
tags: ["security", "crowdsec", "traefik", "ips"]
summary: "Deployed CrowdSec as an intrusion prevention system alongside Traefik, leveraging community threat intelligence to protect 30+ services."
---

Most homelabs stop at a reverse proxy with HTTPS. Stéphane wanted to go further — not just encrypt traffic, but actively detect and block malicious patterns. CrowdSec was the answer.

**The architecture decision:**
CrowdSec runs as an add-on directly on CT 110 (the Traefik container), not as a separate CT. This keeps the detection engine co-located with the logs it analyzes — no network overhead, no log shipping latency. The trade-off is coupling two services on one container, but for a homelab the simplicity wins.

**Key implementation details:**
- LAPI (Local API) listens on port **8081** — port 8080 was already taken by the Traefik dashboard. A small conflict that would have caused a silent failure without checking.
- The **Traefik collection** installed 46 detection scenarios out of the box: CVE exploits, SQL injection, XSS, brute-force, path traversal, and more.
- Acquisition configured via `/etc/crowdsec/acquis.d/traefik.yaml` — CrowdSec parses Traefik's JSON access logs in real time.
- The **iptables bouncer** creates a `CROWDSEC_CHAIN` in the INPUT chain — blocked IPs are dropped at the kernel level before they even reach Traefik.

**The community layer:**
CrowdSec's Central API (CAPI) connection is what makes this more than a local IDS. The homelab shares its detection signals and pulls community blocklists — crowd-sourced threat intelligence from thousands of other CrowdSec instances worldwide. An attacker blocked on someone else's infrastructure gets preemptively blocked on ours.

**LAN safety net:**
RFC 1918 addresses are whitelisted by default — internal traffic between containers never triggers a ban. Essential when your monitoring agents generate thousands of internal requests daily.

**Result:** 46 active scenarios, community blocklists, kernel-level IP blocking — all running on the same container as Traefik with negligible resource overhead. The homelab now has an IPS that gets smarter from the global community.
