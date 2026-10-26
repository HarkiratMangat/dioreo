// scripts/loadoutOps.test.js
const assert = require('assert');
const ops = require('../core/ops');

let failures = 0;
function check(name, fn) {
    try { fn(); console.log(`  ✓ ${name}`); }
    catch (e) { failures++; console.error(`  ✗ ${name}\n      ${e.message}`); }
}

check('loadout.add requires a mode, and rejects anything that is not MP or DMZ', () => {
    const bad = ops.resolveOp('loadout.add').validate({
        type: 'loadout.add', payload: { weaponName: 'FENNEC', buildName: 'CQB', mode: 'WZ' }
    });
    assert.strictEqual(bad.ok, false);
    assert.ok(bad.errors.some(e => /mode/i.test(e)));
});

// ⚠️ CORRECTED: the real add/edit handlers derive weaponKey via a PLAIN `weaponName.toLowerCase().replace(/\s+/g,'')` -- never utils/loadoutRender.js's computeWeaponKeyAndBuild(), which is /autobuild's auto-naming helper and would invent its own buildName/imageKey, silently discarding what the admin actually typed.
check('loadout.add derives weaponKey via the plain normalize, never computeWeaponKeyAndBuild', () => {
    const r = ops.resolveOp('loadout.add').validate({
        type: 'loadout.add', payload: { weaponName: 'FENNEC', buildName: 'My Aggressive Build', mode: 'MP', category: 'SMG', attachments: [] }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
    assert.strictEqual(r.normalized.payload.weaponKey, 'fennec');
    assert.strictEqual(r.normalized.payload.buildName, 'My Aggressive Build',
        'computeWeaponKeyAndBuild would have overwritten this with an auto-generated "Build N"');
});

check('loadout.add preserves weaponName exactly as typed -- the real handler never normalizes case', () => {
    const r = ops.resolveOp('loadout.add').validate({
        type: 'loadout.add', payload: { weaponName: 'Holger 26', buildName: 'CQB', mode: 'MP', category: 'LMG', attachments: [] }
    });
    assert.strictEqual(r.normalized.payload.weaponName, 'Holger 26');
});

check('loadout.add never reorders attachments -- orderAttachmentsBySlot belongs to /autobuild, not /manage', () => {
    const r = ops.resolveOp('loadout.add').validate({
        type: 'loadout.add', payload: { weaponName: 'FENNEC', buildName: 'CQB', mode: 'MP', category: 'SMG', attachments: ['Zed Foregrip', 'OWC Marksman'] }
    });
    assert.deepStrictEqual(r.normalized.payload.attachments, ['Zed Foregrip', 'OWC Marksman']);
});

// ⚠️ CORRECTED from the plan's own draft fixture: a real Gunsmith code has NO hyphens -- it is a continuous digit-letter-digit-letter... alternation (adminParser.js's own header example is "1I2C6B8A9D"). A hyphenated fixture like "6zq4-kp2m-vx90" breaks the alternation, so correctGunsmithCode's stripCodePrefix() (correctly, per its own contract) discards everything outside the longest genuinely-alternating run it can find -- the plan's test would have failed against the real function on its own fixture.
check('loadout.add corrects a gunsmith code rather than storing a typo', () => {
    // Fixture starts with a REAL digit -- stripCodePrefix() only recognizes an actual `\d` as the start of the alternating run (it's stripping a WEAPON NAME PREFIX, e.g. "Locus-1B2A4B8C9C", not correcting a digit/letter look-alike -- that's the later per-character pass). A fixture starting with a letter standing in for a misread digit gets that whole leading segment stripped as if it were a prefix, which is real correctGunsmithCode behaviour, not a bug here.
    const r = ops.resolveOp('loadout.add').validate({
        type: 'loadout.add', payload: { weaponName: 'FENNEC', buildName: 'CQB', mode: 'MP',
                                        category: 'SMG', attachments: [], shareCode: ' 1i2c6b8a9d ' }
    });
    assert.strictEqual(r.normalized.payload.shareCode, '1I2C6B8A9D');
});

check('loadout.delete inverts to an add carrying the whole document', () => {
    const doc = { weaponName: 'FENNEC', buildName: 'CQB', mode: 'MP', attachments: [1, 2, 3, 4, 5] };
    const inv = ops.resolveOp('loadout.delete').invert({ action: 'delete', applied: { removed: doc } });
    assert.strictEqual(inv.type, 'loadout.add');
    assert.deepStrictEqual(inv.payload, doc, 'restoring a build must restore its attachments, not just its name');
});

check('loadout.bulkAdd is tier 2 and scoped to ONE mode', () => {
    assert.strictEqual(ops.resolveOp('loadout.bulkAdd').tier, 2);
    const r = ops.resolveOp('loadout.bulkAdd').validate({ type: 'loadout.bulkAdd', target: {}, payload: { text: 'x' } });
    assert.strictEqual(r.ok, false, 'a bulk add with no mode has nowhere to write');
});

// ⚠️ CORRECTED from the plan's own draft assumption: "Replace Multiple" for loadouts reuses the EXACT SAME modal/handler as "Add Multiple" in the real code (manageActions.js's loadoutsActions()) -- there is no wholesale-replace behaviour for loadouts at all, unlike draws/calendar. A first draft that deleted every loadout of the mode before recreating from the paste would have wiped every build not mentioned in it.
check('loadout.bulkReplace does NOT wipe the mode -- it shares bulkAdd\'s upsert-by-key body', () => {
    const bulkAddSrc = ops.resolveOp('loadout.bulkAdd').apply.toString();
    const bulkReplaceSrc = ops.resolveOp('loadout.bulkReplace').apply.toString();
    assert.ok(bulkAddSrc.includes('upsertBulkBlocks') && bulkReplaceSrc.includes('upsertBulkBlocks'),
        'both ops must route through the same upsert helper, never a deleteMany-then-recreate');
});

// ⚠️ CORRECTED: the real "Bulk Delete Loadouts" modal (modal_loadouts_bulk_remove_{MP|DMZ}) collects pasted lines ("Weapon" or "Weapon | Build Name"), fuzzy-matched by weapon name -- never element ids.
check('loadout.bulkDelete accepts pasted "Weapon" / "Weapon | Build" lines, not just ids', () => {
    const r = ops.resolveOp('loadout.bulkDelete').validate({
        type: 'loadout.bulkDelete', target: { mode: 'MP' }, payload: { lines: ['FENNEC', 'Holger 26 | Aggressive'] }
    });
    assert.strictEqual(r.ok, true, JSON.stringify(r.errors));
});

check('loadout.bulkDelete refuses an empty selection', () => {
    const r = ops.resolveOp('loadout.bulkDelete').validate({ type: 'loadout.bulkDelete', target: { mode: 'MP' }, payload: {} });
    assert.strictEqual(r.ok, false);
});

// Second-pass audit finding: the first draft collected touchedKeys but never actually synced Cloudinary metadata for them -- the real handler syncs once per weaponKey after a bulk add/replace. Structural check (source-string, matching the sibling check above) rather than a live DB assertion, consistent with this file's other pure-logic checks.
check('bulk add/replace sync Cloudinary metadata for every touched weapon, not just single add/edit', () => {
    const fs = require('fs');
    const src = fs.readFileSync(require.resolve('../core/ops/loadouts.js'), 'utf8');
    const upsertBody = src.slice(src.indexOf('async function upsertBulkBlocks'), src.indexOf('registerEntity('));
    assert.ok(upsertBody.includes('syncSiblings'), 'upsertBulkBlocks must sync every touched weaponKey');
});

check('loadout.add requires MP or DMZ to be registered on BOTH pages, not just MP', () => {
    // The real defect this pins: an earlier draft declared `action: 'loadouts_mp:add'` as a bare string, which left every `loadouts_dmz:*` registry action with no op at all -- caught only by scripts/coreOps.test.js's whole-registry conservation check, not by any per-entity test.
    const { actionForOpType } = ops;
    const actions = actionForOpType('loadout.add');
    assert.ok(Array.isArray(actions), 'loadout.add must register an ARRAY of actions, not a single string');
    assert.ok(actions.includes('loadouts_mp:add') && actions.includes('loadouts_dmz:add'),
        `loadout.add must cover both pages, got: ${JSON.stringify(actions)}`);
});

process.exit(failures ? 1 : 0);
