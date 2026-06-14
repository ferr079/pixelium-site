export const meta = {
  name: 'oss-contrib-sweep',
  description: 'Balaye les PR + issues ferr079 et signale les fils où un mainteneur attend notre réponse',
  whenToUse: 'Check périodique des contributions OSS : qui attend quoi de notre part (PR closed inclus, issues incluses)',
  phases: [
    { title: 'Discover', detail: 'lister toutes les PR et issues ferr079 (tous états)' },
    { title: 'Classify', detail: 'par fil : dernier intervenant + en attente vs faux positif' },
  ],
}

// Compte GitHub à balayer — surchargeable via args: { account: "..." }
const ACCOUNT = (args && args.account) || 'ferr079'

const DISCOVER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    threads: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          repo: { type: 'string', description: 'owner/name' },
          number: { type: 'integer' },
          type: { type: 'string', enum: ['pr', 'issue'] },
          state: { type: 'string' },
          title: { type: 'string' },
        },
        required: ['repo', 'number', 'type', 'state', 'title'],
      },
    },
  },
  required: ['threads'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    lastCommenter: { type: 'string', description: 'login du dernier intervenant, ou "" si aucun commentaire' },
    lastDate: { type: 'string', description: 'date YYYY-MM-DD du dernier commentaire, ou ""' },
    status: {
      type: 'string',
      enum: ['ours_last', 'pending', 'terminal', 'resolved_by_pr', 'no_comments'],
      description: 'pending = un retour de notre part est réellement attendu',
    },
    reason: { type: 'string', description: 'une ligne justifiant le statut' },
  },
  required: ['lastCommenter', 'status', 'reason'],
}

phase('Discover')
const disc = await agent(
  `Avec la CLI gh, liste TOUTES les PR et issues écrites par ${ACCOUNT} sur GitHub (tous états).
Exécute exactement ces deux commandes :
  gh search prs --author ${ACCOUNT} --json number,title,repository,state --limit 50
  gh search issues --author ${ACCOUNT} --include-prs=false --json number,title,repository,state --limit 50
Fusionne en une seule liste. Pour chaque entrée : repo = repository.nameWithOwner, type = "pr" ou "issue" selon la source.
NE récupère PAS les commentaires ici. Renvoie uniquement la liste structurée.`,
  { phase: 'Discover', schema: DISCOVER_SCHEMA }
)
const threads = (disc && disc.threads) || []
log(`Discover : ${threads.length} fils (PR + issues) trouvés`)

phase('Classify')
const verdicts = await pipeline(
  threads,
  (t) =>
    agent(
      `Fil GitHub : ${t.repo}#${t.number} (type=${t.type}, state=${t.state}, titre="${t.title}").
Exécute : gh ${t.type === 'pr' ? 'pr' : 'issue'} view ${t.number} --repo ${t.repo} --json comments,state,title
Identifie le DERNIER intervenant (login + date) du fil.
Classe le statut, en étant SCEPTIQUE (ne déclare "pending" que si une réponse/un test de notre part est réellement attendu) :
  - "ours_last"      : le dernier intervenant est ${ACCOUNT} → rien à faire.
  - "no_comments"    : aucun commentaire → rien à faire.
  - "pending"        : le dernier intervenant est quelqu'un d'autre ET attend visiblement notre retour (question, PR de fix à reviewer, demande de test).
  - "terminal"       : dernière intervention = décision finale d'un mainteneur (won't fix, "déjà dispo", clôture polie) → rien à faire.
  - "resolved_by_pr" : issue déjà corrigée par un PR séparé MERGÉ qui la ferme → rien à faire.
Renvoie le verdict avec une raison en une ligne.`,
      { label: `classify:${t.repo}#${t.number}`, phase: 'Classify', schema: VERDICT_SCHEMA }
    ).then((v) => (v ? { ...t, ...v } : null))
)

const clean = verdicts.filter(Boolean)
const pending = clean.filter((v) => v.status === 'pending')
const falsePositives = clean.filter((v) => v.status === 'terminal' || v.status === 'resolved_by_pr')

log(`Classify terminé : ${pending.length} en attente de notre réponse, ${falsePositives.length} faux positifs filtrés`)

return {
  account: ACCOUNT,
  scanned: threads.length,
  pending,
  falsePositives,
  all: clean,
}
