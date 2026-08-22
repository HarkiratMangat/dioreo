// models/Announcement.js
//
// ⚠️ REDESIGNED 2026-08-13 from a singleton (docType: 'global', a single overwritten doc) to a real collection -- one doc per announcement. The singleton design silently lost data: posting a second announcement before a user saw the first OVERWROTE it, so that user could never see the first one's content, and there was no way to delete just one. Never shipped past the dev bot, so no migration was needed -- this is a clean rebuild, not a backwards-compatible schema change.
//
// `/manage` -> "Announcement" creates/edits/deletes these; utils/announcement.js reads the active (non-expired) ones and compares against a given user's UserPreference.seenAnnouncementIds to decide what's still unseen. `expiresAt: null` means "never expires" -- an announcement stops being delivered or listed on /manage the moment `expiresAt` is in the past, filtered at query time in both places. No separate cleanup job exists or is needed for this: the collection stays tiny (a handful of announcements at most) and an expired doc is simply never queried again.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md, .claude/rules/models.md): Mongoose only persists fields declared here. Adding a new field elsewhere without declaring it works in memory and silently reverts on the next fetch. Declare the field in the SAME change.
const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    createdBy: { type: String, required: true }, // discordId of whoever posted it
    // null = never expires. Always set EXPLICITLY by the caller (utils/announcement.js's computeExpiresAt, default 60 days) rather than relying on a schema default here -- one source of truth for "what does blank mean" instead of it living in two places.
    expiresAt: { type: Date, default: null },
    // Random per-announcement accent color (added 2026-08-13), generated ONCE at creation via utils/announcement.js's generateAccentColor() and never regenerated on edit -- see that function's header for why (an edit is a correction to the same announcement, not a new one).
    color: { type: Number, required: true },
    // Scheduling (added with the operation core, 2026-08-21 09:31 EDT). Without this an announcement goes live the instant it is posted and the only time control is an END. null means "live now", which is exactly the pre-existing behaviour, so every existing document keeps working untouched.
    //
    // ⚠️ Declared here in the SAME change as the op that writes it -- root CLAUDE.md's schema-save gotcha. models/SeasonalData.js's draft.calendar is the recorded cost of getting this wrong.
    startsAt: { type: Date, default: null }
});

module.exports = mongoose.model('Announcement', announcementSchema);
