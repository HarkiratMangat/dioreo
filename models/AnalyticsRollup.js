// ==========================================
// ANALYTICS ROLLUP -- one document per (day, command, subcommand)
// ==========================================
// Stage 4 of the observability layer: docs/superpowers/specs/2026-08-16-observability-layer-design.md §2 "Roll-ups" and §"Must verify before building". Load-bearing, not a speed optimisation -- the spec's storage-growth math (§"Storage growth") concludes the event collection alone can exhaust Atlas's free M0 tier in ~1-2 years at plausible volume, so raw AnalyticsEvent rows get a retention horizon and these roll-ups are what lets the PERMANENT answers survive at full resolution after that horizon.
//
// 🔴 DAY BOUNDARY IS UTC, AND INCLUDES THE YEAR -- decided here because the spec's "must verify before building" list left it explicitly open. `day` is an ISO date string ("2026-08-16"), NOT the alertId/changeId "MMMDD" shape (utils/alertStore.js's dateKey()) -- that format was fine for AlertLog/ChangeLog because they retain for 30d/180d and can never see two Aug-16ths, but a roll-up is kept INDEFINITELY (see the plane table in the design doc), so a year-less key would silently merge this year's Aug 16 with next year's. The UTC-midnight boundary itself IS the same convention alertId/changeId use, which is the part of "consistent with alertId/changeId" that actually matters. Changing this key's shape later re-buckets every existing roll-up -- see utils/rollupStore.js's header.
//
// 🔴 `distinctUsers` DOES NOT SUM ACROSS DAYS -- the spec's own warning. `userHashes` stores the day's distinct hash set (bounded, see utils/rollupStore.js's DISTINCT_HASHES_CAP) so a multi-day distinct count can be a real set union instead of an over-count. Above the cap, `distinctUsersExact` flips to false and the array is dropped rather than kept partial -- a PARTIAL set unioned with another day's set silently undercounts, which is worse than admitting the day has no exact figure and falling back to a raw-row query for it.
//
// No raw Discord ID here, ever -- userHashes holds only the same HMAC pseudonym AnalyticsEvent does.

const mongoose = require('mongoose');

const OUTCOME_KEYS = ['ok', 'error', 'expired', 'blocked_by_policy', 'swallowed_by_cooldown', 'rejected_admin'];
const ENTRY_KEYS = ['slash', 'button', 'select', 'autocomplete', 'modal', 'synthetic', 'background'];

const CountMapSchema = new mongoose.Schema(
    Object.fromEntries(OUTCOME_KEYS.map(k => [k, { type: Number, default: 0 }])),
    { _id: false },
);
const EntryMapSchema = new mongoose.Schema(
    Object.fromEntries(ENTRY_KEYS.map(k => [k, { type: Number, default: 0 }])),
    { _id: false },
);
const PercentileSchema = new mongoose.Schema({
    p50: { type: Number, default: null },
    p95: { type: Number, default: null },
}, { _id: false });

const AnalyticsRollupSchema = new mongoose.Schema({
    day: { type: String, required: true },        // 'YYYY-MM-DD', UTC. See header.
    command: { type: String, required: true },
    subcommand: { type: String, default: null },
    invocations: { type: Number, default: 0 },
    distinctUsers: { type: Number, default: 0 },   // exact for this single day, always
    userHashes: { type: [String], default: undefined }, // bounded set for cross-day union; absent
                                                          // once distinctUsersExact is false
    distinctUsersExact: { type: Boolean, default: true },
    outcomes: { type: CountMapSchema, default: () => ({}) },
    entry: { type: EntryMapSchema, default: () => ({}) },
    ackMs: { type: PercentileSchema, default: () => ({}) },
    durationMs: { type: PercentileSchema, default: () => ({}) },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },  // re-stamped on every re-run; rollupDay() is a full
                                                    // recompute-and-upsert, never an increment, so a late-arriving event before the horizon is picked up by the NEXT run rather than lost.
});

// The upsert key. One roll-up per day/command/subcommand, and the only index this collection needs -- every read is either "one day" (recent report) or a bounded date range scan (multi-day report), both served by a natural sort on `day` for a small, bounded-per-day row count.
AnalyticsRollupSchema.index({ day: 1, command: 1, subcommand: 1 }, { unique: true });

const AnalyticsRollup = mongoose.model('AnalyticsRollup', AnalyticsRollupSchema);
// Attached as statics, not a second export shape (v3-pre-release review, finding #31) -- OUTCOME_KEYS/ ENTRY_KEYS used to be declared VERBATIM TWICE, here and in utils/rollupStore.js, with no shared source. This subdocument schema is strict while AnalyticsEvent.outcome is a free-form String, so a key added to one copy and not the other was silently dropped by Mongoose with no error -- either a real outcome permanently undercounted, or a declared key permanently stuck at 0. require('../models/AnalyticsRollup') still returns the model constructor everywhere else unchanged; only a consumer that wants these two arrays needs to destructure them off it.
AnalyticsRollup.OUTCOME_KEYS = OUTCOME_KEYS;
AnalyticsRollup.ENTRY_KEYS = ENTRY_KEYS;
module.exports = AnalyticsRollup;
