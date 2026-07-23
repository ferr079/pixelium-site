/**
 * pve3 is a Wake-on-LAN node that sleeps by design — its services are
 * on-demand, not down. Single source of truth for every surface that has to
 * tell them apart from the always-on core fleet: the hero cockpit (counter +
 * topology tint), the /status on-demand section (EN + FR), and the 30-day
 * history recorder. All pve3 services are in the kv-push monitoring payload,
 * so their awake state is real; this list keeps them out of the core uptime.
 */
export const PVE3_SERVICES = ['PBS', 'netboot.xyz', 'Kiwix', 'IT-Tools', 'Transmute', 'CyberChef', 'Stirling-PDF', 'draw.io', 'Excalidraw', 'Forworld', 'web-check', 'share3 (Samba)'];
export const PVE3_SET = new Set(PVE3_SERVICES);
