// ==========================================
// ROLLUP STORE -- aggregates AnalyticsEvent into one AnalyticsRollup doc per (day, command, subcommand)
// ==========================================
// Stage 4 of the observability layer: docs/superpowers/specs/2026-08-16-observability-layer-design.md §2 "Roll-ups". Triggered from bot/lifecycle.js's existing daily heartbeat -- not a second scheduler -- and fire-and-forget/swallowed like every other write in this layer (a roll-up failing must never affect the heartbeat alert it rides alongside).
//
// 🔴 EACH RUN IS A FULL RECOMPUTE-AND-UPSERT OF ITS TARGET DAY, NEVER AN INCREMENT. This is what makes catchUpRollups() safe to call on every heartbeat and after any gap: a day already rolled up is simply recomputed to the same numbers (idempotent), and a late-arriving event for a day whose roll-up already exists is picked up correctly the next time that day is (re)rolled -- which happens naturally because "yesterday" gets rolled up again on tomorrow's heartbeat before the day-before-yesterday boundary moves past it. Only days strictly older than the CATCH_UP_WINDOW_DAYS below stop being re-touched.

const AnalyticsRollup = require('../models/AnalyticsRollup');
const RollupState = require('../models/RollupState');

const DISTINCT_HASHES_CAP = 5000;   // bounded, per the spec's own suggestion -- this bot's real volume
                                    // (940 total documents across the whole DB, measured 2026-08-16 10:38 EDT) is nowhere near this, so the cap is headroom, not a real constraint
const CATCH_UP_WINDOW_DAYS = 14;    // never re-roll further back than this on a catch-up pass -- a
                                    // multi-week gap should be investigated (see docs/db-deferred-list.md's backup-scheduling item), not silently absorbed into ever-longer roll-up runs on the next heartbeat

// Imported from the model, never redeclared (v3-pre-release review, finding #31) -- see AnalyticsRollup.js's own comment on why these were a silent-drift trap as two verbatim copies.
const { OUTCOME_KEYS, ENTRY_KEYS } = AnalyticsRollup;

function pad2(n) { return String(n).padStart(2, '0'); }

// 'YYYY-MM-DD', UTC. Deliberately NOT utils/alertStore.js's 'MMMDD' dateKey() -- see models/AnalyticsRollup.js's header for why a roll-up needs the year and AlertLog/ChangeLog don't.
function dayKey(date) {
    return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

// The [start, end) UTC window for a given day key, as Date objects Mongo can range-query against.
function dayBounds(key) {
    const [y, m, d] = key.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, d));
    const end = new Date(Date.UTC(y, m - 1, d + 1));
    return { start, end };
}

// key - 1 day, staying in UTC-safe arithmetic (Date.UTC normalises an out-of-range day-of-month, e.g. day 0 of a month rolls back into the previous month correctly).
function prevDayKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    return dayKey(new Date(Date.UTC(y, m - 1, d - 1)));
}

function daysBetweenInclusive(fromKey, toKey) {
    const out = [];
    let cur = fromKey;
    let guard = 0;
    while (cur <= toKey && guard++ < 400) {   // 400-day guard: this is a catch-up loop over an internal
                                              // window, not user input, but an unbounded while(true) on a string comparison that could misbehave is still a bug waiting to OOM the process it is observing
        out.push(cur);
        if (cur === toKey) break;
        const [y, m, d] = cur.split('-').map(Number);
        cur = dayKey(new Date(Date.UTC(y, m - 1, d + 1)));
    }
    return out;
}

// Pure. Exported for scripts/rollupStore.test.js. Turns the aggregation's raw group rows into the AnalyticsRollup document shape -- the part worth testing without a real Mongo connection.
function buildRollupDoc(day, group) {
    const outcomes = Object.fromEntries(OUTCOME_KEYS.map(k => [k, 0]));
    for (const row of group.outcomeRows || []) if (row._id in outcomes) outcomes[row._id] = row.c;

    const entry = Object.fromEntries(ENTRY_KEYS.map(k => [k, 0]));
    for (const row of group.entryRows || []) if (row._id in entry) entry[row._id] = row.c;

    const uniqueHashes = [...new Set((group.userHashes || []).filter(Boolean))];
    const distinctUsersExact = uniqueHashes.length <= DISTINCT_HASHES_CAP;

    return {
        day, command: group.command, subcommand: group.subcommand || null,
        invocations: group.invocations || 0,
        distinctUsers: uniqueHashes.length,
        userHashes: distinctUsersExact ? uniqueHashes : undefined,
        distinctUsersExact,
        outcomes, entry,
        ackMs: { p50: group.ackP?.[0] ?? null, p95: group.ackP?.[1] ?? null },
        durationMs: { p50: group.durP?.[0] ?? null, p95: group.durP?.[1] ?? null },
        updatedAt: new Date(),
    };
}

// The real Mongo half. One aggregation pipeline per day, grouped by (command, subcommand) so a single pass produces every row that day needs -- not one query per command.
async function rollupDay(day) {
    const AnalyticsEvent = require('../models/AnalyticsEvent');
    const { start, end } = dayBounds(day);
    // Counted server-side via $sum:$cond, not $push+client-side Array.filter (v3-pre-release review, finding #55) -- the old shape shipped every event's outcome/entry string across the wire and then ran 13 full Array.filter passes per group in Node; at 10k events for one command that was 20,000 strings transferred and 130,000 comparisons, re-run across up to a 14-day catch-up window. It was also a correctness cliff: a $group result document carrying two full per-event arrays is subject to the 16MB BSON limit, so a busy command-day could eventually fail the whole roll-up. Field names are flattened (oc_/en_ prefixes) because Mongo $group accumulator names can't contain dots.
    const outcomeSums = Object.fromEntries(OUTCOME_KEYS.map(k => [`oc_${k}`, { $sum: { $cond: [{ $eq: ['$outcome', k] }, 1, 0] } }]));
    const entrySums = Object.fromEntries(ENTRY_KEYS.map(k => [`en_${k}`, { $sum: { $cond: [{ $eq: ['$entry', k] }, 1, 0] } }]));
    const groups = await AnalyticsEvent.aggregate([
        { $match: { createdAt: { $gte: start, $lt: end } } },
        { $group: {
            _id: { command: '$command', subcommand: '$subcommand' },
            invocations: { $sum: 1 },
            userHashes: { $addToSet: '$userHash' },
            ...outcomeSums,
            ...entrySums,
            ackP: { $percentile: { input: '$ackMs', p: [0.5, 0.95], method: 'approximate' } },
            durP: { $percentile: { input: '$durationMs', p: [0.5, 0.95], method: 'approximate' } },
        } },
    ]);

    if (!groups.length) return 0;

    const ops = groups.map((g) => {
        const outcomeRows = OUTCOME_KEYS.map(k => ({ _id: k, c: g[`oc_${k}`] || 0 }));
        const entryRows = ENTRY_KEYS.map(k => ({ _id: k, c: g[`en_${k}`] || 0 }));
        const doc = buildRollupDoc(day, {
            command: g._id.command || 'unknown', subcommand: g._id.subcommand,
            invocations: g.invocations, userHashes: g.userHashes,
            outcomeRows, entryRows, ackP: g.ackP, durP: g.durP,
        });
        return {
            updateOne: {
                filter: { day, command: doc.command, subcommand: doc.subcommand },
                update: { $set: doc, $setOnInsert: { createdAt: new Date() } },
                upsert: true,
            },
        };
    });
    await AnalyticsRollup.bulkWrite(ops, { ordered: false });
    return ops.length;
}

// Called from bot/lifecycle.js's daily heartbeat AND once on ClientReady (v3-pre-release review, finding #20). Rolls up every UTC day from (last rolled day, RE-touched) through (yesterday) inclusive -- "today" is deliberately never rolled, since it is still in progress and a partial day's percentiles would look like real data. Swallowed: a roll-up failure must never take down the heartbeat it rides on.
async function catchUpRollups() {
    try {
        const todayKey = dayKey(new Date());
        const yesterdayKey = prevDayKey(todayKey);
        const state = await RollupState.findById('lastRolledUpDay').lean();
        const earliestAllowed = dayKey(new Date(Date.now() - CATCH_UP_WINDOW_DAYS * 86400 * 1000));
        // Resume the day AFTER the last one fully rolled up, unless that resume point is further back than the catch-up window allows -- then start from the window edge instead of re-rolling an unbounded backlog. Re-roll FROM state.day itself, not nextDayKeySafe(state.day) (v3-pre-release review, finding #19) -- the header above claims a late event lands correctly "the next time that day is (re)rolled," but the old resumeFrom skipped straight past the last-rolled day, so an event flushed after that day's roll-up ran (e.g. buffered at 23:59:57 UTC, flushed by the idle timer at 00:00:04) was never re-counted by any future run. rollupDay() is a full recompute-and-upsert, so re-touching an already-correct day is free.
        const resumeFrom = state?.day ? state.day : earliestAllowed;
        const fromKey = resumeFrom > earliestAllowed ? resumeFrom : earliestAllowed;
        const targets = fromKey > yesterdayKey ? [] : daysBetweenInclusive(fromKey, yesterdayKey);
        for (const day of targets) {
            await rollupDay(day);
        }
        if (targets.length) {
            await RollupState.findByIdAndUpdate(
                'lastRolledUpDay',
                { day: yesterdayKey, updatedAt: new Date() },
                { upsert: true },
            );
        }
        return targets.length;
    } catch (err) {
        console.error('Roll-up job failed (heartbeat and analytics collection are unaffected):', err?.message || err);
        return 0;
    }
}

function nextDayKeySafe(key) {
    const [y, m, d] = key.split('-').map(Number);
    return dayKey(new Date(Date.UTC(y, m - 1, d + 1)));
}

module.exports = {
    // pure, exported for scripts/rollupStore.test.js
    dayKey, dayBounds, prevDayKey, daysBetweenInclusive, buildRollupDoc, nextDayKeySafe,
    // Mongo
    rollupDay, catchUpRollups,
    // constants worth asserting on
    DISTINCT_HASHES_CAP, CATCH_UP_WINDOW_DAYS,
};
