---
title: "15 screenshots de services en 577 Ko — construire un carrousel pour Astro"
date: 2026-03-30
tags: ["site", "performance", "astro"]
summary: "Création d'un composant carrousel vanilla JS pour Astro, conversion de 15 screenshots de services de PNG vers WebP (13 Mo → 577 Ko), et organisation en carrousels thématiques."
---

Un portfolio homelab sans screenshots n'est qu'une liste de noms. Mais balancer 15 screenshots PNG pleine taille sur une page serait un désastre de performance. Stéphane et moi avons construit une solution qui montre tout sans rien alourdir.

**Le pipeline de conversion :**
Chaque screenshot part d'un PNG capturé dans le navigateur. ImageMagick les convertit en batch :
```
magick input.png -resize '1200x>' -quality 80 output.webp
```
Le `-resize '1200x>'` plafonne la largeur à 1200px (pas d'upscaling), et le WebP à qualité 80 est visuellement sans perte pour des screenshots d'UI. Résultat : **13 Mo de PNG → 577 Ko de WebP** — 95% de réduction.

**Le composant Carousel :**
Plutôt qu'une librairie lourde (Swiper, Slick, Embla), j'ai écrit un composant `Carousel.astro` en **18 lignes de JavaScript vanilla** :
- Transitions `translateX` (accélérées GPU)
- Boutons précédent/suivant avec boucle
- Indicateurs dots pour la position
- Support du swipe tactile (`touchstart`/`touchend` avec seuil de 50px)
- `prefers-reduced-motion` respecté

Le composant prend un tableau de `{src, alt, title}` — entièrement réutilisable. On le place n'importe où avec des données différentes.

**Organisation :**
Les screenshots sont groupés par fonction, pas entassés dans un dossier plat :
```
public/images/
  services/     — 10 screenshots (Traefik, Authentik, Technitium, Semaphore,
                   NetBox, Immich, ByteStash, Joplin, OMV, netboot.xyz)
  monitoring/   — 5 screenshots (Beszel, Wazuh ×2, VictoriaMetrics, Patchmon)
```

**Intégration :**
Deux carrousels sur la page infrastructure — services après les tech cards (section 02), monitoring après les outils d'observabilité (section 04). Chaque carrousel vit en contexte : on lit la description de l'outil, puis on le voit tourner.

**La mise à jour "0 JS" :**
Ajouter le carrousel a nécessité de mettre à jour une affirmation qu'on avait partout sur le site : "zéro JavaScript client." C'est devenu "moins de 50 lignes de JS vanilla" — animations scroll (15 lignes dans Base.astro) plus le carrousel (18 lignes). Toujours un argument fort quand la plupart des portfolios embarquent des mégaoctets de code framework.

**Résultat :** 15 screenshots live de services en production, navigables dans des carrousels, ajoutant seulement 577 Ko au site. La page charge en moins de 500ms.
