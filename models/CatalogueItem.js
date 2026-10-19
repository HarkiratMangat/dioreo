// models/CatalogueItem.js
//
// The CODM weapons and attachments catalogue (deferred-list entry "Integrate the CODM weapons and attachments catalogue into the prod and dev bot", built 2026-10-19 16:19 EDT). One document per weapon or attachment NAME. It lives in the database, not in a tracked file, by Harkirat's call (2026-10-19 16:13 EDT, "what's BETTER?"): his "Save anyway" on an unknown name teaches it at once, a new season's weapons reach prod without a deploy, and every change goes through core/ops/catalogue.js, so /bot analytics logs it and can revert it. The tracked seed is docs/pins2/data/2026-09-25-codm-weapons-attachments.json (scripts/seedCatalogue.js).
//
// Holds no user data: who added a name is the ChangeLog row's actorId, never a field here (so PRIVACY.md is unaffected).
const mongoose = require('mongoose');

const CatalogueItemSchema = new mongoose.Schema({
    kind: { type: String, enum: ['weapon', 'attachment'], required: true },
    name: { type: String, required: true },
    // utils/catalogue.js's normKey(name): lower-case letters and digits only, so "CX-9" and "cx9" are one name. What every lookup matches on.
    key: { type: String, required: true },
    // Weapons only: the bot's category key (AR, SMG, LMG, MARKSMAN, SNIPER, SHOTGUN, SECONDARIES).
    category: { type: String, default: null },
    // Weapons only: true for a weapon that exists in DMZ alone (the screenshot marks MicroMG 9mm).
    dmzOnly: { type: Boolean, default: false },
    // Attachments only: the Gunsmith slot it sits in ("Muzzle", "Smoothbore", "Perk"...), or null when nobody has said yet (a name learned through Save anyway).
    slot: { type: String, default: null },
    // Attachments only: weapon keys it is limited to (the screenshot's per-weapon lists); empty means any weapon.
    weapons: { type: [String], default: [] },
    // Where the name came from: the game's table, a build already stored, or an admin's Save anyway.
    source: { type: String, enum: ['screenshot', 'stored', 'confirmed'], required: true }
}, { timestamps: true });

CatalogueItemSchema.index({ kind: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('CatalogueItem', CatalogueItemSchema);
