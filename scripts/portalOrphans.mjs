// scripts/portalOrphans.mjs — every class the portal EMITS must be a class the stylesheet DEFINES.
//
// 🔴 THE INVERSE OF `portal:coverage`, AND IT MEASURES WHAT THAT ONE STRUCTURALLY CANNOT. Coverage asks how much of the adopted design the portal has reached; this asks what the portal is rendering into nothing. Adopting the mockup's `app.css` whole meant deleting thirteen portal-authored stylesheets, and every class those sheets defined that a component still emits became an element with no styling at all — Broadcast's "Now showing" slots, Analytics' KPI tiles, Access's permission grid, the Board's review panel. They render. They are in the DOM. They have no rules, and every gate in the suite passed the whole time, because a gate that walks elements can only ask a question about each element on its own (see `feedback_affordance_distance_not_absence`: a check shaped `for each element: assert P(element)` cannot see two authorities disagreeing).
//
// ⚠️ A RATCHET, NOT A CLEAN BILL. The list below is the debt as measured on 2026-08-26. A class NOT on it fails the run, so no new orphan can be introduced; a class on it that has stopped being emitted ALSO fails, so the list cannot rot into a pile of names nothing renders any more. It only ever shrinks, and it is finished when it is empty.
import fs from 'fs';
import { CLASS_PROPS } from './portalClassProps.mjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const UI = path.join(ROOT, 'portal', 'ui');

// ⚠️ EVERY STYLESHEET, GLOBBED — never a listed pair. buildPortal concatenates every portal/ui/*.css, so a hardcoded list here reports a class as an orphan the moment its rules land in a sheet the list does not know about. Same correction portalRender.test.js's logic-module list needed, for the same reason: a source list is only as complete as its list.

// The debt as it stood when this gate was written. Delete a line when the surface behind it is rebuilt on the adopted design — never add one.
const KNOWN_ORPHANS = new Set([
    // ✅ EMPTY, AND IT GOT THERE BY FIXING THINGS. 52 on 2026-08-26 08:00, then 46, 29, 10, 0 across one afternoon — every entry left by rebuilding the surface behind it on the adopted design, never by deleting a line. It must stay empty: a class with no rule is an element with no styling, and the whole suite was green for weeks while nine components rendered as bare text.
]);

// 🔴 COMMENTS ARE NOT DEFINITIONS, AND COUNTING THEM MADE THIS GATE UNDER-REPORT. This tree's stylesheets are heavily commented and those comments NAME CLASSES — one line in tokens.css reads "`.v2-card .v2-row button`" while explaining a form reset, and that alone was enough to certify two classes that have no rule anywhere. A gate whose false NEGATIVES are silent is the exact shape it exists to prevent, so the comments come out first.
function definedClasses() {
    const css = fs.readdirSync(UI).filter((f) => f.endsWith('.css')).sort()
        .map((f) => fs.readFileSync(path.join(UI, f), 'utf8'))
        .join('\n')
        .replace(/\/\*[\s\S]*?\*\//g, ' ');
    return new Set([...css.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)].map((m) => m[1]));
}

// ⚠️ A STRING AFTER `===` IS A COMPARISON, NOT A CLASS. The first version of this scan took every string literal inside a `class=${…}` expression, which reported `.asc`, `.date` and `.state` as orphans — they are `sort.direction === 'asc'` and `c.key === 'state'`, values the expression BRANCHES on. Four false positives out of 56 is enough to make a gate get suppressed instead of obeyed.
function emittedClasses() {
    const out = new Map();
    const add = (cls, file) => {
        for (const c of cls.split(/\s+/).filter(Boolean)) {
            if (!out.has(c)) out.set(c, new Set());
            out.get(c).add(file);
        }
    };
    for (const f of fs.readdirSync(UI).filter((n) => n.endsWith('.js'))) {
        const src = fs.readFileSync(path.join(UI, f), 'utf8');
        for (const m of src.matchAll(/class="([^"$]*)"/g)) add(m[1], f);
        // 🔴 A CLASS PASSED AS A DATA VALUE WAS INVISIBLE TO THIS GATE. The Manifest takes `metaClass` on a column and renders it into the row's secondary line, so the name never appears inside a `class=` attribute in the source — and `metaClass: 'rowlife'` shipped with no rule behind it anywhere, which is precisely the state this file exists to prevent. Any future prop that names a class has to be listed here, or it inherits the same blind spot. ⚠️ THIS LIST MUST MATCH portalCoverage's CLASS_PROPS EXACTLY, and a check below enforces it. Measured 2026-08-26: `tone` was added to coverage's list and NOT to this one, so a `tone: 'live'` counted as covered while this gate — the one that fails on a class with no rule — could not see it. A no-op class shipped and the number went up. The two gates only hold each other while they read the same syntax, and the claim that they do was written in coverage's own header while it was false.
        for (const m of src.matchAll(new RegExp(`\\b(?:${CLASS_PROPS.join('|')}):\\s*'([^']+)'`, 'g'))) add(m[1], f);
        for (const m of src.matchAll(/class=\$\{((?:[^{}]|\{[^{}]*\})*)\}/g)) {
            const expr = m[1];
            for (const lit of expr.matchAll(/(!==|===|==)?\s*['"]([a-zA-Z][\w -]*)['"]/g)) {
                if (lit[1]) continue;           // the right-hand side of a comparison
                add(lit[2], f);
            }
        }
    }
    return out;
}

// 🔴 AN ORPHAN THE DESIGN ITSELF EMITS IS NOT THE SAME DEFECT, AND THIS GATE COULD NOT TELL THEM APART. Added 2026-08-31, when the mode collapse deleted the portal-only rule behind `.rowlife` and this gate correctly reported a new orphan. But the mockup's own season.html emits `<div class="rowmeta rowlife">` on every row and its stylesheet defines no `.rowlife` either — it is a semantic hook the DESIGN carries unstyled. Matching it is the conformance pass working; REMOVING it would change the element's class list, which is what the audit pairs on, and desynchronise every node beneath it.
//
// The two cases need different verdicts and the same visibility. A class the PORTAL invented with no rule still fails. A class INHERITED from the design, unstyled on both sides, is reported every run and does not fail — so it can never quietly become an excuse, and it never needs a line in KNOWN_ORPHANS, whose own rule is that it only ever shrinks.
const { designClasses } = createRequire(import.meta.url)('./lib/designClasses.cjs');
const designEmits = designClasses;
const fromDesign = designEmits();
const designReadable = fromDesign.size > 0;

const defined = definedClasses();
const emitted = emittedClasses();
const orphans = [...emitted.entries()].filter(([c]) => !defined.has(c)).sort();

const inherited = orphans.filter(([c]) => designReadable && fromDesign.has(c));
const unexpected = orphans.filter(([c]) => !KNOWN_ORPHANS.has(c) && !(designReadable && fromDesign.has(c)));
const stale = [...KNOWN_ORPHANS].filter((c) => !orphans.some(([o]) => o === c)).sort();

console.log(`portal:orphans — ${orphans.length} class${orphans.length === 1 ? '' : 'es'} emitted with no rule in the adopted stylesheet\n`);
for (const [c, files] of orphans) {
    console.log(`  .${c.padEnd(12)} ${[...files].sort().join(', ')}`);
}

if (!designReadable) {
    console.log('\n⚠️  the mockup package could not be read, so an orphan inherited from the design cannot be');
    console.log('   distinguished from one the portal invented. Every orphan below is treated as the portal\'s.');
} else if (inherited.length) {
    console.log(`\n📐 ${inherited.length} of these ${inherited.length === 1 ? 'is' : 'are'} INHERITED FROM THE DESIGN — the mockup emits the same class and`);
    console.log('   defines no rule for it either, so matching it is the conformance pass working, not a defect:');
    for (const [c, files] of inherited) console.log(`     .${c}  ←  ${[...files].sort().join(', ')}`);
    console.log('   ⚠️  They still render into nothing. When the surface behind one is rebuilt after the pass,');
    console.log('      it should gain a rule or stop being emitted — on BOTH sides.');
}

let bad = false;
if (unexpected.length) {
    bad = true;
    console.log(`\n❌ ${unexpected.length} NEW orphan${unexpected.length === 1 ? '' : 's'} — these render into nothing:`);
    for (const [c, files] of unexpected) console.log(`     .${c}  ←  ${[...files].sort().join(', ')}`);
    console.log('   Either emit the class the adopted stylesheet already defines, or add the rule.');
}
if (stale.length) {
    bad = true;
    console.log(`\n❌ ${stale.length} entr${stale.length === 1 ? 'y is' : 'ies are'} no longer emitted and must leave KNOWN_ORPHANS:`);
    console.log(`     ${stale.join(', ')}`);
    console.log('   The ratchet only counts if it is kept tight — a list of names nothing renders proves nothing.');
}
if (!bad) console.log(`\n✅ no new orphans. ${orphans.length} emitted with no rule`
    + `${inherited.length ? `, of which ${inherited.length} ${inherited.length === 1 ? 'is' : 'are'} the design's own` : ''}`
    + '; the portal-invented list only ever shrinks.');
process.exit(bad ? 1 : 0);
