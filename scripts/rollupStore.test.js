// scripts/rollupStore.test.js -- coverage for the roll-up job (utils/rollupStore.js), observability
// layer stage 4. Pure logic plus stubbed Mongoose models: no Atlas. What is deliberately NOT covered
// here: whether Mongo's real $percentile aggregation behaves as expected (confirmed live on this
// cluster's MongoDB 8.0.29 by stage 3's Timing page, which uses the identical operator) and the live
// dev-bot boot test.
// Run: `node scripts/rollupStore.test.js` (also via `npm test`).

const assert = require('assert');
const Module = require('module');

// --- Stub the models BEFORE rollupStore lazily requires them. ---
const rollupOps = [];
const rollupPath = require.resolve('../models/AnalyticsRollup');
require.cache[rollupPath] = new Module(rollupPath, null);
require.cache[rollupPath].filename = rollupPath;
require.cache[rollupPath].loaded = true;
require.cache[rollupPath].exports = { bulkWrite: async (ops) => { rollupOps.push(...ops); } };

let stateDoc = null;
const statePath = require.resolve('../models/RollupState');
require.cache[statePath] = new Module(statePath, null);
require.cache[statePath].filename = statePath;
require.cache[statePath].loaded = true;
require.cache[statePath].exports = {
    findById: (id) => ({ lean: async () => (stateDoc && stateDoc._id === id ? stateDoc : null) }),
    findByIdAndUpdate: async (id, update) => { stateDoc = { _id: id, ...update }; return stateDoc; },
};

let eventAggregateResult = [];
const eventPath = require.resolve('../models/AnalyticsEvent');
require.cache[eventPath] = new Module(eventPath, null);
require.cache[eventPath].filename = eventPath;
require.cache[eventPath].loaded = true;
require.cache[eventPath].exports = { aggregate: async () => eventAggregateResult };

const S = require('../utils/rollupStore');

let failures = 0;
const checks = [];
function check(name, fn) { checks.push([name, fn]); }

// --- dayKey / dayBounds / prevDayKey ---------------------------------------------------------
check('dayKey formats a UTC date as YYYY-MM-DD, not the alertId MMMDD shape', () => {
    assert.strictEqual(S.dayKey(new Date(Date.UTC(2026, 7, 16, 23, 59))), '2026-08-16');
});
check('dayKey is stable across a UTC-midnight boundary, not local time', () => {
    // 2026-08-16 23:30 UTC and 2026-08-17 00:30 UTC must be different days regardless of host TZ.
    assert.notStrictEqual(
        S.dayKey(new Date(Date.UTC(2026, 7, 16, 23, 30))),
        S.dayKey(new Date(Date.UTC(2026, 7, 17, 0, 30))),
    );
});
check('dayBounds returns a [start, end) window exactly 24h wide in UTC', () => {
    const { start, end } = S.dayBounds('2026-08-16');
    assert.strictEqual(end.getTime() - start.getTime(), 86400000);
    assert.strictEqual(start.toISOString(), '2026-08-16T00:00:00.000Z');
});
check('prevDayKey steps back one UTC day, including across a month boundary', () => {
    assert.strictEqual(S.prevDayKey('2026-08-01'), '2026-07-31');
});
check('prevDayKey steps back across a year boundary', () => {
    assert.strictEqual(S.prevDayKey('2026-01-01'), '2025-12-31');
});
check('nextDayKeySafe steps forward one UTC day', () => {
    assert.strictEqual(S.nextDayKeySafe('2026-07-31'), '2026-08-01');
});

// --- daysBetweenInclusive --------------------------------------------------------------------
check('daysBetweenInclusive returns every day in the range, both ends included', () => {
    assert.deepStrictEqual(S.daysBetweenInclusive('2026-08-14', '2026-08-16'), ['2026-08-14', '2026-08-15', '2026-08-16']);
});
check('daysBetweenInclusive returns a single-element array for a same-day range', () => {
    assert.deepStrictEqual(S.daysBetweenInclusive('2026-08-16', '2026-08-16'), ['2026-08-16']);
});

// --- buildRollupDoc ---------------------------------------------------------------------------
check('buildRollupDoc tallies outcome and entry rows into the fixed key sets', () => {
    const doc = S.buildRollupDoc('2026-08-16', {
        command: 'gunsmiths', subcommand: 'search', invocations: 5,
        userHashes: ['a', 'b', 'a'],
        outcomeRows: [{ _id: 'ok', c: 4 }, { _id: 'error', c: 1 }],
        entryRows: [{ _id: 'slash', c: 5 }],
        ackP: [120, 340], durP: [200, 900],
    });
    assert.strictEqual(doc.invocations, 5);
    assert.strictEqual(doc.outcomes.ok, 4);
    assert.strictEqual(doc.outcomes.error, 1);
    assert.strictEqual(doc.outcomes.swallowed_by_cooldown, 0, 'every outcome key must be present, even at zero');
    assert.strictEqual(doc.entry.slash, 5);
    assert.strictEqual(doc.entry.button, 0);
    assert.strictEqual(doc.ackMs.p50, 120);
    assert.strictEqual(doc.durationMs.p95, 900);
});
check('buildRollupDoc dedupes userHashes before counting distinctUsers', () => {
    const doc = S.buildRollupDoc('2026-08-16', {
        command: 'draws', invocations: 3, userHashes: ['x', 'x', 'y', null],
        outcomeRows: [], entryRows: [], ackP: null, durP: null,
    });
    assert.strictEqual(doc.distinctUsers, 2, 'null and the duplicate must not count as distinct users');
    assert.strictEqual(doc.distinctUsersExact, true);
    assert.deepStrictEqual(doc.userHashes.sort(), ['x', 'y']);
});
check('buildRollupDoc drops the userHashes array and flips distinctUsersExact past the cap', () => {
    const many = Array.from({ length: S.DISTINCT_HASHES_CAP + 1 }, (_, i) => `h${i}`);
    const doc = S.buildRollupDoc('2026-08-16', {
        command: 'draws', invocations: many.length, userHashes: many,
        outcomeRows: [], entryRows: [], ackP: null, durP: null,
    });
    assert.strictEqual(doc.distinctUsersExact, false, 'over the cap, an exact union is no longer promised');
    assert.strictEqual(doc.userHashes, undefined, 'a PARTIAL set must not be kept -- it would silently undercount a later union');
    assert.strictEqual(doc.distinctUsers, many.length, 'the COUNT for this single day stays exact even when the set is dropped');
});
check('buildRollupDoc treats a missing percentile result as null, not a crash', () => {
    const doc = S.buildRollupDoc('2026-08-16', {
        command: 'draws', invocations: 0, userHashes: [], outcomeRows: [], entryRows: [], ackP: null, durP: undefined,
    });
    assert.strictEqual(doc.ackMs.p50, null);
    assert.strictEqual(doc.durationMs.p95, null);
});

// --- catchUpRollups (integration of the pure day-range logic with the stubbed models) ---------
check('catchUpRollups never rolls up "today" -- only through yesterday', async () => {
    stateDoc = null;
    rollupOps.length = 0;
    eventAggregateResult = [{
        _id: { command: 'draws', subcommand: null }, invocations: 1, userHashes: ['a'],
        outcomes: ['ok'], entries: ['slash'], ackP: [10, 20], durP: [30, 40],
    }];
    const rolled = await S.catchUpRollups();
    const todayKey = S.dayKey(new Date());
    assert.ok(rolled >= 1, 'expected at least yesterday to be rolled up');
    const filters = rollupOps.map(op => op.updateOne.filter.day);
    assert.ok(!filters.includes(todayKey), 'today must never be rolled up -- it is still in progress');
});
check('catchUpRollups is idempotent: a second call with no new days rolls up nothing', async () => {
    const before = rollupOps.length;
    const rolled = await S.catchUpRollups();
    assert.strictEqual(rolled, 0, 'once caught up, a same-day re-run should have nothing left to do');
    assert.strictEqual(rollupOps.length, before);
});
check('catchUpRollups clamps a very old resume point to CATCH_UP_WINDOW_DAYS rather than an unbounded backlog', async () => {
    stateDoc = { _id: 'lastRolledUpDay', day: '2020-01-01' };
    rollupOps.length = 0;
    const rolled = await S.catchUpRollups();
    // The window is CATCH_UP_WINDOW_DAYS days ending yesterday -- never more than that many distinct
    // days get touched, no matter how stale the stored state is.
    assert.ok(rolled <= S.CATCH_UP_WINDOW_DAYS + 1, `expected at most ~${S.CATCH_UP_WINDOW_DAYS} days, got ${rolled}`);
});
check('catchUpRollups swallows a Mongo failure rather than throwing past its own boundary', async () => {
    const AnalyticsRollup = require('../models/AnalyticsRollup');
    const original = AnalyticsRollup.bulkWrite;
    AnalyticsRollup.bulkWrite = async () => { throw new Error('simulated Atlas outage'); };
    stateDoc = null;
    try {
        const result = await S.catchUpRollups();
        assert.strictEqual(result, 0, 'a failed run must report 0 rolled, never throw');
    } finally {
        AnalyticsRollup.bulkWrite = original;
    }
});

(async () => {
    for (const [name, fn] of checks) {
        try { await fn(); console.log(`  ✓ ${name}`); }
        catch (error) { failures++; console.error(`  ✗ ${name}\n      ${error.message}`); }
    }
    if (failures > 0) { console.error(`❌ rollupStore: ${failures} case(s) failed`); process.exit(1); }
    console.log(`✅ rollupStore: ${checks.length} cases passed`);
    process.exit(0);
})();
