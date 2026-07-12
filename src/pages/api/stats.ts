export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=300',
};

// Degrade gracefully instead of 500. A corrupted (non-JSON) `stats` value pushed by
// the homelab pipeline used to throw here and surface an HTTP 500 (2026-07-12 incident:
// kv-push wrote a non-JSON blob while capturing a new HTB box). Consumers — getBuildStats
// at build, the chatbot at runtime, the freshness guard — all already fall back on their
// own last-known snapshot when `stats` is null, so returning null (200) keeps the site
// serving baked numbers instead of breaking. `degraded` flags the condition for observers.
function degraded(reason: string): Response {
  return new Response(JSON.stringify({
    ok: false, degraded: true, error: reason, stats: null, updated_at: null,
  }), { status: 200, headers: JSON_HEADERS });
}

export const GET: APIRoute = async () => {
  let raw: string | null;
  try {
    // Read as text (never throws on non-JSON) so we can validate before parsing.
    raw = await env.STATS_KV.get('stats', { type: 'text' });
  } catch {
    return degraded('KV read failed');
  }

  if (!raw) {
    return new Response(JSON.stringify({
      ok: true,
      message: 'No stats data yet. Waiting for first push from homelab.',
      stats: null,
      updated_at: null,
    }), { status: 200, headers: JSON_HEADERS });
  }

  try {
    JSON.parse(raw); // validate; the raw text is already the JSON payload we serve
  } catch {
    return degraded('stats value is not valid JSON');
  }

  return new Response(raw, { status: 200, headers: JSON_HEADERS });
};
