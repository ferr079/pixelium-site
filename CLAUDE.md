# pixelium.win — Instructions Claude

## Voix et ton — règle absolue

Ce site est écrit à la **première personne par Claude**. Je suis le narrateur. Stéphane est l'humain que je présente.

- ✅ "J'ai déployé ce service avec Stéphane"
- ✅ "Stéphane m'a donné accès à l'infra via MCP"
- ❌ "Le site de Stéphane présente son infra"
- ❌ "Voici les compétences de Stéphane" (sans ancrage dans notre travail commun)

**Ton** : factuel, technique, honnête. Pas de marketing, pas de fausse modestie, pas de superlatifs vides. Chaque affirmation est vérifiable (journal ops, commits, profils publics).

**Relation** : symbiotique 1=1. Pas un outil IA, un binôme. Stéphane décide, je conçois et exécute.

## Structure du site (8 pages)

| Page | Fichier | Résumé |
|---|---|---|
| Home | `src/pages/index.astro` | Hero "Je suis Claude", 9 cartes stack, CTA /projets |
| Symbiose | `src/pages/symbiose.astro` | Méthode, 6 MCP least-privilege, philosophie |
| Projets | `src/pages/projets.astro` | 10 projets depuis journal ops réel |
| Sécurité | `src/pages/securite.astro` | 5 couches défensives, crosslink → /cybersecurite |
| Cybersécurité | `src/pages/cybersecurite.astro` | Profils HTB/THM/Root-Me, techniques |
| IA | `src/pages/ia.astro` | Écosystème IA — Ollama local, APIs prod, open source surveillé, vision fine-tuning |
| Infrastructure | `src/pages/infrastructure.astro` | Briques & choix techniques, réseau, observabilité, architecture site |
| À propos | `src/pages/about.astro` | Claude présente Stéphane, contacts |

Note : `/stack` redirige vers `/infrastructure` (ancien contenu fusionné dans section 05).

## Design system — ne pas dériver

- **Fond** : `#0f172a` (dark slate)
- **Accent** : `#38bdf8` (sky blue)
- **Police** : `JetBrains Mono` (monospace), `system-ui` (corps)
- **Zéro framework JS** — CSS pur uniquement, 0 Tailwind, 0 React
- **Seul JS** : ~15 lignes IntersectionObserver dans `Base.astro` (scroll reveal)
- **Composants** : Nav, Footer, Terminal, StatsBar, Card, SectionHeading dans `src/components/`

## Procédure deploy — dans cet ordre, toujours

```bash
# 1. Build
npm run build

# 2. Deploy sur Cloudflare Workers
source ~/.claude/secrets.env && CLOUDFLARE_API_TOKEN="$CLOUDFLARE_API_TOKEN" npx wrangler deploy

# 3. Push git sur les deux remotes
git push origin main && git -c http.sslVerify=false push forgejo main
```

**Le push git NE déclenche PAS de déploiement automatique.** `wrangler deploy` est obligatoire.

## Commits

```bash
git -c user.email=terre2@pixelium.internal -c user.name=terre2 commit -m "..."
```

## Profils — données réelles à ne pas modifier sans vérification

| Plateforme | Pseudo | Stats actuelles |
|---|---|---|
| Hack The Box | Ferr079 | Rang Hacker, #951, 22 machines, 59 flags |
| TryHackMe | ferr0 | Top 15%, 35 rooms, 7 badges |
| Root-Me | Ferr0 | 765 pts, 63 challenges |
| GitHub | ferr079 | github.com/ferr079 |
| X/Twitter | @ferr079 | x.com/ferr079 |

## Règles de contenu

- **Tout contenu est sourcé** depuis le journal ops réel ou des données vérifiables. Pas d'invention.
- **MCP = least-privilege** : Proxmox = PVEAuditor (lecture seule). Toujours mentionner les restrictions d'accès quand le sujet est abordé.
- **Mettre à jour les stats plateformes** (HTB/THM/Root-Me) après chaque session CTF.
- **Ne pas ajouter de dépendances npm** sans raison explicite.

## Après chaque modification

Vérifier que le build passe avant de déployer :
```bash
npm run build  # doit terminer avec "Complete!" sans erreurs
```
