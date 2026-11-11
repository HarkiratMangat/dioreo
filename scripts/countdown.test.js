// scripts/countdown.test.js -- an end typed as the game's countdown snaps to the midnight UTC the draw really ends at (utils/countdown.js, 2026-11-10). The cases are Harkirat's own: High Tide added about 7:20 pm Toronto on Nov 9 (00:20 UTC Nov 10), the game showing "13d 23h", and the rule he accepted (days only takes the rounded reading; no alternate button).
const assert = require('assert');
const { parseCountdown, snapCountdown } = require('../utils/countdown');
const { parseQuickLine } = require('../utils/quickAdd');
const { parseAdminDateRange } = require('../utils/adminParser');
const { parseDrawDates } = require('../utils/drawDates');

const day = d => d && new Date(d).toISOString().slice(0, 10);
const AFTER = new Date('2026-11-10T00:20:00Z'); // 20 minutes after the daily update
const BEFORE = new Date('2026-11-09T23:55:00Z'); // 5 minutes before it

// His table, typed 20 minutes after the update.
for (const [typed, want] of [
    ['13d', '2026-11-23'], ['14d', '2026-11-24'], ['12d 23h', '2026-11-23'], ['13d 22h', '2026-11-24'], ['13d 23h', '2026-11-24'],
    ['14d 11h', '2026-11-24'], ['14d 16h', '2026-11-25'], ['ends in 13d 23h', '2026-11-24'], ['13d23h', '2026-11-24'], ['13 days 23 hours', '2026-11-24'],
]) assert.strictEqual(day(snapCountdown(typed, AFTER)), want, `${typed} at 00:20 UTC`);

// Five minutes before the update the game shows "13d" (or "13d 0h 5m") for a draw ending in 13 days.
assert.strictEqual(day(snapCountdown('13d', BEFORE)), '2026-11-23', '13d five minutes before the update');
assert.strictEqual(day(snapCountdown('13d 0h 5m', BEFORE)), '2026-11-23', 'minutes typed: the midnight inside the minute');

// The result is always a midnight.
for (const typed of ['13d', '13d 23h', '5h', '23h 40m']) assert.strictEqual(new Date(snapCountdown(typed, AFTER)).getUTCHours(), 0, `${typed} lands on midnight`);

// Not countdowns: the calendar phrases adminParser has always read stay theirs.
for (const typed of ['in 2 days', '2 days', 'Nov 24', 'tomorrow', 'ongoing', '', 'd', '13']) assert.strictEqual(parseCountdown(typed), null, `"${typed}" is not a countdown`);
assert.deepStrictEqual(parseCountdown('13d 23h'), { ms: 13 * 864e5 + 23 * 36e5, unit: 36e5 });

// Quick Add: a countdown in the end slot, or on its own, is the end; in the start slot it is a problem.
let q = parseQuickLine('high tide, 13d 23h', { now: AFTER });
assert.strictEqual(day(q.end && q.end.date), '2026-11-24', 'Quick Add reads a bare countdown as the end');
q = parseQuickLine('high tide, starts today, ends in 14d', { now: AFTER, zone: 'America/Toronto' });
assert.strictEqual(day(q.end && q.end.date), '2026-11-24', 'Quick Add: ends in 14d');
q = parseQuickLine('high tide, starts 13d', { now: AFTER });
assert.ok(q.problems.some(p => /countdown/.test(p)), 'a countdown as the start is named as a problem');

// The one-box date ranges (Add/Edit Draw, calendar, season): "Nov 10 - 13d 23h". These read the clock, so the expected end is computed from now.
const want = day(snapCountdown('13d 23h'));
const r = parseAdminDateRange('Nov 10 - 13d 23h');
assert.ok(r && day(r.end) === want, 'adminParser range takes a countdown end');
const dd = parseDrawDates('November 10, 2026 - 13d 23h');
assert.ok(dd && dd.ok !== false && day(dd.end) === want, 'drawDates takes a countdown end');

// A countdown is only ever an END (think pass, 2026-11-10): a start box refuses it as it always did, and every end box takes it.
const { parseAdminDate, parseAdminEndDate, parseBulkEvents } = require('../utils/adminParser');
for (const typed of ['2h', '1d', '13d 23h']) assert.strictEqual(parseAdminDate(typed), null, `start box refuses "${typed}"`);
assert.strictEqual(day(parseAdminEndDate('13d 23h', AFTER)), '2026-11-24', 'end box takes a countdown');
assert.strictEqual(day(parseAdminEndDate('November 24, 2026')), '2026-11-24', 'end box still reads a plain date');
assert.strictEqual(parseAdminDateRange('13d 23h - Nov 30'), null, 'a countdown as a range START is not a range');
// A lone countdown in a draw's dates box is still only an END (2026-11-11 11:45 EST): the start is today at 00:00 UTC, Quick Add's rule, or the start Edit keeps. Until then it was refused while the Add and Edit pop-ups said "the game's countdown works".
const lone = parseDrawDates('13d 23h', { now: AFTER });
assert.ok(lone.ok && day(lone.end) === day(parseAdminEndDate('13d 23h', AFTER)), 'a lone countdown is the draw\'s end');
const ev = parseBulkEvents('11/10 - 13d 23h | Countdown Event');
assert.ok(ev.length === 1 && day(ev[0].endDate) === want, 'Paste Calendar takes a countdown end');
const { applyFields } = require('../core/ops/season.js');
const live = applyFields({}, {}, 'bp', 'Battle Pass, 13d 23h', 'bp', []);
assert.strictEqual(day(live.end), want, 'live season box: a lone countdown is the end');
const skipped = [];
const draft = applyFields({}, {}, 'bp', 'Battle Pass, 13d 23h', 'bp', skipped, { loneDate: 'start' });
assert.ok(!draft.start && skipped.length === 1, 'draft season box: a lone countdown is not a start, and is reported');
console.log('countdown: all checks passed');
