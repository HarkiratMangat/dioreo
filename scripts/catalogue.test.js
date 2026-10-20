// scripts/catalogue.test.js
//
// The CODM catalogue (utils/catalogue.js, core/ops/catalogue.js): the seed built from the tracked JSON, the unknown-name check that drives /manage's warning, slot inference, the items Save anyway learns, the op's page per mode, and the modal prefill Back to edit uses. No database.
const assert = require('assert');
const cat = require('../utils/catalogue');
const json = require('../docs/pins2/data/2026-09-25-codm-weapons-attachments.json');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

const stored = [
    { weaponName: 'ODEN', category: 'AR', attachments: ['OWC Light Suppressor', 'FMJ'], attachmentSlots: ['Muzzle', 'Perk'] },
    { weaponName: 'PHARO', category: 'SMG', attachments: ['Coming soon — check back later!'], attachmentSlots: [] },
    { weaponName: 'CROSSBOW', category: 'SECONDARIES', attachments: ['2B Bowstring'], attachmentSlots: [] },
];
const seed = cat.seedItems(json, stored);
const index = cat.buildIndex(seed);

check('the seed carries all 122 screenshot weapons, AK17 corrected to AK117, categories on the bot\'s keys', () => {
    const shot = seed.filter(i => i.kind === 'weapon' && i.source === 'screenshot');
    assert.strictEqual(shot.length, 122);
    assert.ok(index.weapons.has('ak117') && !index.weapons.has('ak17'));
    assert.strictEqual(index.weapons.get('ak117').category, 'AR');
    assert.ok(shot.every(w => ['AR', 'SMG', 'LMG', 'MARKSMAN', 'SNIPER', 'SHOTGUN', 'SECONDARIES'].includes(w.category)));
    assert.strictEqual(index.weapons.get('micromg9mm').dmzOnly, true);
});

check('stored builds add their weapons and attachments with the slot they recorded, and skip placeholders', () => {
    assert.strictEqual(index.weapons.get('oden').source, 'stored');
    assert.strictEqual(index.attachments.get('fmj').slot, 'Perk');
    assert.ok(!index.attachments.has(cat.normKey('Coming soon — check back later!')));
});

check('his slot rulings fill what no screenshot or build could', () => {
    assert.strictEqual(index.attachments.get(cat.normKey('2B Bowstring')).slot, 'Bowstring');
});

check('a per-weapon attachment keeps the weapons it is limited to', () => {
    assert.deepStrictEqual(index.attachments.get(cat.normKey('Branson')).weapons, ['asm10']);
});

check('unknown names: punctuation and case never matter, duplicates listed once, empty catalogue warns about nothing', () => {
    const u = cat.unknownNames(index, { weaponName: 'cx 9', attachments: ['fmj', 'Made Up Grip', 'made-up grip'] });
    assert.strictEqual(u.weapon, 'cx 9');
    assert.deepStrictEqual(u.attachments, ['Made Up Grip']);
    assert.strictEqual(u.count, 2);
    assert.strictEqual(cat.unknownNames(cat.buildIndex([]), { weaponName: 'X', attachments: ['Y'] }).count, 0);
});

check('slots come back aligned, blank where unknown, and [] when none is known', () => {
    assert.deepStrictEqual(cat.slotsFromIndex(index, ['FMJ', 'Nope']), ['Perk', '']);
    assert.deepStrictEqual(cat.slotsFromIndex(index, ['Nope']), []);
});

check('Save anyway learns the weapon with its typed category and the attachments with no slot', () => {
    const items = cat.learnItems({ weapon: 'New Gun', attachments: ['New Part'], count: 2 }, { category: 'smg' });
    assert.deepStrictEqual(items.map(i => [i.kind, i.name, i.category ?? i.slot, i.source]),
        [['weapon', 'New Gun', 'SMG', 'confirmed'], ['attachment', 'New Part', null, 'confirmed']]);
});

check('a catalogue op is logged under the loadout page of its own mode', () => {
    require('../core/ops');
    const { pageForOp } = require('../core/changeset');
    assert.strictEqual(pageForOp({ type: 'catalogue.learn', payload: { mode: 'DMZ' } }), 'loadouts_dmz');
    assert.strictEqual(pageForOp({ type: 'catalogue.learn', payload: { mode: 'MP' } }), 'loadouts_mp');
    assert.strictEqual(pageForOp({ type: 'catalogue.forget' }), 'loadouts_mp');
});

check('catalogue.learn refuses an empty list and normalises keys', () => {
    const ops = require('../core/ops');
    assert.strictEqual(ops.resolveOp('catalogue.learn').validate({ type: 'catalogue.learn', payload: { items: [] } }).ok, false);
    const r = ops.resolveOp('catalogue.learn').validate({ type: 'catalogue.learn', payload: { items: [{ kind: 'attachment', name: ' CX-FR ' }] } });
    assert.strictEqual(r.normalized.payload.items[0].key, 'cxfr');
});

check('Back to edit reopens the add box with everything typed', () => {
    const manage = require('../commands/manage');
    const modal = manage.prefillModal(manage.buildAddLoadoutModal('MP'), { weapon: 'ODEN', attachments: 'A\nB', meta: 'AR | hp' }).toJSON();
    const value = (id) => modal.components.flatMap(r => r.components).find(c => c.custom_id === id).value;
    assert.strictEqual(value('weapon'), 'ODEN');
    assert.strictEqual(value('attachments'), 'A\nB');
    assert.strictEqual(value('meta'), 'AR | hp');
});

if (failures) { console.error(`\n${failures} catalogue check(s) failed.`); process.exit(1); }
console.log('\ncatalogue: all checks passed.');
process.exit(0);
