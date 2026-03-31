export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const GET: APIRoute = async () => {
  try {
    const data = await env.STATS_KV.get('stats', { type: 'json' });

    if (!data) {
      return new Response(JSON.stringify({
        ok: true,
        message: 'No stats data yet. Waiting for first push from homelab.',
        stats: null,
        updated_at: null,
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300',
        },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Failed to read stats' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
