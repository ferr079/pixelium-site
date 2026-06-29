export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const DEDUP_MINUTES = 55;
const RETENTION_DAYS = 30;

export const POST: APIRoute = async ({ request }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  // Auth check
  const authKey = request.headers.get('X-History-Key');
  const expectedKey = (env as any).HISTORY_KEY;
  if (!authKey || !expectedKey || authKey !== expectedKey) {
    return new Response(JSON.stringify({ ok: false, error: 'unauthorized' }), {
      status: 401, headers,
    });
  }

  try {
    const db = (env as any).HISTORY_DB;

    // Dedup: skip if last snapshot < 55 min ago
    const last = await db.prepare(
      'SELECT recorded_at FROM snapshots ORDER BY id DESC LIMIT 1'
    ).first<{ recorded_at: string }>();

    if (last) {
      const elapsed = Date.now() - new Date(last.recorded_at).getTime();
      if (elapsed < DEDUP_MINUTES * 60_000) {
        return new Response(JSON.stringify({
          ok: true, skipped: true,
          reason: `last snapshot ${Math.round(elapsed / 60_000)}min ago`,
        }), { status: 200, headers });
      }
    }

    // Read current status from KV
    const status = await env.STATUS_KV.get('services', { type: 'json' }) as any;
    if (!status?.summary) {
      return new Response(JSON.stringify({ ok: false, error: 'no status data in KV' }), {
        status: 404, headers,
      });
    }

    // pve3 services are Wake-on-LAN (on-demand): exclude them so an intentionally
    // sleeping node doesn't get recorded as downtime in the 30-day history. Mirrors
    // PVE3_SERVICES in status.astro. Falls back to summary if no services array.
    const PVE3_SERVICES = new Set(['PBS', 'netboot.xyz', 'CyberChef', 'Stirling-PDF', 'draw.io', 'Excalidraw', 'Forworld', 'web-check']);
    const core = (status.services || []).filter((s: any) => !PVE3_SERVICES.has(s.name));
    const hasCore = core.length > 0;
    const total = hasCore ? core.length : status.summary.total;
    const up = hasCore ? core.filter((s: any) => s.status === 'up').length : status.summary.up;
    const uptime_pct = hasCore
      ? (total ? Math.round((up / total) * 1000) / 10 : 100)
      : status.summary.uptime_pct;
    const downServices = core
      .filter((s: any) => s.status === 'down')
      .map((s: any) => s.name);

    // Insert snapshot
    await db.prepare(
      'INSERT INTO snapshots (recorded_at, up, total, uptime_pct, down_services) VALUES (?, ?, ?, ?, ?)'
    ).bind(
      new Date().toISOString(),
      up, total, uptime_pct,
      JSON.stringify(downServices),
    ).run();

    // Purge old entries (> 30 days)
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString();
    await db.prepare('DELETE FROM snapshots WHERE recorded_at < ?').bind(cutoff).run();

    return new Response(JSON.stringify({
      ok: true, recorded: true,
      snapshot: { up, total, uptime_pct, down: downServices },
    }), { status: 200, headers });

  } catch (e: any) {
    console.error('history/record error:', e?.message);
    return new Response(JSON.stringify({ ok: false, error: 'internal error' }), {
      status: 500, headers,
    });
  }
};
