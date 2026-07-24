import { z } from 'zod';

// Frontière de confiance KV : STATUS_KV/STATS_KV ne sont écrits que par le
// pipeline homelab (kv-push.sh), mais le Worker n'a aucun moyen de vérifier
// l'intégrité de ce qu'il y trouve — un bug du pipeline ou un token push
// compromis pourrait y déposer un JSON valide mais mal formé. `.passthrough()`
// partout : on valide la forme des champs qu'on consomme, sans bloquer sur un
// champ que kv-push ajouterait plus tard (cf. rootme_validations/uptime_hours,
// ajoutés après coup par le passé).

export const ServiceSchema = z.object({
  name: z.string(),
  status: z.enum(['up', 'down']),
  latency: z.number().nullable(),
  category: z.string(),
}).passthrough();

export const NodeSchema = z.object({
  name: z.string(),
  state: z.enum(['up', 'on-demand', 'offline']),
  cpu: z.number().optional(),
  ram: z.number().optional(),
  uptime_days: z.number().optional(),
  uptime_hours: z.number().optional(),
}).passthrough();

export const SummarySchema = z.object({
  total: z.number(),
  up: z.number(),
  down: z.number(),
  uptime_pct: z.number(),
  total_core: z.number(),
  up_core: z.number(),
  uptime_pct_core: z.number(),
}).passthrough();

export const StatusSchema = z.object({
  ok: z.boolean(),
  services: z.array(ServiceSchema),
  nodes: z.array(NodeSchema),
  summary: SummarySchema,
  updated_at: z.string(),
}).passthrough();

// STATS_KV (clé "stats") est un objet {ok, stats, updated_at} où `stats` est
// un sac de métriques plates qui grossit au fil des sessions (claude_*,
// htb_*, rootme_*, services_*...) — pas de schéma exhaustif par clé (churn
// trop élevé), juste une garantie de forme : un objet plat de scalaires, pas
// de tableau/objet imbriqué qui casserait le rendu en aval.
export const StatsBagSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

export const StatsPayloadSchema = z.object({
  ok: z.boolean(),
  stats: StatsBagSchema.nullable(),
  updated_at: z.string().nullable(),
}).passthrough();
