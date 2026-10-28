// models/BuildSubmission.js
//
// A build a player sent through Submit a Build on /gunsmith's No build yet card (Harkirat's /gunsmith review, 2026-10-25 16:40-17:08 EDT). Dioreo Admin DMs it to the owner with Read Screenshot / Approve / Deny; Approve (or saving from the screenshot's review) writes the build with `submittedBy` and DMs the submitter a thank-you, Deny closes it with no DM (utils/buildSubmissions.js).
//
// `discordId` is the submitter, so this is personal data: PRIVACY.md §2.1e, §7 and Appendix A name it. It is kept even when they chose to stay anonymous, privately, so a dispute can be checked (his pick "A", 2026-10-25 17:06 EDT); the pop-up says so. A record is deleted 90 days after it was sent, decided or not.
const mongoose = require('mongoose');

const BuildSubmissionSchema = new mongoose.Schema({
    discordId: { type: String, required: true, index: true },
    mode: { type: String, enum: ['MP', 'DMZ'], default: 'MP' },
    category: { type: String, default: null },
    // Optional since 2026-10-28 00:12 EDT (Harkirat: "make the weapon name optional too. some people are lazy and will likely just attach a screenshot only"); '' when left blank.
    weaponName: { type: String, default: '' },
    gunsmithCode: { type: String, default: '' },
    attachments: { type: [String], default: [] },
    notes: { type: String, default: '' },
    credited: { type: Boolean, default: false },
    hasScreenshot: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    dmChannelId: { type: String, default: null },
    dmMessageId: { type: String, default: null },
    loadoutId: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 },
});

module.exports = mongoose.models.BuildSubmission || mongoose.model('BuildSubmission', BuildSubmissionSchema);
