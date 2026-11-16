// models/DrawIndexUpload.js -- one Upload Draws batch from /bot drawindex, kept for a day (handlers/manage/drawsPanel/drawIndexUpload.js).
//
// Built 2026-11-16 12:15 EST for owner-draws-index (Harkirat 2026-11-16 11:11 EST: "an owner only command where i can upload and check the draws index"). The review pages through up to ten pictures, each with what Gemini read and what the bot decided, and Harkirat's own changes (a draw type, an edit, a skip); that has to outlive one click and a bot restart, and a custom_id holds 100 characters. So the batch lives here, under a random token its buttons carry.
//
// ⚠️ NO USER ID IS STORED, as models/ManageSelection.js: who may act is checked on every click (owner only, utils/adminAccess.js isOwner), so the token only says WHICH batch.
// ⚠️ Rows expire after 24 hours (TTL on createdAt): an uploaded file's Discord link lasts about a day too, so an older batch could not upload its pictures anyway.
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    tier: { type: String, default: 'legendary' },
    kind: { type: String, default: '' },
    name: { type: String, required: true },
    baseName: { type: String, default: '' },
    skinName: { type: String, default: '' },
    guessed: { type: Boolean, default: false },   // the tier was not printed and nothing in the index knew it
    newToIndex: { type: Boolean, default: false },     // the index has never seen this item
}, { _id: false });

const pictureSchema = new mongoose.Schema({
    url: { type: String, required: true },        // the uploaded file's Discord link
    filename: { type: String, default: '' },
    status: { type: String, enum: ['read', 'failed', 'saved'], default: 'read' },
    error: { type: String, default: '' },
    // What the bot decided (utils/drawIndexRead.js decideDraw), then edited by Harkirat on the review.
    title: { type: String, default: '' },
    items: { type: [itemSchema], default: [] },
    comments: { type: [String], default: [] },
    aliases: { type: [String], default: [] },
    priceType: { type: String, default: '' },
    typeSettled: { type: Boolean, default: false },
    typeChanged: { type: Boolean, default: false }, // he picked the type on the review, so it may overwrite the entry's own
    readTitle: { type: String, default: '' },      // the title as the poster printed it; becomes another name when it differs from the entry's
    matchStatus: { type: String, enum: ['sure', 'maybe', 'none'], default: 'none' },
    matchId: { type: String, default: null },
    matchTitle: { type: String, default: null },
    matchBy: { type: String, default: null },
    sameDraw: { type: Boolean, default: null },   // his answer to "Same draw as X?" on a maybe; null = not answered
    sameAs: { type: Number, default: null },      // another picture in this batch shows the same draw (its index)
    added: { type: Number, default: 0 },
    snapped: { type: [String], default: [] },
    flags: { type: [String], default: [] },
    skip: { type: Boolean, default: false },
    keepOldPicture: { type: Boolean, default: false },
    // The black logo bar at the bottom (utils/drawPictureBar.js): its height in pixels on the uploaded picture (0 = none found), the picture's size, and whether Save crops it (on when found; Keep Bottom Bar turns it off). Harkirat 2026-11-16 12:47 EST: "some do, some don't but it is common".
    barPx: { type: Number, default: 0 },
    imgWidth: { type: Number, default: 0 },
    imgHeight: { type: Number, default: 0 },
    cropBar: { type: Boolean, default: false },
    savedTitle: { type: String, default: '' },
}, { _id: false });

const drawIndexUploadSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    season: { type: Number, default: null },
    year: { type: Number, default: null },
    origin: { type: String, enum: ['panel', 'news'], default: 'panel' },
    newsCard: { type: String, default: '' },      // the news card it was opened from, redrawn after a save
    pictures: { type: [pictureSchema], default: [] },
    costUsd: { type: Number, default: 0 },
    savedChangeIds: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 },
}, { versionKey: false });

module.exports = mongoose.model('DrawIndexUpload', drawIndexUploadSchema);
