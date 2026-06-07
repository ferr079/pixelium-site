// F-007 (#97) — security headers sur les réponses rendues par le Worker.
// Les pages statiques sont couvertes par public/_headers (Workers Assets),
// mais les routes on-demand (/api/*) sortaient sans aucun header de sécurité.
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Les routes API ne servent que du JSON/SSE — CSP minimale, rien à exécuter.
  if (!response.headers.has('Content-Security-Policy')) {
    response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'self'");
  }

  return response;
});
