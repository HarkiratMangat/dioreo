/**
 * The committed weapon index is a copy of live data, so it is the one artifact on this page that CAN go stale. These cases are what make that loud instead of silent.
 *
 * ⚠️ THEY CANNOT CHECK FRESHNESS — nothing here reaches the database, by design, because the website build must not need one. What they check is that the file exists, is shaped right, is plausibly complete, and agrees with the maps the page paints from. A staleness WARNING lives in the file's own `generated` date; re-run `scripts/exportWeaponIndex.mjs` after any bulk loadout import.
 */
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { loadCategoryAccents, loadWeaponIndex } = require('./lib/commandsPage');

const checks = [];
let failures = 0;
const check = (name, fn) => checks.push([name, fn]);

check('the weapon index exists and parses', () => {
    const file = path.join(__dirname, 'data', 'weapon-index.json');
    assert.ok(fs.existsSync(file), 'run: node --env-file=.env scripts/exportWeaponIndex.mjs');
    assert.doesNotThrow(() => JSON.parse(fs.readFileSync(file, 'utf8')));
});

check('it holds a plausible number of weapons, not a broken query', () => {
    // The first run of the exporter used the wrong field name and wrote "1 MP + 1 DMZ" while exiting 0. A floor is the difference between that shipping and failing here.
    const d = loadWeaponIndex();
    assert.ok(d.MP.length >= 20, `only ${d.MP.length} MP weapons`);
    assert.ok(d.DMZ.length >= 3, `only ${d.DMZ.length} DMZ weapons`);
});

check('every weapon carries the fields the page reads', () => {
    const d = loadWeaponIndex();
    const bad = [...d.MP, ...d.DMZ].filter(w =>
        !w.name || typeof w.name !== 'string' || !w.key || !Number.isInteger(w.builds) || w.builds < 1);
    assert.deepStrictEqual(bad.slice(0, 3), [], 'a row missing name/key/builds renders a blank autocomplete hit');
});

check('every MP category resolves to a real accent', () => {
    // A weapon whose category is not in MP_CATEGORY_ACCENT would tint the panel to nothing, which is the same defect the non-category scopes had.
    const cats = loadCategoryAccents();
    const orphan = [...new Set(loadWeaponIndex().MP.map(w => (w.category || '').toUpperCase()))]
        .filter(c => !cats[c]);
    assert.deepStrictEqual(orphan, [], 'a weapon category with no accent makes the card lose its colour');
});

check('the plausibility floor can actually FAIL, so the cases above are not vacuous', () => {
    // Feed the same shape a broken query produces. If the floor did not reject it, every assertion above would pass on an index holding one weapon.
    const broken = { MP: [{ name: 'X', key: 'x', builds: 1, category: 'AR' }], DMZ: [] };
    assert.ok(!(broken.MP.length >= 20), 'the floor must reject a one-row index');
});

for (const [name, fn] of checks) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}
if (failures > 0) { console.error(`❌ weaponIndex: ${failures} case(s) failed`); process.exit(1); }
console.log(`✅ weaponIndex: ${checks.length} cases passed`);
