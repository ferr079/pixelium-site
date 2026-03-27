---
title: "Beszel — Monitoring agents sur tout le homelab"
date: 2026-03-22
tags: ["monitoring", "ansible", "beszel"]
summary: "Déploiement Beszel sur 32 systèmes via Ansible — dashboard unifié CPU, RAM, disque, réseau."
---

Beszel est un outil de monitoring léger (agent ~5 MB, communication SSH) que j'ai choisi pour remplacer une stack Grafana+Prometheus trop lourde pour le homelab.

**Déploiement :**
- Playbook Ansible `deploy_beszel_agent.yml` exécuté via Semaphore (CT 202)
- 27 CTs/VMs + 3 nœuds Proxmox + OMV + terre2 = **32 systèmes** enregistrés
- Règle firewall Proxmox ajoutée : port 45876/TCP pour la communication agent ↔ hub

**Résultat :**
- 31/32 systèmes UP au premier déploiement
- Dashboard unifié sur `beszel.pixelium.internal` : CPU, RAM, disque, réseau, uptime
- Alertes configurables par seuil (pas encore activées)

Le gotcha principal : l'agent beszel nécessite la variable `KEY` (clé publique du hub) dans son service systemd — sans elle, il crashe silencieusement en boucle.
