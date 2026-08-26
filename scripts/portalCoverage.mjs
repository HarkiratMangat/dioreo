// scripts/portalCoverage.mjs — how much of each mockup PAGE the portal actually emits.
//
// 🔴 THE NUMBER THAT STOPS THE OVERCLAIM. On 2026-08-26 a two-line status said "all 6 realms on the
// adopted design"; four COMPONENTS were, inside six pages that were still the old composition. The
// commit log looked like a finished migration. This is the only thing that said otherwise, and it
// is a command rather than a paragraph so re-deriving it costs nothing.
//
// Method: for each mockup page, take the class names its markup emits (plus the shared shell's) and
// ask what fraction the corresponding portal component emits. Same method that settled the topic
// -colour fork, for the same reason — two internally-consistent implementations hide from every
// other gate, and only a comparison across them shows the gap.
//
// ⚠️ DONE IS NOT 100%. A real slice of every remaining gap is the mockup's own reviewer scaffolding
// — `data-demo-only` controls, `S.audit()` hooks, `data-async-host`/`data-skel`, the document-nav
// chrome standalone files need — and the mockup says in capitals that some of it MUST NOT SHIP.
// Chasing the number builds things the design forbids. A realm is done when the remaining delta is
// scaffolding, which is why this prints the MISSING NAMES and not just a percentage.
//
// ⚠️ IT UNDER-COUNTS, IN ONE KNOWN WAY. Components build class strings in variables
// (`const cls = 'bar ' + state`), which a source scan cannot see. So true coverage is somewhat
// higher than reported, and a realm that stalls while LOOKING right may be hitting that rather than
// missing markup. Read it with the page open, never instead of opening the page.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOCKUP = join(ROOT, 'docs/superpowers/mockups/2026-08-23-portal-interactive');
const UI = join(ROOT, 'portal/ui');

const CLASS_RE = /^[a-zA-Z][\w-]*$/;
function emitted(paths) {
    const out = new Set();
    for (const p of paths) {
        if (!existsSync(p)) continue;
        const t = readFileSync(p, 'utf8');
        const add = (s) => s.split(/\s+/).forEach((c) => { if (CLASS_RE.test(c)) out.add(c); });
        for (const m of t.matchAll(/class=["'`]([^"'`$]*)["'`]/g)) add(m[1]);
        for (const m of t.matchAll(/class=\$\{([^}]*)\}/g)) {
            for (const lit of m[1].matchAll(/["'`]([^"'`]*)["'`]/g)) add(lit[1]);
        }
        for (const m of t.matchAll(/class="([^"$]*)/g)) add(m[1]);
    }
    return out;
}

const PAIRS = [
    ['Season', ['season.html'], ['season.js', 'track.js', 'board.js', 'manifest.js']],
    ['Armory', ['armory.html'], ['armory.js', 'manifest.js']],
    ['Broadcast', ['broadcast.html'], ['broadcast.js', 'manifest.js']],
    ['Access', ['access.html'], ['access.js']],
    ['Analytics', ['analytics.html'], ['analytics.js', 'manifest.js']],
    ['Review', ['review.html'], ['review.js']],
    ['Home', ['index.html'], ['home.js']],
    ['Door', ['door.html'], ['shell.js']],
];

const sharedMockup = emitted([join(MOCKUP, 'assets/shell.js')]);
const sharedPortal = emitted(readdirSync(UI).filter((f) => f.endsWith('.js')).map((f) => join(UI, f)));

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
        console.log(`           missing: ${missing.join(' ')}\n`);
    }
}
console.log(`\n${'OVERALL'.padEnd(10)} ${String(Math.round((100 * totalHave) / totalWant) + '%').padStart(6)}  ${totalHave}/${totalWant}`);
console.log('\nDone is when the remaining delta is mockup-only scaffolding — never when this reads 100%.');
console.log('Run with --missing to see the class names behind each number.');
