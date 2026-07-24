export const prerender = false;

import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { StatusSchema } from '../../lib/status-schema';

const HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Cache-Control': 'public, max-age=60',
};

export const GET: APIRoute = async () => {
  try {
    const data = await env.STATUS_KV.get('services', { type: 'json' });

    if (!data) {
      return new Response(JSON.stringify({
        ok: true,
        message: 'No status data yet. Waiting for first push from homelab.',
        services: [],
        updated_at: null,
      }), { status: 200, headers: HEADERS });
    }

    // Frontière de confiance : STATUS_KV n'est écrit que par kv-push, mais le
    // Worker n'a aucun moyen de vérifier l'intégrité de ce qu'il y trouve — un
    // bug pipeline ou un token push compromis pourrait y déposer un JSON valide
    // mais mal formé (audit sécu Grok 24/07, pixelium/web#18, item P2). Repli
    // sur la même forme "pas encore de données" déjà gérée par tous les
    // consommateurs (services:[] est déjà le cas "rien à afficher" existant).
    const parsed = StatusSchema.safeParse(data);
    if (!parsed.success) {
      console.error('[api/status] schema validation failed:', parsed.error.message);
      return new Response(JSON.stringify({
        ok: true,
        degraded: true,
        error: 'status payload failed schema validation',
        services: [],
        updated_at: null,
      }), { status: 200, headers: HEADERS });
    }

    const validated: Record<string, unknown> = { ...parsed.data };

    // Staleness detection: if data is older than 2 hours, homelab is likely unreachable
    const STALE_THRESHOLD_MS = 2 * 60 * 60 * 1000;
    const updatedAt = validated.updated_at as string;
    const age = Date.now() - new Date(updatedAt).getTime();
    validated.homelab_status = age > STALE_THRESHOLD_MS ? 'unreachable' : 'online';
    validated.data_age_minutes = Math.round(age / 60000);

    return new Response(JSON.stringify(validated), { status: 200, headers: HEADERS });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Failed to read status' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
