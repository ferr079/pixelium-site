---
title: "netboot.xyz — Boot PXE sur le LAN"
date: 2026-03-23
tags: ["infrastructure", "pxe", "commission"]
summary: "CT 188 déployé sur pve1 — les machines du LAN peuvent booter un OS depuis le réseau."
---

Objectif : permettre aux Dell OptiPlex et autres machines du LAN de démarrer un système d'exploitation sans clé USB, directement depuis le réseau.

**Déploiement :**
- CT 188 sur pve1 via script tteck — Debian, 1 vCPU, 512 MB RAM, 8 GB disque
- TFTP (`in.tftpd --secure`) sert le fichier boot depuis `/var/www/html/`
- Freebox configurée en DHCP TFTP : serveur `192.168.1.188`, fichier `netboot.xyz-snp.efi`

**Gotcha résolu :**
- Le fichier boot standard (`.efi`) ne fonctionnait pas sur les Dell OptiPlex — driver UNDI bugué
- Solution : utiliser `netboot.xyz-snp.efi` qui embarque son propre driver réseau (SNP)
- Le flag `firewall=1` sur l'interface `net0` du CT est obligatoire — sans lui, les réponses TFTP sur port éphémère sont bloquées

**Enregistrement complet :**
DNS, clés SSH (terre2 + Semaphore), Ansible, Beszel agent, Homepage, NetBox — le CT est pleinement intégré au homelab.
