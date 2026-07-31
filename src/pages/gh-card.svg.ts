import type { APIRoute } from 'astro';
import { getCardData, renderStatsCard, svgResponse } from '../lib/gh-card';

// Generated at build time — see src/lib/gh-card.ts for why this is not a runtime route.
export const prerender = true;

export const GET: APIRoute = async () => svgResponse(renderStatsCard(await getCardData()));
