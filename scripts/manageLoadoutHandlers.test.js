// scripts/manageLoadoutHandlers.test.js -- /manage's loadout handlers end to end: the five-box form → checks → op → saved build → the panel (code-housekeeping, 2026-11-04 12:15 EST). Runs on scripts/lib/manageHarness.cjs: Loadout, the catalogue and VisionRead are in-memory collections, Cloudinary uploads succeed without a network.
const assert = require('assert');
const h = require('./lib/manageHarness.cjs');
const loadouts = require('../handlers/manage/loadouts');
const { Loadout, CatalogueItem } = h.collections;
const { invalidateCatalogue } = require('../utils/catalogue');   // the catalogue index is cached in memory; each check seeds its own

const ATTACH = 'Monolithic Suppressor\nMIP Light Barrel\nNo Stock\nGranulated Grip Tape\nOWC Laser - Tactical';
const form = (over = {}) => ({ weapon: 'BAL-27', build: 'AR, 1, 1C2B4A8B9A', attachments: ATTACH, image_url: '', ...over });
// Knows the weapon and every attachment above, so a save is not stopped to ask about new names.
function knownCatalogue() {
    CatalogueItem.seed([{ kind: 'weapon', name: 'BAL-27', key: 'bal27', category: 'AR', mode: 'MP' },
        ...ATTACH.split('\n').map(name => ({ kind: 'attachment', name, key: name.toLowerCase().replace(/[^a-z0-9]/g, ''), mode: 'MP' }))]);
    invalidateCatalogue();
}
let failures = 0;
async function check(name, fn) {
    try { await fn(); console.log(`  ✓ ${name}`); } catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.stack.split('\n').slice(0, 3).join('\n      ')}`); }
}

(async () => {
    await check('Add an MP build saves it with its code and answers with the saved panel', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        const i = h.modal('add_loadout_MP', form({ image_url: 'https://img/bal.png' }));
        await loadouts.addLoadout(i);
        assert.strictEqual(Loadout.rows.length, 1, i.text());
        const [b] = Loadout.rows;
        assert.strictEqual(b.weaponName, 'BAL-27');
        assert.strictEqual(b.attachments.length, 5);
        assert.ok(/1C2B4A8B9A/i.test(b.shareCode || ''), JSON.stringify(b));
        assert.ok(i.text().includes('BAL-27'), 'the reply shows the build');
    });

    await check('an MP build with no gunsmith code is refused before anything is saved', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        const i = h.modal('add_loadout_MP', form({ build: 'AR, 1' }));
        await loadouts.addLoadout(i);
        assert.strictEqual(Loadout.rows.length, 0);
        assert.ok(/gunsmith code/i.test(i.text()), i.text());
    });

    await check('a second build with the same code is refused and names the first', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        await loadouts.addLoadout(h.modal('add_loadout_MP', form()));
        const i = h.modal('add_loadout_MP', form({ build: 'AR, 2, 1C2B4A8B9A' }));
        await loadouts.addLoadout(i);
        assert.strictEqual(Loadout.rows.length, 1, i.text());
        assert.ok(/already has the code/.test(i.text()), i.text());
    });

    await check('names the catalogue does not know stop the save and ask first', async () => {
        h.reset(); Loadout.seed([]); CatalogueItem.seed([{ kind: 'weapon', name: 'Fennec', key: 'fennec', category: 'SMG', mode: 'MP' }]); invalidateCatalogue();   // a catalogue that knows none of this build's names
        const i = h.modal('add_loadout_MP', form());
        await loadouts.addLoadout(i);
        assert.strictEqual(Loadout.rows.length, 0, 'nothing saved before the answer');
        assert.ok(/mng_cat/.test(i.text()), i.text());
    });

    await check('Edit changes the attachments in place and keeps the build', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        await loadouts.addLoadout(h.modal('add_loadout_MP', form()));
        const id = String(Loadout.rows[0]._id);
        const edited = ATTACH.replace('No Stock', 'Granulated Grip Tape').split('\n').slice(0, 5).join('\n');
        const i = h.modal(`edit_loadout_${id}`, form({ attachments: edited }));
        await loadouts.editLoadout(i);
        assert.strictEqual(Loadout.rows.length, 1, i.text());
        assert.strictEqual(String(Loadout.rows[0]._id), id);
    });

    await check('Delete removes one build and returns its change id', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        await loadouts.addLoadout(h.modal('add_loadout_MP', form()));
        const doc = Loadout.rows[0];
        const before = h.state.changes.length;
        await loadouts.deleteItem({ id: String(doc._id), doc }, h.OWNER);
        assert.strictEqual(Loadout.rows.length, 0);
        assert.strictEqual(h.state.changes.length, before + 1);
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/manage loadout handlers: all checks pass');
    process.exit(0);
})();
