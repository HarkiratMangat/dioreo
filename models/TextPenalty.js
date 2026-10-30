// models/TextPenalty.js -- one record per person serving a text-command spam penalty (B7, 2026-10-30; the ladder is utils/textCommands/spamLadder.js).
//
// Stored so neither a restart nor the daily reset lifts a penalty (Harkirat 2026-10-29 15:30 EDT: "penalties themselves in mongo so they dont get lifted by bot restarts to on daily update"). It holds who, which rung, until when, and where Dioreo's own countdown note is, so it can be deleted when the penalty ends; NEVER a message's words. The bot deletes the record itself when the penalty ends, note first; `expireAt` (a day after `until`) is only the backstop for one it missed. Disclosed in docs/legal/PRIVACY.md §2.1h and Appendix A.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md): a field not declared here is silently dropped on save.
const mongoose = require('mongoose');

const textPenaltySchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true, index: true },
    // 1 to 6: 1 m, 5 m, 15 m, 1 h, 6 h, 12 h.
    step: { type: Number, required: true, min: 1, max: 6 },
    until: { type: Date, required: true },
    // Where the countdown note was posted (the server and channel of the message that reached the limit), and the note's own id. Null when Dioreo could not post there.
    guildId: { type: String, default: null },
    channelId: { type: String, default: null },
    noteMessageId: { type: String, default: null },
    expireAt: { type: Date, required: true, expires: 0 },
}, { timestamps: true });

module.exports = mongoose.model('TextPenalty', textPenaltySchema);
