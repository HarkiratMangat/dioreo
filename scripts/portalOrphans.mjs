// scripts/portalOrphans.mjs — every class the portal EMITS must be a class the stylesheet DEFINES.
//
// 🔴 THE INVERSE OF `portal:coverage`, AND IT MEASURES WHAT THAT ONE STRUCTURALLY CANNOT. Coverage asks how much of the adopted design the portal has reached; this asks what the portal is rendering into nothing. Adopting the mockup's `app.css` whole meant deleting thirteen portal-authored stylesheets, and every class those sheets defined that a component still emits became an element with no styling at all — Broadcast's "Now showing" slots, Analytics' KPI tiles, Access's permission grid, the Board's review panel. They render. They are in the DOM. They have no rules, and every gate in the suite passed the whole time, because a gate that walks elements can only ask a question about each element on its own (see `feedback_affordance_distance_not_absence`: a check shaped `for each element: assert P(element)` cannot see two authorities disagreeing).
//
// ⚠️ A RATCHET, NOT A CLEAN BILL. The list below is the debt as measured on 2026-08-26. A class NOT on it fails the run, so no new orphan can be introduced; a class on it that has stopped being emitted ALSO fails, so the list cannot rot into a pile of names nothing renders any more. It only ever shrinks, and it is finished when it is empty.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const UI = path.join(ROOT, 'portal', 'ui');

// The debt as it stood when this gate was written. Delete a line when the surface behind it is rebuilt on the adopted design — never add one.
const KNOWN_ORPHANS = new Set([
    // Armory — the two-column layout and the coverage matrix
    'armcols', 'armmain', 'armside', 'covwrap', 'covcell', 'covnote', 'hit', 'bc-mode',
    // Access — the grant form's own row
    'grantrow',
    // Board — the whole per-changeset review panel
    'review', 'revhead', 'revbody', 'revfoot', 'oplist', 'rows', 'diffs', 'step', 'tally',
    'tierbadge', 'ttl', 'discard',
    // Track — two marks
    'bpe', 'leg',
    // Home — the clock face wrapper
    'hc-face',
    // The Discord card preview, which has no counterpart in the mockup at all
    'v2-text', 'v2-media', 'v2-sep', 'v2-small', 'v2-empty',
]);

function definedClasses() {
    const css = ['app.css', 'tokens.css'].map((f) => fs.readFileSync(path.join(UI, f), 'utf8')).join('\n');
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

const defined = definedClasses();
const emitted = emittedClasses();
const orphans = [...emitted.entries()].filter(([c]) => !defined.has(c)).sort();

const unexpected = orphans.filter(([c]) => !KNOWN_ORPHANS.has(c));
const stale = [...KNOWN_ORPHANS].filter((c) => !orphans.some(([o]) => o === c)).sort();

console.log(`portal:orphans — ${orphans.length} class${orphans.length === 1 ? '' : 'es'} emitted with no rule in the adopted stylesheet\n`);
for (const [c, files] of orphans) {
    console.log(`  .${c.padEnd(12)} ${[...files].sort().join(', ')}`);
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
if (!bad) console.log(`\n✅ no new orphans. ${orphans.length} known; the list only ever shrinks.`);
process.exit(bad ? 1 : 0);
