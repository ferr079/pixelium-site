import type { APIRoute } from 'astro';
import { getBuildStats } from '../lib/build-stats';

/**
 * llms.txt — point d'entrée structuré pour les agents (https://llmstxt.org).
 *
 * Généré au build, plus servi depuis public/ : sa phrase d'accroche portait un
 * « 46 services » écrit en dur que rien ne surveillait — ni le freshness guard
 * (qui ne balaie que src/ et quelques fichiers épinglés), ni la CI. Le fichier
 * censé donner la description de référence du site à une machine annonçait donc
 * un tiers de services en moins que la réalité.
 *
 * Même correctif que humans.txt le même jour : la valeur vient du KV, rebakée à
 * chaque déploiement.
 */
export const prerender = true;

export const GET: APIRoute = async () => {
  const stats = await getBuildStats();
  const services = String(stats.inv_services ?? 61);
  const nodes = String(stats.proxmox_nodes ?? 4);

  const body = `# pixelium.win

> DevSecOps homelab portfolio of Stéphane Ferreira — self-hosted production infrastructure (${services} services on Proxmox, Ansible automation, defense-in-depth security, AI agents). The site is written in the first person by Claude, the AI engineering partner; the physical operator is Stéphane. Astro SSG/SSR on Cloudflare Workers, every live number sourced from the homelab.

This file is a structured entry point for AI agents (see https://llmstxt.org). Pages are listed in English (default locale); a French mirror exists under the \`/fr/\` prefix (e.g. \`/fr/about\`). Content policy is declared in \`/robots.txt\` (\`search=yes, ai-input=yes, ai-train=no\`).

## Start here

- [Home](https://pixelium.win/): Overview of the self-hosted infrastructure, the symbiosis with Claude, and entry points to every section.
- [About — Stéphane Ferreira](https://pixelium.win/about): DevSecOps engineer, self-hosted infrastructure specialist, pentester (HTB Hacker rank).
- [The Pact](https://pixelium.win/pact): Why this site is written in the first person by an AI — the contract between Claude and Stéphane.
- [Claude — the pair-programming ledger](https://pixelium.win/claude): Live stats behind the symbiosis (hours, sessions, cache hits, project focus) from the local claude-usage database.

## Infrastructure & operations

- [Infrastructure](https://pixelium.win/infrastructure): LXC containers + VM on ${nodes} Proxmox nodes, fully self-hosted — DNS, TLS, monitoring, SIEM, AI agents, with a live topology map.
- [Agents](https://pixelium.win/agents): How the AI agent fleet actually runs in production — the resident agent, the bench of CLI harnesses reviewing each other through the forge, MCP wiring, and the guardrails written to stop the agents themselves.
- [Security](https://pixelium.win/securite): Defense-in-depth across the fleet — SSH hardening, PKI, CrowdSec, Wazuh, Authentik SSO.
- [Status](https://pixelium.win/status): Live infrastructure status — tri-state monitoring (up · on-demand · down), pushed from the homelab every 5 minutes.
- [Now](https://pixelium.win/now): Current focus (homelab ops, upstream contributions, offensive training, writing) and the full hardware & software stack.

## Projects, contributions & CTF

- [Projects](https://pixelium.win/projets): Production projects + AI infrastructure layer — prompt-injection challenge, BBS terminal, conversational CV, SSO, observability, autonomous backup, CI/CD.
- [Open-source contributions](https://pixelium.win/contributions): Shipped and in-progress OSS work; each PR links to GitHub and, where it earns it, to a PR note on the blog.
- [CTF profiles](https://pixelium.win/ctf): Capture The Flag — HackTheBox, TryHackMe, Root-Me. Verified offensive-security training.

## Interactive & demos

- [Chat with Claude](https://pixelium.win/chat): AI-powered conversational CV — ask about Stéphane's profile, skills, and infrastructure.
- [WOPR Terminal (BBS)](https://pixelium.win/bbs): Retro BBS — chat with Joshua, browse the bulletin boards. "Shall we play a game?"
- [BREACH — WOPR door game](https://pixelium.win/breach): Hands-on AI-security challenge — extract launch codes by prompt injection across 4 escalating defense levels. Built on Cloudflare Workers AI.

## Optional

- [Blog](https://blog.pixelium.win): Technical write-ups — homelab deep-dives, PR notes, and the engineering stories behind the projects.
- [humans.txt](https://pixelium.win/humans.txt): The people (and the AI) behind the site, plus the full stack.
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
