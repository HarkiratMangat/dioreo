const mongoose = require('mongoose');

// What one person asked Dioreo to remind them about, and whether their DMs are reaching them (2026-10-23, the notifications design: docs/superpowers/specs/2026-10-23-notifications-design.md). A record exists only for someone who turned a reminder on; Stop all in /remind deletes it. Read and written by utils/reminders.js, never by a command directly.
const ReminderSubscriptionSchema = new mongoose.Schema({
    discordId: { type: String, required: true, unique: true },
    // Whole categories ("every new draw", "the daily digest"), keys from utils/reminders.js's CATEGORIES.
    categories: { type: [String], default: [] },
    // One-thing follows: a single draw, event or playlist, when it releases or when it is leaving. Removed once its reminder has gone out.
    follows: { type: [{ _id: false, kind: { type: String, enum: ['release', 'leaving'] }, title: String }], default: [] },
    // The game day (YYYY-MM-DD, UTC) of the last daily run that reached this record, so a restart never sends twice.
    lastSentDay: { type: String },
    // FAILED DMs, his rule (2026-10-23 20:21 EDT): after a failed set, a one-line note on their next command; if that note was seen and DMs keep failing for 3 more days, their reminders pause.
    failingSince: { type: Date },
    noteDue: { type: Boolean, default: false },
    noteShownAt: { type: Date },
    pausedAt: { type: Date },
    pauseNoteShown: { type: Boolean, default: false },
    // When the one-time "set your timezone" tip went out beside the first real reminder, so it is never sent twice (Harkirat, 2026-10-24 23:44 EDT ask: "for the first time… when a real reminder sends… send another follow-up DM… heads up… your time zone… with the set button in it").
    tzNudgedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('ReminderSubscription', ReminderSubscriptionSchema);
