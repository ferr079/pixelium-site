export const prerender = false;

import type { APIRoute } from 'astro';

// "THIS DEPLOYMENT" — the site proves its own delivery chain.
// Build provenance (sha/builtAt) is frozen at build time via vite.define;
// edge facts (colo/country/ray) are read live from the Cloudflare request serving this call.
export const GET: APIRoute = async ({ request, locals }) => {
  const cf: any = (locals as any)?.runtime?.cf ?? (request as any).cf ?? {};
  const ray = request.headers.get('cf-ray');
  // cf-ray looks like "8f1c2d3e4f5a6b7c-CDG" — the suffix is the serving colo (IATA code).
  const coloFromRay = ray && ray.includes('-') ? ray.split('-').pop() : null;

  const body = {
    sha: import.meta.env.PUBLIC_COMMIT_SHA ?? 'dev',
    builtAt: import.meta.env.PUBLIC_BUILD_TIME ?? null,
    colo: cf.colo ?? coloFromRay ?? null,
    country: cf.country ?? null,
    city: cf.city ?? null,
    protocol: cf.httpProtocol ?? null,
    ray: ray ?? null,
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
