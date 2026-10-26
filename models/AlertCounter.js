const mongoose = require('mongoose');

// Atomic per-day counter backing AlertLog's human-referenceable `alertId` ("Jul20-03"). One document per UTC day, keyed by the "MMMDD" date part; `seq` is bumped atomically on each new alert.
//
// Why a dedicated counter and not `AlertLog.countDocuments(today) + 1`: two alerts firing in the same second (e.g. a crash that emits several alerts at once) both need a DISTINCT trailing number. A count-then-add read races — both would compute the same next value and collide on AlertLog's unique `alertId`, silently dropping one alert from the store. `findOneAndUpdate({_id}, {$inc:{seq:1}}, {upsert,new})` is a single atomic op with no such race. See utils/alertStore.js's nextDailyAlertId.
//
// These docs accumulate at ~1/day (negligible) and are intentionally left unpruned — they're tiny and harmless, unlike AlertLog which has real retention (utils/alertStore.js pruneAlerts).
const AlertCounterSchema = new mongoose.Schema({
    _id: { type: String },   // UTC date key, e.g. "Jul20" (MONTHS[getUTCMonth()] + zero-padded getUTCDate())
    seq: { type: Number, default: 0 },
});

module.exports = mongoose.model('AlertCounter', AlertCounterSchema);
