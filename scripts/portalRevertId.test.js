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

it('the Analytics revert call encodes its id before putting it in a path', () => {
    const src = fs.readFileSync(path.join(ROOT, 'portal', 'ui', 'analytics.js'), 'utf8');
    const call = src.split('\n').find((l) => l.includes('fetchJson(`/api/revert/'));
    assert.ok(call, 'no /api/revert fetch found in portal/ui/analytics.js — this gate has lost its subject');
    assert.ok(/encodeURIComponent\(/.test(call),
        'the revert URL interpolates a raw id: a `#N` change id becomes a URL fragment and never reaches the server\n    ' + call.trim());
});

console.log('  ' + n + ' passed');
