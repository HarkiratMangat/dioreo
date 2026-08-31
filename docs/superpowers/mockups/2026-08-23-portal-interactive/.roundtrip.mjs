#!/usr/bin/env node
/* ══════════════════════════════════════════════════════════════════════════════
 * EXPORT ROUND-TRIP GATE  ·  npm run portal:roundtrip
 *
 * Every export in the portal claims, in its own copy, that "pasting it back restores them
 * exactly". Nothing checked that, and nothing could: an export's output is written to a file
 * and never read again by anything in the package, so a wrong format looks correct by
 * construction and stays wrong indefinitely.
 *
 * MEASURED THE FIRST TIME THIS RAN, 2026-08-24:
 *   · armory     was emitting the SEVEN-SEGMENT PIPE LINE that utils/adminParser.js was
 *                rewritten to REJECT on 2026-08-22 (deliberately, no back-compat), and its
 *                format-guide drawer documented the retired shape to the reader as well.
 *   · patchnotes joined entries with a blank line; the bot joins with "\n\n---\n\n", and
 *                read `titleOverride` where the bot reads `title`.
 * Two of four formats were wrong. Both would have produced a file that fails on paste-back —
 * the exact moment an export matters, and the only moment nobody is watching.
 *
 * HOW IT WORKS, and why it is not vacuous: it lifts the SHIPPED source out of the .html files
 * between literal markers and runs THAT — never a retyped copy, which would only prove that
 * the copy matches. It then runs the bot's own utils/adminParser.js over the same fixture
 * documents and compares byte for byte. Finally it corrupts one input by a single character
 * and asserts the comparison reports a difference; if that falsifier ever passes silently,
 * the harness is broken and the run FAILS rather than reporting clean.
 * ══════════════════════════════════════════════════════════════════════════════ */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';

/* fileURLToPath, not a hand-rolled slice: the repo path contains a space
 * (/Applications/Claude Code/Diors-Builds) and a naive URL-to-path conversion leaves %20. */
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..', '..', '..');
const require = createRequire(import.meta.url);
const A = require(join(REPO, 'utils', 'adminParser.js'));

const fixtures = readFileSync(join(HERE, 'assets', 'fixtures.js'), 'utf8');
const season   = readFileSync(join(HERE, 'season.html'), 'utf8');
const armory   = readFileSync(join(HERE, 'armory.html'), 'utf8');

const grab = (re, label) => {
  const m = fixtures.match(re);
  if (!m) throw new Error('fixture not found: ' + label);
  return eval(m[1]);                                   // eslint-disable-line no-eval
};
const slice = (src, from, to, label) => {
  const i = src.indexOf(from), j = src.indexOf(to);
  if (i < 0 || j < 0 || j <= i) throw new Error('source markers not found: ' + label);
  return src.slice(i, j);
};

const newDraws       = grab(/const newDraws\s*=\s*(\[[\s\S]*?\n  \]);/, 'newDraws');
const returningDraws = grab(/const returningDraws\s*=\s*(\[[\s\S]*?\n  \]);/, 'returningDraws');
const calendar       = grab(/const calendar\s*=\s*(\[[\s\S]*?\n  \]);/, 'calendar');
const patchNotes     = grab(/const patchNotes\s*=\s*(\[[\s\S]*?\n  \]);/, 'patchNotes');
const builds         = grab(/const builds\s*=\s*(\[[\s\S]*?\n  \]);/, 'builds');

const S = new Function(
  slice(season, '  const TIER_SHORTHAND', '  /* A selection spans every entity', 'season builders') +
  '\nreturn { drawsBulkText, calendarBulkText, patchNotesText };')();
const R = new Function(
  slice(armory, '  const bulkLine = b =>', '\n  function renderBulk()', 'armory builders') +
  '\nreturn { bulkLine, bulkText };')();

const cases = [
  ['season · new draws',       () => S.drawsBulkText(newDraws),        () => A.formatDrawsAsBulkText(newDraws)],
  ['season · returning draws', () => S.drawsBulkText(returningDraws),  () => A.formatDrawsAsBulkText(returningDraws)],
  ['season · calendar',        () => S.calendarBulkText(calendar),     () => A.formatCalendarAsBulkText(calendar)],
  ['season · patch notes',     () => S.patchNotesText(patchNotes),     () => A.formatPatchNotesAsText(patchNotes)],
  ['armory · builds',          () => R.bulkText(builds),               () => A.formatLoadoutsAsBulkText(builds)]
];

let failed = 0;
for (const [name, mineFn, botFn] of cases) {
  const mine = mineFn(), bot = botFn();
  const ok = mine === bot;
  if (!ok) failed++;
  console.log((ok ? 'MATCH   ' : 'DIFFERS ') + name.padEnd(26) + mine.split('\n').length + ' lines');
  if (!ok) {
    const a = mine.split('\n'), b = bot.split('\n');
    for (let i = 0, shown = 0; i < Math.max(a.length, b.length) && shown < 4; i++) {
      if (a[i] !== b[i]) { shown++;
        console.log('   line ' + i + '\n     portal: ' + JSON.stringify(a[i]) + '\n     bot   : ' + JSON.stringify(b[i])); }
    }
  }
}

/* ── ANALYTICS CSV ESCAPING ──────────────────────────────────────────────────
 * Analytics exports do NOT round-trip into the bot — nothing re-ingests them — so the
 * property worth checking is different: does a value survive being written and read back?
 * It matters here specifically because the two columns most worth exporting are the two
 * most likely to contain a comma or a quote: a search TERM is arbitrary text a player typed,
 * and a change-log SUMMARY is a sentence with a quoted title inside it.
 * The parser below is a minimal RFC-4180 reader written for this test alone, so a bug in the
 * writer cannot hide behind a matching bug in the reader. */
const analytics = readFileSync(join(HERE, 'analytics.html'), 'utf8');
const C = new Function(
  slice(analytics, '  const csvCell =', '  const stamp =', 'analytics csv') +
  '\nreturn { csvCell, csv };')();

function parseCsv(text) {
  const rows = [[]]; let cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { rows[rows.length - 1].push(cell); cell = ''; }
    else if (c === '\n') { rows[rows.length - 1].push(cell); cell = ''; rows.push([]); }
    else cell += c;
  }
  rows[rows.length - 1].push(cell);
  return rows;
}

const nasty = [
  ['plain', 1],
  ['ak117, holger', 2],
  ['he said "meta"', 3],
  ['line\nbreak', 4],
  ['"leading quote', 5],
  ['trailing comma,', 6],
  ['', 7]
];
const written = C.csv(['term', 'n'], nasty);
const readBack = parseCsv(written).slice(1);
const escOk = readBack.length === nasty.length &&
  nasty.every((r, i) => readBack[i][0] === r[0] && readBack[i][1] === String(r[1]));
console.log('MATCH   analytics · csv escaping   ' + nasty.length + ' adversarial cells');
if (!escOk) {
  failed++;
  console.log('DIFFERS analytics · csv escaping');
  nasty.forEach((r, i) => {
    const got = readBack[i] || [];
    if (got[0] !== r[0]) console.log('   row ' + i + '\n     wrote: ' + JSON.stringify(r[0]) + '\n     read : ' + JSON.stringify(got[0]));
  });
}
/* And the escaping check must itself be able to fail: a writer that simply joined on commas
 * would break the second row. */
const naive = ['term,n', ...nasty.map(r => r.join(','))].join('\n');
const naiveSurvives = parseCsv(naive).slice(1).every((row, i) => row[0] === nasty[i][0]);
if (naiveSurvives) { console.log('falsifier · a naive comma-join is rejected: NO — the escaping test is vacuous'); process.exit(1); }
console.log('falsifier · a naive comma-join is rejected: YES');

/* The falsifier. A check that cannot fail is not evidence — three probes shipped clean and
 * structurally incapable of failing in this package on 2026-08-24 alone. */
const bent = newDraws.map((d, i) => (i ? d : { ...d, title: d.title + '!' }));
const canFail = S.drawsBulkText(bent) !== A.formatDrawsAsBulkText(newDraws);
console.log('falsifier · a one-character change is detected: ' + (canFail ? 'YES' : 'NO'));
if (!canFail) { console.log('\nFAIL — the comparison is vacuous; fix the harness before trusting a MATCH.'); process.exit(1); }
console.log(failed ? '\nFAIL — ' + failed + ' export format(s) would not paste back into the bot.'
                   : '\nOK — every export round-trips into utils/adminParser.js byte for byte.');
process.exit(failed ? 1 : 0);
