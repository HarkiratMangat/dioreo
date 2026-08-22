const mongoose = require('mongoose');

// Persistent audit trail of every DB-mutating operation `/manage` performs — stage 4 of docs/superpowers/specs/2026-08-14-manage-slash-decomposition-design.md. Modelled directly on AlertLog (see models/AlertLog.js's own header) since that pattern already solves human-referenceable ids, read-back pagination, export and retention. Backs `/audit`.
//
// ⚠️ `actorId` is a per-user Discord ID, so docs/legal/PRIVACY.md must name this model (§2.1b + Appendix A) in the same change — see CLAUDE.md's hard invariants + the `privacy-model-coverage` docs-audit check, which specifically exists to catch a new model gaining a per-user field.
const ChangeLogSchema = new mongoose.Schema({
    // Short human-referenceable id, "MmmDD-NN" (UTC day) -- same scheme + same atomic allocator as AlertLog's alertId (utils/alertStore.js's nextDailyAlertId), but under a namespaced counter key ("chg-" prefix) so the two logs' daily sequences don't collide or share a counter document.
    changeId: { type: String, unique: true, index: true },
    actorId: { type: String },     // Discord user ID of whoever made the change
    page: { type: String },        // /manage page key (draws, calendar, loadouts_mp, ...)
    action: { type: String },      // what kind of operation (add, edit, bulkAdd, purge, delete, ...)
    model: { type: String },       // which collection/document type was touched (SeasonalData, Loadout, ...)
    target: { type: String },      // human label of the specific thing changed (a draw title, a weapon+build, ...)
    summary: { type: String },     // one-line human summary, same wording the confirmation message showed
    detail: { type: String },      // optional longer detail (counts, warnings) -- truncated same as AlertLog's detail
    // Flipped true when a registered Undo (handlers/manage/shared.js's registerUndo) consumes and reverses the change this row recorded. Undo itself is not separately audited -- this flag is the extent of undo-awareness in scope (see the design spec's Out of scope section).
    undone: { type: Boolean, default: false },
    // The op that reverses this change, stored so revert works from EITHER surface and survives a restart. handlers/manage/shared.js's registerUndo() holds a closure in a router-private Map: it dies with the process and the web cannot see it. This does neither.
    //
    // ⚠️ PRIVACY: today every op payload here describes CONTENT (a draw, an event, a build), so the only per-user field on this model is still `actorId`, already inventoried in PRIVACY.md §2.1b and Appendix A. THAT CHANGES the moment an admin-grant op is stored, because its payload carries a third party's Discord id — update the policy in the SAME change that adds one.
    inverse: { type: mongoose.Schema.Types.Mixed, default: null },
    // Authoritative ordering + retention key, same convention as AlertLog: explicit createdAt only, no updatedAt (Mongoose `timestamps` would add one nothing here ever needs).
    createdAt: { type: Date, default: Date.now, index: true },
});

module.exports = mongoose.model('ChangeLog', ChangeLogSchema);
