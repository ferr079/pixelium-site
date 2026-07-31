import type { APIRoute } from 'astro';
import { getCardData, renderLanguagesCard, svgResponse } from '../lib/gh-card';

export const prerender = true;

export const GET: APIRoute = async () => svgResponse(renderLanguagesCard(await getCardData()));
