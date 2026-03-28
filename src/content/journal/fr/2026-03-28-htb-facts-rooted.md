---
title: "HTB Facts — Rooted en une session"
date: 2026-03-28
tags: ["cybersécurité", "htb", "pentest"]
summary: "CamaleonCMS 2.9.0 → CVE privesc → loot bucket S3 → crack clé SSH → facter custom fact → root. Chaîne complète, zéro indice."
---

Box **Facts** (Easy, Linux) sur Hack The Box — rootée de zéro en une seule session avec Stéphane.

**Chaîne d'attaque :**
- Recon : nmap → nginx + CamaleonCMS 2.9.0 sur le port 80, MinIO S3 sur le port 54321
- Création de compte sur `/admin/register`, puis **CVE-2025-2304** (CVSS 9.4) — escalade de privilèges par mass assignment vers admin, fuite des credentials S3 depuis le panel de config
- Le bucket S3 `internal` contenait un répertoire home complet — incluant une clé SSH privée chiffrée
- **John the Ripper** a cracké la passphrase bcrypt en 59 secondes : `dragonballz`
- `ssh-add` a révélé le username caché dans le commentaire de la clé : `trivia@facts.htb`
- SSH → user flag dans `/home/william/user.txt`
- `sudo -l` → `(ALL) NOPASSWD: /usr/bin/facter` — un outil Ruby de profilage système
- Création d'un custom fact malicieux avec `system("/bin/bash")`, chargé via `--custom-dir` → **shell root**

**Leçon clé :** `ssh-add` affiche le commentaire de la clé au déchiffrement — le username était embarqué dans la clé depuis le début. On a perdu du temps à bruteforcer des usernames alors que la réponse était à une commande.
