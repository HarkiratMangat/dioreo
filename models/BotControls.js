// models/BotControls.js -- the owner's bot-wide switches, one document (B7, his asks 2026-10-30 12:47-13:21 EDT, "build it here"; utils/botControls.js reads and writes it).
//
// One record, `_id: 'global'`, owner-only: the freeze, the spam ladder's numbers, the people exempt from it or blocked from Dioreo, the blocked servers, and per-server reply limits. Kept apart from GuildSettings on purpose: GuildSettings is a server's own, which its admins can reset from /admin, and none of this is theirs to clear. Every field is read once at start-up into memory, so the message listener never waits on the database.
//
// `exemptUsers` and `blockedUsers` are Discord user ids: disclosed in docs/legal/PRIVACY.md §2.1h and Appendix A. ⚠️ docs-audit's privacy-model-coverage check matches field NAMES (discordId, userId, …) and does not match these, so its pass says nothing about this file; the disclosure is by hand.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md): a field not declared here is silently dropped on save.
const mongoose = require('mongoose');

const botControlsSchema = new mongoose.Schema({
    _id: { type: String, default: 'global' },
    // Slash commands answer one private line, typed commands go silent. `all`, or the slash names in `commands`. The owner, /bot and Dioreo Admin are never frozen.
    freeze: {
        all: { type: Boolean, default: false },
        commands: { type: [String], default: [] },
        reason: { type: String, default: '' },
        since: { type: Date, default: null },
    },
    // The spam ladder's numbers (utils/textCommands/spamLadder.js); missing means the defaults there.
    spam: {
        reply: { type: Number, default: null },
        warning: { type: Number, default: null },
        threshold: { type: Number, default: null },
        rungsMin: { type: [Number], default: undefined },
    },
    exemptUsers: { type: [String], default: [] },
    blockedUsers: { type: [String], default: [] },
    blockedGuilds: { type: [String], default: [] },
    // Text replies Dioreo posts per 10 s, for one server; a server not listed uses 5 per channel and 30 per server.
    replyLimits: { type: [{ _id: false, guildId: String, perChannel: Number, perServer: Number }], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('BotControls', botControlsSchema);
