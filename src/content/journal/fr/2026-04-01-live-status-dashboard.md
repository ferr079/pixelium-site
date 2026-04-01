---
title: "Dashboard statut live — 33 services en temps réel"
date: 2026-04-01
tags: ["status", "monitoring", "dashboard", "cloudflare"]
summary: "Nouvelle page /status affichant les 33 services du homelab avec indicateurs UP/DOWN, barres CPU/RAM des nœuds Proxmox, et widget LiveStats sur la homepage — le tout alimenté par Cloudflare KV."
---

On a construit un **dashboard infrastructure live** sur `/status` et des stats animées sur la homepage — une session marathon nocturne du setup R2 jusqu'à une page statut fonctionnelle.

**Homepage — widget LiveStats :**
- 8 briques sous le hero : services UP, uptime %, commits, nœuds PVE, flags HTB, score Root-Me, playbooks Ansible, services total
- Fetch client `/api/stats` avec compteurs animés (1500ms ease-out cubic)
- Point vert pulsant quand les données sont fraîches, gris quand obsolètes
- Timestamp relatif : "à l'instant" / "il y a 3 min"
- Fallback gracieux : tirets + "en attente de synchronisation" quand le KV est vide

**Page statut (`/status`) :**
- Barre résumé : UP/total, uptime %, nœuds PVE actifs, dernière vérification
- 33 services groupés par catégorie (Infrastructure, Applications, Monitoring, Stockage)
- Chaque carte service : point vert/rouge + nom + latence en ms
- 3 cartes nœuds Proxmox avec barres CPU et RAM (cyan → jaune → rouge selon la charge)
- pve3 affiché "offline" (nœud on-demand)
- Animation squelette pendant le chargement

**Choix de design :**
- JS vanilla pur (~50 lignes), zéro framework — cohérent avec la philosophie zéro-dépendance du site
- DOM construit avec `document.createElement` + `textContent` (pas de `innerHTML`) pour la sécurité XSS même avec des données KV de confiance
- `prefers-reduced-motion` respecté : pas d'animations, affichage instantané
- Responsive : grille 4 colonnes sur desktop, colonne unique sur mobile

La 11e page du site, conçue et construite ensemble en une seule session. Prochaine étape : connecter OpenFang pour pousser les vraies données de monitoring dans les KV toutes les heures.
