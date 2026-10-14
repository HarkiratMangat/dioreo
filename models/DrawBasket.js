// models/DrawBasket.js
//
// A saved `/draw calculator` basket -- a flat, player-ordered list of individually-orderable banners (see docs/superpowers/specs/2026-08-27-draw-calculator-multi-draw-design.md §1). "Quantity" does not exist as a concept here: three Mythic Weapon banners are three separate entries in `banners`, each with its own `pullsDone`, and array order IS priority order -- never re-derived, never re-sorted.
//
// ⚠️ PRIVACY: discordId is a per-user Discord ID. Named in PRIVACY.md §2 and Appendix A in the same change that adds this model -- docs-audit's privacy-model-coverage enforces this.
//
// 🔴 STORE drawKey STRINGS, NEVER INDICES. A positional index into DRAW_DATA/DRAW_KEYS would silently re-point a stored basket at a DIFFERENT draw the moment that array's order or length changes -- the exact class of bug the old stateless customId encoding was designed to survive by re-deriving state fresh on every click. A basket persists across restarts and code changes, so it cannot lean on today's array order the way a single click's customId could.
const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    drawKey: { type: String, required: true },
    pullsDone: { type: Number, default: 0 }
}, { _id: false });

const DrawBasketSchema = new mongoose.Schema({
    discordId: { type: String, required: true, index: true },
    // Absent (not null) on an unnamed basket -- the TTL index below keys on that absence via partialFilterExpression, and `undefined` fields are simply never written by Mongoose, so "never named" and "not yet named" are the same on-disk shape until a rename sets this.
    name: { type: String },
    banners: { type: [BannerSchema], default: [] },
    region: { type: String, default: 'region_10' },
    balance: { type: Number, default: 0 },
    includeUpgrades: { type: Boolean, default: false },
    // The existing 6-bit mask over CP_PACKAGES (cp80...cp8000), snapshotted onto the basket -- there is no live entitlement source to read, only what the player told us they still hold.
    entitlementMask: { type: Number, default: 0 },
    // FALSE while the player is still filling in the setup form; TRUE once they have pressed Calculate. This is what makes a result "persist until reset / new calculation" (Harkirat, 2026-08-27) across restarts -- a draft has to survive the same way a finished calculation does, so it cannot live in memory or in the customId. Existing docs predate the field and read as false, which correctly reopens them on the form with their draws intact.
    submitted: { type: Boolean, default: false },
    // A SAVED calculation stays exactly as it was saved (2026-10-14 17:28 EDT, Harkirat: "a saved calc should remain in its saved state. so that means a user needs to press save and select that previous saved result to override it"). The first change made to one opens an unnamed working copy instead, and this is the saved calculation it came from: the title says so, and Save offers to save over it.
    sourceId: { type: String },
    createdAt: { type: Date, default: Date.now },
    // When the calculation last changed (2026-10-13 12:40 EDT). Running /draw calculator again reopens the most recently changed one -- before this an unsaved calculation could not be reached again once its message was gone. Written by utils/drawBasketStore.js on every save and rename. Older documents lack it and fall back to createdAt.
    updatedAt: { type: Date, default: Date.now }
});

// 🔴 TTL ONLY ON UNNAMED BASKETS. A bare createdAt TTL would also delete a basket the player deliberately named and is actively planning around. `partialFilterExpression` scopes the expiry the same way models/Changeset.js's does for abandoned changesets. 30 days matches that precedent (Announcement uses 60, set explicitly by its own caller rather than as a schema default -- the better habit, followed here: nothing in this file sets `name` to a blank string as a default, so "unnamed" stays a true field-absence, not a stored empty value).
DrawBasketSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60,
      partialFilterExpression: { name: { $exists: false } } }
);

module.exports = mongoose.model('DrawBasket', DrawBasketSchema);
