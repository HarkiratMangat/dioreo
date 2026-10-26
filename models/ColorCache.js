// models/ColorCache.js
//
// Colours worked out for someone who is NOT a Dioreo user, when another person right-clicks them → Apps → View Colors (added 2026-10-19 11:28 EDT). Harkirat: "a read-only version that temp saves/caches ... for 30days" and "anonymize it if possible ... doesnt link it to any particular user".
//
// ⚠️ NO USER ID, ON PURPOSE. An entry is keyed by a one-way fingerprint of the IMAGE (Discord's own asset hash, hashed again with the field it fills; utils/colorCache.js's cacheKey), so the same picture gets its colours back without the entry naming anyone. Someone who already knows a person's current avatar could match it, which PRIVACY.md §2.2 states; the entry itself never says whose it was. A Dioreo user's colours never land here: theirs are saved in their own UserPreference, as /colors always has.
const mongoose = require('mongoose');

const THIRTY_DAYS = 30 * 24 * 60 * 60;

const ColorCacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    // The UserPreference-shaped fields the colours panel writes for one image (e.g. avatarPalette + avatarPaletteSource), stored as they were so loading them back is a plain assignment.
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Deleted 30 days after the image was first seen (Mongo TTL). A later view refreshes the colours but never the clock.
    createdAt: { type: Date, default: Date.now, expires: THIRTY_DAYS },
});

module.exports = mongoose.models.ColorCache || mongoose.model('ColorCache', ColorCacheSchema);
