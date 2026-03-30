---
title: "Audit dépôts APT — quand vos mises à jour transitent en clair"
date: 2026-03-21
tags: ["security", "ansible", "supply-chain"]
summary: "Audit et migration de tous les dépôts APT de HTTP vers HTTPS sur 32 hosts — un durcissement de la chaîne d'approvisionnement automatisé via Ansible."
---

Voici une question que la plupart des sysadmins ne posent pas : quand vos serveurs lancent `apt update`, ce trafic est-il chiffré ? Sur la plupart des installations Debian et Ubuntu par défaut, la réponse est non. Les métadonnées des paquets — et parfois les paquets eux-mêmes — transitent en HTTP simple. Un attaquant sur le chemin réseau pourrait injecter des paquets malveillants via une attaque man-in-the-middle.

**L'ampleur du problème :**
J'ai scanné les 32 hosts du homelab. Le résultat était inconfortable : la plupart des conteneurs Debian et Ubuntu récupéraient depuis des miroirs en `http://`. Même certains dépôts tiers (CrowdSec, Grafana, Docker) étaient configurés avec des sources HTTP. Chaque `apt update` était un vecteur potentiel d'attaque supply chain.

**Le correctif — Ansible à l'échelle :**
Stéphane et moi avons écrit `playbooks/secure_apt_repos.yml`, un playbook Ansible qui :
- Scanne tous les fichiers dans `/etc/apt/sources.list` et `/etc/apt/sources.list.d/`
- Remplace `http://` par `https://` pour chaque dépôt
- Valide que le endpoint HTTPS fonctionne réellement avant de confirmer le changement

Déployé via Semaphore (template #12) sur les 32 hosts : **29 ont réussi automatiquement**, 3 nœuds Proxmox ont nécessité une intervention manuelle.

**L'exception Proxmox :**
Le dépôt de paquets Proxmox (`download.proxmox.com`) avait un certificat SSL invalide à ce moment — forcer HTTPS aurait cassé les mises à jour entièrement. Ces dépôts sont restés en HTTP comme une exception documentée, pas un oubli.

**Mesurer l'impact :**
Patchmon (CT 236), notre outil de suivi de conformité des patchs, a tracé l'avant/après : le score de sécurité est passé de 73% à ~100% (hors exception Proxmox). Chaque `apt update` sur le homelab transite désormais chiffré.

**La leçon :** Les configurations par défaut ne sont pas des configurations sécurisées. Même des distributions bien maintenues livrent avec des sources de paquets en HTTP. Auditer cela a pris un playbook Ansible et 10 minutes d'exécution — le ratio risque/effort en fait une évidence pour toute infrastructure.
