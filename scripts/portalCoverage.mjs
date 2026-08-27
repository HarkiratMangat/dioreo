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
        for (const c of emittedFrom(readFileSync(p, 'utf8'))) out.add(c);
    }
    return out;
}

// The same scan over a STRING, so a slice of one file (one shell member) is measured by exactly the rule a whole file is.
function emittedFrom(t) {
    const out = new Set();
    {
        const add = (s) => s.split(/\s+/).forEach((c) => { if (CLASS_RE.test(c) && !isFragment(c)) out.add(c); });
        for (const m of t.matchAll(/class=["'`]([^"'`$]*)["'`]/g)) add(m[1]);
        for (const expr of classExpressions(t)) {
            for (const lit of expr.matchAll(/["'`]([^"'`]*)["'`]/g)) add(lit[1]);
        }
        for (const m of t.matchAll(/class="([^"$]*)/g)) add(m[1]);
        // 🔴 A CLASS PASSED AS A DATA VALUE IS STILL EMITTED. A Manifest column declares `col: 'c-type'` and `metaClass: 'rowlife'`, and the component renders them into a real class attribute — but the literal lives in the REALM file as a property, so a scan for `class=` finds the component's fallbacks and never the realm's override. Season emitted `c-type`, `c-spark` and `rowlife` and was reported as missing all three. `portal:orphans` learned this same lesson yesterday and this file did not, which is the fourth blind spot of one shape on this branch.
        for (const m of t.matchAll(/\b(?:col|metaClass|cls|accentClass):\s*'([^']+)'/g)) add(m[1]);
        // 🔴 THE UNDER-COUNT THIS FILE'S OWN HEADER ADMITTED TO, CLOSED. A component that computes its cell class into a variable — `const kind = ci === 0 ? 'n' : c.dataKind === 'detail' ? 'det' : 'ta-r';` then `class=${kind}` — puts no literal anywhere near a `class=` attribute, so every one of those names read as unbuilt. The Manifest has emitted `det`, `nums` and `ta-r` on every row since dataKind was added, and this instrument called all three missing from the realms that render them.
        //
        // ⚠️ BOUNDED BY USE, NOT BY SHAPE. Only identifiers that actually appear inside a `class=` expression are resolved, and only their own declaration is read — so an unrelated `const MESSAGES = ['saved', 'failed']` is never mistaken for a class list. CLASS_RE still filters what survives, and the same pass runs over the mockup, which builds its classes the same way. 🔴 IMPERATIVE CLASS TOGGLES ARE DELIBERATELY NOT READ, AND THIS IS THE ONE PLACE THE TWO SIDES ARE MEASURED BY DIFFERENT IDIOMS ON PURPOSE. Reading `classList.toggle('is-slow', on)` was tried and reverted the same hour: the mockup is imperative vanilla JS whose dominant way of expressing state IS a toggle, and the portal is declarative Preact whose dominant way is a computed class string. Scanning toggles reads one side's whole state vocabulary and the other's not at all, so it charged the portal ~200 classes for a difference in MECHANISM — and the evidence is that it demanded classes the portal plainly implements: async.js emits `is-refreshing` and `is-slow` from a returned hostClass, the Track collapses lanes as `lnc`, and `zero`/`stg-clear` encode a rule shell.js deliberately reversed (a chip is ABSENT at zero rather than dimmed). A measurement that moves because two codebases are written in different styles is measuring the style.
        //
        // ⚠️ THE COST IS REAL AND NAMED: tips.js sets `sub.className = 'sub'` on the tooltip's second line — built as nodes because a tip's text is a build name and not ours to trust as markup — so `sub` reads as missing from every realm while the shared runtime has always emitted it. That is this instrument's known under-count, disclosed in the header, not a portal gap.
        const inClassPos = new Set();
        for (const expr of classExpressions(t)) {
            for (const id of expr.matchAll(/\b([A-Za-z_$][\w$]*)\b/g)) inClassPos.add(id[1]);
        }
        for (const id of inClassPos) {
            const decl = new RegExp(`\\b(?:const|let|var)\\s+${id}\\s*=([\\s\\S]{0,600}?);`, 'g');
            for (const d of t.matchAll(decl)) {
                for (const lit of d[1].matchAll(/'([^'\n]*)'|"([^"\n]*)"/g)) add(lit[1] ?? lit[2] ?? '');
            }
        }
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

// 🔴 THE LAST ASYMMETRY, AND IT IS THE SAME ONE THIS FILE ALREADY FIXED ONCE FROM THE OTHER SIDE. The portal half is scoped by IMPORT GRAPH — a realm is charged for `oneway.js` only if it imports it. The mockup half was scoped by FILE: all 2,821 lines of assets/shell.js counted against every page, including the one-way strip, the composer, the selection bar and the Discord card. But that file is not a monolith; it is an object of members, and a page opts in by CALLING one. Measured: `Shell.oneWay` is called by season.html alone, `Shell.compose` by season.html alone, `Shell.selection` by three pages, and door.html calls exactly one member in the whole file. So seven realms were charged for a strip only Season mounts, and the Door — a sign-in screen — was charged for the composer's entire vocabulary. That is not a gap in the portal; it is the instrument measuring a page against a component the design never puts on it.
//
// ⚠️ THE PARTITION IS DERIVED, NOT LISTED. A hand-written "these are the opt-in components" list is a second authority that goes stale the first time the mockup adds one. Members are read out of the file, a call graph is built between them, and a page's shell vocabulary is the CLOSURE of the members that page calls — so `compose` pulling in `pasteRows` and `dateField` is followed, and a member no page names is simply never charged to anyone.
//
// ⚠️ BOTH ALIASES. The pages use `Shell.` and `S.` interchangeably for the same object; a scan for `Shell.` alone reported season.html calling 8 members when it calls 27, and would have attributed the one-way strip to nobody at all.
function shellMembers(src) {
    const out = new Map();
    // ⚠️ KEYWORDS ARE NOT MEMBERS. `if (…)` sits at this indent all over the file, and matching it invented a member nobody calls — which quietly moved the code after it out of chrome and out of every page's want. Sixty-one "members" became fifty-three once the keywords were excluded.
    const KEYWORD = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'function', 'do', 'else', 'try', 'typeof', 'new', 'await', 'const', 'let', 'var']);
    const re = /^ {4}([A-Za-z_$][\w$]*)\s*[({]/gm;
    const hits = [...src.matchAll(re)].filter((h) => !KEYWORD.has(h[1]));
    // ⚠️ THE RANGES ARE RETURNED TOO. Chrome is "everything in this file that is not inside a member", and the first attempt computed it by string-splitting on the joined member text — which never appears verbatim in the source, so nothing was removed, every page kept the whole vocabulary, and the numbers did not move by a single class. A silent no-op that looked exactly like "the correction made no difference".
    const ranges = [];
    for (let i = 0; i < hits.length; i += 1) {
        const start = hits[i].index;
        const end = i + 1 < hits.length ? hits[i + 1].index : src.length;
        ranges.push([start, end]);
        // A name can be declared twice (Store and Shell both have members at this indent); the union is correct — either declaration's markup ships when the name is called.
        out.set(hits[i][1], (out.get(hits[i][1]) || '') + src.slice(start, end));
    }
    return { members: out, ranges };
}

function calledIn(text, names) {
    const out = new Set();
    for (const m of text.matchAll(/\b(?:Shell|S)\.([A-Za-z_$][\w$]*)/g)) if (names.has(m[1])) out.add(m[1]);
    // A member calling a sibling by bare name inside the same object literal — `pasteRows({…})` from within `compose` — is the common form and is invisible to the qualified scan above.
    for (const m of text.matchAll(/(?:^|[^.\w$])([A-Za-z_$][\w$]*)\s*\(/g)) if (names.has(m[1])) out.add(m[1]);
    return out;
}

function closureOf(seed, members) {
    const names = new Set(members.keys());
    const seen = new Set();
    const queue = [...seed];
    while (queue.length) {
        const n = queue.pop();
        if (seen.has(n) || !members.has(n)) continue;
        seen.add(n);
        for (const next of calledIn(members.get(n), names)) if (!seen.has(next)) queue.push(next);
    }
    return seen;
}

const SHELL_SRC = readFileSync(join(MOCKUP, 'assets/shell.js'), 'utf8');
const { members: MEMBERS, ranges: MEMBER_RANGES } = shellMembers(SHELL_SRC);
// Whatever is not inside a member — top-level constants and markup — belongs to every page.
const shellChrome = emittedFrom((() => {
    let out = '', at = 0;
    for (const [a, b] of MEMBER_RANGES) { out += SHELL_SRC.slice(at, a); at = b; }
    return out + SHELL_SRC.slice(at);
})());
const memberClasses = new Map([...MEMBERS].map(([n, body]) => [n, emittedFrom(body)]));

function shellVocabularyFor(pageSrc) {
    const out = new Set(shellChrome);
    for (const n of closureOf(calledIn(pageSrc, new Set(MEMBERS.keys())), MEMBERS)) {
        for (const c of memberClasses.get(n) || []) out.add(c);
    }
    return out;
}

const sharedPortal = emitted(SHARED_UI.map((f) => join(UI, f)));

// 🔴 A CLASS THE ADOPTED SHEET DOES NOT STYLE CANNOT BE WANTED, and the two gates now hold each other rather than pulling apart. Reading the mockup's imperative class toggles pulled in its animation runtime — `rolling` and `fdelta` from `setFigure`, `rb` from the export-again demo hook — and measured, **app.css has no rule for `rolling` or `fdelta` at all**. The mockup does not style them either; they are hooks its own demo runtime toggles. Emitting one here would fail `portal:orphans`, which refuses a class with no rule — so the instrument was asking for markup the other gate forbids, which is not a gap, it is two checks disagreeing.
//
// ⚠️ IT IS A LOOPHOLE IF READ ALONE, and it is worth saying so: `want` now depends on a file this repo can edit, so adding a rule adds a demand and deleting one removes it. What closes it is that `portal:orphans` fails on a class with no rule and a rule with no markup is dead weight the stylesheet's own header calls out — neither direction is free. The twelve classes this branch authored rules for went the other way on purpose: naming the markup and styling it beats dropping both from the measurement.
const STYLED = (() => {
    const css = readFileSync(join(UI, 'app.css'), 'utf8') + readFileSync(join(UI, 'tokens.css'), 'utf8');
    const out = new Set();
    for (const m of css.matchAll(/\.(-?[A-Za-z_][\w-]*)/g)) out.add(m[1]);
    return out;
})();

const showMissing = process.argv.includes('--missing');
let totalWant = 0, totalHave = 0;
console.log(`${'realm'.padEnd(10)} ${'cover'.padStart(6)}  ${'have'.padStart(5)}/${'want'.padEnd(5)}`);
for (const [name, mockPages, uiFiles] of PAIRS) {
    const pageSrc = mockPages.map((f) => join(MOCKUP, f)).filter(existsSync).map((f) => readFileSync(f, 'utf8')).join('\n');
    const want = new Set([...emitted(mockPages.map((f) => join(MOCKUP, f))), ...shellVocabularyFor(pageSrc)]
        .filter((c) => STYLED.has(c)));
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
