// models/TextMisfire.js -- daily counts, per server, of text-command answers nobody wanted (B7, his pick A, 2026-10-30 13:21 EDT: "okay A").
//
// A row is a day, a server, a kind and Dioreo's OWN word: the command it suggested or answered for, and the form that reached it (`d`, `dior`, `mention`, with `+typo` when a near-miss ran). Never the person and never what they typed, so it answers "which alias or typo rule fires on chat" and nothing about anyone. Kinds: `didYouMean` and `pick` (a card that expired unpressed), `askedForInput` and `couldntRead` (a timestamp card left unanswered), `noMatch` (the no-match line). Written by utils/textCommands/misfires.js; read by /bot servers' checkup. Kept 30 days.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md): a field not declared here is silently dropped on save.
const mongoose = require('mongoose');

const textMisfireSchema = new mongoose.Schema({
    day: { type: String, required: true },
    guildId: { type: String, required: true },
    kind: { type: String, required: true },
    word: { type: String, default: '' },
    via: { type: String, default: '' },
    count: { type: Number, default: 0 },
    expireAt: { type: Date, required: true, expires: 0 },
});
textMisfireSchema.index({ day: 1, guildId: 1, kind: 1, word: 1, via: 1 }, { unique: true });

module.exports = mongoose.model('TextMisfire', textMisfireSchema);
