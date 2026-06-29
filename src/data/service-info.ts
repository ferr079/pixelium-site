/**
 * service-info — short, factual blurbs for each homelab service shown on /status.
 * `what` = what the service is, `why` = why it earns its place in the infra.
 * Bilingual (EN/FR). Keys MUST match the service `name` pushed to the status KV
 * (and the PVE3_SERVICES labels). Powers the click-to-reveal popover on /status.
 */
export interface ServiceBlurb {
  what: { en: string; fr: string };
  why: { en: string; fr: string };
}

export const SERVICE_INFO: Record<string, ServiceBlurb> = {
  // ── Infrastructure ──────────────────────────────────────────────
  'Traefik': {
    what: { en: 'Reverse proxy and TLS terminator, configured as code.', fr: 'Reverse proxy et terminaison TLS, configuré en code.' },
    why: { en: 'Single entry point for every internal service — drop a file in conf.d/ and the HTTPS route exists, no restart.', fr: 'Point d\'entrée unique de chaque service interne — un fichier dans conf.d/ et la route HTTPS existe, sans redémarrage.' },
  },
  'TechnitiumDNS': {
    what: { en: 'Authoritative + recursive DNS server with DNS-over-TLS and blocklists.', fr: 'Serveur DNS autoritaire + récursif, DNS-over-TLS et blocklists.' },
    why: { en: 'Primary resolver for the whole lab — names, ad/tracker blocking and encrypted queries, all self-owned.', fr: 'Résolveur primaire de tout le lab — noms, blocage pub/trackers et requêtes chiffrées, entièrement maîtrisé.' },
  },
  'TechnitiumDNS 2': {
    what: { en: 'Secondary DNS instance, AXFR-synced from the primary.', fr: 'Instance DNS secondaire, synchronisée par AXFR depuis la primaire.' },
    why: { en: 'High availability: if one node sleeps or fails, name resolution never drops.', fr: 'Haute disponibilité : si un nœud dort ou tombe, la résolution de noms ne lâche jamais.' },
  },
  'step-ca': {
    what: { en: 'Private ACME certificate authority (Smallstep).', fr: 'Autorité de certification ACME privée (Smallstep).' },
    why: { en: 'Issues internal TLS certs the same way Let\'s Encrypt does, but locally — zero browser warnings, auto-renewed.', fr: 'Émet les certs TLS internes comme Let\'s Encrypt, mais en local — zéro avertissement navigateur, renouvellement auto.' },
  },
  'Headscale': {
    what: { en: 'Self-hosted control server for a Tailscale (WireGuard) mesh VPN.', fr: 'Serveur de contrôle self-hosted pour un mesh VPN Tailscale (WireGuard).' },
    why: { en: 'Secure remote access to the lab without exposing a single port to the internet.', fr: 'Accès distant sécurisé au lab sans exposer le moindre port sur internet.' },
  },
  'Authentik': {
    what: { en: 'Identity provider — OAuth2/OIDC, forward-auth, WebAuthn MFA.', fr: 'Fournisseur d\'identité — OAuth2/OIDC, forward-auth, MFA WebAuthn.' },
    why: { en: 'Single sign-on across heterogeneous services, with YubiKey MFA — one login for the whole lab.', fr: 'SSO sur des services hétérogènes, MFA YubiKey — un seul login pour tout le lab.' },
  },
  'Forgejo': {
    what: { en: 'Self-hosted Git forge (soft-fork of Gitea).', fr: 'Forge Git self-hosted (soft-fork de Gitea).' },
    why: { en: 'Source of truth for all code and configs — this site mirrors from here to GitHub.', fr: 'Source de vérité de tout le code et les configs — ce site est mirroré depuis ici vers GitHub.' },
  },
  'Forgejo Runner': {
    what: { en: 'CI/CD runner for Forgejo Actions, on Podman.', fr: 'Runner CI/CD pour Forgejo Actions, sur Podman.' },
    why: { en: 'Runs builds and pipelines locally, container-isolated — no cloud CI minutes.', fr: 'Exécute builds et pipelines en local, isolés en conteneur — zéro minute de CI cloud.' },
  },
  'NetBox': {
    what: { en: 'Source-of-truth IPAM and infrastructure inventory.', fr: 'IPAM et inventaire d\'infrastructure, source de vérité.' },
    why: { en: 'Documents IPs, VLANs and devices so the network is described, not guessed.', fr: 'Documente IPs, VLANs et équipements — le réseau est décrit, pas deviné.' },
  },
  'netboot.xyz': {
    what: { en: 'Network boot menu for installing OSes over PXE.', fr: 'Menu de démarrage réseau pour installer des OS en PXE.' },
    why: { en: 'Reinstall any machine from the network — no USB sticks, always up-to-date images.', fr: 'Réinstalle n\'importe quelle machine depuis le réseau — sans clé USB, images toujours à jour.' },
  },
  'Mosquitto MQTT': {
    what: { en: 'Lightweight MQTT message broker.', fr: 'Broker de messages MQTT léger.' },
    why: { en: 'The nervous system for IoT and inter-service messaging (Zigbee, Home Assistant, agents).', fr: 'Le système nerveux de l\'IoT et de la messagerie inter-services (Zigbee, Home Assistant, agents).' },
  },
  'Home Assistant': {
    what: { en: 'Home automation hub.', fr: 'Hub de domotique.' },
    why: { en: 'Local-first control of IoT devices — automations stay in the lab, not in a vendor cloud.', fr: 'Contrôle local-first des objets connectés — les automatisations restent dans le lab, pas dans un cloud tiers.' },
  },
  'Node-RED': {
    what: { en: 'Flow-based automation — wire devices, APIs and services in a browser.', fr: 'Automatisation par flux — câbler appareils, API et services dans le navigateur.' },
    why: { en: 'Ties MQTT, Zigbee and Home Assistant together into automations, no code.', fr: 'Relie MQTT, Zigbee et Home Assistant en automatisations, sans code.' },
  },
  'Zigbee2MQTT': {
    what: { en: 'Bridge exposing Zigbee devices over MQTT, vendor-independent.', fr: 'Pont exposant les appareils Zigbee via MQTT, indépendant des marques.' },
    why: { en: 'Frees sensors and bulbs from proprietary hubs and clouds — local control.', fr: 'Libère capteurs et ampoules des hubs et clouds propriétaires — contrôle local.' },
  },
  'Infisical': {
    what: { en: 'Self-hosted secrets manager.', fr: 'Gestionnaire de secrets self-hosted.' },
    why: { en: 'Central vault for tokens and credentials — secrets live here, never in code or commits.', fr: 'Coffre central pour tokens et identifiants — les secrets vivent ici, jamais dans le code ou les commits.' },
  },

  // ── Applications ────────────────────────────────────────────────
  'Homepage': {
    what: { en: 'Customizable service dashboard / start page.', fr: 'Dashboard de services / page d\'accueil personnalisable.' },
    why: { en: 'One pane to reach and watch every service in the lab.', fr: 'Une vue unique pour accéder et surveiller chaque service du lab.' },
  },
  'Jellyfin': {
    what: { en: 'Self-hosted media server.', fr: 'Serveur multimédia self-hosted.' },
    why: { en: 'Films and series streamed from the lab, no subscription, no tracking.', fr: 'Films et séries en streaming depuis le lab, sans abonnement ni tracking.' },
  },
  'Immich': {
    what: { en: 'Self-hosted photo & video backup with on-device ML.', fr: 'Sauvegarde photos & vidéos self-hosted avec ML embarqué.' },
    why: { en: 'A private Google Photos — face/object search runs on the lab GPU, images never leave home.', fr: 'Un Google Photos privé — la recherche visage/objet tourne sur le GPU du lab, les images ne sortent jamais.' },
  },
  'Kavita': {
    what: { en: 'Digital library server for books, comics and manga.', fr: 'Serveur de bibliothèque numérique (livres, comics, manga).' },
    why: { en: 'Self-hosted reading across devices, no third-party reader.', fr: 'Lecture self-hosted multi-appareils, sans lecteur tiers.' },
  },
  'FreshRSS': {
    what: { en: 'Self-hosted RSS/Atom feed aggregator.', fr: 'Agrégateur de flux RSS/Atom self-hosted.' },
    why: { en: 'Owns the tech-watch pipeline — feeds it reads drive automated upgrade radars.', fr: 'Porte la veille techno — les flux qu\'il lit alimentent les radars d\'upgrade automatisés.' },
  },
  'The Lounge': {
    what: { en: 'Self-hosted, always-on web IRC client.', fr: 'Client IRC web self-hosted, toujours connecté.' },
    why: { en: 'Persistent IRC presence without leaving a laptop on.', fr: 'Présence IRC persistante sans laisser un laptop allumé.' },
  },
  'ByteStash': {
    what: { en: 'Self-hosted code-snippet manager.', fr: 'Gestionnaire de snippets de code self-hosted.' },
    why: { en: 'A searchable home for the one-liners and configs worth keeping.', fr: 'Un foyer cherchable pour les one-liners et configs qui méritent d\'être gardés.' },
  },
  'draw.io': {
    what: { en: 'Self-hosted diagram editor.', fr: 'Éditeur de diagrammes self-hosted.' },
    why: { en: 'Architecture diagrams drawn locally, no account, no cloud storage.', fr: 'Diagrammes d\'architecture dessinés en local, sans compte ni stockage cloud.' },
  },
  'Excalidraw': {
    what: { en: 'Self-hosted virtual whiteboard.', fr: 'Tableau blanc virtuel self-hosted.' },
    why: { en: 'Quick hand-drawn sketches and flows, kept in the lab.', fr: 'Croquis et schémas rapides à main levée, gardés dans le lab.' },
  },
  'Joplin Server': {
    what: { en: 'Sync server for Joplin notes (E2E-encrypted).', fr: 'Serveur de synchro pour les notes Joplin (chiffrées E2E).' },
    why: { en: 'Notes synced across devices through the lab, not a vendor backend.', fr: 'Notes synchronisées entre appareils via le lab, pas un backend tiers.' },
  },
  'SilverBullet': {
    what: { en: 'Self-hosted, end-user-programmable notes and knowledge base (markdown).', fr: 'Prise de notes et base de connaissances self-hosted, programmable (markdown).' },
    why: { en: 'An extensible PKM with live queries and templates — local and hackable.', fr: 'Un PKM extensible avec requêtes et templates live — local et bidouillable.' },
  },
  'Hermes Agent': {
    what: { en: 'Autonomous Telegram agent running the night shift over the homelab.', fr: 'Agent Telegram autonome qui assure le quart de nuit sur le homelab.' },
    why: { en: 'Watches, reports and self-improves 24/7 — the resident agent after the AIops v2 trio.', fr: 'Surveille, rapporte et s\'améliore 24/7 — l\'agent résident depuis le trio AIops v2.' },
  },
  'Semaphore': {
    what: { en: 'Web UI for running Ansible playbooks.', fr: 'UI web pour lancer des playbooks Ansible.' },
    why: { en: 'One-click, audited execution of the IaC that provisions the whole fleet.', fr: 'Exécution en un clic et auditée de l\'IaC qui provisionne toute la flotte.' },
  },
  'Wiki.js Infra': {
    what: { en: 'Self-hosted documentation wiki.', fr: 'Wiki de documentation self-hosted.' },
    why: { en: 'The lab\'s long-form knowledge base — runbooks, service docs, decisions.', fr: 'La base de connaissance long format du lab — runbooks, docs de services, décisions.' },
  },
  'Termix': {
    what: { en: 'Web-based SSH terminal and connection manager.', fr: 'Terminal SSH et gestionnaire de connexions web.' },
    why: { en: 'Reach any host\'s shell from a browser, through SSO, no local client.', fr: 'Atteindre le shell de n\'importe quel hôte depuis un navigateur, via SSO, sans client local.' },
  },
  'Open WebUI': {
    what: { en: 'Chat front-end for local and gateway LLMs.', fr: 'Front-end de chat pour LLM locaux et passerelle.' },
    why: { en: 'A private ChatGPT-style UI over Ollama and LiteLLM — prompts stay in the lab.', fr: 'Une UI privée façon ChatGPT au-dessus d\'Ollama et LiteLLM — les prompts restent dans le lab.' },
  },
  'LiteLLM': {
    what: { en: 'Unified gateway/proxy for many LLM providers.', fr: 'Passerelle/proxy unifiée pour de nombreux fournisseurs LLM.' },
    why: { en: 'One OpenAI-compatible endpoint with virtual keys, budgets and failover — agents target it, not a vendor.', fr: 'Un endpoint compatible OpenAI avec clés virtuelles, budgets et failover — les agents le ciblent, pas un fournisseur.' },
  },
  'Jellystat': {
    what: { en: 'Statistics and analytics dashboard for Jellyfin.', fr: 'Dashboard de statistiques et analytics pour Jellyfin.' },
    why: { en: 'Insight into what gets watched, served locally.', fr: 'Visibilité sur ce qui est regardé, servie en local.' },
  },
  'SearXNG': {
    what: { en: 'Privacy-respecting metasearch engine.', fr: 'Métamoteur de recherche respectueux de la vie privée.' },
    why: { en: 'Aggregates search results without profiling — also a clean source for agents.', fr: 'Agrège les résultats de recherche sans profilage — aussi une source propre pour les agents.' },
  },
  'Homelable': {
    what: { en: 'Interactive homelab topology visualizer with live monitoring.', fr: 'Visualiseur interactif de topologie homelab avec monitoring live.' },
    why: { en: 'The source of this site\'s network map — it scans, maps and exposes the canvas via MCP.', fr: 'La source de la carte réseau de ce site — il scanne, cartographie et expose le canvas via MCP.' },
  },

  // ── Monitoring & Security ───────────────────────────────────────
  'Beszel': {
    what: { en: 'Lightweight server monitoring with per-host agents.', fr: 'Monitoring serveur léger avec agents par hôte.' },
    why: { en: 'CPU/RAM/disk health across the fleet, with native alerting to ntfy.', fr: 'Santé CPU/RAM/disque sur toute la flotte, alerting natif vers ntfy.' },
  },
  'Wazuh': {
    what: { en: 'Open-source SIEM and host intrusion detection.', fr: 'SIEM open-source et détection d\'intrusion hôte.' },
    why: { en: 'Security eyes on every host — file integrity, log analysis, threat detection.', fr: 'Des yeux sécurité sur chaque hôte — intégrité fichiers, analyse de logs, détection de menaces.' },
  },
  'VictoriaMetrics': {
    what: { en: 'High-performance time-series metrics database.', fr: 'Base de métriques time-series haute performance.' },
    why: { en: 'Stores the lab\'s metrics efficiently — the backend Grafana queries.', fr: 'Stocke les métriques du lab efficacement — le backend que Grafana interroge.' },
  },
  'Prometheus-PVE-Exporter': {
    what: { en: 'Exporter that turns the Proxmox VE API into Prometheus metrics.', fr: 'Exporter qui transforme l\'API Proxmox VE en métriques Prometheus.' },
    why: { en: 'Feeds node/VM/CT metrics into VictoriaMetrics and Grafana.', fr: 'Alimente VictoriaMetrics et Grafana en métriques nœuds/VM/CT.' },
  },
  'Patchmon': {
    what: { en: 'Patch / update status tracker across hosts.', fr: 'Suivi de l\'état des patchs / mises à jour sur les hôtes.' },
    why: { en: 'Shows at a glance what needs updating — no host drifts unpatched.', fr: 'Montre d\'un coup d\'œil ce qui doit être mis à jour — aucun hôte ne dérive non patché.' },
  },
  'Loki': {
    what: { en: 'Log aggregation system (Grafana stack).', fr: 'Système d\'agrégation de logs (stack Grafana).' },
    why: { en: 'Central, queryable logs from every host via Grafana Alloy.', fr: 'Logs centralisés et cherchables depuis chaque hôte via Grafana Alloy.' },
  },
  'Glance': {
    what: { en: 'Self-hosted information / feeds dashboard.', fr: 'Dashboard d\'informations / flux self-hosted.' },
    why: { en: 'A single glance at lab status, feeds and metrics.', fr: 'Un seul coup d\'œil sur l\'état du lab, les flux et les métriques.' },
  },
  'Grafana': {
    what: { en: 'Metrics & logs visualization and alerting.', fr: 'Visualisation de métriques & logs et alerting.' },
    why: { en: 'The dashboards that turn VictoriaMetrics and Loki data into something readable.', fr: 'Les dashboards qui rendent lisibles les données de VictoriaMetrics et Loki.' },
  },
  'changedetection': {
    what: { en: 'Website change monitor.', fr: 'Moniteur de changement de pages web.' },
    why: { en: 'Watches pages without a feed — e.g. OSS PR/issue threads we contribute to.', fr: 'Surveille les pages sans flux — ex. les PR/issues OSS où l\'on contribue.' },
  },
  'Dagu': {
    what: { en: 'Lightweight workflow / DAG scheduler.', fr: 'Ordonnanceur de workflows / DAG léger.' },
    why: { en: 'Runs the scheduled jobs that push this site\'s live stats and watch releases.', fr: 'Exécute les jobs planifiés qui poussent les stats live de ce site et surveillent les releases.' },
  },
  'ntfy': {
    what: { en: 'Simple pub/sub push-notification server.', fr: 'Serveur de notifications push pub/sub simple.' },
    why: { en: 'Where every alert lands — Beszel, Wazuh, CrowdSec, cron jobs all notify here.', fr: 'Là où atterrit chaque alerte — Beszel, Wazuh, CrowdSec, crons notifient ici.' },
  },
  'Healthchecks': {
    what: { en: 'Dead-man\'s-switch monitoring for cron jobs.', fr: 'Surveillance « dead-man switch » pour les jobs cron.' },
    why: { en: 'Catches the job that silently stopped running — absence is the alert.', fr: 'Attrape le job qui s\'est arrêté en silence — l\'absence est l\'alerte.' },
  },
  'Uptime-Kuma': {
    what: { en: 'Self-hosted uptime/status monitor.', fr: 'Moniteur d\'uptime/statut self-hosted.' },
    why: { en: 'Independent probe of service availability, with its own history.', fr: 'Sonde indépendante de disponibilité des services, avec son propre historique.' },
  },

  // ── Storage & Backup ────────────────────────────────────────────
  'PBS': {
    what: { en: 'Proxmox Backup Server — incremental, deduplicated backups.', fr: 'Proxmox Backup Server — sauvegardes incrémentales et dédupliquées.' },
    why: { en: 'The safety net for every container and VM — restore-tested, not just stored.', fr: 'Le filet de sécurité de chaque conteneur et VM — restauration testée, pas juste stockée.' },
  },
  'share2': {
    what: { en: 'Samba/CIFS network file share.', fr: 'Partage de fichiers réseau Samba/CIFS.' },
    why: { en: 'Shared storage reachable across the lab and the workstation.', fr: 'Stockage partagé accessible depuis le lab et la workstation.' },
  },
  'share3 (Samba)': {
    what: { en: 'Samba/CIFS share for cold storage on the on-demand node.', fr: 'Partage Samba/CIFS pour le stockage froid sur le nœud à la demande.' },
    why: { en: 'Bulk/archival files parked on the WOL node, woken only when needed.', fr: 'Fichiers volumineux/archives parqués sur le nœud WOL, réveillé seulement au besoin.' },
  },
  'APT Cache': {
    what: { en: 'Caching proxy for Debian/APT packages.', fr: 'Proxy de cache pour les paquets Debian/APT.' },
    why: { en: 'Downloads a package once, serves it to every CT — faster updates, less bandwidth.', fr: 'Télécharge un paquet une fois, le sert à chaque CT — updates plus rapides, moins de bande passante.' },
  },

  // ── pve3 on-demand tools (not in continuous monitoring) ─────────
  'Kiwix': {
    what: { en: 'Offline content server for ZIM archives (Wikipedia, Stack Exchange…).', fr: 'Serveur de contenu offline pour archives ZIM (Wikipédia, Stack Exchange…).' },
    why: { en: 'Gigabytes of knowledge readable with the internet unplugged — and now a query source for local LLMs.', fr: 'Des gigaoctets de savoir consultables internet débranché — et désormais une source à interroger pour les LLM locaux.' },
  },
  'IT-Tools': {
    what: { en: 'Self-hosted box of ~100 developer/sysadmin utilities.', fr: 'Boîte self-hosted d\'environ 100 utilitaires dev/sysadmin.' },
    why: { en: 'Encoders, formatters, converters, generators — all client-side, all offline-capable.', fr: 'Encodeurs, formatters, convertisseurs, générateurs — tout côté client, tout utilisable offline.' },
  },
  'Transmute': {
    what: { en: 'Self-hosted file converter with a REST API.', fr: 'Convertisseur de fichiers self-hosted avec API REST.' },
    why: { en: 'Convert documents and media locally, scriptable — no upload to a web service.', fr: 'Convertit documents et médias en local, scriptable — sans upload vers un service web.' },
  },
  'CyberChef': {
    what: { en: 'The "cyber swiss-army knife" for data transforms.', fr: 'Le « couteau suisse cyber » pour transformer la donnée.' },
    why: { en: 'Encoding, crypto, parsing recipes — invaluable for CTF and forensics, kept local.', fr: 'Recettes d\'encodage, crypto, parsing — précieux en CTF et forensics, gardé en local.' },
  },
  'Stirling-PDF': {
    what: { en: 'Self-hosted PDF toolkit (merge, split, OCR, sign…).', fr: 'Boîte à outils PDF self-hosted (fusion, découpe, OCR, signature…).' },
    why: { en: 'Everything you\'d send to a sketchy "free PDF" site — done locally instead.', fr: 'Tout ce qu\'on enverrait à un site « PDF gratuit » douteux — fait en local à la place.' },
  },
  'Forworld': {
    what: { en: 'Offline Git mirror vault — 170+ repos on a cold-storage node.', fr: 'Coffre de miroirs Git offline — 170+ dépôts sur un nœud de stockage froid.' },
    why: { en: 'Survives upstream loss: infra, AI and pentest repos kept reachable offline.', fr: 'Survit à la perte de l\'upstream : dépôts infra, IA et pentest accessibles offline.' },
  },
  'web-check': {
    what: { en: 'Self-hosted OSINT tool that X-rays any website (headers, DNS, TLS, stack…).', fr: 'Outil OSINT self-hosted qui radiographie n\'importe quel site (headers, DNS, TLS, stack…).' },
    why: { en: 'Recon and posture checks on demand, without leaking the target to a SaaS.', fr: 'Recon et vérifs de posture à la demande, sans fuiter la cible vers un SaaS.' },
  },
};
