export const prerender = false;

import type { APIRoute } from 'astro';

// "THIS DEPLOYMENT" — the site proves its own delivery chain.
// Build provenance (sha/builtAt) is frozen at build time via vite.define.
// Edge facts (colo/loc/tls) are read live from Cloudflare's reserved /cdn-cgi/trace endpoint,
// which the edge answers before the Worker runs — robust across adapter/runtime quirks
// (the `cf` object was not reliably populated via the Astro Cloudflare runtime).
export const GET: APIRoute = async ({ request }) => {
  let colo: string | null = null;
  let country: string | null = null;
  let ray: string | null = null;

  try { ray = request.headers.get('cf-ray'); } catch { /* no header */ }

  // Note: /cdn-cgi/trace's `http`/`tls` describe this internal sub-request, not the
  // visitor's connection, so we only surface colo + loc (the serving datacenter) — both honest.
  try {
    const res = await fetch('https://pixelium.win/cdn-cgi/trace');
    if (res.ok) {
      const map: Record<string, string> = {};
      for (const line of (await res.text()).trim().split('\n')) {
        const i = line.indexOf('=');
        if (i > 0) map[line.slice(0, i)] = line.slice(i + 1);
      }
      colo = map.colo ?? null;
      country = map.loc ?? null;
    }
  } catch { /* trace unreachable — provenance still returned */ }

  const body = {
    sha: import.meta.env.PUBLIC_COMMIT_SHA ?? 'dev',
    builtAt: import.meta.env.PUBLIC_BUILD_TIME ?? null,
    colo,
    country,
    ray,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
