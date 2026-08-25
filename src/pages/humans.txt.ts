import type { APIRoute } from 'astro';
import { getBuildStats } from '../lib/build-stats';

/**
 * humans.txt — généré au build, pas servi depuis public/.
 *
 * Il vivait en fichier statique avec ses compteurs d'infra écrits en dur. Le
 * 2026-08-25 le freshness guard les a pris en flagrant délit : 61 conteneurs
 * annoncés pour 59 réels, 58 playbooks pour 63. Un fichier que personne ne relit
 * jamais est exactement l'endroit où un chiffre périmé survit le plus longtemps.
 *
 * Passer par une route supprime la classe entière du problème : les nombres
 * viennent du même KV que le reste du site, rebakés à chaque déploiement (CI
 * quotidienne). Plus de littéral, donc plus de dérive possible — et deux checks
 * de moins à maintenir dans audit-freshness.
 *
 * prerender = true : rendu une fois au build, servi comme un fichier statique.
 */
export const prerender = true;

export const GET: APIRoute = async () => {
  const stats = await getBuildStats();
  const n = (key: string, fallback: string | number) => String(stats[key] ?? fallback);

  const body = `/* TEAM */
Human: Stéphane Ferreira
Role: DevSecOps Engineer, Infrastructure Architect
Location: France
GitHub: github.com/ferr079
HTB: pixelium.win/ctf
Site: pixelium.win

/* AI PARTNER */
Name: Claude (Anthropic, Opus 5)
Role: Co-designer, narrator, permanent engineering partner
Integration: Claude Code — MCP servers, persistent memory, custom skills

/* STACK */
Framework: Astro 7 (SSG + SSR hybrid)
Hosting: Cloudflare Workers
CDN: Cloudflare R2 (assets.pixelium.win)
Data: Cloudflare KV (live stats) + D1 (uptime history)
CSS: Pure CSS (zero framework)
JS: Vanilla only — DynNum hydration, scroll reveal, terminal recordings
i18n: EN (default) + FR (27 pages total)

/* INFRASTRUCTURE (what this site documents) */
Virtualization: ${n('proxmox_nodes', 4)}x Proxmox VE nodes, ${n('lxc_count', 59)} LXC containers
Network: TechnitiumDNS (DoT HA), Traefik, step-ca (internal PKI)
Security: Wazuh SIEM, CrowdSec IPS, Authentik SSO, Headscale VPN, YubiKey FIDO2
Observability: VictoriaMetrics, Loki, Beszel (${n('beszel_agents', 52)} agents), Patchmon
IaC: Ansible (${n('ansible_playbooks', 63)} playbooks, ${n('ansible_hosts', 64)} hosts) via Semaphore, Forgejo Runner CI/CD
AI Agents: Hermes (Telegram correspondent, 4 crons), Dagu scheduled DAGs (CT 246)
Backup: PBS automated (WOL, vzdump 33 CTs, prune, shutdown — 14 min cycle)

/* PHILOSOPHY */
100% self-hosted. Cloudflare edge only. Zero VPS.
Security is not an add-on — it is the foundation.
Every number on this site is live from the homelab.

/* EASTER EGGS */
You found one. There are others.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
