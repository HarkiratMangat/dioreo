// scripts/portalCoverage.mjs — how much of each mockup PAGE the portal actually emits.
//
// 🔴 THE NUMBER THAT STOPS THE OVERCLAIM. On 2026-08-26 a two-line status said "all 6 realms on the adopted design"; four COMPONENTS were, inside six pages that were still the old composition. The commit log looked like a finished migration. This is the only thing that said otherwise, and it is a command rather than a paragraph so re-deriving it costs nothing.
//
// Method: for each mockup page, take the class names its markup emits (plus the shared shell's) and ask what fraction the corresponding portal component emits. Same method that settled the topic -colour fork, for the same reason — two internally-consistent implementations hide from every other gate, and only a comparison across them shows the gap.
//
// ⚠️ DONE IS NOT 100%. A real slice of every remaining gap is the mockup's own reviewer scaffolding — `data-demo-only` controls, `S.audit()` hooks, `data-async-host`/`data-skel`, the document-nav chrome standalone files need — and the mockup says in capitals that some of it MUST NOT SHIP. Chasing the number builds things the design forbids. A realm is done when the remaining delta is scaffolding, which is why this prints the MISSING NAMES and not just a percentage.
//
// ⚠️ IT UNDER-COUNTS, IN ONE KNOWN WAY. Components build class strings in variables (`const cls = 'bar ' + state`), which a source scan cannot see. So true coverage is somewhat higher than reported, and a realm that stalls while LOOKING right may be hitting that rather than missing markup. Read it with the page open, never instead of opening the page.
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOCKUP = join(ROOT, 'docs/superpowers/mockups/2026-08-23-portal-interactive');
const UI = join(ROOT, 'portal/ui');

const CLASS_RE = /^[a-zA-Z][\w-]*$/;

// 🔴 A NON-GREEDY `[^}]*` CANNOT READ A CLASS EXPRESSION THAT INTERPOLATES, and every dynamic class in this codebase does. `class=${`lvtag lv-${r.level}`}` stops the old scan dead at the FIRST `}` — which belongs to the inner `${r.level}`, not to the attribute — so the captured text was the fragment "`lvtag lv-$" and the literal `lvtag` was never seen. analytics.js has emitted `lvtag` since the river was built and BOTH instruments reported it as unbuilt work. That is the third blind spot of this exact shape on this branch: a gate is a claim about what it can SEE, and a regex that cannot nest is claiming less than it appears to.
//
// ⚠️ Brace-matched rather than made cleverer. Counting `{` and `}` from the opening `${` is the only thing that ends in the right place for arbitrary nesting, and it is applied to the MOCKUP and the PORTAL by the same function — an asymmetric fix here is what inflated this instrument once already.
function classExpressions(text) {
    const out = [];
    const re = /class=\$\{/g;
    let m;
    while ((m = re.exec(text))) {
        let depth = 1, i = m.index + m[0].length;
        for (; i < text.length && depth > 0; i += 1) {
            if (text[i] === '{') depth += 1;
            else if (text[i] === '}') depth -= 1;
        }
        out.push(text.slice(m.index + m[0].length, i - 1));
    }
    return out;
}
function emitted(paths) {
    const out = new Set();
    for (const p of paths) {
        if (!existsSync(p)) continue;
        const t = readFileSync(p, 'utf8');
        const add = (s) => s.split(/\s+/).forEach((c) => { if (CLASS_RE.test(c) && !isFragment(c)) out.add(c); });
        for (const m of t.matchAll(/class=["'`]([^"'`$]*)["'`]/g)) add(m[1]);
        for (const expr of classExpressions(t)) {
            for (const lit of expr.matchAll(/["'`]([^"'`]*)["'`]/g)) add(lit[1]);
        }
        for (const m of t.matchAll(/class="([^"$]*)/g)) add(m[1]);
    }
    return out;
}

// 🔴 THE THIRD COLUMN WAS A HAND-MAINTAINED LIST AND IT HAD ALREADY GONE STALE. Access renders a Manifest — the live-sessions table with its search box and its selection bar is one, plainly, on screen — and `manifest.js` was not in Access's row. So every class the SelectionBar emits was counted as MISSING from a realm that renders it, which is a false negative in the direction that costs most: it invents work. The entry point is the only thing worth declaring; what a realm actually renders is what it imports, and the import graph cannot go stale because it is the code.
const ENTRY = [
    ['Season', ['season.html'], 'season.js'],
    ['Armory', ['armory.html'], 'armory.js'],
    ['Broadcast', ['broadcast.html'], 'broadcast.js'],
    ['Access', ['access.html'], 'access.js'],
    ['Analytics', ['analytics.html'], 'analytics.js'],
    ['Review', ['review.html'], 'review.js'],
    ['Home', ['index.html'], 'home.js'],
    ['Door', ['door.html'], null],   // the Door component lives in shell.js, which the shared set already covers
];

// Relative imports only, followed transitively. A vendor import (../vendor/preact.mjs) emits no classes and is skipped by the same rule that keeps this from wandering out of portal/ui.
function importsOf(file, seen = new Set()) {
    if (!file || seen.has(file)) return seen;
    const full = join(UI, file);
    if (!existsSync(full)) return seen;
    seen.add(file);
    for (const m of readFileSync(full, 'utf8').matchAll(/from\s+'\.\/([\w.-]+\.js)'/g)) importsOf(m[1], seen);
    return seen;
}

const PAIRS = ENTRY.map(([name, pages, entry]) => [name, pages, [...importsOf(entry)]]);

// 🔴 THE THIRD COLUMN OF `PAIRS` DID NOTHING, AND THE NUMBERS WERE INFLATED FOR IT. `sharedPortal` used to be EVERY portal/ui/*.js file, so each realm's "have" already contained the whole portal's class vocabulary and the per-realm list it is unioned with could not change a single result. A class emitted only by Season counted as covered on Broadcast. Adding the composer on 2026-08-26 moved five realms that do not render it — 51% to 57% in one commit — which is what exposed it.
//
// ⚠️ THE FIX IS TO MIRROR THE MOCKUP'S OWN SPLIT, not to invent one. The mockup's `assets/shell.js` is what every page shares — the header, rail, tray, drawer, toast, command bar, compose and the Discord card — so the portal's shared set is the modules holding those same things, and everything else is attributed to the realm that renders it. Both sides are now scoped the same way; before this the mockup side was scoped per page and the portal side was not, which is the asymmetry that produced the inflation. async.js belongs here by the same test as the rest: the mockup's assets/shell.js is what every page shares, and Shell.async — skeleton, refreshing, slow, failure, progress, banner — is declared in it. Every realm renders those states; none owns them. ⚠️ exportPanel.js joins by the SAME test that put async.js here, applied 2026-08-26: the mockup declares Shell.Export in assets/shell.js, so every page's `want` contains the export panel's vocabulary — and the portal mounts ExportStrip from Shell too. Leaving it attributed per realm made those classes read as missing from Door, which renders no realm surfaces at all and cannot be given one. ⚠️ manifest.js and oneway.js do NOT join, even though the mockup declares both in its own shell: Home and Door render neither, so counting them as shared would inflate exactly the two realms this correction exists to stop mis-measuring. ⚠️ A TRAILING-HYPHEN FRAGMENT IS A PREFIX, NOT A CLASS. `class="lvlb lv-${level}"` scans as the literal `lv-`, and the same goes for `t-${rank}` and `s-${kind}` — three phantoms that can never be emitted by anybody and therefore capped this instrument's own ceiling below 100% for no reason. Dropped on BOTH sides, so the mockup and the portal are measured by the same rule.
const isFragment = (c) => c.endsWith('-');

const SHARED_UI = ['shell.js', 'palette.js', 'overlay.js', 'icons.js', 'tray.js', 'composer.js', 'v2Render.js', 'async.js', 'exportPanel.js'];

const sharedMockup = emitted([join(MOCKUP, 'assets/shell.js')]);
const sharedPortal = emitted(SHARED_UI.map((f) => join(UI, f)));

const showMissing = process.argv.includes('--missing');
let totalWant = 0, totalHave = 0;
console.log(`${'realm'.padEnd(10)} ${'cover'.padStart(6)}  ${'have'.padStart(5)}/${'want'.padEnd(5)}`);
for (const [name, mockPages, uiFiles] of PAIRS) {
    const want = new Set([...emitted(mockPages.map((f) => join(MOCKUP, f))), ...sharedMockup]);
    const have = new Set([...emitted(uiFiles.map((f) => join(UI, f))), ...sharedPortal]);
    const hit = [...want].filter((c) => have.has(c));
    totalWant += want.size; totalHave += hit.length;
    console.log(`${name.padEnd(10)} ${String(Math.round((100 * hit.length) / want.size) + '%').padStart(6)}  ${String(hit.length).padStart(5)}/${want.size}`);
    if (showMissing) {
        const missing = [...want].filter((c) => !have.has(c)).sort();
        console.log(`           from: ${uiFiles.join(' ')}`);
        console.log(`           missing: ${missing.join(' ')}\n`);
    }
}
console.log(`\n${'OVERALL'.padEnd(10)} ${String(Math.round((100 * totalHave) / totalWant) + '%').padStart(6)}  ${totalHave}/${totalWant}`);
console.log('\nDone is when the remaining delta is mockup-only scaffolding — never when this reads 100%.');
console.log('Run with --missing to see the class names behind each number.');
