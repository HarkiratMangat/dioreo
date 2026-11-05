// models/NewsSkip.js -- a post news-channel triage read and did not card, waiting for the 00:05 UTC skipped list (built 2026-11-04 22:10 EST). Ids and a reason only, NEVER the post's text: the list re-reads each title from the channel when it posts. Stored, rather than held in memory, because every deploy and crash restarts the bot and the list is the one place a missed post can be noticed. Deleted when listed; the TTL is the backstop for a list that never posted.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md): a field not declared here is silently dropped on save.
const mongoose = require('mongoose');

const newsSkipSchema = new mongoose.Schema({
    channelId: { type: String, required: true },
    messageId: { type: String, required: true },
    guildId: { type: String, default: '' },
    reason: { type: String, default: '' },
    expireAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });
newsSkipSchema.index({ channelId: 1, messageId: 1 }, { unique: true });

module.exports = mongoose.model('NewsSkip', newsSkipSchema);
