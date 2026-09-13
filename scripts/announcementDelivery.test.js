// scripts/announcementDelivery.test.js
//
// Pure-logic test of utils/announcement.js's due-for-delivery decision (isAnnouncementDue), driven by
// a FIXED simulated clock rather than a live database or a real Discord interaction --
// announcementOps.test.js already covers the DB-touching op layer (validate/apply/invert); this file
// is only about "given this state, is this announcement due right now", which is the function most
// likely to get the 24h boundary math wrong.
const assert = require('assert');
const { isAnnouncementDue, isRepeatingAnnouncement, MIN_HOURS_BETWEEN_REPEATS } = require('../utils/announcement');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

const HOUR_MS = 60 * 60 * 1000;
const EPOCH = Date.parse('2026-09-13T00:00:00.000Z');
const at = (hours) => EPOCH + hours * HOUR_MS;

check('MIN_HOURS_BETWEEN_REPEATS is the fixed 24h minimum the plan specifies', () => {
    assert.strictEqual(MIN_HOURS_BETWEEN_REPEATS, 24);
});

check('a non-repeating announcement is due once, unseen, then never again -- unchanged from before repeat existed', () => {
    const announcement = { _id: 'a1', repeatCount: null };
    const seen = new Set();
    const deliveries = new Map();
    assert.strictEqual(isAnnouncementDue(announcement, seen, deliveries, at(0)), true, 'unseen -- due');
    seen.add('a1');
    assert.strictEqual(isAnnouncementDue(announcement, seen, deliveries, at(1)), false, 'seen, not repeating -- never due again');
});

check('repeat 3 at 0h/23h/25h/49h/73h: delivers on 0h, 25h, 49h and stops at 73h', () => {
    const announcement = { _id: 'a2', repeatCount: 3 };
    const seen = new Set();
    const deliveries = new Map();

    // Mirrors what maybeSendAnnouncement() itself does on a real delivery: mark seen, then upsert the delivery counter -- so this simulation exercises the exact same state transition the production code makes, not a hand-picked stand-in for it.
    function checkDueThenDeliver(hours) {
        const due = isAnnouncementDue(announcement, seen, deliveries, at(hours));
        if (due) {
            seen.add('a2');
            const existing = deliveries.get('a2');
            deliveries.set('a2', { count: (existing?.count || 0) + 1, lastShownAt: at(hours) });
        }
        return due;
    }

    assert.strictEqual(checkDueThenDeliver(0), true, '0h -- first-ever showing, unseen');
    assert.strictEqual(checkDueThenDeliver(23), false, '23h -- under the 24h minimum since the 0h showing');
    assert.strictEqual(checkDueThenDeliver(25), true, '25h -- 25h since the 0h showing clears the minimum, and count(1) < repeatCount(3)');
    assert.strictEqual(checkDueThenDeliver(49), true, '49h -- exactly 24h since the 25h showing, and count(2) < repeatCount(3)');
    assert.strictEqual(checkDueThenDeliver(73), false, '73h -- 24h have passed since the 49h showing, but count(3) already meets repeatCount(3)');

    assert.strictEqual(deliveries.get('a2').count, 3, 'exactly 3 deliveries happened across the whole timeline, matching repeatCount');
});

check('a repeating announcement seen once but with no delivery row yet is due immediately -- "no last-shown record" must never read as "shown 24h ago"', () => {
    const announcement = { _id: 'a3', repeatCount: 2 };
    const seen = new Set(['a3']);
    const deliveries = new Map();
    assert.strictEqual(isAnnouncementDue(announcement, seen, deliveries, at(0)), true);
});

check('isRepeatingAnnouncement rejects 0, negative and non-integer repeatCount, accepts any integer >= 1', () => {
    assert.strictEqual(isRepeatingAnnouncement({ repeatCount: 0 }), false);
    assert.strictEqual(isRepeatingAnnouncement({ repeatCount: -1 }), false);
    assert.strictEqual(isRepeatingAnnouncement({ repeatCount: 1.5 }), false);
    assert.strictEqual(isRepeatingAnnouncement({ repeatCount: null }), false);
    assert.strictEqual(isRepeatingAnnouncement({ repeatCount: undefined }), false);
    assert.strictEqual(isRepeatingAnnouncement({ repeatCount: 1 }), true);
    assert.strictEqual(isRepeatingAnnouncement({ repeatCount: 10 }), true);
});

process.exit(failures ? 1 : 0);
