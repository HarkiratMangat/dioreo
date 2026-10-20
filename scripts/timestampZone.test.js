// scripts/timestampZone.test.js -- relative and absolute dates must not depend on the HOST's time zone (added 2026-10-20 16:50 EDT).
// chrono reads a plain Date reference in the host's local fields, so /timestamp, Convert Times and patch-notes release times used to shift by the gap between the machine's zone and the user's: on the prod VM (Etc/UTC) "in 2 hours" for a Toronto user came out +6 h. scripts/tzIndependence.test.mjs runs this file under TZ=UTC, Asia/Tokyo and America/Toronto, so the UTC case runs whatever zone CI or the Mac is in.
const assert = require('assert');
const { generateTimestamps } = require('../utils/timestampHelper');
const { convertText } = require('../commands/convertTimes');
const { parseReleaseDateTime } = require('../utils/adminParser');

// 22:37 on 2026-10-19 in Toronto: the moment the bug was measured, late enough that "tomorrow" crosses a UTC midnight.
const NOW = new Date('2026-10-20T02:37:00Z');
const at = (iso) => Date.parse(iso) / 1000;
let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ok   [TZ=${process.env.TZ}] ${name}`); }
    catch (e) { failures++; console.error(`  FAIL [TZ=${process.env.TZ}] ${name}\n       ${e.message}`); }
}
const ts = (text, zone) => generateTimestamps(text, zone, NOW).unix;

check('"in 2 hours" is two hours away, never six', () => {
    assert.strictEqual(ts('in 2 hours', 'America/Toronto'), at('2026-10-20T04:37:00Z'));
    assert.notStrictEqual(ts('in 2 hours', 'America/Toronto'), at('2026-10-20T08:37:00Z'));
});
check('"tomorrow" is the next Toronto midnight, about 1.4 h away', () => {
    assert.strictEqual(ts('tomorrow', 'America/Toronto'), at('2026-10-20T04:00:00Z'));
});
check('"tomorrow 9am" is 9am on the Toronto user\'s tomorrow', () => {
    assert.strictEqual(ts('tomorrow 9am', 'America/Toronto'), at('2026-10-20T13:00:00Z'));
});
check('"tomorrow 9am" for a Tokyo user is 9am JST on their tomorrow', () => {
    assert.strictEqual(ts('tomorrow 9am', 'Asia/Tokyo'), at('2026-10-21T00:00:00Z'));
});
check('a date across the daylight-time change uses that date\'s offset (EST)', () => {
    assert.strictEqual(ts('jan 5 9am', 'America/Toronto'), at('2027-01-05T14:00:00Z'));
});
check('a bare date is midnight in the zone, not noon', () => {
    assert.strictEqual(ts('july 17', 'America/Toronto'), at('2027-07-17T04:00:00Z'));
});
check('a time already past today rolls to tomorrow', () => {
    assert.strictEqual(ts('19:30', 'America/Toronto'), at('2026-10-20T23:30:00Z'));
});
// "tomorrow" is the user's tomorrow (Oct 20 in Toronto), and the named zone sets the clock: 02:00 UTC that day, even though it is already past.
check('a time that names its zone is read on that zone\'s clock', () => {
    assert.strictEqual(ts('tomorrow 2am UTC', 'America/Toronto'), at('2026-10-20T02:00:00Z'));
});

check('Convert Times: "tomorrow 8 PM" counts from the reader\'s day', () => {
    const { lines } = convertText('Event tomorrow 8 PM', 'America/Toronto', NOW);
    assert.strictEqual(Number(/<t:(\d+):/.exec(lines[0])[1]), at('2026-10-21T00:00:00Z'));
});

check('release time: "tomorrow 7pm" counts from the admin\'s day', () => {
    assert.strictEqual(parseReleaseDateTime('tomorrow 7pm', 'America/Toronto', NOW).toISOString(), '2026-10-20T23:00:00.000Z');
});
check('release time: a typed wall-clock time is read in the admin\'s zone', () => {
    assert.strictEqual(parseReleaseDateTime('July 22, 2026 7:20 AM', 'America/Toronto', NOW).toISOString(), '2026-07-22T11:20:00.000Z');
});
check('release time: an ISO string with its own offset round-trips untouched', () => {
    assert.strictEqual(parseReleaseDateTime('2026-07-06T16:27:56.919Z', 'America/Toronto', NOW).toISOString(), '2026-07-06T16:27:56.919Z');
});

process.exit(failures ? 1 : 0);
