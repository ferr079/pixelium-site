# Claude Code workflows (domain tooling — not part of the site build)

These are Claude Code orchestration workflows used while working on the
pixelium web domain. They are **not** Astro pages, GitHub Actions, or anything
the site build/deploy touches (`.claude/` is ignored by Astro and CI is skipped
on commits that only change this folder).

- `oss-contrib-sweep.js` — sweeps every `ferr079` PR + issue (all states) and
  flags the threads where a maintainer is actually waiting on us (closed PRs and
  issues included), filtering out terminal/already-resolved false positives.
  Source of truth for the file is here (versioned + mirrored); the operational
  copy at `~/Claude/web/.claude/workflows/` is a symlink to this one.
