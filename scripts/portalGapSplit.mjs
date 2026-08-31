// scripts/portalGapSplit.mjs — what is actually left, split three ways.
//
// 🔴 A COVERAGE PERCENTAGE IS NOT A WORK LIST, and treating it as one produced a wrong answer twice in one session. "Armory is at 61%" says nothing about whether those classes are surfaces somebody has to build, styling that already exists under a different name, or names nobody can ever emit — and on 2026-08-26 a ceiling of "~92–94%" was stated out loud and beaten within the hour, because a third of what had been written off was buildable.
//
// So this splits `portal:coverage --missing` into the only three buckets that change what you do:
//
//   NO RULE       the adopted stylesheet defines nothing for it. Building it means AUTHORING CSS,
//                 which is a different kind of work from wiring markup to a sheet that already
//                 exists. Not "out of scope" — Harkirat has said nothing is — just different.
//   ALREADY HERE  some portal/ui file emits it. The realm-level miss is the INSTRUMENT's own
//                 asymmetry: the mockup declares the SelectionBar and the one-way strip in its
//                 shared assets/shell.js, the portal attributes them to the realms that render
//                 them. ⚠️ Do NOT "fix" that by widening SHARED_UI — Home and Door render neither,
//                 and it would inflate exactly the realms the split exists to measure honestly.
//   UNBUILT       the actual work, grouped by prefix so a cluster reads as one surface.
//
// ⚠️ COMMENTS ARE STRIPPED BEFORE THE "already here" SCAN. Three separate gates on this branch fired on prose that merely described the thing they were looking for — a file documenting a trap contains the trap's shape in words, so a scan without this reports the best-documented code as the offender.
import { readFileSync, readdirSync } from 'fs';
import { execFileSync } from 'child_process';
import { join } from 'path';

const UI = 'portal/ui';
const CSS = readFileSync(join(UI, 'app.css'), 'utf8');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
const SRC = Object.fromEntries(readdirSync(UI).filter((f) => f.endsWith('.js'))
    .map((f) => [f, strip(readFileSync(join(UI, f), 'utf8'))]));

const out = execFileSync('npm', ['run', 'portal:coverage', '--silent', '--', '--missing'], { encoding: 'utf8' });
const missing = new Map();
for (const m of out.matchAll(/^(\w+)\s+(\d+)%[\s\S]*?missing: (.*?)\n/gm)) {
    for (const c of m[3].split(/\s+/).filter(Boolean)) missing.set(c, (missing.get(c) || 0) + 1);
}
if (!missing.size) {
    console.log('nothing missing — either the migration is complete or portal:coverage changed its output shape');
    process.exit(0);
}

const hasRule = (c) => new RegExp(`\\.${c.replace(/[-]/g, '\\-')}(?![\\w-])`).test(CSS);
// A class name can appear inside any string that ends up in a class attribute, so the match is on the NAME inside a quoted run rather than on `class=` — the portal builds plenty of them by concatenation. ⚠️ THE RUN MAY CONTAIN AN INTERPOLATION. `'lvtag lv-' + level` and `` `lvtag lv-${r.level}` `` are both a class this file emits, and a character class of `[\w\s-]` alone rejects the second — which is how `lvtag` reached the UNBUILT list while analytics.js had been emitting it all along. `$`, `{`, `}` and `.` join the run so an interpolated neighbour cannot hide a literal class name.
const emittedBy = (c) => Object.keys(SRC).filter((f) =>
    new RegExp(`["'\`][\\w\\s${'\\-'}\\$\\{\\}.]*\\b${c.replace(/[-]/g, '\\-')}\\b[\\w\\s${'\\-'}\\$\\{\\}.]*["'\`]`).test(SRC[f]));

const noRule = [], already = [], unbuilt = [];
for (const [c, realms] of [...missing].sort()) {
    if (!hasRule(c)) noRule.push(c);
    else if (emittedBy(c).length) already.push(c);
    else unbuilt.push([c, realms]);
}

// Grouped by prefix, because a cluster of nine `fx*` names is ONE panel to decide about, not nine.
const groups = new Map();
for (const [c, n] of unbuilt) {
    // The part before the first hyphen, or the first two characters — chosen so `fxar`/`fxwas`/`fxnow` land in one `fx` row (they are one panel), which a three-character key splits into three.
    const key = c.includes('-') ? c.slice(0, c.indexOf('-')) : c.slice(0, 2);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(`${c}×${n}`);
}

const pct = (out.match(/OVERALL\s+(\d+)%/) || [])[1];
console.log(`portalGapSplit — overall ${pct}%, ${missing.size} distinct classes missing somewhere\n`);
console.log(`NO RULE (${noRule.length}) — building these means authoring CSS:`);
console.log(`  ${noRule.join(' ') || '(none)'}\n`);
console.log(`ALREADY EMITTED (${already.length}) — instrument asymmetry, not work.\n`);
console.log(`UNBUILT (${unbuilt.length}) — the real list, grouped:`);
for (const [key, list] of [...groups].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${key.padEnd(10)} ${list.sort().join(' ')}`);
}
