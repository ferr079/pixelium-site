export const prerender = false;

import type { APIRoute } from 'astro';

// "THIS DEPLOYMENT" — the site proves its own delivery chain.
// Build provenance (sha/builtAt) is frozen at build time via vite.define;
// edge facts (colo/country/ray) are read live from the Cloudflare request serving this call.
// Each edge lookup is guarded: the cf-ray suffix already encodes the serving colo, so the
// colo resolves even if the richer `cf` object is unavailable in this runtime context.
export const GET: APIRoute = async ({ request, locals }) => {
  if (new URL(request.url).searchParams.get('debug') === '1') {
    const rt: any = (locals as any)?.runtime;
    return new Response(JSON.stringify({
      localsKeys: Object.keys((locals as any) || {}),
      runtimeKeys: Object.keys(rt || {}),
      cfType: typeof rt?.cf,
      cfKeys: Object.keys(rt?.cf || {}),
      reqCfType: typeof (request as any).cf,
      reqCfKeys: Object.keys((request as any).cf || {}),
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  let colo: string | null = null;
  let country: string | null = null;
  let city: string | null = null;
  let protocol: string | null = null;
  let ray: string | null = null;

  try {
    ray = request.headers.get('cf-ray');
    // cf-ray looks like "8f1c2d3e4f5a6b7c-CDG" — the suffix is the serving colo (IATA code).
    if (ray && ray.includes('-')) colo = ray.split('-').pop() ?? null;
  } catch { /* no cf-ray header */ }

  try {
    const cf: any = (locals as any)?.runtime?.cf ?? (request as any).cf ?? {};
    if (cf.colo) colo = cf.colo;
    country = cf.country ?? null;
    city = cf.city ?? null;
    protocol = cf.httpProtocol ?? null;
  } catch { /* cf object unavailable — colo already derived from ray */ }

  const body = {
    sha: import.meta.env.PUBLIC_COMMIT_SHA ?? 'dev',
    builtAt: import.meta.env.PUBLIC_BUILD_TIME ?? null,
    colo,
    country,
    city,
    protocol,
    ray,
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
};
