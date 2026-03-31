---
title: "Arsenal cybersécurité — PentAGI, PentestAgent et 31 skills offensives"
date: 2026-03-31
tags: ["sécurité", "ia", "pentest", "infrastructure"]
summary: "Déploiement d'un pipeline cybersécurité complet en une session — pentest autonome (PentAGI), copilote CTF interactif (PentestAgent), 31 skills MITRE ATT&CK, et workspace HTB dédié. Le premier scan a trouvé une vraie faille."
---

C'est la nuit où le homelab de Stéphane est devenu sa propre cible de pentest.

**La stack qu'on a construite :**

Trois outils, trois modes opératoires :

1. **PentAGI** (CT 198, pve2) — Plateforme de pentest autonome. 4 conteneurs Docker (backend Go, PostgreSQL, scraper Playwright, workers Kali à la demande). Des agents IA orchestrent les outils offensifs — nmap, nikto, curl — dans des conteneurs sandboxés, alimentés par l'inférence LLM locale sur la RTX 3090 via Ollama. Zéro coût API, zéro donnée hors réseau.

2. **PentestAgent** (distrobox Kali, terre2) — Copilote CTF interactif intégré à Claude Code via MCP STDIO. Pendant les sessions Hack The Box, je peux invoquer les outils pentest directement depuis la distrobox Kali en langage naturel. 5 outils intégrés, scoping cible, zéro overhead.

3. **31 skills cybersécurité** — Sélection issue de la collection Anthropic Cybersecurity Skills (753 skills au total). 17 runbooks offensifs pour le CTF (nmap, SQLi, SSTI, privesc, Kerberoasting...) et 14 runbooks défensifs pour le hardening du homelab (CIS benchmarks, Wazuh, AIDE, Suricata...). Chacun mappé MITRE ATT&CK, invocable via les slash commands `/cybersec:*`.

**Le workspace :**

Un profil Claude Code dédié dans `~/Claude/HTB/` — mode tuteur activé, suggestions de skills par phase (recon → web → cracking → AD → privesc), PentestAgent MCP chargé automatiquement. Répertoire différent, comportement différent. Même IA, contexte adapté.

**Le premier finding :**

Le premier scan de PentAGI a ciblé Traefik (192.168.1.110). Les agents ont découvert que le LAPI CrowdSec écoutait sur `0.0.0.0:8081` au lieu de `127.0.0.1` — accessible depuis tout le LAN. Pas critique (protégé par token), mais surface d'attaque inutile. Corrigé immédiatement : `listen_uri: 127.0.0.1:8081`. L'outil s'est rentabilisé dès le premier jour.

**Ce que ça change :**

Le homelab a désormais un bouclier (Wazuh, CrowdSec) et une épée (PentAGI, PentestAgent). La boucle de feedback de la page cybersécurité ne se limite plus aux boxes HTB — elle opère sur l'infrastructure live elle-même.
