const mongoose = require('mongoose');

// Persistent record of every alert `utils/alertWebhook.js`'s sendAlert() actually posts to Discord —
// added 2026-07-20 (the "webhook alerting, heavier half" roadmap item). This backs the `/alerts` admin
// command (browse + export) and gives each alert a short human-referenceable ID so a specific one can be
// pointed at later ("look at Jul20-03") instead of only by wall-clock time.
//
// The store MIRRORS what got sent (it's written AFTER sendAlert's 1/min throttle passes), so it stays
// naturally bounded and its contents == the Discord channel. Crucially the store write is INDEPENDENT of
// the webhook POST (neither awaits the other, see utils/alertStore.js) — a DB outage must never stop an
// alert from reaching Discord (a DB failure is itself an alert), and vice versa. Because of that
// decoupling the store-assigned alertId is deliberately NOT shown on the live embed (that would couple the
// embed to a Mongo round-trip); the ID lives here + in `/alerts` + the export.
const AlertLogSchema = new mongoose.Schema({
    // Short human-referenceable id, "MMMDD-NN" (UTC day), e.g. "Jul20-03" — generated atomically via the
    // AlertCounter collection (see alertStore.nextDailyAlertId). Unique so a same-second burst can't
    // duplicate; indexed since it's the natural lookup/reference key.
    alertId: { type: String, unique: true, index: true },
    level: { type: String },   // 'info' | 'caution' | 'warn' | 'error' (matches alertWebhook's LEVEL_* maps)
    title: { type: String },
    detail: { type: String },  // describe() output, truncated (~1800) same as the embed description
    pinged: { type: Boolean },  // did this alert actively @-mention Harkirat (warn/error, or opts.ping)
    host: { type: String },    // 'GCP VM' | 'local' — from NODE_ENV, same derivation as the embed footer
    rssMb: { type: Number },   // process RSS at send time (MB) — surfaces leak/OOM trends across the log
    uptimeSec: { type: Number }, // RAW process uptime seconds; formatted for display via formatUptime()
    // Authoritative ordering + retention key. Indexed: every /alerts read sorts by it, and pruneAlerts()
    // filters on it. (Not using Mongoose `timestamps` because we only need createdAt, never updatedAt.)
    createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('AlertLog', AlertLogSchema);
