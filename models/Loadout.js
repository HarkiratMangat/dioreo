const mongoose = require('mongoose');

const LoadoutSchema = new mongoose.Schema({
    weaponKey: { type: String, required: true, index: true }, // e.g. "holger26" (lowercased, spaces stripped)
    weaponName: { type: String, required: true }, // e.g. "Holger 26"
    category: { type: String, required: true }, // e.g. "LMG"
    mode: { type: String, enum: ['MP', 'DMZ'], required: true },
    buildName: { type: String, default: 'Standard Build' }, // Allows multiple builds per gun
    attachments: [{ type: String }], // Array handles varied attachment limits natively
    // `imageKey` supports EITHER a bare Cloudinary key (the original design, prefixed with the
    // Cloudinary base URL at render time) OR a full external URL (needed for the builds.xlsx
    // migration, whose images are hosted on imgur, not Cloudinary) -- see the buildImageUrl()
    // helper wherever this is rendered (dmz.js, index.js's MP/DMZ lookup + pagination).
    imageKey: { type: String, required: true }, // e.g. "HOLGER-26-1" or a full "https://..." URL
    // Added during the builds.xlsx -> MongoDB migration: `description` preserves the old
    // spreadsheet's per-build usage blurb (e.g. "No suppressor build... FMJ allows 1 tap through
    // walls"), shown above the attachment list when present. `shareCode` preserves the actual
    // copyable in-game Gunsmith code from the spreadsheet's `Code` column -- distinct from
    // `buildName`, which despite its "Build Name / Share Code" label in /manage's modal is really
    // just a human-readable variant label (e.g. "Aggressive Flex"), not a real game code. The copy
    // button prefers `shareCode` when present and falls back to `buildName` otherwise, so loadouts
    // added via /manage (which never collected a real code) keep working exactly as before.
    description: { type: String, default: '' },
    shareCode: { type: String, default: '' },
    // "Badges" shown under the weapon name in the loadout card (utils/loadoutRender.js) — only
    // rendered when actually granted, never both `categoryRank` values at once (a build can be
    // flagged Meta independently, but "Best in category" and "Top 3 in category" are mutually
    // exclusive tiers of the same ranking, not two separate flags). Parsed from the 3rd
    // pipe-delimited segment of /manage's "Category | Mode | Badges" modal field.
    isMeta: { type: Boolean, default: false },
    categoryRank: { type: String, enum: ['best', 'top3', null], default: null },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Loadout', LoadoutSchema);