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
    pullsDone: { type: Number, default: 0 },
    // Mythic upgrade by tier (2026-10-17 13:17 EDT): what this line has already upgraded (only meaningful once its draw is finished) and what it is planned up to. Weapon `[level]`; character `[battle, arm, color, finalForm]`. Absent = not set, which falls back to the basket's old includeUpgrades toggle (utils/drawCost.js upgradeState).
    upHave: { type: [Number], default: undefined },
    upWant: { type: [Number], default: undefined },
    // Series Armory lines (2026-10-18 12:13 EDT): `size` is the number of items in the armory and `pullsDone` then counts items collected; `spinsIn` is the spins already done toward the next item (utils/drawCost.js). Absent on every other draw.
    size: { type: Number, default: undefined },
    spinsIn: { type: Number, default: undefined },
    // A line picked from this season's draws (2026-10-18 12:13 EDT) keeps that draw's title, so the line reads as the draw and a saved calculation never moves when the draw is later renamed. `drawKey` is the draw's Draw Type at the time it was picked.
    title: { type: String, default: undefined },
    // An Advanced Double Legendary line's goal (2026-10-18 21:51 EDT; per set 2026-10-18 22:31 EDT): 'all4', 'top2', 'mid2_top1', 'one_each', 'mid2', 'mid1' or 'everything'; absent is 'all4', and the first build's 'all'/'two'/'one' still read (utils/drawCost.js advancedGoal). `bothSets` are the spun sets it got both items from, each 1 to `pullsDone`.
    goal: { type: String, default: undefined },
    bothSets: { type: [Number], default: undefined },
    // The full sets finished the long way, a Regular pull then the other item bought (2026-10-18 23:24 EDT): always within `bothSets`, and only for the Spent figure.
    laterSets: { type: [Number], default: undefined }
}, { _id: false });

const DrawBasketSchema = new mongoose.Schema({
    discordId: { type: String, required: true, index: true },
    // Absent (not null) on an unnamed basket -- the TTL index below keys on that absence via partialFilterExpression, and `undefined` fields are simply never written by Mongoose, so "never named" and "not yet named" are the same on-disk shape until a rename sets this.
    name: { type: String },
    banners: { type: [BannerSchema], default: [] },
    region: { type: String, default: 'region_10' },
    balance: { type: Number, default: 0 },
    includeUpgrades: { type: Boolean, default: false },
    // Mythic Cards and Mythic Coins the player already holds (2026-10-17 13:17 EDT): one shared pool each, in steps of 5, taken off the pooled upgrade need.
    mythicCards: { type: Number, default: 0 },
    mythicCoins: { type: Number, default: 0 },
    // RESTORE CALCULATION (2026-10-19 00:13 EDT, his idea): what New Calculation cleared, kept so the empty form can bring it back, through relaunches, until the next Calculate. Either the cleared contents (banners, region, balance, cards, coins, currency, upgrade toggle, 2X selections, submitted, sourceId) or { savedId } when the one left was a saved calculation. It lives on an unnamed calculation, so the 30-day TTL removes it with that calculation.
    previous: { type: mongoose.Schema.Types.Mixed, default: undefined },
    // The existing 6-bit mask over CP_PACKAGES (cp80...cp8000), snapshotted onto the basket -- there is no live entitlement source to read, only what the player told us they still hold.
    entitlementMask: { type: Number, default: 0 },
    // FALSE while the player is still filling in the setup form; TRUE once they have pressed Calculate. This is what makes a result "persist until reset / new calculation" (Harkirat, 2026-08-27) across restarts -- a draft has to survive the same way a finished calculation does, so it cannot live in memory or in the customId. Existing docs predate the field and read as false, which correctly reopens them on the form with their draws intact.
    submitted: { type: Boolean, default: false },
    // A SAVED calculation stays exactly as it was saved (2026-10-14 17:28 EDT, Harkirat: "a saved calc should remain in its saved state. so that means a user needs to press save and select that previous saved result to override it"). The first change made to one opens an unnamed working copy instead, and this is the saved calculation it came from: the title says so, and Save offers to save over it.
    sourceId: { type: String },
    // This calculation's own price currency (2026-10-18 20:00 EDT, Harkirat: "allow currency to be changed in the Set region balance button modal. This change can be per calculation. whereas the /settings one is the default"). Null follows the player's /settings default (UserPreference.cpCurrency); a code here overrides it for this calculation only.
    currency: { type: String, default: null },
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
