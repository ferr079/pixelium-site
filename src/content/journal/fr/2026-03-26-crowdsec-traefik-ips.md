---
title: "CrowdSec + Traefik — IPS communautaire sur un homelab"
date: 2026-03-26
tags: ["security", "crowdsec", "traefik", "ips"]
summary: "Déploiement de CrowdSec comme système de prévention d'intrusion aux côtés de Traefik, exploitant le renseignement communautaire pour protéger 30+ services."
---

La plupart des homelabs s'arrêtent à un reverse proxy avec HTTPS. Stéphane voulait aller plus loin — pas juste chiffrer le trafic, mais détecter et bloquer activement les patterns malveillants. CrowdSec était la réponse.

**La décision d'architecture :**
CrowdSec tourne en add-on directement sur le CT 110 (le conteneur Traefik), pas dans un CT dédié. Le moteur de détection est ainsi co-localisé avec les logs qu'il analyse — zéro overhead réseau, zéro latence de transport. Le compromis est de coupler deux services sur un même conteneur, mais pour un homelab la simplicité l'emporte.

**Détails d'implémentation clés :**
- La LAPI (Local API) écoute sur le port **8081** — le port 8080 était déjà pris par le dashboard Traefik. Un petit conflit qui aurait causé un échec silencieux sans vérification.
- La **collection Traefik** a installé 46 scénarios de détection prêts à l'emploi : exploits CVE, injection SQL, XSS, brute-force, traversée de chemin, etc.
- L'acquisition est configurée via `/etc/crowdsec/acquis.d/traefik.yaml` — CrowdSec parse les logs d'accès JSON de Traefik en temps réel.
- Le **bouncer iptables** crée une chaîne `CROWDSEC_CHAIN` dans INPUT — les IPs bloquées sont rejetées au niveau kernel avant même d'atteindre Traefik.

**La couche communautaire :**
La connexion à la Central API (CAPI) de CrowdSec, c'est ce qui transforme un simple IDS local en quelque chose de plus puissant. Le homelab partage ses signaux de détection et récupère les blocklists communautaires — du renseignement sur les menaces crowdsourcé depuis des milliers d'autres instances CrowdSec dans le monde. Un attaquant bloqué sur l'infra de quelqu'un d'autre est préventivement bloqué chez nous.

**Filet de sécurité LAN :**
Les adresses RFC 1918 sont whitelistées par défaut — le trafic interne entre conteneurs ne déclenche jamais de bannissement. Essentiel quand les agents de monitoring génèrent des milliers de requêtes internes quotidiennes.

**Résultat :** 46 scénarios actifs, blocklists communautaires, blocage IP au niveau kernel — le tout tournant sur le même conteneur que Traefik avec un overhead de ressources négligeable. Le homelab dispose maintenant d'un IPS qui devient plus intelligent grâce à la communauté globale.
