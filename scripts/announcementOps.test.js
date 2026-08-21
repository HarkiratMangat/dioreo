// scripts/announcementOps.test.js
const assert = require('assert');
const Announcement = require('../models/Announcement');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('startsAt is declared on the schema and defaults to null', () => {
    const path = Announcement.schema.path('startsAt');
    assert.ok(path, 'startsAt is NOT declared -- Mongoose will drop it silently on the next fetch');
    assert.strictEqual(new Announcement({ text: 'x', createdBy: 'y', color: 0 }).startsAt, null,
        'null must mean "live now", so every existing announcement keeps its current behaviour');
});

// ⚠️ CORRECTED from the plan's own draft test: utils/announcement.js's computeExpiresAt() only understands blank/"never"/a whole number of DAYS FROM NOW -- it cannot parse an absolute date string like "2026-09-01" at all (Number('2026-09-01') is NaN, so that would fail as an unparseable EXPIRY, not exercise the start-after-expiry check). `expiry` (relative) is the real contract; `startsAt` (an absolute admin date) is the new field this task adds.
check('announcement.post rejects a start after its own expiry', () => {
    const r = ops.resolveOp('announcement.post').validate({
        type: 'announcement.post',
        payload: { text: 'hi', expiry: '5', startsAt: 'September 10, 2099' }
    });
    assert.strictEqual(r.ok, false);
    assert.ok(r.errors.some(e => /after it expires/i.test(e)), 'an announcement that starts after it expires can never show');
});

check('announcement.post accepts blank expiry as the 60-day default', () => {
    const r = ops.resolveOp('announcement.post').validate({ type: 'announcement.post', payload: { text: 'hi', expiry: '' } });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.ok(r.normalized.payload.expiresAt instanceof Date);
});

check('announcement.post rejects an unparseable expiry', () => {
    const r = ops.resolveOp('announcement.post').validate({ type: 'announcement.post', payload: { text: 'hi', expiry: 'sometime' } });
    assert.strictEqual(r.ok, false);
});

check('announcement.delete inverts to a post carrying the original createdAt and color', () => {
    const doc = { text: 'hi', color: 1, createdBy: 'u', createdAt: new Date('2026-08-01'), expiresAt: null, startsAt: null };
    const inv = ops.resolveOp('announcement.delete').invert({ action: 'delete', applied: { removed: doc } });
    assert.strictEqual(inv.type, 'announcement.post');
    assert.deepStrictEqual(inv.payload.createdAt, doc.createdAt,
        'restoring must not silently re-date the announcement to now');
    assert.strictEqual(inv.payload.color, doc.color, 'restoring must not silently re-roll the accent color');
});

check('announcement.delete\'s invert re-validates without re-parsing expiresAt as a day-count', () => {
    // The most likely regression: alreadyNormalized() failing to detect a restored Date and running it back through computeExpiresAt(), which would reject a real Date as an unparseable string.
    const inv = ops.resolveOp('announcement.delete').invert({
        action: 'delete', applied: { removed: { text: 'hi', color: 1, createdBy: 'u', createdAt: new Date(), expiresAt: null, startsAt: null } }
    });
    const r = ops.resolveOp('announcement.post').validate(inv);
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
});

process.exit(failures ? 1 : 0);
