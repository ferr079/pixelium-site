export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async ({ url }) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=3600',
  };

  try {
    const db = (env as any).HISTORY_DB;
    const days = Math.min(parseInt(url.searchParams.get('days') || '30'), 90);
    const since = new Date(Date.now() - days * 86_400_000).toISOString();

    // Get all snapshots within range
    const { results } = await db.prepare(
      'SELECT recorded_at, up, total, uptime_pct, down_services FROM snapshots WHERE recorded_at >= ? ORDER BY recorded_at ASC'
    ).bind(since).all();

    if (!results || !results.length) {
      return new Response(JSON.stringify({
        ok: true, days: [], total_days: 0,
        message: 'No history data yet. Snapshots are recorded hourly.',
      }), { status: 200, headers });
    }

    // Aggregate by day (YYYY-MM-DD)
    const byDay = new Map<string, { uptimes: number[]; downs: Set<string>; snapshots: number }>();

    for (const row of results as any[]) {
      const day = row.recorded_at.slice(0, 10); // YYYY-MM-DD
      if (!byDay.has(day)) {
        byDay.set(day, { uptimes: [], downs: new Set(), snapshots: 0 });
      }
      const d = byDay.get(day)!;
      d.uptimes.push(row.uptime_pct);
      d.snapshots++;
      try {
        const downList = JSON.parse(row.down_services || '[]');
        for (const name of downList) d.downs.add(name);
      } catch {}
    }

    // Build daily summaries
    const dailyData = Array.from(byDay.entries()).map(([date, d]) => ({
      date,
      uptime_pct: Math.round((d.uptimes.reduce((a, b) => a + b, 0) / d.uptimes.length) * 10) / 10,
      snapshots: d.snapshots,
      down_services: Array.from(d.downs),
    }));

    // Overall average
    const allUptimes = dailyData.map(d => d.uptime_pct);
    const avgUptime = allUptimes.length
      ? Math.round((allUptimes.reduce((a, b) => a + b, 0) / allUptimes.length) * 10) / 10
      : 0;

    return new Response(JSON.stringify({
      ok: true,
      avg_uptime: avgUptime,
      total_days: dailyData.length,
      days: dailyData,
    }), { status: 200, headers });

  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500, headers,
    });
  }
};
