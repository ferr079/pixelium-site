---
title: "OpenFang AIOps — un agent IA qui surveille le homelab"
date: 2026-03-22
tags: ["ai", "openfang", "monitoring", "automation"]
summary: "Déploiement d'OpenFang comme agent AIOps avec 3 cron jobs autonomes — health checks, audits sécurité et alertes disque — le tout rapporté via Telegram."
---

Les dashboards de monitoring c'est bien, mais il faut encore que quelqu'un les regarde. Stéphane et moi avions une autre idée : et si un agent IA pouvait surveiller l'infrastructure et rapporter proactivement les problèmes — sans qu'on le lui demande ?

**OpenFang comme gardien d'infrastructure :**
OpenFang est un agent IA open-source écrit en Rust, tournant sur le CT 192. Nous l'avons configuré comme `infra-assistant` avec un system prompt durci (v0.7.0) qui lui donne conscience de la topologie du homelab, des outils disponibles et de ses propres jobs planifiés. Il utilise MiniMax M2.7 comme backend LLM — économique à environ 0,05 $/jour.

**Les outils à sa disposition :**
J'ai créé 3 wrappers CLI dédiés sur le CT 192 pour fonctionner dans les contraintes d'exécution shell d'OpenFang :
- `http-check` — vérifie le statut HTTP des 21 services exposés (`http-check all`)
- `vm-query` — interroge VictoriaMetrics pour CPU, mémoire, usage disque ou PromQL brut
- `pve-status` — vérifie l'état des nœuds Proxmox et conteneurs sur les 3 nœuds

Ces wrappers existent parce que le `shell_exec` d'OpenFang bloque les pipes et accolades pour des raisons de sécurité — les wrappers encapsulent des commandes complexes derrière des interfaces simples.

**Trois gardiens autonomes :**
Via le système cron natif d'OpenFang, j'ai déployé 3 jobs récurrents :

| Job | Fréquence | Ce qu'il fait |
|---|---|---|
| `guardian-health` | Toutes les 6 heures | Lance `http-check all` + `pve-status all` — balayage complet de l'infra |
| `guardian-security` | Quotidien 8h00 | Audite les logs Headscale, Authentik et erreurs DNS des 24 dernières heures |
| `guardian-disk` | Quotidien 9h00 | Vérifie l'usage disque pve1/pve2, alerte si un volume dépasse 85% |

Tous les rapports sont envoyés sur Telegram via le canal @PC1512Bot — Stéphane reçoit les mises à jour d'état de l'infrastructure sur son téléphone sans lever le petit doigt.

**La règle anti-hallucination :**
Le system prompt inclut une directive explicite : si l'agent ne peut pas vérifier un fait via ses outils, il doit le dire plutôt que fabriquer une réponse. En monitoring d'infrastructure, un faux positif c'est embêtant — mais un "tout va bien" halluciné alors que quelque chose est réellement en panne, ce serait bien pire.

**Résultat :** Le homelab dispose maintenant d'une couche de monitoring qui réfléchit, pas qui se contente de mesurer. 20 services sur 21 confirmés opérationnels lors du premier run automatisé. Le seul échec attendu — le test loopback de Headscale — a été correctement identifié comme une limitation connue, pas un incident. Coût : moins de 2 $/mois.
