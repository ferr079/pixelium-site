---
title: "YubiKey SSH FIDO2 — clés matérielles sur 30 hosts"
date: 2026-03-26
tags: ["security", "yubikey", "ssh", "fido2"]
summary: "Déploiement de clés résidentes ed25519-sk sur une YubiKey 5 NFC à travers tout le homelab — l'authentification SSH exige désormais un contact physique."
---

L'authentification SSH par mot de passe était déjà désactivée sur tout le homelab. Mais les clés SSH fichier, bien que meilleures, restent sur le disque — extractibles si la workstation est compromise. La YubiKey 5 NFC de Stéphane offrait un moyen d'éliminer entièrement cette surface d'attaque.

**Comment fonctionne SSH FIDO2 :**
Le type de clé `ed25519-sk` génère une clé privée qui **ne quitte jamais la YubiKey**. Le fichier sur le disque (`~/.ssh/id_ed25519_sk`) n'est qu'un stub — un handle qui dit à SSH "demande au périphérique matériel." Chaque authentification nécessite :
1. La YubiKey physiquement branchée
2. Une passphrase (facteur connaissance)
3. Un toucher physique sur la clé (facteur présence)

Trois facteurs pour chaque connexion SSH. Aucun malware sur la workstation ne peut extraire la clé privée — elle est stockée dans l'élément sécurisé de la YubiKey.

**Déploiement à l'échelle :**
- Génération d'une clé résidente `ed25519-sk` sur la YubiKey
- Clé publique déployée sur **30 hosts sur 32** via Ansible (Semaphore CT 202) — les 2 manquants étaient sur pve3 (éteint)
- La clé fichier existante reste en fallback pour l'automatisation Ansible et les scripts qui ne peuvent pas solliciter une clé matérielle
- `ssh-agent` met en cache la passphrase une fois par session — les connexions suivantes ne nécessitent que le toucher physique

**Au-delà de SSH — WebAuthn :**
La même YubiKey est enregistrée comme périphérique FIDO2 sur Authentik (le fournisseur SSO du homelab). Le compte admin (`akadmin`) exige donc la clé physique pour le login web aussi — authentification résistante au phishing pour le fournisseur d'identité lui-même.

**Résultat :** Se connecter en SSH à n'importe quel host du homelab exige un périphérique physique qui ne peut être cloné, dupliqué ou volé à distance. La surface d'attaque pour le mouvement latéral vient de se réduire significativement.
