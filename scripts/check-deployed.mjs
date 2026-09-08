// check-deployed.mjs — compare the numbers PRODUCTION actually serves against the
// live KV (/api/stats), and flag a deployment that stopped being rebaked.
//
// Why this exists (issue #136). Two guards already run and both stayed green while
// the home page served 115 flags and the KV said 117:
//   - audit-freshness compares the SOURCE to the KV  → green (the source was right)
//   - headers-check    compares served HEADERS       → green (headers were right)
// Nobody compared the served HTML to the KV. DynNum bakes its value at build time
// and never hydrates ("no client fetch, no fallback flash"), so every inline number
// is frozen until the next rebake — and the daily rebake is a GitHub Actions
// `schedule`, which is explicitly best-effort: it was simply skipped that day.
// A second cron would share the same weakness, so this guard does not try to
// prevent the miss; it makes it visible instead.
//
// Design rule, learned the hard way (see the 2026-08-27 note on #136): a guard that
// checks for an ABSENCE is green when it receives nothing. The 4 "clean" pages that
// day were 307s with an empty body — grep found nothing because there was nothing.
// So every check here is a POSITIVE assertion, and the script refuses to report
// success when it could not actually look: no anchors found, an empty body, a
// non-200 after redirects and a missing build stamp are all failures, never a pass.
//
//   node scripts/check-deployed.mjs                     # audit https://pixelium.win
//   node scripts/check-deployed.mjs --base http://…     # another origin
//   node scripts/check-deployed.mjs --max-age-hours 30  # staleness threshold
//   node scripts/check-deployed.mjs --json              # machine-readable
//
// Exit codes: 0 = pass (or skipped, network unreachable) · 1 = a problem was found.
// The first line of a failure carries a marker so CI can tell a real production
// problem from a broken guard: DEPLOYED DRIFT / STALE DEPLOY / GUARD BLIND.

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const BASE = (flag('--base', 'https://pixelium.win')).replace(/\/$/, '');
const MAX_AGE_HOURS = Number(flag('--max-age-hours', '30'));
const JSON_OUT = args.includes('--json');

// The site sits behind Cloudflare's Browser Integrity Check: a default UA gets a
// 403 on HTML. That is deliberate (only /llms.txt, /robots.txt and *.md are exempt,
// see #135), so the guard must identify as a browser or it would fail on every page
// and call production broken.
const UA = 'Mozilla/5.0 (compatible; pixelium-check-deployed/1.0; +https://pixelium.win)';

// Below this, a "page" is not a page — almost certainly a redirect body or an error.
const MIN_BODY_BYTES = 1000;
// If the whole site yields fewer anchors than this, the markup changed under us and
// the guard has gone blind. Louder than a silent pass. (106 <DynNum> today.)
const MIN_TOTAL_ANCHORS = 40;   // baked (data-stat) anchors; ~106 <DynNum> today

// Keys whose served value is legitimately NOT stats[key]. Without this the guard
// would cry drift every single day on a by-design mapping.
const ALIASES = {
  // LiveStats bakes uptime_pct_core into the uptime_pct brick on purpose: the raw
  // uptime_pct counts on-demand services, so it drops to ~82% whenever pve3 sleeps
  // (Wake-on-LAN) without a single service being down.
  uptime_pct: 'uptime_pct_core',
};

// Numbers are rendered for humans: thousands separators (which may be a narrow
// no-break space depending on the build machine's ICU — see the /ctf incident),
// a trailing "+", a "%" suffix. Compare meaning, not typography.
function normalise(raw) {
  const cleaned = String(raw)
    .replace(/[   \s]/g, '')
    .replace(/,/g, '')
    .replace(/[+%]/g, '')
    .trim();
  if (!/^-?\d+(\.\d+)?$/.test(cleaned)) return null;
  return Number(cleaned);
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,*/*' },
    redirect: 'follow',
  });
  const body = await res.text();
  return { status: res.status, body, url: res.url };
}

// Two different mechanisms, and only one of them is allowed to be compared strictly:
//
//   <span data-stat="lxc_count">59</span>                      DynNum   — baked, NEVER
//     hydrated ("no client fetch"). What is in the HTML is what every visitor sees,
//     forever, until the next rebake. This is the surface issue #136 is about, and
//     any disagreement with the KV is a real, visible defect.
//
//   <span class="brick-value" data-key="claude_hours" …>10,669</span>   LiveStats —
//     baked AND refreshed client-side on every visit. Its baked value is *expected*
//     to lag: forgejo_commits_total climbs ~40/day, so it disagrees with the KV
//     minutes after every build, by design. Comparing it strictly would make this
//     guard cry drift every single day — the fastest way to get a guard ignored.
//     We still assert its key exists in the KV (an orphan there means the brick is
//     silently serving a hardcoded fallback), but not its value.
function extractAnchors(html) {
  const found = [];
  const re = /<span[^>]*\bdata-(stat|key)="([a-z0-9_]+)"[^>]*>([^<]{0,40})<\/span>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    found.push({ key: m[2], rendered: m[3].trim(), baked: m[1] === 'stat' });
  }
  return found;
}

// Astro emits a real 200 page for a redirect: <meta http-equiv="refresh"> + noindex.
// They are listed in the sitemap and carry no content — legitimately short, so they
// must be recognised explicitly rather than lumped in with "suspiciously empty".
function isRedirectStub(html) {
  return /<meta\s+http-equiv="refresh"/i.test(html) && html.length < 2000;
}

// The footer carries: "▚ this deployment … built 2026-09-08 19:18 UTC".
function extractBuiltAt(html) {
  const m = html.match(/built (\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})\s*UTC/i);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi));
}

async function main() {
  const problems = [];   // real production problems
  const blind = [];      // reasons the guard could not look
  let networkOk = false;

  // 1. The KV — our reference.
  let stats = null;
  try {
    const r = await fetchText(`${BASE}/api/stats`);
    networkOk = true;
    const payload = JSON.parse(r.body);
    stats = payload?.stats ?? null;
    if (!stats) {
      // api/stats degrades to 200 + stats:null when the KV blob is corrupt, by
      // design (see the 2026-07-12 kv-push incident). Nothing to compare against.
      console.log('SKIP — /api/stats served stats:null (KV blob unavailable). Nothing to compare.');
      process.exit(0);
    }
  } catch (err) {
    if (!networkOk) {
      console.log(`SKIP — cannot reach ${BASE}/api/stats (${err.message}). Network unavailable, not a site failure.`);
      process.exit(0);
    }
    console.log(`GUARD BLIND — /api/stats reachable but unusable: ${err.message}`);
    process.exit(1);
  }

  // 2. Which pages to audit — taken from the sitemap so a new page is covered the
  //    day it ships, rather than from a hand-kept list that silently goes stale.
  let pages = [];
  try {
    const idx = await fetchText(`${BASE}/sitemap-index.xml`);
    const maps = [...idx.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const map of maps) {
      const sm = await fetchText(map);
      pages.push(...[...sm.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]));
    }
  } catch (err) {
    blind.push(`sitemap unreadable (${err.message}) — cannot enumerate pages`);
  }
  pages = [...new Set(pages)];
  if (pages.length === 0) blind.push('sitemap listed 0 pages');

  // 3. Read what production actually serves.
  let totalAnchors = 0;
  let bakedAnchors = 0;
  let redirects = 0;
  let newestBuild = null;
  let pagesWithStamp = 0;
  const drift = [];

  for (const page of pages) {
    let res;
    try {
      res = await fetchText(page);
    } catch (err) {
      problems.push(`${page} — request failed: ${err.message}`);
      continue;
    }
    if (res.status !== 200) {
      problems.push(`${page} — HTTP ${res.status} after redirects (served, not skipped)`);
      continue;
    }
    if (isRedirectStub(res.body)) { redirects++; continue; }
    if (res.body.length < MIN_BODY_BYTES) {
      // The exact trap from the 2026-08-27 note: an empty body makes every
      // absence-check pass. Treat it as a failure, never as a clean page.
      problems.push(`${page} — body is ${res.body.length} B (< ${MIN_BODY_BYTES}); an empty page passes every check vacuously`);
      continue;
    }

    const builtAt = extractBuiltAt(res.body);
    if (builtAt) {
      pagesWithStamp++;
      if (!newestBuild || builtAt > newestBuild) newestBuild = builtAt;
    }

    for (const { key, rendered, baked } of extractAnchors(res.body)) {
      if (baked) bakedAnchors++;
      totalAnchors++;
      const kvKey = ALIASES[key] ?? key;
      if (!(kvKey in stats)) {
        problems.push(`${page} — serves data-${baked ? 'stat' : 'key'}="${key}" but the KV has no key "${kvKey}" (orphan: it is showing a fallback)`);
        continue;
      }
      if (!baked) continue; // LiveStats: hydrated client-side, its baked lag is by design
      const served = normalise(rendered);
      const live = normalise(stats[kvKey]);
      if (served === null || live === null) continue; // non-numeric (e.g. htb_rank "Pro Hacker")
      if (served !== live) {
        drift.push({ page, key: kvKey, served, live });
      }
    }
  }

  // The threshold counts BAKED anchors only: they are the ones this guard actually
  // verifies. Counting LiveStats too would let the number stay comfortably above the
  // bar while every DynNum anchor had vanished — green, and blind.
  if (bakedAnchors < MIN_TOTAL_ANCHORS) {
    blind.push(`only ${bakedAnchors} baked (data-stat) anchors found across ${pages.length} pages (expected >= ${MIN_TOTAL_ANCHORS}) — either the deployment predates the data-stat anchor, or the markup changed and this guard can no longer see the numbers`);
  }
  if (pagesWithStamp === 0) {
    blind.push('no build stamp found on any page — cannot tell how old the deployment is');
  }

  // 4. Is the deployment still being rebaked? This is the actual failure mode of
  //    #136: everything is "correct" but frozen.
  let ageHours = null;
  if (newestBuild) {
    ageHours = (Date.now() - newestBuild.getTime()) / 36e5;
    if (ageHours > MAX_AGE_HOURS) {
      problems.push(`deployment is ${ageHours.toFixed(1)} h old (built ${newestBuild.toISOString().slice(0, 16).replace('T', ' ')} UTC, threshold ${MAX_AGE_HOURS} h) — the daily rebake did not run, every baked number is frozen`);
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({
      base: BASE, pages: pages.length, redirects,
      anchors: totalAnchors, baked_anchors: bakedAnchors,
      built_at: newestBuild?.toISOString() ?? null, age_hours: ageHours,
      drift, problems, blind,
    }, null, 2));
  }

  // 5. Report. Marker first — CI keys its alerting off it.
  const stale = problems.some((p) => p.startsWith('deployment is'));
  if (drift.length) {
    console.log('DEPLOYED DRIFT — production is serving numbers that disagree with the live KV\n');
    for (const d of drift) {
      console.log(`  ${d.page}\n    ${d.key}: served ${d.served} — KV ${d.live}`);
    }
    console.log('');
  }
  if (stale) console.log('STALE DEPLOY');
  if (blind.length) {
    console.log('GUARD BLIND — this run could not verify what it claims to verify:');
    for (const b of blind) console.log(`  - ${b}`);
    console.log('');
  }
  if (problems.length) {
    console.log('Problems:');
    for (const p of problems) console.log(`  - ${p}`);
    console.log('');
  }

  if (drift.length || problems.length || blind.length) {
    console.log(`Checked ${pages.length} pages (${redirects} redirect stubs skipped), ${bakedAnchors} baked + ${totalAnchors - bakedAnchors} client-refreshed anchors, against ${Object.keys(stats).length} KV keys.`);
    process.exit(1);
  }

  console.log(`OK — ${pages.length} pages (${redirects} redirect stubs skipped), ${bakedAnchors} baked numbers all matching the live KV, ${totalAnchors - bakedAnchors} client-refreshed anchors key-checked.`);
  console.log(`Deployment built ${newestBuild.toISOString().slice(0, 16).replace('T', ' ')} UTC (${ageHours.toFixed(1)} h ago, threshold ${MAX_AGE_HOURS} h).`);
  process.exit(0);
}

main().catch((err) => {
  // An unexpected throw must not read as a pass.
  console.log(`GUARD BLIND — unexpected error: ${err.stack || err.message}`);
  process.exit(1);
});
