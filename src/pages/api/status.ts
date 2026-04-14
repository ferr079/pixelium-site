export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  try {
    const data = await env.STATUS_KV.get('services', { type: 'json' });

    if (!data) {
      return new Response(JSON.stringify({
        ok: true,
        message: 'No status data yet. Waiting for first push from homelab.',
        services: [],
        updated_at: null,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=60',
        },
      });
    }

    // Staleness detection: if data is older than 2 hours, homelab is likely unreachable
    const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;
    if (data && typeof data === 'object') {
      const updatedAt = (data as any).updated_at;
      if (updatedAt) {
        const age = Date.now() - new Date(updatedAt).getTime();
        (data as any).homelab_status = age > STALE_THRESHOLD_MS ? 'unreachable' : 'online';
        (data as any).data_age_minutes = Math.round(age / 60000);
      }
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=60',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Failed to read status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
