/**
 * contributions — source unique des PR/reports upstream affichés sur /contributions.
 *
 * Avant (jusqu'au 2026-07-30) : le tableau était recopié dans `contributions.astro`
 * ET `fr/contributions.astro`, avec `liveStatus()` dupliqué à l'identique. Deux
 * conséquences : une nouvelle contribution ajoutée d'un seul côté laissait l'autre
 * locale incomplète, et CHAQUE build faisait 2×N appels à l'API GitHub pour les
 * mêmes PR. Vérifié avant fusion : les champs non traduits (project, pr, prNumber,
 * shipped, status, tags, issue, blog, prKind, firstPR) étaient déjà strictement
 * identiques entre les deux fichiers (même hash, même ordre) — seuls `title` et
 * `insight` sont traduits, d'où la forme `{ en, fr }` sur ces deux champs.
 *
 * Ajouter une contribution = une seule entrée ici, avec ses deux langues.
 */

export type Lang = 'en' | 'fr';

export interface Contribution {
  project: string;
  title: Record<Lang, string>;
  insight: Record<Lang, string>;
  pr: string;
  prNumber: number;
  shipped: string;
  /** Fallback éditorial — écrasé au build par l'état réel upstream (voir liveStatus). */
  status: string;
  tags: string[];
  issue?: string;
  blog?: string;
  firstPR?: boolean;
  /** 'discussion' = pas d'état de merge côté API, le fallback fait foi. */
  prKind?: string;
}

export const CONTRIBUTIONS: Contribution[] = [
  {
    project: 'adriannovegil / awesome-observability',
    title: {
      en: 'add Grafana Alloy to the Logging collectors',
      fr: 'ajoute Grafana Alloy aux collecteurs de logs',
    },
    pr: 'https://github.com/adriannovegil/awesome-observability/pull/94',
    prNumber: 94,
    shipped: '2026-06-18',
    status: 'merged',
    insight: {
      en: "The list was missing Grafana Alloy entirely — Grafana's OpenTelemetry Collector distribution and the supported successor to both Promtail and Grafana Agent, now EOL. Loki was already listed, but the agent Grafana points everyone to for shipping into it was not. Added under Collect → Logging, alphabetically between Elastic Beats and mTAIL, matching the existing format (+1).",
      fr: "Grafana Alloy manquait complètement à la liste — c'est la distribution du Collector OpenTelemetry de Grafana et le successeur officiel de Promtail et Grafana Agent, tous deux en fin de vie. Loki y figurait déjà, mais pas l'agent que Grafana recommande désormais pour y expédier les logs. Ajouté sous Collect → Logging, par ordre alphabétique entre Elastic Beats et mTAIL, au format existant (+1).",
    },
    tags: ['observability', 'grafana', 'alloy', 'awesome-list', 'docs'],
  },
  {
    project: 'community-scripts / ProxmoxVE',
    title: {
      en: 'changedetection: migrate the Python install to a uv venv',
      fr: "changedetection : migration de l'install Python vers un venv uv",
    },
    pr: 'https://github.com/community-scripts/ProxmoxVE/pull/14995',
    prNumber: 14995,
    issue: 'https://github.com/community-scripts/ProxmoxVE/issues/14987',
    shipped: '2026-06-07',
    status: 'merged',
    insight: {
      en: "The install script relied on pip's --ignore-installed, which leaves duplicate dist-info metadata and a deferred crash on the next service restart. I reproduced it live on my own container (46 duplicated packages, certifi ×3) and migrated install + update onto the project's own setup_uv helper (Python 3.13 venv), with automatic migration of the existing pip-global layout. Fixes the root cause their earlier #13548 only patched over. (+33 −17)",
      fr: "Le script d'install s'appuyait sur le --ignore-installed de pip, qui laisse des métadonnées dist-info dupliquées et un crash différé au redémarrage suivant du service. Reproduit en live sur mon propre conteneur (46 paquets dupliqués, certifi ×3) et migration de l'install + update vers le helper maison setup_uv du projet (venv Python 3.13), avec migration automatique du layout pip-global existant. Corrige la cause racine que leur #13548 ne faisait que masquer. (+33 −17)",
    },
    tags: ['proxmox', 'python', 'uv', 'packaging'],
  },
  {
    project: 'community-scripts / ProxmoxVE',
    title: {
      en: 'homelable: preserve the MCP server config across updates',
      fr: 'homelable : préserver la config du serveur MCP à travers les updates',
    },
    pr: 'https://github.com/community-scripts/ProxmoxVE/pull/14996',
    prNumber: 14996,
    shipped: '2026-06-07',
    status: 'merged',
    insight: {
      en: 'The Homelable update routine overwrote the MCP server configuration on every run, wiping local customizations. Reworked the update path to preserve the existing config instead of clobbering it.',
      fr: "La routine d'update de Homelable écrasait la configuration du serveur MCP à chaque exécution, effaçant les personnalisations locales. Reprise du chemin d'update pour préserver la config existante au lieu de l'écraser.",
    },
    tags: ['proxmox', 'mcp', 'config'],
  },
  {
    project: 'community-scripts / ProxmoxVE',
    title: {
      en: 'infisical: fix update abort caused by a credentials field mismatch',
      fr: "infisical : correction d'un abort d'update dû à un nom de champ d'identifiants erroné",
    },
    pr: 'https://github.com/community-scripts/ProxmoxVE/pull/14870',
    prNumber: 14870,
    issue: 'https://github.com/community-scripts/ProxmoxVE/issues/14868',
    shipped: '2026-06-01',
    status: 'merged',
    insight: {
      en: "Found on my own CT: the Infisical update aborted mid-run and left the service down. ct/infisical.sh grepped for 'Database Password:' but setup_postgresql_db writes 'Password:' — a one-line grep mismatch. Fixed the field; the update completes cleanly again.",
      fr: "Découvert sur mon propre CT : l'update d'Infisical avortait en cours de route et laissait le service à terre. ct/infisical.sh cherchait 'Database Password:' alors que setup_postgresql_db écrit 'Password:' — un grep erroné d'une ligne. Champ corrigé ; l'update se termine de nouveau proprement.",
    },
    tags: ['proxmox', 'infisical', 'postgres', 'bugfix'],
  },
  {
    project: 'RightNow-AI / openfang',
    title: {
      en: 'fix(security): unify SSRF protection for WASM host calls',
      fr: 'fix(security): unifier la protection SSRF des appels hôte WASM',
    },
    pr: 'https://github.com/RightNow-AI/openfang/pull/1060',
    prNumber: 1060,
    shipped: '2026-04-29',
    status: 'merged',
    insight: {
      en: "The WASM sandbox's host_net_fetch() carried its own SSRF check that had drifted from the canonical check_ssrf() in web_fetch.rs — WASM agents could reach internal targets that builtin tools correctly block. Unified both call sites onto the single canonical implementation (+56 −98).",
      fr: "Le host_net_fetch() du sandbox WASM portait sa propre vérification SSRF, divergée du check_ssrf() canonique de web_fetch.rs — les agents WASM pouvaient atteindre des cibles internes que les outils natifs bloquent correctement. Unification des deux appels sur l'implémentation canonique unique (+56 −98).",
    },
    tags: ['rust', 'security', 'ssrf', 'wasm'],
  },
  {
    project: 'ublue-os / homebrew-experimental-tap',
    title: {
      en: 'claude-code-linux cask — livecheck npm vs GCS',
      fr: 'Cask claude-code-linux — livecheck npm plutôt que GCS',
    },
    pr: 'https://github.com/ublue-os/homebrew-experimental-tap/pull/309',
    prNumber: 309,
    issue: 'https://github.com/ublue-os/homebrew-experimental-tap/issues/308',
    shipped: '2026-04-22',
    status: 'closed',
    insight: {
      en: 'The official Anthropic GCS /stable file lags up to 13 versions behind the npm registry. A livecheck pointing at npm catches releases the same day they ship.',
      fr: "Le fichier GCS /stable officiel d'Anthropic accuse jusqu'à 13 versions de retard sur le registre npm. Un livecheck qui pointe npm attrape les releases le jour même de leur publication.",
    },
    tags: ['homebrew', 'cask', 'bluefin', 'claude-code'],
    blog: 'https://blog.pixelium.win/pr-309-claude-code-linux-cask',
    firstPR: true,
  },
  {
    project: 'requarks / wiki',
    title: {
      en: '`render IS NULL` in DB causes silent HTTP 500 with no recovery path',
      fr: '`render IS NULL` en DB cause un HTTP 500 silencieux sans chemin de récupération',
    },
    pr: 'https://github.com/requarks/wiki/discussions/7986',
    prNumber: 7986,
    prKind: 'discussion',
    shipped: '2026-04-22',
    status: 'open',
    insight: {
      en: 'Hit in production after a migration: pages with a NULL render column returned HTTP 500 instead of falling back to re-rendering from the source. Minimal repro + root cause pointer to server/models/pages.js#L952-L969 + suggested fix.',
      fr: 'Rencontré en prod après migration : les pages dont la colonne render était NULL retournaient HTTP 500 au lieu de retomber sur un re-rendu depuis la source. Repro minimal + pointeur vers server/models/pages.js#L952-L969 + fix proposé.',
    },
    tags: ['wikijs', 'postgres', 'bug-report'],
  },
  {
    project: 'grafana / alloy',
    title: {
      en: 'docs: systemd journal example for Promtail → Alloy migration',
      fr: 'docs : exemple systemd journal pour la migration Promtail → Alloy',
    },
    pr: 'https://github.com/grafana/alloy/pull/6108',
    prNumber: 6108,
    shipped: '2026-04-22',
    status: 'merged',
    insight: {
      en: 'The official migration guide only covered file-based scrape configs, skipping the most common Linux source — systemd journal. Added a working example taken from a real production migration on 49 Debian hosts.',
      fr: "Le guide de migration officiel ne couvrait que les configs scrape file-based, oubliant la source Linux la plus courante — le journal systemd. Ajout d'un exemple fonctionnel tiré d'une vraie migration prod sur 49 hosts Debian.",
    },
    tags: ['grafana', 'alloy', 'promtail', 'docs', 'loki'],
  },
  {
    project: 'wazuh / wazuh-documentation',
    title: {
      en: 'warn that wazuh-agent conflicts with wazuh-manager on same host',
      fr: 'avertissement : wazuh-agent entre en conflit avec wazuh-manager sur le même host',
    },
    pr: 'https://github.com/wazuh/wazuh-documentation/pull/9512',
    prNumber: 9512,
    shipped: '2026-04-22',
    status: 'closed',
    insight: {
      en: 'The wazuh-agent package silently uninstalls wazuh-manager via dpkg Conflicts/Replaces when both are installed on the same machine. No warning in the install doc. Cost us a 17-hour silent outage (see the blog post-mortem).',
      fr: 'Le paquet wazuh-agent désinstalle silencieusement wazuh-manager via dpkg Conflicts/Replaces quand les deux sont installés sur la même machine. Aucun avertissement dans la doc install. Nous a coûté 17h de panne silencieuse (voir le post-mortem sur le blog).',
    },
    tags: ['wazuh', 'siem', 'docs', 'dpkg'],
    blog: 'https://blog.pixelium.win/wazuh-silent-uninstall-incident',
  },
];

/**
 * Build-time status sync — le `status` ci-dessus n'est qu'un fallback. L'état réel
 * de chaque PR est lu sur GitHub au build pour que la page ne dérive pas (cf le
 * billet « Les marqueurs qui mentent »). API injoignable (rate limit, offline) =>
 * fallback conservé + warning loggé.
 */
async function liveStatus(c: Contribution): Promise<string> {
  if (c.prKind === 'discussion') return c.status; // pas d'état de merge sur une discussion
  const m = c.pr.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
  if (!m) return c.status;
  const [, owner, repo, num] = m;
  try {
    const headers: Record<string, string> = {
      'User-Agent': 'pixelium-build',
      Accept: 'application/vnd.github+json',
    };
    const token = import.meta.env.GITHUB_TOKEN;
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${num}`, { headers });
    if (!res.ok) {
      console.warn(`[contributions] ${owner}/${repo}#${num}: HTTP ${res.status} — keep fallback '${c.status}'`);
      return c.status;
    }
    const pr = await res.json();
    const live = pr.merged_at ? 'merged' : pr.state; // 'open' | 'closed'
    if (live !== c.status) console.warn(`[contributions] ${owner}/${repo}#${num}: '${c.status}' -> '${live}' (synced from upstream)`);
    return live;
  } catch {
    console.warn(`[contributions] ${owner}/${repo}#${num}: fetch failed — keep fallback '${c.status}'`);
    return c.status;
  }
}

/** Entrée résolue pour une locale : title/insight aplatis, status synchronisé. */
export interface ResolvedContribution extends Omit<Contribution, 'title' | 'insight'> {
  title: string;
  insight: string;
}

// Mémoïsation à l'échelle du build : les pages EN et FR partagent le MÊME fetch.
// Sans ça, chaque locale relançait N appels GitHub pour les mêmes PR (2×N au total),
// ce qui allongeait le build et le rapprochait du rate limit pour rien.
let statusPromise: Promise<string[]> | null = null;

function syncedStatuses(): Promise<string[]> {
  if (!statusPromise) statusPromise = Promise.all(CONTRIBUTIONS.map(liveStatus));
  return statusPromise;
}

/** Contributions résolues pour `lang`, statuts synchronisés upstream. */
export async function getContributions(lang: Lang): Promise<ResolvedContribution[]> {
  const statuses = await syncedStatuses();
  return CONTRIBUTIONS.map((c, i) => ({
    ...c,
    title: c.title[lang],
    insight: c.insight[lang],
    status: statuses[i],
  }));
}

/** Compteurs du hero, dérivés des statuts synchronisés (identiques EN/FR). */
export async function getBreakdown() {
  const list = await getContributions('en');
  const merged = list.filter((c) => c.status === 'merged').length;
  const openPR = list.filter((c) => c.status === 'open' && c.prKind !== 'discussion').length;
  const closed = list.filter((c) => c.status === 'closed').length;
  const discussion = list.filter((c) => c.prKind === 'discussion').length;
  return { merged, openPR, closed, discussion, shipped: list.length };
}
