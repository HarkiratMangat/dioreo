// models/NewsCursor.js -- the last post read in each followed news channel (news-channel-triage, built 2026-11-04 20:02 EST), so the posts that arrive while the bot is down are read when it comes back (bot/newsWatch.js catchUp). One tiny record per channel: two ids, nothing else.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md): a field not declared here is silently dropped on save.
const mongoose = require('mongoose');

const newsCursorSchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true },
    lastMessageId: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('NewsCursor', newsCursorSchema);
