// docs/pins2/instruments/counts-check.cjs — do the numbers the pins2 docs state still equal what they count? Written 2026-09-29 12:14 EDT, class B of the sweep. docClaimCheck.mjs runs the COMMANDS a doc names; nothing re-derived the NUMBERS, and a number in prose is a copy of state that nothing updates. Each claim below names the doc sentence it reads and the source that decides it, so a count that drifts fails here instead of misleading Session 4. Coverage, stated: only the claims registered below. A dated "State at …" block is history and is never registered; a claim with no derivable source (his pin counts, a measured pixel) is out of scope and listed by --list as such. Run: node docs/pins2/instruments/counts-check.cjs   ·   --selftest shifts every claimed number by one and requires every claim to fail.
const fs = require('fs'); const path = require('path'); const cp = require('child_process');
process.chdir(path.resolve(__dirname, '../../..'));
const read = (f) => fs.readFileSync(f, 'utf8');
const git = (c) => cp.execSync(c, { maxBuffer: 1e9 }).toString();
const num = (s) => (s == null ? null : +String(s).replace(/,/g, ''));
const grab = (f, re) => { const m = read(f).match(re); return m ? num(m[1]) : null; };
const kitConst = (name) => grab('docs/pins2/kit/ui/broadcast.js', new RegExp('\\b' + name + '\\s*=\\s*(\\d+)'));
const CLAIMS = [
  { id: 'kit-files', doc: 'docs/pins2/README.md', re: /tracked at `docs\/pins2\/kit\/`, (\d+) files/,   /* 2026-09-30 19:52 EDT: prep-17 is a dated record, so its number is history; the claim moved to the live README */ truth: () => git('git ls-files docs/pins2/kit').split('\n').filter(Boolean).length, src: 'git ls-files docs/pins2/kit' },
  { id: 'r22-flows-readme', doc: 'docs/pins2/README.md', re: /walks (\d+) flows/, truth: () => (read('docs/pins2/instruments/r22.cjs').match(/\bok\('/g) || []).length, src: "r22.cjs's ok('…') checks" },
  { id: 'r22-flows-instr', doc: 'docs/pins2/instruments/README.md', re: /(\d+) flows/, truth: () => (read('docs/pins2/instruments/r22.cjs').match(/\bok\('/g) || []).length, src: "r22.cjs's ok('…') checks" },
  { id: 'gates', doc: 'docs/pins2/final/board4-spec/HANDOFF.md', re: /### C(\d) · Admin traffic/, truth: () => fs.readdirSync('docs/pins2/final/board4-spec').filter((f) => /^C\d-.*\.md$/.test(f)).length, src: 'board4-spec/C*.md files (the last gate heading is C<N>)' },
  { id: 'version-readme', doc: 'docs/pins2/README.md', re: /\*\*Version (\d+) —/, truth: () => grab('docs/pins2/final/board4-spec/HANDOFF.md', /gate by gate \(Version (\d+)/),   /* 2026-09-30 19:52 EDT: the signed-off wording */ src: "HANDOFF.md's title — the two must agree; neither can read the artifact offline" },
  { id: 'text-max', doc: 'docs/pins2/final/board4-spec/HANDOFF.md', re: /past ([\d,]+) → blocked/, truth: () => kitConst('TEXT_MAX'), src: 'kit ui/broadcast.js TEXT_MAX' },
  { id: 'warn-at', doc: 'docs/pins2/final/board4-spec/HANDOFF.md', re: /([\d,]+)\+ → the counter warns/, truth: () => grab('docs/pins2/kit/ui/broadcast.js', /warnAt=\$\{(\d+)\}/), src: 'kit ui/broadcast.js warnAt' },
  { id: 'shared-budget', doc: 'docs/pins2/final/board4-spec/HANDOFF.md', re: /past the shared ([\d,]+) with the live posts/, truth: () => kitConst('EMBED_BUDGET'), src: 'kit ui/broadcast.js EMBED_BUDGET' },
  { id: 'shared-budget-portal', doc: 'docs/pins2/final/board4-spec/HANDOFF.md', re: /past the shared ([\d,]+) with the live posts/, truth: () => grab('portal/ui/broadcast.js', /EMBED_BUDGET\s*=\s*(\d+)/), src: 'portal/ui/broadcast.js EMBED_BUDGET' },
  { id: 'posted-line', doc: 'docs/pins2/final/board4-spec/HANDOFF.md', re: /the (\d+)-character Posted line/, truth: () => { const t = read('utils/announcement.js').match(/description: `\$\{doc\.text\}([^`]*)`/); return t ? t[1].replace(/\\n/g, '\n').replace(/\$\{postedTs\}/, '1790000000').length : null; }, src: "utils/announcement.js's description suffix with a 10-digit timestamp" },
  { id: 'posted-line-kit', doc: 'docs/pins2/final/board4-spec/HANDOFF.md', re: /the (\d+)-character Posted line/, truth: () => kitConst('POSTED_LINE'), src: 'kit ui/broadcast.js POSTED_LINE' },
  { id: 'text-over', doc: 'docs/pins2/final/board4-spec/HANDOFF.md', re: /a text over ([\d,]+), Discord rejects/, truth: () => 4096 - kitConst('POSTED_LINE'), src: "Discord's 4,096-character embed description, less the Posted line" },
  // 2026-09-29 15:37 EDT: the index is read up to the next heading. It read to the end of the file, so the "Built in the kit" table that follows it doubled the count to 42
  // 2026-09-30 19:52 EDT: 'intake-classes' retired — README no longer states a round's class count (the Version 40 round closed long ago; the intake log carries every round)
];
function run(mutate) {
  let bad = 0;
  for (const c of CLAIMS) {
    let text = read(c.doc); if (mutate) text = text.replace(c.re, (m, g) => m.replace(g, String(num(g) + 1)));
    const m = text.match(c.re); const claimed = m ? num(m[1]) : null; const truth = c.truth();
    const ok = claimed != null && truth != null && claimed === truth;
    if (!ok) bad++;
    if (!mutate) console.log(`${ok ? '✓' : '✗'} ${c.id.padEnd(22)} claims ${claimed ?? 'NOT FOUND'} · source ${truth ?? 'UNREADABLE'} (${c.src}) — ${c.doc}`);
  }
  return bad;
}
if (process.argv.includes('--selftest')) {
  const bad = run(true); const pass = bad === CLAIMS.length;
  console.log(`selftest: ${bad} of ${CLAIMS.length} claims fail with every number shifted by one → ${pass ? 'PASS' : 'FAIL'}`);
  process.exit(pass ? 0 : 1);
}
const bad = run(false);
console.log(`\n${CLAIMS.length - bad} of ${CLAIMS.length} claims hold`);
process.exit(bad ? 1 : 0);
