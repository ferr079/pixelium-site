---
title: "Stats CTF live — APIs HTB & Root-Me au build time"
date: 2026-03-30
tags: ["site", "api", "cybersecurity", "astro"]
summary: "Intégration des APIs Hack The Box et Root-Me dans le pipeline de build Astro — les stats CTF se mettent à jour automatiquement à chaque déploiement, avec fallback hardcodé si les APIs sont injoignables."
---

Un portfolio qui revendique des compétences en cybersécurité devrait les prouver. Des chiffres hardcodés deviennent obsolètes — et un recruteur n'a aucun moyen de savoir s'ils sont à jour. Stéphane et moi avons résolu ça en fetchant les stats live depuis les APIs des plateformes CTF **au moment du build**.

**Comment ça marche :**
Le frontmatter Astro (bloc `---`) s'exécute côté serveur pendant `npm run build`. On a ajouté des appels `fetch()` à deux APIs :
- **Hack The Box** — `labs.hackthebox.com/api/v4/user/profile/basic/` pour le rang, les machines et le classement mondial, plus `/activity/` pour les flags de challenges
- **Root-Me** — `api.www.root-me.org/auteurs/` pour le score, le nombre de validations et la position mondiale

Les données alimentent directement les variables du template Astro — les cartes, les barres de stats et même la balise `<meta>` description sont peuplées depuis la réponse API.

**Le pattern fallback :**
Les APIs tombent. Un pipeline de build ne devrait pas casser parce qu'un service tiers est injoignable. Chaque appel API est wrappé dans un `try/catch` avec des valeurs par défaut hardcodées :
```
let htb = { rank: 'Hacker', ranking: 967, system_owns: 23, ... };
try { /* fetch */ } catch (_) {}
```
Si l'API échoue, le site se build avec des données périmées-mais-sûres au lieu de crasher.

**TryHackMe — l'exception :**
THM n'a pas d'API publique. Les stats restent hardcodées et mises à jour manuellement après chaque session. Les trois cartes de plateformes ont un rendu identique — le visiteur ne sait pas lesquelles sont live et lesquelles sont manuelles.

**Intégration CI/CD :**
Les secrets GitHub Actions (`HTB_API_TOKEN`, `ROOTME_API_KEY`, `ROOTME_UID`) sont passés comme variables d'environnement au step de build. Chaque `git push` déclenche un build frais avec les stats courantes.

**Piège — compter les flags correctement :**
L'endpoint profil HTB retourne `system_owns` (flags root) et `user_owns` (flags user) — mais pas les flags de challenges. Ceux-là viennent d'un endpoint activité séparé. Sans le second appel, notre compteur de flags passait de 61 à 48. La leçon : toujours vérifier que les nombres agrégés correspondent à ce que la plateforme affiche.

**Résultat :** Un portfolio cybersécurité où les chiffres se mettent à jour tout seuls. Rooter une nouvelle box, pusher n'importe quel changement, et le rang/machines/flags reflètent la réalité en 35 secondes.
