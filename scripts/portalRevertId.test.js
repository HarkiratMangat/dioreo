/* scripts/portalRevertId.test.js — the revert seam: a change id survives the round trip through a URL.
 *
 * WHY THIS EXISTS: found by the first Review real walk, 2026-09-02 22:41 EDT. `POST /api/revert/:changeId`
 * could not address ANY change minted since ids became `#N` (utils/changeStore.js, 2026-08-23), because of two
 * independent faults at one seam — the client interpolated a raw `#` into a URL (making it a fragment, so the
 * id never left the browser) and the server never decoded the segment (so a correctly-encoded `%231` was
 * looked up literally). Either fix alone leaves the button dead, which is why both halves are asserted here.
 *
 * ⚠️ BOTH ASSERTIONS FAIL ON THE PRE-FIX CODE — checked by reverting each change in turn before wiring this
 * in. A gate proven only against the fixed code proves nothing (REVIEW-PROMPT.md §7.1).
 */
'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { segment } = require('../portal/api/httpUtil');

const ROOT = path.join(__dirname, '..');
let n = 0;
const it = (what, fn) => { fn(); n += 1; console.log('  ok  ' + what); };

console.log('portalRevertId');

it('segment() decodes a percent-encoded change id', () => {
    assert.strictEqual(segment(new URL('http://localhost:8787/api/revert/%231'), 2), '#1');
    assert.strictEqual(segment(new URL('http://localhost:8787/api/revert/%23284'), 2), '#284');
});

it('segment() leaves a legacy id untouched', () => {
    assert.strictEqual(segment(new URL('http://localhost:8787/api/revert/Aug22-28'), 2), 'Aug22-28');
});

it('segment() survives a malformed escape instead of throwing', () => {
    assert.strictEqual(segment(new URL('http://localhost:8787/api/revert/%ZZ'), 2), '%ZZ');
});

it('segment() still reads an ObjectId path unchanged', () => {
    assert.strictEqual(segment(new URL('http://localhost:8787/api/changeset/6a98ddaf6c28ce6f6ff06bb2/commit'), 2), '6a98ddaf6c28ce6f6ff06bb2');
});

it('EVERY revert call site in portal/ui encodes its id', () => {
    // ⚠️ EVERY, NOT THE FIRST. This read one line of analytics.js — `.find(...)` — so a SECOND call site, added later or in another file, was unchecked. There is exactly one today, which made the hole latent rather than live. Found by the reader test 2026-09-03 09:04 EDT.
    const files = fs.readdirSync(path.join(ROOT, 'portal', 'ui')).filter((f) => f.endsWith('.js'));
    const sites = [];
    for (const f of files) {
        const src = fs.readFileSync(path.join(ROOT, 'portal', 'ui', f), 'utf8');
        src.split('\n').forEach((line, i) => {
            const code = line.replace(/\/\/.*$/, '');            // a comment describing the bug is not a call site
            if (/\/api\/revert\//.test(code) && /fetch|Json/.test(code)) sites.push({ f, n: i + 1, line: code.trim() });
        });
    }
    assert.ok(sites.length > 0, 'no /api/revert call site found in portal/ui — this gate has lost its subject');
    for (const s of sites) {
        assert.ok(/encodeURIComponent\(/.test(s.line),
            `${s.f}:${s.n} interpolates a raw id: a \`#N\` change id becomes a URL FRAGMENT and never reaches the server\n    ` + s.line);
    }
});

it('the revert ROUTE reads its id through segment(), the function this gate tests', () => {
    // ⚠️ WITHOUT THIS the gate proved a helper nobody had to call. Replacing segment() at the route with an inline regex capture left both halves green while the button died again. Found by the reader test 2026-09-03 09:04 EDT.
    const src = fs.readFileSync(path.join(ROOT, 'portal', 'api', 'changesets.js'), 'utf8');
    const i = src.indexOf('/^\\/api\\/revert\\/');
    assert.ok(i !== -1, 'no /api/revert route found in portal/api/changesets.js — this gate has lost its subject');
    const body = src.slice(i, i + 600);
    assert.ok(/segment\(url,\s*2\)/.test(body),
        'the revert route no longer reads its id through segment(), so segment()\'s decode above proves nothing about it\n    ' + body.split('\n').slice(0, 4).join('\n    '));
});

console.log('  ' + n + ' passed');
