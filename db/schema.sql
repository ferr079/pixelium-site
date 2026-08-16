-- Schéma de la base D1 `pixelium-history` (binding HISTORY_DB).
--
-- Pourquoi ce fichier existe : jusqu'au 2026-08-16, ce schéma n'existait QUE
-- dans la base de production. Time Travel couvre 30 jours de restauration
-- automatique, mais une perte totale aurait obligé à le reconstituer de
-- mémoire — et un index oublié à la reconstruction ne se voit pas, il rame
-- juste. Le contenu ci-dessous est un relevé fidèle de `sqlite_master` en
-- production, pas une réécriture.
--
-- Appliquer (idempotent) :
--   wrangler d1 execute pixelium-history --remote --file=db/schema.sql
-- En local :
--   wrangler d1 execute pixelium-history --local  --file=db/schema.sql

-- Un snapshot horaire de l'état des services, écrit par /api/history/record
-- (authentifié par X-History-Key), lu et agrégé par jour par /api/history.
-- Rétention 30 jours, purgée à l'écriture par le même endpoint.
CREATE TABLE IF NOT EXISTS snapshots (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  recorded_at   TEXT    NOT NULL,          -- ISO-8601 UTC
  up            INTEGER NOT NULL,          -- services up (hors pve3, on-demand/WOL)
  total         INTEGER NOT NULL,
  uptime_pct    REAL    NOT NULL,
  down_services TEXT    DEFAULT '[]'       -- tableau JSON de noms
);

-- Les deux seules requêtes chaudes filtrent sur recorded_at : la lecture
-- (`WHERE recorded_at >= ?`) et la purge de rétention (`WHERE recorded_at < ?`).
-- Sans cet index, les deux dégénèrent en scan complet à mesure que la table
-- grossit.
CREATE INDEX IF NOT EXISTS idx_snapshots_recorded_at ON snapshots(recorded_at);
