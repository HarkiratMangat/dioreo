// scripts/seedCatalogue.js
//
// Seeds the CODM catalogue (models/CatalogueItem.js) from the tracked screenshot transcription, docs/pins2/data/2026-09-25-codm-weapons-attachments.json, plus every weapon and attachment name already stored on a build in the same database (utils/catalogue.js's seedItems). ADDITIVE: a name already in the catalogue is never touched, so a re-run never undoes an admin's Save anyway.
//
// Usage: node --env-file=.env.dev scripts/seedCatalogue.js                 (dry run: counts what it would add)
//        node --env-file=.env.dev scripts/seedCatalogue.js --write         (adds them)
//        node --env-file=.env.dev scripts/seedCatalogue.js --fill-slots    (dry run: builds with no slots that the catalogue can now slot; add --write to save)
//        node --env-file=.env.dev scripts/seedCatalogue.js --report        (names that came only from stored builds, and attachments with no slot, for Harkirat to rule on)
//        add --prod to allow a non-localhost database -- prod is outward and needs Harkirat's restated approval.
//
// The seed is a bulk insert, not an op: it is the catalogue's starting state, the same way scripts/migrateBuildsToMongo.js was the loadouts'. Everything after it (Save anyway, /autobuild Confirm) goes through core/ops/catalogue.js and is logged.
const path = require('path');
const mongoose = require('mongoose');
const Loadout = require('../models/Loadout');
const CatalogueItem = require('../models/CatalogueItem');
const { seedItems, buildIndex, slotsFromIndex } = require('../utils/catalogue');

const WRITE = process.argv.includes('--write');
const PROD = process.argv.includes('--prod');
const FILL = process.argv.includes('--fill-slots');
const REPORT = process.argv.includes('--report');
const SEED = path.join(__dirname, '..', 'docs', 'pins2', 'data', '2026-09-25-codm-weapons-attachments.json');

(async () => {
    const uri = process.env.MONGODB_URI || '';
    if (!PROD && !/^mongodb:\/\/(localhost|127\.0\.0\.1)/.test(uri)) {
        console.error('Refusing a non-localhost database without --prod.');
        process.exit(2);
    }
    await mongoose.connect(uri);
    const loadouts = await Loadout.find({}).lean();

    if (FILL) {
        const index = buildIndex(await CatalogueItem.find({}).lean());
        let filled = 0;
        for (const b of loadouts.filter(l => !(l.attachmentSlots || []).length)) {
            const slots = slotsFromIndex(index, b.attachments);
            const blanks = slots.filter(s => !s).length;
            console.log(`${b.weaponName} (${b.buildName}, ${b.mode}): ${slots.length ? `${slots.join(' · ')}${blanks ? ` (${blanks} unknown)` : ''}` : 'no slot known'}`);
            if (WRITE && slots.length) { await Loadout.updateOne({ _id: b._id }, { $set: { attachmentSlots: slots } }); filled++; }
        }
        console.log(WRITE ? `${filled} build(s) slotted.` : 'Dry run: add --write to save.');
    } else if (REPORT) {
        const items = await CatalogueItem.find({}).lean();
        const stored = items.filter(i => i.source !== 'screenshot');
        const noSlot = items.filter(i => i.kind === 'attachment' && !i.slot);
        console.log(`Catalogue: ${items.length} names (${items.filter(i => i.kind === 'weapon').length} weapons).`);
        console.log(`\nWeapons not in the screenshot (${stored.filter(i => i.kind === 'weapon').length}):\n${stored.filter(i => i.kind === 'weapon').map(i => `- ${i.name} [${i.category || '?'}] (${i.source})`).join('\n')}`);
        console.log(`\nAttachments not in the screenshot (${stored.filter(i => i.kind === 'attachment').length}):\n${stored.filter(i => i.kind === 'attachment').map(i => `- ${i.name} -> ${i.slot || 'NO SLOT'} (${i.source})`).join('\n')}`);
        console.log(`\nAttachments with no slot (${noSlot.length}):\n${noSlot.map(i => `- ${i.name}`).join('\n')}`);
    } else {
        const seed = seedItems(require(SEED), loadouts);
        const have = new Set((await CatalogueItem.find({}, { kind: 1, key: 1 }).lean()).map(i => `${i.kind}|${i.key}`));
        const fresh = seed.filter(i => !have.has(`${i.kind}|${i.key}`));
        const count = (src, kind) => fresh.filter(i => i.source === src && i.kind === kind).length;
        console.log(`Seed: ${seed.length} names; ${fresh.length} new here.`);
        console.log(`  screenshot: ${count('screenshot', 'weapon')} weapons, ${count('screenshot', 'attachment')} attachments`);
        console.log(`  stored builds: ${count('stored', 'weapon')} weapons, ${count('stored', 'attachment')} attachments (${fresh.filter(i => i.source === 'stored' && i.kind === 'attachment' && !i.slot).length} with no slot)`);
        // A name already present keeps everything it has, except that a slot nobody had given yet is filled when the seed knows it (his rulings, utils/catalogue.js's RULED_SLOTS). Never overwrites a slot.
        const slotted = seed.filter(i => i.kind === 'attachment' && i.slot && have.has(`${i.kind}|${i.key}`));
        if (WRITE && fresh.length) await CatalogueItem.insertMany(fresh, { ordered: false });
        let filledSlots = 0;
        if (WRITE) for (const i of slotted) filledSlots += (await CatalogueItem.updateOne({ kind: i.kind, key: i.key, slot: null }, { $set: { slot: i.slot } })).modifiedCount;
        console.log(WRITE ? `Added ${fresh.length}; filled ${filledSlots} missing slot(s).` : 'Dry run: add --write to save.');
    }
    await mongoose.disconnect();
    process.exit(0);
})().catch((err) => { console.error(err?.message || err); process.exit(1); });
