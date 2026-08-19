// F-007 (infra/homelab-infra#97) — security headers sur les réponses rendues par le Worker.
// Les pages statiques sont couvertes par public/_headers (Workers Assets),
// mais les routes on-demand (/api/*) sortaient sans aucun header de sécurité.
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (_context, next) => {
  const response = await next();

  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Resource-Policy', 'same-site');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  // Même valeur que public/_headers : les routes /api/* en sortaient dépourvues,
  // sans raison. Aucun effet sur du JSON — c'est la cohérence de politique entre
  // les deux surfaces qui compte, et ce qu'un garde-fou peut vérifier.
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

  // CSP minimale — posée UNIQUEMENT sur les réponses de données.
  //
  // Elle convient au JSON et au SSE, où il n'y a rien à exécuter ni à styler.
  // Posée sur du HTML, elle casse la page : `GET /api/chat` (la route existe,
  // mais sans handler GET) renvoyait la 404 du site avec `default-src 'none'`,
  // donc sans CSS ni script. Mesuré le 2026-08-20, cf pixelium/web#73.
  //
  // ⚠️ Le test « ce n'est pas du text/html » NE MARCHE PAS, vérifié en local le
  // 2026-08-20 : sur une 404, le Content-Type n'est pas encore posé quand ce
  // middleware s'exécute — il devient text/html plus loin dans la chaîne. Une
  // exclusion laisse donc passer exactement le cas qu'elle vise. D'où une liste
  // d'autorisation : on ne pose la CSP que si la réponse s'annonce déjà comme
  // des données. Tout le reste est laissé à public/_headers, qui porte la vraie
  // CSP du site — ne rien poser ici, c'est le laisser faire, pas ouvrir un trou.
  const contentType = response.headers.get('Content-Type') ?? '';
  const isData = contentType.includes('application/json') || contentType.includes('text/event-stream');
  if (isData && !response.headers.has('Content-Security-Policy')) {
    response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'; base-uri 'self'");
  }

  return response;
});
