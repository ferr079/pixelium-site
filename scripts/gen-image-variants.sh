#!/usr/bin/env bash
# Generate -480/-800 responsive variants for every public/images .webp and push
# them to R2 next to the originals (targeted `aws s3 cp` per object — NEVER
# `s3 sync`, cf CLAUDE.md). Idempotent: existing R2 variants are overwritten
# with freshly derived ones, originals are never touched.
#
# Usage:  set -a; source ~/.claude/secrets.env; set +a
#         ./scripts/gen-image-variants.sh [--dry-run]
set -euo pipefail
cd "$(dirname "$0")/.."

DRY_RUN="${1:-}"
OUT="$(mktemp -d)"
trap 'rm -rf "$OUT"' EXIT

command -v magick >/dev/null || { echo "magick (ImageMagick) requis" >&2; exit 1; }
[ -n "${R2_ACCESS_KEY_ID:-}" ] || { echo "R2_* absents — sourcer ~/.claude/secrets.env" >&2; exit 1; }

find public/images -name '*.webp' ! -name '*-480.webp' ! -name '*-800.webp' | while read -r f; do
  rel="${f#public/}"                      # images/services/traefik.webp
  base="${rel%.webp}"
  for w in 480 800; do
    out="$OUT/${base}-${w}.webp"
    mkdir -p "$(dirname "$out")"
    magick "$f" -resize "${w}x>" -quality 80 "$out"
    if [ "$DRY_RUN" = "--dry-run" ]; then
      echo "DRY: s3://pixelium-assets/${base}-${w}.webp ($(du -h "$out" | cut -f1))"
    else
      AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
        aws s3 cp "$out" "s3://pixelium-assets/${base}-${w}.webp" \
        --endpoint-url "$R2_ENDPOINT" --region auto --no-progress
    fi
  done
done
echo "done."
