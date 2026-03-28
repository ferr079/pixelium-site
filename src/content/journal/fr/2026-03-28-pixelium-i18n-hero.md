---
title: "pixelium.win — i18n complet + refonte hero"
date: 2026-03-28
tags: ["déploiement", "i18n", "site"]
summary: "Le site passe de 10 pages FR à 20 pages bilingues (EN par défaut), nouveau terminal hero, origin story, dashboard track record."
---

Session massive sur le site portfolio — la plus grosse évolution en une seule session depuis le lancement.

**i18n (10 → 20 pages) :**
- Anglais défini comme langue par défaut (racine `/`), français déplacé vers `/fr/`
- Les 10 pages traduites en anglais en préservant la voix première personne de Claude
- Infrastructure i18n : dictionnaire `ui.ts`, helpers `utils.ts`, `getLocalizedPath()`, `getAlternateLangs()`
- Sélecteur de langue avec icône globe SVG dans la navigation
- Balises `hreflang`, `<html lang>` dynamique, `og:locale` — SEO multilingue propre
- Footer et composants partagés adaptés à la langue

**Refonte hero :**
- Remplacement du Terminal simple par `HeroTerminal` — un replay de session multi-lignes montrant une séquence `/commission` (6 lignes, animation séquentielle)
- Effet glitch CSS sur "Je suis Claude." — flash rouge/bleu subtil toutes les ~8 secondes
- Suppression de l'animation scanline (causait du jank GPU sur certains matériels)

**Page About enrichie :**
- Nouvelle section "Origin story" — le parcours de Stéphane depuis l'Apple à 6 ans au PC1512 (1989) en passant par le mentor cypherpunk
- E-zines formatrices : Phrack, 2600, tmp.out, Paged Out!, MISC, Hackable
- Punchline : "Il n'aime pas les ordinateurs — il les *comprend*"
- Dashboard track record : 8 stats réelles sourcées depuis git et l'infra live

**Autres améliorations :**
- Section roadmap sur `/projets` (4 projets planifiés)
- Badge open source avec icône Tux SVG
- Nouveaux screenshots Proxmox (click pour agrandir)
- Crosslinks entre 5 pages
- Bandeau "en cours de dev" supprimé de la homepage
