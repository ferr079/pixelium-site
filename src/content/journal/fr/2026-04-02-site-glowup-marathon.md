---
title: "Marathon glowup du site — tapes, stats dynamiques, easter eggs"
date: 2026-04-02
tags: ["site", "vhs", "cloudflare", "astro", "design"]
summary: "Une session qui a transformé le portfolio : enregistrements terminal VHS avec thème custom, rotation aléatoire hero, 14 stats KV dynamiques, 3 easter eggs, audit contenu corrigeant 40+ problèmes, et audit sécurité grade A."
---

Session marathon où chaque couche du site a été travaillée — de l'automatisation infra au polish visuel en passant par les easter eggs cachés.

**Enregistrements terminal VHS (tapes) :**
Installation de [VHS](https://github.com/charmbracelet/vhs) (Charm) pour enregistrer des sessions terminal en WebM. 5 tapes créées avec un thème custom "pixelium" correspondant exactement aux couleurs du site (`#0f172a` fond, `#38bdf8` accent, `#22c55e` vert). Le prompt affiche `root@openfang:~#` avec le même style vert/bleu que l'ancien composant HeroTerminal. Chaque tape fait ~200 Ko sur R2 CDN.

**Rotation aléatoire hero :**
Le terminal hero de la homepage affiche maintenant un tape aléatoire à chaque chargement — cert-check, http-check, pbs-backup, pve-status, ou loki-query. Un recruteur qui refresh voit une démo différente à chaque fois. La barre de titre se met à jour avec la commande. C'est un easter egg pour les observateurs.

**Stats dynamiques (DynNum) :**
Création d'un composant `DynNum` qui fetch les chiffres live depuis Cloudflare KV. `kv-push.sh` sur CT 192 pousse maintenant 14 métriques toutes les heures : nombre de services, conteneurs LXC, services HTTPS, hôtes/playbooks Ansible, agents Beszel, commits Forgejo (30j + total), entrées journal, uptime, et plus. La section "track record" de la page about est 100% dynamique — zéro chiffre hardcodé.

**Audit contenu :**
Revue approfondie des 22 pages — ~40 accents français manquants dans `fr/infrastructure.astro`, 15 occurrences de "Stephane" sans accent, chiffres périmés (12→13 playbooks, 25+→22+ HTTPS), améliorations prose ("thirtiplicate" → "thirty-fold"). Tout corrigé EN+FR.

**Nouveau contenu :**
- Projet PBS backup ajouté sur la page projets (orchestration 9 étapes, testé live en 14 min)
- Section "Agents en production" sur la page IA — 4 cartes agents (OpenFang, veille-rss, PentAGI, IronClaw)
- Monitoring certificats ajouté dans la section PKI de la page sécurité
- Guardian mis à jour partout : 5 crons, 7 wrappers, v0.9.0

**Easter eggs — 3 niveaux :**
1. **Footer ASCII** — PIXELIUM en block art à 12% d'opacity, visible en scrollant tout en bas
2. **Console (F12)** — banner ASCII coloré + message recruteur dans les DevTools
3. **View Source (Ctrl+U)** — message de Claude dans un cadre ASCII en tête de chaque page

**Sécurité :**
- Suppression de `<meta name="generator">` pour cacher Astro de Wappalyzer
- Ajout `media-src` au CSP pour la lecture vidéo R2
- Audit complet des headers de sécurité : HSTS preload, CSP strict (default-src 'none'), X-Frame-Options DENY, toutes les APIs testées pour l'injection — grade A

**Scan autonome PentAGI :**
Lancement de PentAGI (CT 198) contre pixelium.win — premier pentest autonome de notre propre site public. Tournant sur qwen3.5:9b via Ollama, il a eu du mal avec le tool-calling (dizaines de retries) mais a complété 12 sous-tâches. **Résultat : 8/10, zéro vulnérabilité critique ou haute.** Les findings correspondent exactement à notre audit manuel — CORS wildcard et CSP unsafe-inline comme seuls axes d'amélioration.

**Design :**
- SectionHeadings supprimés sur la page status — tient en 1080p
- Diagramme SVG architecture supprimé — sera remplacé par screenshot Homelable
- Largeur tagline alignée avec le hero tape (40rem)
- Screenshot Homepage déplacé dans le carousel monitoring
- Page 404 custom avec logo pixelium + glow pulse + ASCII "404"
- Font smoothing cross-browser pour rendu cohérent Chromium/Gecko

Le site est passé de "bon portfolio" à "le genre de site où tu découvres quelque chose de nouveau à chaque visite."
