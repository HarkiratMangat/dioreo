// models/EmojiApplied.js
//
// Which version of an emoji's Cloudinary original each Discord app currently holds (2026-10-28 16:30 EDT, Harkirat: "i want the replace option as well ... what if we store the emoji map in the database?"). One doc per (app, emoji name). `version` is the Cloudinary version number of the original that was uploaded to the app, a Unix time that rises each time the original is replaced.
//
// WHY IT EXISTS: a Discord app emoji carries no metadata, so nothing on the app says which file it was made from. utils/emojiSync.js's runAutoSync compares the original's CURRENT version with this record and swaps the app's emoji when the original is newer, which is how Replace reaches the bot that was not running when it was uploaded. The first time an app and an original meet with no record, the current version is written down and nothing is swapped: otherwise the first run would replace every emoji on every app.
//
// ⚠️ DEV AND PROD HAVE SEPARATE DATABASES (diors-builds-dev against prod's), so each environment records only its own two apps. The other environment's emojis are still read from Cloudinary's emoji-status report. Fail-soft: with no connection the sync still adds missing emojis and just never swaps.
//
// ⚠️ SCHEMA-SAVE GOTCHA (root CLAUDE.md, .claude/rules/models.md): Mongoose only persists fields declared here.
const mongoose = require('mongoose');

const emojiAppliedSchema = new mongoose.Schema({
    appId: { type: String, required: true },   // the Discord application's id, not the bot user's
    name: { type: String, required: true },    // the emoji's name, as Cloudinary's emoji-originals/ names it
    version: { type: Number, required: true }, // the Cloudinary version of the original now on that app
    updatedAt: { type: Date, default: Date.now }
});
emojiAppliedSchema.index({ appId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('EmojiApplied', emojiAppliedSchema);
