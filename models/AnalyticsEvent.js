// ==========================================
// ANALYTICS EVENT -- the event plane
// ==========================================
// One document per interaction. Usage, timing, dead clicks, policy enforcement and install-type adoption are all facets of the SAME record rather than four separate stores -- see docs/superpowers/specs/2026-08-16-observability-layer-design.md §2, which is frozen and settled.
//
// 🔴 NO RAW DISCORD USER ID EVER ENTERS THIS COLLECTION. `userHash` is HMAC-SHA256(ANALYTICS_HMAC_KEY, discordId) via utils/requestContext.js's hashUserId() -- the SAME function stage 1 already uses for the diagnostic plane, so the two planes correlate. A second hashing implementation with a different key or encoding would silently stop correlating with every log line already written. `guildId` IS stored raw, deliberately: a server is not a person, guilds are enumerable so hashing protects little, and "which servers are adopting this" stays answerable at a glance.
//
// ⚠️ DELIBERATELY ONE INDEX (plus _id). The spec measured this database's own indexes at 1.7x its data, and this is a grow-forever collection on a free-tier M0 with a 512 MB hard cap -- so index count is the single biggest lever on when the ceiling arrives. `{ createdAt: -1, command: 1 }` serves both the panel's "recent window" queries and its "recent window, one command" queries, because createdAt is the prefix. Do NOT add an index speculatively: derive it from a query the panel or scripts/analytics.mjs actually runs. A userHash lookup (deletion requests, PRIVACY §9) collection-scans on purpose -- it is rare and manual, and an index for it would be paid on every single write forever.
//
// (Not using Mongoose `timestamps` because we only need createdAt, never updatedAt -- same reasoning as models/AlertLog.js.)

const mongoose = require('mongoose');

const AnalyticsEventSchema = new mongoose.Schema({
    userHash: { type: String },          // HMAC-SHA256 pseudonym. NEVER the raw id. Null for context-less events.
    guildId: { type: String },           // raw; null in DMs
    context: { type: String },           // 'guild' | 'dm'
    installType: { type: String },       // 'guild' | 'user' -- adoption tracking, from
                                         // interaction.authorizingIntegrationOwners (verified present in discord.js 14.27.0; null when Discord omits it)
    isAdmin: { type: Boolean, default: false }, // /manage, /bot, /autobuild -- excluded from product
                                                // stats by default so a self-observing system doesn't distort its own numbers. (/alerts and /audit retired as command names in stage 3; their panels are now /bot analytics pages, still under the 'bot' token.)
    command: { type: String },
    subcommand: { type: String },
    entry: { type: String },             // 'slash' | 'button' | 'select' | 'autocomplete' | 'modal' | 'synthetic' | 'background'
    customIdPrefix: { type: String },    // the segment BEFORE the first '_', nothing after it. custom_ids
                                         // here embed Mongo _ids and user snowflakes (mng_admin_*, mng_announce_*), so a looser capture would leak one.
    outcome: { type: String },           // 'ok' | 'error' | 'expired' | 'blocked_by_policy'
                                         //   | 'swallowed_by_cooldown' | 'rejected_admin'
    ackMs: { type: Number },             // time to the first defer/reply -- the 3-second deadline
    durationMs: { type: Number },        // total handler time
    deps: { type: Array, default: undefined }, // [{ name, ms, calls, ok, tokens? }] -- aggregated PER
                                               // NAME, not per call, which is what keeps this bounded
    detail: { type: Object },            // subsystem-specific; absorbs RenderTiming's area/source/
                                         // subpage/variant/cold. BOUNDED to 8 scalar keys / 512 bytes by utils/eventStore.js's clampDetail(), because an unbounded bag is where schema discipline leaks away.
    search: { type: Object },            // autocomplete sessions only: { term, field, keystrokes, results, picked }
    version: { type: String },
    commit: { type: String },
    host: { type: String },
    createdAt: { type: Date, default: Date.now },
});

// The one deliberate index. See the header before adding a second.
AnalyticsEventSchema.index({ createdAt: -1, command: 1 });

module.exports = mongoose.model('AnalyticsEvent', AnalyticsEventSchema);
