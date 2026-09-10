'use strict';
// The season countdown reads a STORED INSTANT, and for the life of the portal it did not.
//
// `models/SeasonalData.js` stores `bpEnd` / `rankEnd` / `dmzEnd` as Mongoose `Date`s. What Harkirat types as
// "sept 10" is stored as `2026-09-10T00:00:00.000Z` — 8pm Sep 9 in Toronto — and both dev and prod held exactly
// that value when this was filed. `countdownParts` took the instant, threw it away with `.slice(0, 10)`, and
// counted to `T23:59:59Z` of the same day, adding 23h 59m 59s. The clock read **8h 52m remaining at 11:07 EDT
// on Sep 10**, a full day after the season had ended, and the bot's player-facing timers read the same field.
//
// 🔴 EVERY ASSERTION BELOW IS PAIRED WITH THE OLD EXPRESSION, computed inline, so the file cannot become a
// vacuous pass. If someone reintroduces the end-of-day coercion the first case goes red; and `oldEnd()` proves
// the case DISCRIMINATES rather than merely agreeing with whatever the code currently does.
const assert = require('assert');
const { seasonMoments, countdownParts, seasonTier } = require('../portal/ui/season.logic');

// The exact expression this fix removed, kept as the falsifier.
const oldEnd = (iso) => new Date(String(iso).slice(0, 10) + 'T23:59:59Z').getTime();

const STORED = '2026-09-10T00:00:00.000Z';
const season = {
    bpEnd: STORED, bpEndTBD: false,
    rankEnd: STORED, rankEndTBD: false,
    dmzEnd: '2026-11-11T00:00:00.000Z', dmzEndTBD: false,
};

// ── 1 · the moment carries the instant off the document unmodified ────────────────────────────
const moments = seasonMoments(season, '2026-09-10');
assert.ok(moments.length >= 1, 'seasonMoments returned nothing for a season with three deadlines');
const next = moments[0];
assert.strictEqual(next.iso, '2026-09-10', 'the DAY is still what fmtDay/daysUntil render');
assert.strictEqual(next.at, Date.parse(STORED), 'the moment must carry the stored instant, not a re-derived one');
assert.notStrictEqual(next.at, oldEnd(STORED), 'the instant must not be the end of its own day');

// ── 2 · two lines on one day are ONE wall ─────────────────────────────────────────────────────
assert.strictEqual(next.lines.length, 2, 'bpEnd and rankEnd share a date and must merge into one moment');
assert.deepStrictEqual(next.lines.map((L) => L.key), ['bp', 'rank']);

// A wall carrying two lines that fall at different hours is the EARLIER of them.
const split = seasonMoments({
    bpEnd: '2026-09-10T18:00:00.000Z', bpEndTBD: false,
    rankEnd: '2026-09-10T06:00:00.000Z', rankEndTBD: false,
}, '2026-09-10');
assert.strictEqual(split[0].at, Date.parse('2026-09-10T06:00:00.000Z'),
    'a merged wall falls when its FIRST line falls, never when its last does');

// ── 3 · THE DEFECT ITSELF ─────────────────────────────────────────────────────────────────────
// 2026-09-10T15:07Z is 11:07 EDT — the hour the wrong reading was observed at.
const OBSERVED = Date.UTC(2026, 8, 10, 15, 7, 0);
const p = countdownParts(next.at, OBSERVED);
assert.strictEqual(p.past, true, 'a season stored at 00:00Z has ENDED by 15:07Z the same day');

// The falsifier: the removed expression produces 8h 52m at that same instant, so this case can fail.
const wrong = oldEnd(STORED) - OBSERVED;
assert.strictEqual(Math.floor(wrong / 3600000), 8, 'guard: the old coercion really did read 8h at 15:07Z');
assert.strictEqual(Math.floor((wrong % 3600000) / 60000), 52, 'guard: ...and 52 minutes, which is what was seen');

// ── 4 · a live deadline still counts correctly ────────────────────────────────────────────────
const dmz = countdownParts(Date.parse('2026-11-11T00:00:00.000Z'), OBSERVED);
assert.deepStrictEqual({ d: dmz.d, h: dmz.h, m: dmz.m }, { d: 61, h: 8, m: 53 },
    '2026-09-10T15:07Z to 2026-11-11T00:00Z is 61d 8h 53m');
assert.strictEqual(seasonTier(dmz.d), 'open');

// ── 5 · a bare date still means that day's UTC MIDNIGHT, never the end of it ──────────────────
assert.strictEqual(countdownParts('2026-09-10', Date.UTC(2026, 8, 9, 23, 0)).h, 1,
    'a bare YYYY-MM-DD denotes 00:00Z of that day');
assert.strictEqual(countdownParts('2026-09-10', OBSERVED).past, true);

// ── 6 · absent and unparseable values are absent, never a guessed number ──────────────────────
assert.strictEqual(countdownParts(null, OBSERVED), null);
assert.strictEqual(countdownParts('', OBSERVED), null);
assert.strictEqual(countdownParts('not a date', OBSERVED), null);
assert.deepStrictEqual(seasonMoments({ bpEnd: STORED, bpEndTBD: true }, '2026-09-10'), [],
    'a TBD line is not a deadline');

console.log('seasonCountdown.test.js — 6 groups pass (countdown reads the stored instant)');
