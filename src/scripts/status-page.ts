  import { PVE3_SERVICES, PVE3_SET } from '../lib/pve3-services';
/**
 * status-page — client de /status, partagé par la version EN et la version FR.
 *
 * Avant (jusqu'au 2026-07-30) : ces ~340 lignes étaient forkées entre
 * `status.astro` et `fr/status.astro`. Tout correctif métier (uptime core hors
 * pve3, artefact de sonde, seuils des barres) devait être appliqué deux fois, et
 * l'oublier produisait un bug visible dans UNE SEULE langue — le pire cas, parce
 * que personne ne teste les deux. Mesuré avant fusion : 343 lignes EN / 342 FR,
 * dont seulement 13 chaînes d'interface réellement différentes. Le reste était
 * identique, commentaires traduits mis à part.
 *
 * La langue est lue sur <html lang> (le popover de services le faisait déjà) :
 * une seule implémentation, deux dictionnaires.
 */
const LANG = (document.documentElement.lang || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';

const STRINGS = {
  en: {
    catMonitoring: 'MONITORING & SECURITY',
    catStorage: 'STORAGE & BACKUP',
    awake: '◉ awake',
    asleep: '◌ asleep',
    pve3Awake: 'Node powered on right now — services reachable.',
    pve3Asleep: 'Node powered on when needed — sleeping is not down.',
    justNow: 'just now',
    minAgo: (m) => m + ' min ago',
    stale: (age) => 'Homelab unreachable — last data received ' + age + ' ago. Displayed values may be outdated.',
    uptimeHours: (h) => h + 'h uptime',
    uptimeDays: (d) => d + 'd uptime',
    poweredOnDemand: 'powered on when needed',
    metricsUnavailable: 'metrics unavailable',
    online: 'online',
    offline: 'offline',
  },
  fr: {
    catMonitoring: 'MONITORING & SÉCURITÉ',
    catStorage: 'STOCKAGE & SAUVEGARDE',
    awake: '◉ réveillé',
    asleep: '◌ en veille',
    pve3Awake: 'Nœud allumé en ce moment — services accessibles.',
    pve3Asleep: 'Nœud allumé à la demande — en veille ne veut pas dire down.',
    justNow: "à l'instant",
    minAgo: (m) => 'il y a ' + m + ' min',
    stale: (age) => 'Homelab injoignable — dernières données reçues il y a ' + age + '. Les valeurs affichées peuvent être obsolètes.',
    uptimeHours: (h) => h + "h d'uptime",
    uptimeDays: (d) => d + "j d'uptime",
    poweredOnDemand: 'allumé à la demande',
    metricsUnavailable: 'métriques indisponibles',
    online: 'en ligne',
    offline: 'hors ligne',
  },
};
const T = STRINGS[LANG];

  // Category display order and labels — data is trusted (from our own KV, pushed by Dagu)
  const categoryLabels: Record<string, string> = {
    infra: 'INFRASTRUCTURE',
    apps: 'APPLICATIONS',
    monitoring: T.catMonitoring,
    storage: T.catStorage,
  };

  function barColor(pct: number): string {
    if (pct > 85) return '#ef4444';
    if (pct > 65) return '#eab308';
    return '#38bdf8';
  }

  function el(tag: string, className: string, text?: string): HTMLElement {
    const e = document.createElement(tag);
    e.className = className;
    if (text) e.textContent = text;
    return e;
  }

  // ── Service info popover ──────────────────────────────────────
  const SVC_INFO: Record<string, any> = (() => {
    try { return JSON.parse(document.getElementById('svc-info')?.textContent || '{}'); }
    catch { return {}; }
  })();
  const SVC_LANG = (document.documentElement.lang || 'en').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  const WHY_LABEL = SVC_LANG === 'fr' ? "Pourquoi c'est là" : "Why it's here";

  function openServicePopover(name: string) {
    const info = SVC_INFO[name];
    if (!info) return;
    const pop = document.getElementById('svc-popover');
    const t = document.getElementById('svc-pop-title');
    const w = document.getElementById('svc-pop-what');
    const wl = document.getElementById('svc-pop-why-label');
    const wt = document.getElementById('svc-pop-why-text');
    if (!pop || !t || !w || !wl || !wt) return;
    t.textContent = name;
    w.textContent = info.what?.[SVC_LANG] || info.what?.en || '';
    wl.textContent = WHY_LABEL;
    wt.textContent = info.why?.[SVC_LANG] || info.why?.en || '';
    pop.style.display = 'flex';
  }
  function closeServicePopover() {
    const pop = document.getElementById('svc-popover');
    if (pop) pop.style.display = 'none';
  }
  function wireServiceCard(card: HTMLElement, name: string) {
    if (!SVC_INFO[name]) return;
    card.classList.add('has-info');
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.addEventListener('click', () => openServicePopover(name));
    card.addEventListener('keydown', (ev) => {
      const k = (ev as KeyboardEvent).key;
      if (k === 'Enter' || k === ' ') { ev.preventDefault(); openServicePopover(name); }
    });
  }
  // Document-level Escape stays module-scoped (unique); element bindings move
  // into initStatusPage() — fresh elements arrive on every client-side visit.
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') closeServicePopover(); });

  // pve3 is a Wake-on-LAN node that sleeps by design. Its services get their own
  // section, with state derived from the node: awake → real monitored state, asleep →
  // on-demand (sky), never red while sleeping. The shared PVE3 list (lib/pve3-services)
  // keeps them out of the core uptime.
  function renderOnDemand(data: any) {
    const section = document.getElementById('ondemand-section');
    const grid = document.getElementById('ondemand-grid');
    const stateEl = document.getElementById('ondemand-state');
    const noteEl = document.getElementById('ondemand-note');
    if (!section || !grid) return;

    const pve3 = (data.nodes || []).find((n: any) => n.name === 'pve3');
    const pve3State = pve3 ? (pve3.state || pve3.status || (pve3.cpu != null ? 'up' : 'offline')) : 'offline';
    const awake = pve3State === 'up';

    const byName: Record<string, any> = {};
    for (const sv of data.services || []) byName[sv.name] = sv;

    if (stateEl) {
      stateEl.textContent = awake ? T.awake : T.asleep;
      stateEl.className = 'ondemand-state ' + (awake ? 'awake' : 'asleep');
    }
    if (noteEl) noteEl.textContent = awake
      ? T.pve3Awake
      : T.pve3Asleep;

    grid.innerHTML = '';
    for (const name of PVE3_SERVICES) {
      const svc = byName[name];
      // asleep → everything on-demand (sky); awake → real monitored state, tools assumed up.
      let state: string;
      if (!awake) state = 'on-demand';
      else if (svc) state = svc.status === 'up' ? 'up' : 'down';
      else state = 'up';

      const card = el('div', 'service-card');
      card.appendChild(el('span', 'svc-dot ' + state));
      card.appendChild(el('span', 'svc-name', name));
      if (state === 'on-demand') {
        card.appendChild(el('span', 'svc-ondemand', 'WOL'));
      } else {
        card.appendChild(el('span', 'svc-latency', svc && svc.latency != null ? svc.latency + 'ms' : '--'));
      }
      wireServiceCard(card, name);
      grid.appendChild(card);
    }
    section.style.display = 'block';
  }

  async function loadStatus() {
    try {
      const res = await fetch('/api/status');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.services || !data.services.length) return;

      // Summary
      const s = data.summary;
      if (s) {
        const upEl = document.getElementById('summary-up');
        const totalEl = document.getElementById('summary-total');
        const uptimeEl = document.getElementById('summary-uptime');
        const nodesEl = document.getElementById('summary-nodes');
        const dot = document.getElementById('global-dot');
        // Core fleet = always-on services. pve3 (WOL) services live in their own
        // section and are excluded from up/total/uptime — an intentionally-sleeping
        // node must not drag the headline below 100%.
        const core = data.services.filter((sv: any) => !PVE3_SET.has(sv.name));
        const coreUp = core.filter((sv: any) => sv.status === 'up').length;
        const coreTotal = core.length;
        const corePct = coreTotal ? Math.round((coreUp / coreTotal) * 1000) / 10 : 100;
        if (upEl) upEl.textContent = String(coreUp);
        if (totalEl) totalEl.textContent = String(coreTotal);
        if (uptimeEl) uptimeEl.textContent = corePct + '%';
        if (nodesEl) nodesEl.textContent = data.nodes ? String(data.nodes.length) : '--';
        const realDown = coreTotal - coreUp;
        if (dot) dot.classList.add(realDown > 0 ? 'degraded' : 'healthy');
      }

      // Timestamp + staleness banner
      if (data.updated_at) {
        const mins = Math.round((Date.now() - new Date(data.updated_at).getTime()) / 60000);
        const tsEl = document.getElementById('summary-updated');
        if (tsEl) tsEl.textContent = mins < 1 ? T.justNow : T.minAgo(mins);

        if (data.homelab_status === 'unreachable') {
          const banner = document.getElementById('stale-banner');
          const text = document.getElementById('stale-text');
          if (banner) banner.style.display = 'flex';
          if (text) {
            const hours = Math.floor(mins / 60);
            const remainder = mins % 60;
            const age = hours > 0 ? hours + 'h' + (remainder > 0 ? remainder + 'm' : '') : mins + 'm';
            text.textContent = T.stale(age);
          }
        }
      }

      // Services grouped by category (pve3 WOL services handled in their own section)
      const grouped: Record<string, any[]> = {};
      for (const svc of data.services) {
        if (PVE3_SET.has(svc.name)) continue;
        const cat = svc.category || 'apps';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(svc);
      }

      const container = document.getElementById('services-grid');
      if (!container) return;

      for (const [cat, label] of Object.entries(categoryLabels)) {
        const svcs = grouped[cat];
        if (!svcs || !svcs.length) continue;

        const section = el('div', 'service-category');
        section.appendChild(el('h3', 'category-title', label));

        const grid = el('div', 'service-grid');
        for (const svc of svcs) {
          const isUp = svc.status === 'up';
          const card = el('div', 'service-card');
          card.appendChild(el('span', 'svc-dot ' + (isUp ? 'up' : 'down')));
          card.appendChild(el('span', 'svc-name', svc.name));
          card.appendChild(el('span', 'svc-latency', svc.latency != null ? svc.latency + 'ms' : '--'));
          wireServiceCard(card, svc.name);
          grid.appendChild(card);
        }

        section.appendChild(grid);
        container.appendChild(section);
      }

      document.getElementById('services-loading')!.style.display = 'none';
      container.style.display = 'block';

      // On-demand section (pve3 WOL) — derived from the node state
      renderOnDemand(data);

      // Nodes
      if (data.nodes && data.nodes.length) {
        const nodesContainer = document.getElementById('nodes-grid');
        if (!nodesContainer) return;

        // Probe guard: a permanent node (not pve3 WOL) reported "offline" while the homelab
        // is reachable AND the core fleet is at 100% cannot really be down — it's the pipeline's
        // Proxmox API node probe that failed (token, timeout). Render it "online · metrics
        // unavailable" instead of a misleading red. If the node were truly down, its services
        // would drop → core < 100% → this fallback won't fire and red returns. Source of truth
        // remains the homelab pipeline.
        const sm = data.summary || {};
        const homelabHealthy = data.homelab_status === 'online'
          && sm.total_core > 0 && sm.up_core === sm.total_core;

        for (const node of data.nodes) {
          const card = el('div', 'node-card');
          // derive normalized state — tolerate both 'state' (v2) and 'status' (legacy)
          const rawState = (node.state || node.status || (node.cpu != null ? 'up' : 'offline')) as string;
          const probeArtifact = rawState === 'offline' && node.name !== 'pve3' && homelabHealthy;
          const nodeState = probeArtifact ? 'up' : rawState;
          card.classList.add('node-' + nodeState);

          card.appendChild(el('h4', 'node-name', node.name));

          if (nodeState === 'up' && node.cpu != null) {
            for (const [metric, value] of [['CPU', node.cpu], ['RAM', node.ram]] as [string, number][]) {
              const row = el('div', 'node-metric');
              row.appendChild(el('span', 'metric-label', metric));
              const bar = el('div', 'bar');
              const fill = el('div', 'bar-fill');
              (fill as HTMLElement).style.width = value + '%';
              (fill as HTMLElement).style.background = barColor(value);
              bar.appendChild(fill);
              row.appendChild(bar);
              row.appendChild(el('span', 'metric-value', value + '%'));
              card.appendChild(row);
            }
            // uptime: « Nh » under 24h (uptime_hours, payload v2), else « Nd » (floor, not
            // round → no « 1d » for a 13h node). Fallback to uptime_days if field absent (old blob).
            const uh = node.uptime_hours;
            const uptimeText = uh != null
              ? (uh < 24 ? T.uptimeHours(uh) : T.uptimeDays(Math.floor(uh / 24)))
              : T.uptimeDays(node.uptime_days);
            card.appendChild(el('div', 'node-uptime', uptimeText));
          } else if (nodeState === 'on-demand') {
            card.appendChild(el('span', 'node-ondemand', 'on-demand · WOL'));
            card.appendChild(el('div', 'node-sub', T.poweredOnDemand));
          } else if (probeArtifact) {
            card.appendChild(el('span', 'node-ondemand', T.online));
            card.appendChild(el('div', 'node-sub', T.metricsUnavailable));
          } else {
            card.appendChild(el('span', 'node-offline', T.offline));
          }

          nodesContainer.appendChild(card);
        }

        document.getElementById('nodes-loading')!.style.display = 'none';
        nodesContainer.style.display = 'grid';
      }
    } catch (_) { /* keep skeletons */ }
  }

  function initStatusPage() {
    const grid = document.getElementById('services-grid');
    if (!grid || grid.dataset.init) return; // guard: module load + initial astro:page-load
    grid.dataset.init = '1';
    document.getElementById('svc-pop-close')?.addEventListener('click', closeServicePopover);
    document.getElementById('svc-popover')?.addEventListener('click', (ev) => {
      if (ev.target === document.getElementById('svc-popover')) closeServicePopover();
    });
    loadStatus();
  }
  initStatusPage();
  document.addEventListener('astro:page-load', initStatusPage);
  // Uptime 30-day timeline
  async function loadHistory() {
    const barsHost = document.getElementById('uptime-bars');
    if (!barsHost || barsHost.dataset.init) return; // guard: module load + initial astro:page-load
    barsHost.dataset.init = '1';
    const section = document.querySelector('[data-lang]') as HTMLElement;
    const lang = section?.dataset.lang || 'en';
    const l = lang === 'fr'
      ? { avg: 'Moyenne', days: 'jours', nodata: 'Pas de données', down: 'down' }
      : { avg: 'Average', days: 'days', nodata: 'No data', down: 'down' };

    try {
      const res = await fetch('/api/history?days=30');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.days || !data.days.length) return;

      const barsEl = document.getElementById('uptime-bars');
      const avgEl = document.getElementById('uptime-avg');
      const periodEl = document.getElementById('uptime-period');
      if (!barsEl) return;

      // Fill missing days in the 30-day range
      const dayMap = new Map(data.days.map((d: any) => [d.date, d]));
      const bars: any[] = [];
      for (let i = 29; i >= 0; i--) {
        const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
        bars.push(dayMap.get(date) || { date, uptime_pct: null, down_services: [] });
      }

      for (const day of bars) {
        const bar = document.createElement('div');
        bar.className = 'ubar';
        if (day.uptime_pct === null) {
          bar.classList.add('ubar-nodata');
          bar.title = `${day.date}: ${l.nodata}`;
        } else {
          const pct = day.uptime_pct;
          if (pct >= 99.5) bar.classList.add('ubar-perfect');
          else if (pct >= 95) bar.classList.add('ubar-good');
          else if (pct >= 90) bar.classList.add('ubar-degraded');
          else bar.classList.add('ubar-bad');

          const downText = day.down_services.length
            ? ` — ${day.down_services.join(', ')} ${l.down}` : '';
          bar.title = `${day.date}: ${pct}%${downText}`;
        }
        barsEl.appendChild(bar);
      }

      if (avgEl) avgEl.textContent = data.avg_uptime + '%';
      if (periodEl) periodEl.textContent = `${l.avg} ${data.total_days} ${l.days}`;

      document.getElementById('uptime-loading')!.style.display = 'none';
      document.getElementById('uptime-timeline')!.style.display = 'block';
    } catch (_) { /* keep loading state */ }
  }
  loadHistory();
  document.addEventListener('astro:page-load', loadHistory);
