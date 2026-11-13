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

    // The Comment line (2026-11-06 11:06 EST): a Comment line sets the build's comment, no line keeps it, an empty one clears it.
    await check('a Comment line sets the comment; an Edit with no Comment line keeps it; an empty one clears it', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        await loadouts.addLoadout(h.modal('add_loadout_MP', form({ attachments: `${ATTACH}\nComment: Close range\nno suppressor` })));
        const id = String(Loadout.rows[0]._id);
        assert.strictEqual(Loadout.rows[0].description, 'Close range\nno suppressor');
        await loadouts.editLoadout(h.modal(`edit_loadout_${id}`, form()));
        assert.strictEqual(Loadout.rows[0].description, 'Close range\nno suppressor', 'no Comment line leaves it');
        await loadouts.editLoadout(h.modal(`edit_loadout_${id}`, form({ attachments: `${ATTACH}\nComment:` })));
        assert.strictEqual(Loadout.rows[0].description, '', 'an empty Comment line clears it');
    });

    await check('an option save of a merged build writes the shared comment', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        await loadouts.addLoadout(h.modal('add_loadout_MP', form()));
        const doc = Loadout.rows[0];
        doc.variants = [{ attachments: ATTACH.split('\n'), attachmentSlots: [], shareCode: '1D2B4A8B9A', imageKey: '', label: '' }];
        const i = h.modal(`edit_loadout_${doc._id}~1`, form({ build: 'AR, 1b, 1D2B4A8B9A', attachments: `${ATTACH}\nComment: Both options` }));
        await loadouts.editLoadout(i);
        assert.strictEqual(Loadout.rows[0].description, 'Both options', i.text());
    });

    await check('an Edit does not ask about names already saved on the build, only new ones', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        await loadouts.addLoadout(h.modal('add_loadout_MP', form()));
        const id = String(Loadout.rows[0]._id);
        CatalogueItem.seed([{ kind: 'weapon', name: 'Fennec', key: 'fennec', category: 'SMG', mode: 'MP' }]); invalidateCatalogue();   // the catalogue now knows none of this build's names, as for builds saved before it existed
        const same = h.modal(`edit_loadout_${id}`, form({ weapon: 'BAL-27, Ranked' }));
        await loadouts.editLoadout(same);
        assert.ok(!/mng_cat/.test(same.text()), `a label-only edit asked: ${same.text()}`);
        assert.strictEqual(Loadout.rows[0].label, 'Ranked');
        const added = h.modal(`edit_loadout_${id}`, form({ attachments: ATTACH.replace('No Stock', 'Brand New Stock') }));
        await loadouts.editLoadout(added);
        assert.ok(/mng_cat/.test(added.text()) && /Brand New Stock/.test(added.text()), 'a new name still asks');
    });

    await check('build: autocomplete lists each option, the whole merged build and a new build; openFromSlash opens the right pop-up', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        await loadouts.addLoadout(h.modal('add_loadout_MP', form()));
        const doc = Loadout.rows[0];
        doc.variants = [{ attachments: ['X'], attachmentSlots: [], shareCode: '1D2B4A8B9A', imageKey: '', label: 'Fast' }];
        const choices = await loadouts.buildChoices('loadouts_mp', 'bal 1b');
        assert.ok(choices.some(c => c.value === `${doc._id}~1` && /1b/.test(c.name) && /Fast/.test(c.name)), JSON.stringify(choices));
        const all = await loadouts.buildChoices('loadouts_mp', 'bal');
        assert.ok(all.some(c => c.value === String(doc._id) && /all 2 options/.test(c.name)), JSON.stringify(all));
        assert.ok(all.some(c => c.value === `new:${doc.weaponKey}`), JSON.stringify(all));
        const edit = h.modal('x'); await loadouts.openFromSlash(edit, 'loadouts_mp', `${doc._id}~1`, null);
        assert.ok(edit.sent[0]?.modal && JSON.stringify(edit.sent[0].modal).includes(`edit_loadout_${doc._id}~1`), edit.text());
        const add = h.modal('x'); await loadouts.openFromSlash(add, 'loadouts_mp', String(doc._id), 'add');
        assert.ok(JSON.stringify(add.sent[0]?.modal).includes('AR, 1c, '), `Add opens Create New for 1c: ${add.text()}`);
        const fresh = h.modal('x'); await loadouts.openFromSlash(fresh, 'loadouts_mp', `new:${doc.weaponKey}`, 'add');
        assert.ok(JSON.stringify(fresh.sent[0]?.modal).includes('AR, 2, '), `a new build gets the next number: ${fresh.text()}`);
        const typed = h.modal('x'); await loadouts.openFromSlash(typed, 'loadouts_mp', 'BAL-27 1b', null);
        assert.ok(JSON.stringify(typed.sent[0]?.modal).includes(`edit_loadout_${doc._id}~1`), `a typed tag finds the option: ${typed.text()}`);
    });

    // 2026-11-12 22:34 EST: the /manage gunsmith panel draws a save in place (his v3.13 spec), through onSaved; a refusal still answers privately and never calls it.
    await check('onSaved replaces the follow-up on a real save, and a refusal never calls it', async () => {
        h.reset(); Loadout.seed([]); knownCatalogue();
        let got = null;
        const i = h.modal('add_loadout_MP', form());
        await loadouts.addLoadout(i, null, { onSaved: (r) => { got = r; } });
        assert.ok(got && got.doc && got.doc.weaponName === 'BAL-27' && got.before === null && got.changeIds.length, JSON.stringify(got));
        assert.ok(!/BAL-27/.test(i.text()), 'no saved panel was posted: ' + i.text());
        const id = String(Loadout.rows[0]._id);
        let edited = null;
        await loadouts.editLoadout(h.modal(`edit_loadout_${id}`, form({ attachments: ATTACH.replace('No Stock', 'MIP Light Barrel') })), null, { onSaved: (r) => { edited = r; } });
        assert.ok(edited && edited.before && String(edited.doc._id) === id, 'an edit hands back the build as it was');
        let refused = null;
        const bad = h.modal('add_loadout_MP', form({ build: 'AR, 2' }));
        await loadouts.addLoadout(bad, null, { onSaved: (r) => { refused = r; } });
        assert.strictEqual(refused, null);
        assert.ok(/gunsmith code/i.test(bad.text()), bad.text());
    });

    if (failures) { console.error(`\n${failures} failing`); process.exit(1); }
    console.log('\n/manage loadout handlers: all checks pass');
    process.exit(0);
})();
