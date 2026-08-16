// ==========================================
// ROLLUP STATE -- one singleton document tracking how far the roll-up job has caught up
// ==========================================
// utils/rollupStore.js's catchUpRollups() needs to know the last UTC day it fully rolled up, so a gap
// between daily heartbeats (the bot restarting, a deploy landing mid-day, a stretch of downtime) gets
// every missed day rolled up rather than silently skipped. A single document keyed by a fixed _id is
// simpler than deriving "already rolled up" by querying AnalyticsRollup for distinct days -- a day with
// zero interactions for every command produces no AnalyticsRollup row at all, so that query would
// re-process an already-handled empty day forever.

const mongoose = require('mongoose');

const RollupStateSchema = new mongoose.Schema({
    _id: { type: String, default: 'lastRolledUpDay' },
    day: { type: String, default: null },   // 'YYYY-MM-DD', UTC -- the last day fully rolled up
    updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('RollupState', RollupStateSchema);
