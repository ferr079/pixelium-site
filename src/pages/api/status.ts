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
