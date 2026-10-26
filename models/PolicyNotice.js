// models/PolicyNotice.js
//
// How many times a member has been told "this is private because of this server's settings", per server. Harkirat 2026-10-22 15:51 EDT: not a permanent line on every answer but "a 2x repeat ... private notification, if the settings change ... and they don't match the user's own settings". The notice shows at most twice per change to a server's rules; a newer rule change starts the count again.
//
// Keyed by the same HMAC user hash the analytics use (utils/requestContext.js's hashUserId), never the raw Discord id, and removed after 90 days unused (PRIVACY.md §2.1a, Appendix A).
const mongoose = require('mongoose');

const policyNoticeSchema = new mongoose.Schema({
    userHash: { type: String, required: true },
    guildId: { type: String, required: true },
    // The server's settings version (GuildSettings.updatedAt) the count below belongs to.
    rulesAt: { type: Date, required: true },
    shown: { type: Number, default: 0 },
    lastShownAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 },
});
policyNoticeSchema.index({ userHash: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.models.PolicyNotice || mongoose.model('PolicyNotice', policyNoticeSchema);
