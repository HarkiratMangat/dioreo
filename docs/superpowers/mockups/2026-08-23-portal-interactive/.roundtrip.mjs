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

/* The falsifier. A check that cannot fail is not evidence — three probes shipped clean and
 * structurally incapable of failing in this package on 2026-08-24 alone. */
const bent = newDraws.map((d, i) => (i ? d : { ...d, title: d.title + '!' }));
const canFail = S.drawsBulkText(bent) !== A.formatDrawsAsBulkText(newDraws);
console.log('falsifier · a one-character change is detected: ' + (canFail ? 'YES' : 'NO'));
if (!canFail) { console.log('\nFAIL — the comparison is vacuous; fix the harness before trusting a MATCH.'); process.exit(1); }
console.log(failed ? '\nFAIL — ' + failed + ' export format(s) would not paste back into the bot.'
                   : '\nOK — every export round-trips into utils/adminParser.js byte for byte.');
process.exit(failed ? 1 : 0);
