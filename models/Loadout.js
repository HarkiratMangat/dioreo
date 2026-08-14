const mongoose = require('mongoose');

const LoadoutSchema = new mongoose.Schema({
    weaponKey: { type: String, required: true, index: true }, // e.g. "holger26" (lowercased, spaces stripped)
    weaponName: { type: String, required: true }, // e.g. "Holger 26"
    category: { type: String, required: true }, // e.g. "LMG"
    mode: { type: String, enum: ['MP', 'DMZ'], required: true },
    buildName: { type: String, default: 'Standard Build' }, // Allows multiple builds per gun
    attachments: [{ type: String }], // Array handles varied attachment limits natively
    // Parallel array to `attachments` (same index alignment) holding each slot's Gunsmith label
    // (e.g. "Muzzle", "Barrel") -- ONLY ever populated by /autobuild's vision extraction, since a
    // manual /manage add/edit has no slot data to offer. Persisting this on the doc (added
    // 2026-07-24 18:07 EDT, closing the "accepted gap" in loadout-images-and-metadata.md) is what lets a later
    // /manage attachment edit re-sync per-slot Cloudinary metadata for the common case -- editing an
    // existing build WITHOUT changing which attachments are equipped -- instead of always leaving it
    // stale. See handlers/manage.js's edit_loadout_ handler for the actual re-sync/invalidation logic.
    attachmentSlots: [{ type: String }],
    // `imageKey` supports EITHER a bare Cloudinary key (the original design, prefixed with the
    // Cloudinary base URL at render time) OR a full external URL -- added for the builds.xlsx
    // migration, which briefly had 2 imgur-hosted LOCUS rows before those were re-uploaded to
    // Cloudinary directly (2026-07-09). No current row uses the external-URL path, but it stays
    // supported in case a future import ever has one again -- see the buildImageUrl() helper
    // wherever this is rendered (dmz.js, handlers/loadouts.js's MP/DMZ lookup + pagination).
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
    // rendered when actually granted, never both a "best" AND a "topN" tier at once (a build can be
    // flagged Meta independently, but "Best in category" and "Top N in category" are mutually
    // exclusive tiers of the same ranking, not two separate flags). `categoryRank` is intentionally
    // NOT a fixed enum -- not every category tops out at exactly 3, so this stores 'best' or a
    // free-form 'top{N}' (e.g. 'top3', 'top4', 'top5'), validated by adminParser.js's
    // parseLoadoutBadges() rather than a rigid Mongoose enum. Parsed from the 3rd pipe-delimited
    // segment of /manage's "Category | Mode | Badges" modal field, and propagated across every
    // build sharing the same weaponKey/mode on edit (see handlers/manage.js's edit_loadout_ handler) since
    // badges describe the weapon, not one specific build variant.
    isMeta: { type: Boolean, default: false },
    categoryRank: { type: String, default: null },
    // Independent third badge, added alongside Meta/Best/TopN -- a build can be flagged "Toxic"
    // (an unbalanced/cheese pick, per Harkirat's own terminology) regardless of its Meta status or
    // category ranking, so this is its own boolean rather than folded into categoryRank.
    isToxic: { type: Boolean, default: false },
    // The ONLY rank-badge field DMZ builds ever use -- categoryRank is never set for mode: 'DMZ'
    // (handlers/manage.js's add/edit-loadout handlers reroute a bare "best"/"topN" token here instead), since
    // /dmz isn't split into per-category commands the way MP is, so "Best/Top N in category"
    // doesn't read as meaningfully there. Stores a bare 'best'/'top{N}' (renders as "... DMZ") or a
    // combat-range-role-qualified 'best-close'/'best-midlong'/'top{N}-close'/'top{N}-midlong'
    // (mirrors categoryRank's non-enum, parser-validated pattern -- see adminParser.js's
    // parseLoadoutBadges()). MP builds never set this field; DMZ builds never set categoryRank.
    dmzRangeRank: { type: String, default: null },
    lastUpdated: { type: Date, default: Date.now }
});

// Compound index on category+mode -- every autocomplete keystroke (weapon dictionary, /manage
// loadouts search) and every /<category> command filters on this pair together
// (Loadout.find({category, mode})/Loadout.distinct('category', {mode})). Harmless at the current
// collection size (~100-200 docs), but cheap to add now rather than needing a migration later once
// it actually matters.
LoadoutSchema.index({ category: 1, mode: 1 });

module.exports = mongoose.model('Loadout', LoadoutSchema);