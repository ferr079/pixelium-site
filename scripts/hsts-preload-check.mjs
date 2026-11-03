/**
 * hsts-preload-check — pixelium.win remplit-il encore les exigences du preload HSTS ?
 *
 * Le domaine a été soumis à hstspreload.org le 2026-11-03 (statut `pending`). Le
 * service retire un domaine qui cesse de remplir ses exigences : en-tête de l'apex
 * (`max-age` d'au moins un an, `includeSubDomains`, `preload`), redirection HTTP vers
 * HTTPS sur le même nom, certificat valide. Rien ne le surveillait : headers-check.mjs
 * vérifie bien la valeur exacte de l'en-tête, mais aucun workflow ne le lance. Ce
 * script interroge l'API `preloadable` de hstspreload.org, celle de l'autorité qui
 * déciderait du retrait.
 *
 * Règle reprise de check-deployed.mjs : un garde qui vérifie une absence (« aucune
 * erreur ») est vert quand il ne reçoit rien. Il exige donc une réponse lisible, avec
 * ses deux listes, avant de conclure ; sinon il sort en GUARD BLIND.
 *
 *   node scripts/hsts-preload-check.mjs                       # pixelium.win
 *   node scripts/hsts-preload-check.mjs --domain example.com  # témoin négatif
 *
 * Sortie : 0 = exigences remplies · 1 = HSTS PRELOAD (au moins une erreur) ·
 *          2 = GUARD BLIND (API injoignable ou réponse inattendue).
 */

const argv = process.argv.slice(2);
const at = argv.indexOf('--domain');
const domain = at >= 0 && argv[at + 1] ? argv[at + 1] : 'pixelium.win';
const url = `https://hstspreload.org/api/v2/preloadable?domain=${encodeURIComponent(domain)}`;
const UA = 'pixelium-hsts-preload-check/1.0 (+https://pixelium.win)';

async function fetchJson(target, tries = 3) {
  let last;
  for (let n = 1; n <= tries; n++) {
    try {
      const res = await fetch(target, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(30_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      last = err;
      if (n < tries) await new Promise((resolve) => setTimeout(resolve, 5_000 * n));
    }
  }
  throw last;
}

let report;
try {
  report = await fetchJson(url);
} catch (err) {
  console.log(`GUARD BLIND — hstspreload.org illisible après 3 essais (${err.message}).`);
  process.exit(2);
}
if (!Array.isArray(report?.errors) || !Array.isArray(report?.warnings)) {
  console.log(`GUARD BLIND — réponse inattendue : ${JSON.stringify(report).slice(0, 200)}`);
  process.exit(2);
}

// Texte de l'API sur une seule ligne, derrière un préfixe fixe : sous GitHub Actions, une
// ligne qui commence par `::` est une commande de workflow (annotation forgée → ntfy).
const oneLine = (s) => String(s ?? '').replace(/[\r\n]+/g, ' ').slice(0, 300);
for (const w of report.warnings) console.log(`  warning  ${oneLine(w.code)} — ${oneLine(w.summary ?? w.message)}`);
for (const e of report.errors) console.log(`  error    ${oneLine(e.code)} — ${oneLine(e.summary ?? e.message)}`);

if (report.errors.length > 0) {
  console.log(`HSTS PRELOAD — ${domain} ne remplit plus ${report.errors.length} exigence(s) : hstspreload.org retirera le domaine si rien n'est corrigé.`);
  process.exit(1);
}
console.log(`OK — ${domain} remplit les exigences du preload HSTS (${report.warnings.length} avertissement(s)).`);
