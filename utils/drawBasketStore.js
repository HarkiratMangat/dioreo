// utils/drawBasketStore.js
//
// The ONLY module that touches the DrawBasket collection directly (see .claude/rules/models.md). Every read is scoped to the caller's own discordId -- there is no "load someone else's basket" path here. Deciding WHO is allowed to act on a panel is the author-lock's job (resolvePanelActor, used by commands/drawCalculator.js and handlers/drawCalc.js); this store decides WHAT that action can see once they are allowed to act at all.
//
// 🔴 EVERY READ HANDLES "NOT FOUND". A basket can be deleted, expire (unnamed, 30-day TTL -- see models/DrawBasket.js), or simply never have existed (a stale/forged basketId surviving from an old customId). The old fully-stateless panel made a missing-state path structurally impossible; the store makes it a real, permanent possibility, so every function here returns a typed absence (null / empty array / false) rather than throwing. Callers render a "this basket no longer exists" message instead of crashing -- see docs/superpowers/specs/2026-08-27-draw-calculator-multi-draw-design.md §5.
const DrawBasket = require('../models/DrawBasket');

// Never throws on a malformed/stale id -- a customId surviving a schema change, or hand-edited, can carry a string that is not a valid Mongo ObjectId at all (Mongoose throws a CastError for that); that must decode to "not found", not a 500 that takes the whole panel down with it.
async function load(discordId, basketId) {
    if (!basketId) return null;
    let doc;
    try {
        doc = await DrawBasket.findById(basketId).lean();
    } catch {
        return null;
    }
    if (!doc || doc.discordId !== discordId) return null;
    return doc;
}

// Creates a fresh basket when `basket._id` is absent; otherwise updates the operational fields (banners/region/balance/includeUpgrades/entitlementMask) in place. Deliberately never touches `name` -- that is `rename`'s job alone, so a generic save can never accidentally clear or overwrite the one field that decides whether a basket is exempt from the TTL. Ownership is RE-CHECKED on every update via `load`, never assumed from the id alone -- a basketId is not proof of ownership, and a forged or copy-pasted one must not let one user edit another's basket.
async function save(discordId, basket) {
    if (!basket._id) {
        const created = await DrawBasket.create({
            discordId,
            banners: basket.banners || [],
            region: basket.region || 'region_10',
            balance: basket.balance || 0,
            includeUpgrades: Boolean(basket.includeUpgrades),
            entitlementMask: basket.entitlementMask || 0,
            submitted: Boolean(basket.submitted),
            updatedAt: new Date()
        });
        return created.toObject();
    }
    const existing = await load(discordId, basket._id);
    if (!existing) return null;
    const doc = await DrawBasket.findByIdAndUpdate(
        basket._id,
        { $set: {
            banners: basket.banners !== undefined ? basket.banners : existing.banners,
            region: basket.region !== undefined ? basket.region : existing.region,
            balance: basket.balance !== undefined ? basket.balance : existing.balance,
            includeUpgrades: basket.includeUpgrades !== undefined ? basket.includeUpgrades : existing.includeUpgrades,
            entitlementMask: basket.entitlementMask !== undefined ? basket.entitlementMask : existing.entitlementMask,
            // 🔴 A field missing from BOTH the schema and this whitelist is the silent-revert bug CLAUDE.md names: it would set in memory, save without error, and be gone on the next read.
            submitted: basket.submitted !== undefined ? basket.submitted : existing.submitted,
            updatedAt: new Date()
        } },
        { new: true }
    ).lean();
    return doc;
}

// The saved-basket list on the calculator's landing page (decision 8) -- NAMED baskets only. Naming is the signal a player intends to keep coming back to a basket (it is also what exempts it from the 30-day TTL, see models/DrawBasket.js); an unnamed in-progress basket is session state for whichever live panel already has it open, not something to surface in a picker list.
async function listForUser(discordId) {
    return DrawBasket.find({ discordId, name: { $exists: true, $ne: '' } })
        .sort({ name: 1 })
        .lean();
}

// Renaming to a blank string deliberately returns a basket to "unnamed" ($unset, not $set to '') -- and therefore back under the TTL -- rather than storing an empty-string name that would silently defeat models/DrawBasket.js's partialFilterExpression (`{ name: { $exists: false } }`, which does not match a doc holding `name: ''`).
async function rename(discordId, basketId, name) {
    const existing = await load(discordId, basketId);
    if (!existing) return null;
    const trimmed = typeof name === 'string' ? name.trim().slice(0, 80) : '';
    const update = trimmed ? { $set: { name: trimmed, updatedAt: new Date() } } : { $unset: { name: 1 }, $set: { updatedAt: new Date() } };
    return DrawBasket.findByIdAndUpdate(basketId, update, { new: true }).lean();
}

async function remove(discordId, basketId) {
    const existing = await load(discordId, basketId);
    if (!existing) return false;
    await DrawBasket.deleteOne({ _id: basketId });
    return true;
}

// The calculation this player changed most recently, named or not (2026-10-13 12:40 EDT). Running /draw calculator, or arriving from /draw prices' cross-link, reopens it -- the result "persists until New Calculation" (Harkirat, 2026-08-27) only if the player can get back to it, and listForUser above deliberately lists NAMED ones only. Older documents have no updatedAt, so createdAt breaks the tie.
async function latestForUser(discordId) {
    return DrawBasket.findOne({ discordId }).sort({ updatedAt: -1, createdAt: -1 }).lean();
}

module.exports = { load, save, listForUser, rename, remove, latestForUser };
