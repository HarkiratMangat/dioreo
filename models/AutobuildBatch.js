// models/AutobuildBatch.js
//
// An admin's open /autobuild batch, saved so a panel timeout or a bot restart loses nothing and no screenshot is read twice (Harkirat, 2026-10-25 13:31 EDT: "the current cache only expires if something is submitted or ... discarded ... running /autobuild ... will basically resume"). One open batch per admin (his pick "A", 14:01 EDT); new screenshots JOIN it (13:38 EDT).
//
// `ownerId` is the admin's Discord user ID, so a batch is personal data and PRIVACY.md §2.1b names it. It exists only while the batch has a build waiting: once every build is saved or discarded, the record is deleted when its panel next goes idle (utils/autobuildBulk.js's finalize), with its cached screenshots.
//
// `items` are utils/autobuildBulk.js's batch items as stored: each build's review `data` (what was read, plus any Adjust), its status, and for a saved build only a summary of the Loadout it became.
const mongoose = require('mongoose');

const AutobuildBatchSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    ownerId: { type: String, required: true, index: true },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    page: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 },
    source: { type: mongoose.Schema.Types.Mixed, default: null },
    public: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.models.AutobuildBatch || mongoose.model('AutobuildBatch', AutobuildBatchSchema);
