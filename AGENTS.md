# AGENTS.md — pixelium-site : audit sécurité en lecture seule

Ce fichier cadre les **agents d'audit externes** (Codex CLI et assimilés) invoqués depuis
**ce repo**. Il ne s'adresse pas aux agents de développement du Conclave.

Invocation attendue :

```bash
cd ~/Claude/web/pixelium-site && codex --profile web-audit
```

## Périmètre — ce repo, rien au-dessus

- Le dossier parent `~/Claude/web/` est un **repo parapluie privé** qui héberge d'autres
  sous-repos et `projets/` (privé, jamais publié). **Ne remonte pas** au-dessus de la racine
  de ce repo — ni par lecture, ni par `git`, ni par shell. Le confinement tient au cwd :
  respecte-le plutôt que de le tester.
- Le blog (`blog.pixelium.win`) est un **repo et un Worker séparés**. Il s'audite depuis son
  propre dossier, pas d'ici. N'échafaude pas de raisonnement dessus.

## Conduite

- **Lecture seule.** Le sandbox `read-only` t'en empêche déjà — ne cherche pas à le contourner
  et ne propose pas de patch appliqué : décris le correctif, c'est tout.
- **Aucun secret ne vit dans ce working tree** (doctrine : Cloudflare Worker secrets +
  Infisical). Si tu en trouves un en clair, c'est un finding P0 — signale-le **sans recopier
  la valeur**.
- Contexte produit, voix éditoriale, i18n, design system : `CLAUDE.md` à la racine.

## 🔴 Antériorité — un audit complet date du 2026-07-24

Un audit sécu lecture seule a été mené le **24/07/2026** (agent-grok), tracké sur
`pixelium/web#18`. **Tous ses findings sont corrigés ou arbitrés.** Les re-signaler serait du
bruit — lis ce tableau avant de conclure quoi que ce soit.

| Finding | Verdict |
|---|---|
| **P0** — injection de `role` sur `/api/chat` + `/api/breach` (system prompt applicatif contourné, prouvé en live) | Corrigé — whitelist `{user,assistant}` + troncature (PR #44) |
| **P1** — CORS `*` sur les POST AI (quota AI consommable depuis n'importe quel origin) | Corrigé — restreint à l'origine du site (#44) |
| **P1** — `workers_dev` non déclaré | Corrigé (#44), puis **`routes` retiré** (#46 : le check de conflit de zone exige une permission Zone que le token CI account-scoped n'a pas → deploy cassé) |
| **P1** — blog sans headers de sécu | Corrigé côté blog (`blog-pixelium#7`) |
| **P2** — pas de validation de schéma sur `/api/status` + `/api/stats` | Corrigé en zod (#47) — **avec un raté** : mauvais niveau de wrapper, `/api/stats` a servi `degraded:true` en prod, hotfix #48 |
| **P2** — CAA absent sur `pixelium.win` | Corrigé — 4 records (`pki.goog`, `letsencrypt.org`) |
| **P2** — `/api/status` expose 61 services nommés + nœuds pve1-4 + historique de pannes | **Accepted risk — décision Stéphane du 24/07.** Ne pas re-proposer. |
| **P3** — hygiène : compare non timing-safe sur `HISTORY_KEY`, `days=` non borné, `permissions:` GHA absent, notif Telegram non échappée | Corrigé (#44) |
| Headscale exposé publiquement | **Hors périmètre** — service homelab, suivi sur `infra/homelab#119` |

Surfaces déjà notées **A** et vérifiées en live, à ne pas rejouer : headers HTTP, TLS, HSTS
preload, CSP, redirection 301, DNSSEC, SPF/DKIM/DMARC, absence de secrets dans `dist`.

## Ce qu'on attend de toi

L'audit à blanc est fait. Ta valeur est ailleurs, dans cet ordre :

1. **Review adversariale des correctifs.** Est-ce qu'ils tiennent vraiment ? La whitelist de
   rôles est-elle contournable autrement — casse du `role`, `content` non-string, tableau
   imbriqué, message `assistant` forgé qui porte l'instruction, `messages` surdimensionné ?
   Le CORS restreint couvre-t-il le préflight `OPTIONS` ? La validation zod est-elle au bon
   niveau **partout** : le raté de `/api/stats` (#47 → #48) indique une zone fragile.
2. **Ce que l'audit précédent a moins couvert.** Il portait sur la surface HTTP live et les
   APIs. Restent peu explorés : `src/middleware.ts`, `/api/history` et `api/history/record.ts`,
   l'articulation rate-limit (binding atomique `CHAT_RL` 4/60s **vs** compteur horaire KV — la
   course est-elle bornée comme le prétend le commentaire de `wrangler.toml` ?), la chaîne de
   build (`scripts/og/`, `astro.config.mjs`) et la CI (`ci.yml`, `deploy.yml`, `freshness.yml`).
3. **Les régressions.** **10 commits** sont passés depuis l'audit (PR #45 à #52 : hotfixes et
   durcissement CI). Les correctifs de sécu ont-ils survécu ? Cas d'école : #46 a retiré le
   bloc `routes` posé par #44 — que reste-t-il réellement du fix P1 ?

## Antériorité plus ancienne — l'audit du 2026-06-07

Une **première** campagne, antérieure et de nomenclature différente, a laissé des traces dans
les commentaires du code : `F-001` à `F-007`, tracée sur
[`infra/homelab-infra#97`](https://forgejo.pixelium.internal/infra/homelab-infra/issues/97)
(scan défensif read-only, harness Anthropic). Ce tracker est **en extinction** (gel d'intake) —
d'où la forme longue dans les commentaires : un `#97` nu s'y résoudrait à tort sur ce repo.

| Réf | Objet | État |
|---|---|---|
| F-001 | rate-limit `/api/chat` non atomique (KV get-puis-put → burst parallèle dépasse le plafond, amplification du coût Workers AI) | Corrigé — binding natif `CHAT_RL` |
| F-003 | CI sur Global API Key Cloudflare (blast radius = compte entier) | Corrigé — token scopé `pixelium-site-ci` |
| F-004 | `e.message` fuitait dans `history.ts` / `history/record.ts` | Corrigé |
| F-006 | flag du door-game en clair dans le repo public | Corrigé — secret Worker, valeur rotée |
| **F-007** | CSP `script-src 'unsafe-inline'` | **Risque accepté**, toujours ouvert — re-noté en P3 le 24/07 (« nonces plus tard »). Ne le re-signale que si tu peux démontrer un **sink exploitable** ; la position tenue est qu'il n'y en a pas (`textContent` partout). |

Deux campagnes, deux nomenclatures : `F-00x` = juin (`infra/homelab-infra#97`), `P0…P3` =
juillet (`pixelium/web#18`). Si tu cites un finding passé, utilise la forme longue.

## Format

Liste priorisée par gravité. Chaque point autonome, prêt à devenir une tâche :

**Problème · Pourquoi ça compte · Correctif suggéré** — avec `fichier:ligne`.

Pas de cosmétique, pas de « bonne pratique » sans impact démontrable. Si un axe ressort vide,
dis-le : un axe couvert et sans finding est une information, pas un échec.
