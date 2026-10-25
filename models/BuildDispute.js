// models/BuildDispute.js
//
// A claim, sent through /help's Dispute a Build, that a submitted build uses someone else's screenshot (Harkirat's /gunsmith review, 2026-10-25 16:59-17:08 EDT): they ask for its removal or for the credit, with proof the original was theirs and posted before the build went live. Dioreo Admin DMs it to the owner with Remove build / Change credit / Deny / More info, and the person who disputed is DMed whichever he picks (utils/buildSubmissions.js).
//
// `discordId` is the person disputing, so this is personal data: PRIVACY.md §2.1e, §7 and Appendix A name it. A record is deleted 90 days after it was sent.
const mongoose = require('mongoose');

const BuildDisputeSchema = new mongoose.Schema({
    discordId: { type: String, required: true, index: true },
    buildText: { type: String, required: true },
    loadoutId: { type: String, default: null },
    ask: { type: String, enum: ['remove', 'credit'], default: 'remove' },
    proofUrl: { type: String, default: '' },
    notes: { type: String, default: '' },
    hasScreenshot: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'removed', 'credited', 'denied'], default: 'pending' },
    dmChannelId: { type: String, default: null },
    dmMessageId: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 },
});

module.exports = mongoose.models.BuildDispute || mongoose.model('BuildDispute', BuildDisputeSchema);
