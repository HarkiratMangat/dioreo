// models/Changeset.js
//
// Staged work lives in the DATABASE, not the browser — which is why a session expiry can never cost
// composed work, and why a set started on one machine can be committed from another.
//
// ⚠️ PRIVACY: authorId is a per-user Discord ID. Named in PRIVACY.md §2 and Appendix A in the same
// change that adds this model.
//
// ⚠️ CAPACITY: the cluster is M0 free tier — 512 MB total, shared with the observability layer's
// event stream. A tier-2 inverse snapshot can be large (a loadouts bulk replace is ~125 objects), so
// this collection carries a TTL: an abandoned changeset is not precious. Measured 2026-08-20: the
// whole database is ~750KB of 512MB, so this is hygiene, not a capacity fix.
const mongoose = require('mongoose');

const ChangesetSchema = new mongoose.Schema({
    authorId: { type: String, required: true, index: true },
    realm: { type: String, required: true },
    ops: { type: [mongoose.Schema.Types.Mixed], default: [] },
    state: { type: String, enum: ['draft', 'staged', 'blocked', 'committed', 'discarded'], default: 'draft' },
    tier: { type: Number, default: 1 },
    exportedAt: { type: Date, default: null },   // tier 3 will not commit until this is set
    createdAt: { type: Date, default: Date.now },
    committedAt: { type: Date, default: null }
});

ChangesetSchema.index({ realm: 1, state: 1 });   // the /manage "someone has changes staged here" notice

// 🔴 TTL ONLY ON ABANDONED WORK. A bare createdAt TTL would also delete `committed` changesets after
// 30 days, and those are the record of what was actually applied. `partialFilterExpression` scopes
// the expiry to sets that were never committed.
ChangesetSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 30 * 24 * 60 * 60,
      partialFilterExpression: { state: { $in: ['draft', 'staged', 'blocked'] } } }
);

module.exports = mongoose.model('Changeset', ChangesetSchema);
