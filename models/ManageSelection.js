// ==========================================
// MANAGE SELECTION — a /manage gunsmith Select list or paste, kept for a day
// ==========================================
// Built 2026-11-07 14:01 EST for the /manage gunsmith rehaul (local/project/features/manage-rehaul/spec.md, his "go ahead", 13:58 EST). The Select panel pages through up to every build and keeps what is selected across pages, and Paste / Edit N show a preview before Save; both need state that outlives one click and a bot restart, and a custom_id holds only 100 characters. So the panel keeps its state here, under a random token its buttons carry.
//
// ⚠️ NO USER ID IS STORED, on purpose: a per-user field would make this personal data the Privacy Policy must list (docs-audit's privacy-model-coverage). Who may act is checked on every click by utils/manageActions.js resolveAction, so the token only says WHICH list, never whose.
//
// Rows expire after 24 hours (TTL index on createdAt); a click on an older panel says the list expired and offers a new search.
const mongoose = require('mongoose');

const manageSelectionSchema = new mongoose.Schema({
    _id: { type: String, required: true }, // the token in the panel's custom_ids
    // MP / DMZ: the gunsmith panel. DRAWS: the draws panel (handlers/manage/drawsPanel/, 2026-11-07 19:13 EST), whose entry keys are `n:<id>` (New) or `r:<id>` (Returning).
    mode: { type: String, enum: ['MP', 'DMZ', 'DRAWS', 'CALENDAR'], required: true }, // CALENDAR: the /manage calendar panel's Select (2026-11-07 21:03 EST)
    // Entry keys, in list order: a build id, or `id~option` for one option of a merged build.
    ids: { type: [String], default: [] },
    selected: { type: [String], default: [] },
    // What was searched, as typed (lines and quick-pick labels), shown under the title.
    query: { type: [String], default: [] },
    unmatched: { type: [String], default: [] },
    // Paste / Edit N: the text the preview was made from, so Save and Edit Again use exactly it.
    text: { type: String, default: '' },
    // Expand View: when it opened, so Finish can say which builds were saved since.
    openedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 },
}, { versionKey: false });

module.exports = mongoose.model('ManageSelection', manageSelectionSchema);
