/* Bump the ?v= cache-buster on every asset reference in the package.
 * 🔴 THE GATE THAT DEMANDS THIS SHOULD NOT LEAVE YOU HAND-ROLLING IT. `portal:refs` fails when an
 * asset is newer than its stamp — correct, and on its own it converts one silent failure into a
 * recurring manual chore, which is how a gate ends up being worked around instead of satisfied.
 * `npm run portal:bust` is the other half. Run it, then re-run the gate. */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
/* ⚠️ THE REPO PATH CONTAINS A SPACE, so import.meta.url's pathname is percent-encoded and
 * readdirSync would get "Claude%20Code". fileURLToPath is the fix, never a manual decode. */
const dir = fileURLToPath(new URL('.', import.meta.url));
const stamp = Math.floor(Date.now() / 1000);
let files = 0, refs = 0;
for (const f of readdirSync(dir).filter((f) => f.endsWith('.html'))) {
    const src = readFileSync(dir + f, 'utf8');
    /* Only the ?v= that follows an assets/ path — a bare ?v= elsewhere is a harness cache-bust
     * and none of this script's business. */
    const out = src.replace(/(assets\/[A-Za-z0-9_.-]+)\?v=\d+/g, (_m, a) => { refs++; return `${a}?v=${stamp}`; });
    if (out !== src) { writeFileSync(dir + f, out); files++; }
}
console.log(`cache-buster: ${refs} reference(s) across ${files} file(s) -> v=${stamp}`);
