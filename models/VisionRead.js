// models/VisionRead.js
//
// One record per screenshot the vision model read for /autobuild (Harkirat, 2026-10-25 13:31-13:50 EDT: "more logs or tracking for the vision model, just so we always have good data on what it saw ... its confidence rate ... or anything else really"). Kept indefinitely ("those are just internal anyways ... why don't we just keep it indefinitely?").
//
// ⚠️ NO USER ID, ON PURPOSE. A record says what the model saw, what it cost and what an admin later changed, never who ran it, so it stays the bot's own data and PRIVACY.md needs no line for it. Keyed for reuse by `fileHash`, a SHA-256 of the screenshot's exact bytes: the same file again reuses this read instead of a second vision call. A different format of the same picture is deliberately NOT matched (measured 2026-10-25 13:47 EDT: a picture fingerprint scored two different DR-H builds closer than one screenshot and its JPEG).
const mongoose = require('mongoose');

const VisionReadSchema = new mongoose.Schema({
    fileHash: { type: String, index: true },
    task: String,
    model: String,
    location: String,
    imageType: String,
    imageBytes: Number,
    // The model's answer exactly as it parsed, so a reuse is shaped by today's code and a later question can be asked of what it really said.
    raw: { type: mongoose.Schema.Types.Mixed, default: null },
    weaponName: String,
    gunsmithCode: String,
    attachments: [{ _id: false, slot: String, name: String }],
    mode: { type: String, default: null },
    modeSignals: { type: mongoose.Schema.Types.Mixed, default: {} },
    // The model's own 0-100 rating per field, and its note on anything that made the screenshot hard. Models rate themselves loosely: a flag to look closer, never a score.
    confidence: { type: mongoose.Schema.Types.Mixed, default: {} },
    observations: { type: String, default: '' },
    // What it read twice: the same attachment in two slots.
    repeatedAttachments: { type: [String], default: [] },
    inputTokens: Number,
    outputTokens: Number,
    thinkingTokens: Number,
    costUsd: Number,
    durationMs: Number,
    reusedCount: { type: Number, default: 0 },
    lastReusedAt: Date,
    // What happened to the build it fed: saved, discarded, or null while it is still under review.
    outcome: { type: String, enum: [null, 'saved', 'discarded'], default: null },
    // Every Adjust on that build, field by field: the measure of what the model got wrong.
    adjustments: [{ _id: false, at: Date, field: String, from: mongoose.Schema.Types.Mixed, to: mongoose.Schema.Types.Mixed }],
}, { timestamps: true });

module.exports = mongoose.models.VisionRead || mongoose.model('VisionRead', VisionReadSchema);
