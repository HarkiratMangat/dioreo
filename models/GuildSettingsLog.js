// models/GuildSettingsLog.js
//
// One row per change to a server's /admin settings: who, when, and what changed, kept 60 days. Harkirat 2026-10-22 15:51 EDT: "a server admin like log ... the log cannot be reset ... it has to be like a source of truth ... export a log file ... maybe like the last 60 days".
//
// ⚠️ NOTHING DELETES THESE ROWS BUT THE TTL. /admin's Reset Everything and the owner's Reset Rules / Delete Record (/bot servers) all leave the log in place and add a row of their own, so a takeover cannot hide what it changed. A row's only personal data is the actor's Discord user id (PRIVACY.md §2.1a, Appendix A).
const mongoose = require('mongoose');

const guildSettingsLogSchema = new mongoose.Schema({
    guildId: { type: String, required: true, index: true },
    // Who saved. For an owner action through /bot servers this is Dioreo's owner, and `source` says so.
    actorId: { type: String, required: true },
    source: { type: String, enum: ['admin', 'owner'], default: 'admin' },
    // Plain lines, one per change, with channels and roles as <#id> / <@&id> tokens that the export turns into names.
    changes: { type: [String], default: [] },
    // The TTL: MongoDB removes a row 60 days after it was written.
    createdAt: { type: Date, default: Date.now, expires: 60 * 24 * 60 * 60 },
});

module.exports = mongoose.models.GuildSettingsLog || mongoose.model('GuildSettingsLog', guildSettingsLogSchema);
