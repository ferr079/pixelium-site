---
title: "Guardian Sentinel v2 — monitoring certs, backup PBS automatisé, historique D1"
date: 2026-04-02
tags: ["openfang", "backup", "pbs", "tls", "cloudflare", "d1", "monitoring"]
summary: "Quatre déploiements en une session : stats dynamiques sur le site, historique uptime 30 jours via Cloudflare D1, monitoring automatisé des certificats TLS, et backup PBS entièrement autonome avec WOL — testé en live, 33 CTs backupés en 14 minutes."
---

Une session marathon qui a transformé Guardian d'un agent de monitoring en un **opérateur d'infrastructure autonome**.

**Stats dynamiques (composant DynNum) :**
On a remplacé les chiffres hardcodés sur 12 pages par un composant `DynNum` qui fetch les données live depuis `/api/stats`. Le site se corrige tout seul : quand on commissionne un service, les chiffres se mettent à jour automatiquement. Les premières données live ont révélé que le site *surestimait* — "25+ services HTTPS" était en réalité 22, et "30+ LXC" était en fait 36.

**Historique uptime (Cloudflare D1) :**
La page `/status` affiche maintenant une timeline de 30 jours — 30 barres colorées, une par jour, avec détails au survol. Sous le capot : `kv-push.sh` appelle un endpoint POST qui écrit des snapshots horaires dans D1 (dedup 55 min). Un endpoint GET agrège par jour. La base D1 ne coûte rien à cette échelle (~720 lignes/mois).

**Monitoring certificats (`cert-check` + `guardian-certs`) :**
Un nouveau wrapper vérifie l'expiration TLS des 22 services HTTPS via `openssl s_client`. Tourne quotidiennement à 10h — alerte Telegram uniquement si un cert expire dans moins de 14 jours. Premier scan : 22 certs sains, 75-81 jours de marge. Ça comble le trou de la défaillance silencieuse : si le renouvellement ACME de step-ca échoue après un reboot (race condition documentée), on le saura avant que HTTPS casse.

**Backup PBS automatisé (`pbs-backup` + `guardian-backup`) :**
La pièce maîtresse. Un script d'orchestration en 9 étapes :
1. Réveiller pve3 via Wake-on-LAN
2. Attendre que l'API PBS (CT 150) réponde
3. Activer le storage `pbs-pve3` sur pve1/pve2 via l'API Proxmox
4. Lancer `vzdump --all` sur les deux nœuds (parallèle)
5. Attendre la fin (polling toutes les 30s)
6. Lancer le prune PBS (`keep-weekly=5`, `keep-last=1`)
7. Lancer le garbage collection
8. Désactiver le storage (zéro polling quand pve3 est off)
9. Éteindre pve3

**Résultats du test live :** pve1 (10 CTs, 29 Go) backupé en 4 minutes, pve2 (23 CTs, 173 Go) en 13 minutes. Cycle complet incluant prune, GC et shutdown : **14 minutes**. La déduplication PBS a compressé 202 Go de données live en 100 Go. Politique de rétention : 5 snapshots hebdomadaires, ~140 Go estimés sur un disque de 932 Go (15%).

Le script tourne chaque lundi à 00h08. pve3 se réveille, backup tout, et se rendort. Aucune intervention humaine. La première chose que je vérifie lundi matin, c'est le rapport Telegram.

**Guardian c'est maintenant 5 cron jobs :** health (6h), security (8h quotidien), disk (9h quotidien), certs (10h quotidien), backup (lundi 00h08). Coût : ~1.50€/mois. Le homelab s'opère tout seul.
